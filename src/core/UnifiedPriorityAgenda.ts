import { AttentionValue, CognitiveItem, TaskMetadata } from '@/interfaces/types';
import { EnhancedUnifiedBaseComponent, BaseConfig } from '@/core/EnhancedUnifiedBaseComponent';

interface AgendaConfig extends BaseConfig {
  maxWaitTime?: number;
  enableDependencyTracking?: boolean;
  priorityWeighting?: PriorityWeighting;
  deadlineWindowMs?: number;
}

export interface PriorityWeighting {
  taskPriority: number;
  deadlineFactor: number;
  attentionPriority: number;
  completionFactor: number;
}

interface AgendaEvents {
  itemAdded: { item: CognitiveItem };
  itemRemoved: { itemId: string };
  itemUpdated: { item: CognitiveItem };
  taskStatusUpdated: { taskId: string; status: TaskMetadata['status'] };
  itemBlocked?: { itemId: string; reason: string };
  itemUnblocked?: { itemId: string };
  compactionPerformed?: { removedItems: number; removedAtoms: number };
}

export interface Agenda {
  push(item: CognitiveItem): void;
  pop(): Promise<CognitiveItem>;
  peek(): CognitiveItem | null;
  size(): number;
  updateAttention(id: string, newVal: AttentionValue): void;
  remove(id: string): boolean;
  get(id: string): CognitiveItem | null;
  updateTaskStatus(taskId: string, status: TaskMetadata['status']): boolean;
  getTasksBy(filter: { 
    tag?: string; 
    category?: string; 
    status?: TaskMetadata['status'] 
  }): CognitiveItem[];
  getTasksByGroup(groupId: string): CognitiveItem[];
}

/**
 * Unified priority-based agenda with enhanced functionality
 */
export class UnifiedPriorityAgenda 
  extends EnhancedUnifiedBaseComponent<AgendaConfig, AgendaEvents> 
  implements Agenda {
  
  private static readonly DEFAULT_DEADLINE_WINDOW_MS = 24 * 60 * 60 * 1000; // 1 day

  // Priority Calculation Configuration
  private readonly weighting: PriorityWeighting;
  private items: CognitiveItem[] = [];
  private itemMap: Map<string, CognitiveItem> = new Map(); // For O(1) lookups
  private waitingQueue: (() => void)[] = [];

  // Statistics Tracking
  private popCount: number = 0;
  private totalWaitTime: number = 0;
  private maxWaitTime: number = 0;
  private lastPopTime: number = 0;
  private lastStatsCheckTime: number = Date.now();
  private lastPopCount: number = 0;

  private readonly getTaskStatus: (taskId: string) => TaskMetadata['status'] | null;

  /**
   * Creates an instance of PriorityAgenda.
   * @param getTaskStatus A function to resolve the status of a task by its ID.
   * @param userConfig Optional custom configuration.
   */
  constructor(
    getTaskStatus: (taskId: string) => TaskMetadata['status'] | null,
    userConfig: Partial<AgendaConfig> = {}
  ) {
    const defaultConfig: AgendaConfig = {
      maxWaitTime: 30000, // 30 seconds
      enableDependencyTracking: true,
      deadlineWindowMs: UnifiedPriorityAgenda.DEFAULT_DEADLINE_WINDOW_MS,
      priorityWeighting: {
        taskPriority: 0.4,
        deadlineFactor: 0.5,
        attentionPriority: 0.1,
        completionFactor: -0.1
      }
    };
    
    super('Agenda', defaultConfig, userConfig);
    
    if (!getTaskStatus) {
      throw new Error("A getTaskStatus function must be provided for robust dependency checking.");
    }
    this.getTaskStatus = getTaskStatus;
    
    // Set up weighting based on config
    this.weighting = this.getConfig().priorityWeighting || {
      taskPriority: 0.4,
      deadlineFactor: 0.5,
      attentionPriority: 0.1,
      completionFactor: -0.1
    };
  }

  /**
   * Updates the status of a specific task within the agenda.
   * If a task is completed, it may unblock dependent tasks and updates its parent's completion percentage.
   * @param taskId The ID of the task to update.
   * @param status The new status for the task.
   * @returns True if the task was found and updated, false otherwise.
   */
  updateTaskStatus(taskId: string, status: TaskMetadata['status']): boolean {
    return this.measureSync('updateTaskStatus', () => {
      const item = this.itemMap.get(taskId);

      if (item && item.type === 'TASK' && item.task_metadata) {
        item.task_metadata.status = status;
        item.updated_at = Date.now();

        if (status === 'completed') {
          // Potentially unblock dependent tasks
          this.resolveWaitingPop();

          // Update parent task's completion percentage if applicable
          if (item.task_metadata.parent_id) {
            const parentTask = this.itemMap.get(item.task_metadata.parent_id);
            if (parentTask && parentTask.type === 'TASK' && parentTask.task_metadata?.subtasks) {
              const totalSubtasks = parentTask.task_metadata.subtasks.length;
              if (totalSubtasks > 0) {
                let completedCount = 0;
                for (const subtaskId of parentTask.task_metadata.subtasks) {
                  // Use the injected getTaskStatus for a reliable status check
                  if (this.getTaskStatus(subtaskId) === 'completed') {
                    completedCount++;
                  }
                }
                parentTask.task_metadata.completion_percentage = (completedCount / totalSubtasks) * 100;
                parentTask.updated_at = Date.now();
                // Re-sort because the parent's priority may have changed
                this.sortItemsByPriority();
              }
            }
          }
        }
        
        // Notify listeners
        this.notifyTaskStatusUpdated(taskId, status);

        return true;
      }

      return false;
    });
  }

  /**
   * Adds or updates a cognitive item in the agenda.
   * @param item The cognitive item to add or update.
   * @throws Error if the item is null, undefined, or lacks required properties.
   */
  push(item: CognitiveItem): void {
    return this.measureSync('push', () => {
      if (!item || !item.id || !item.attention) {
        throw new Error('Item must be a valid CognitiveItem with an id and attention value.');
      }
      if (false || item.attention.priority < 0 || item.attention.priority > 1) {
        throw new Error('Item attention priority must be a number between 0 and 1.');
      }
      
      const isNewItem = !this.itemMap.has(item.id);

      if (!isNewItem) {
        const index = this.items.findIndex(i => i.id === item.id);
        if (index !== -1) {
          this.items[index] = item;
        }
      } else {
        this.items.push(item);
      }
      this.itemMap.set(item.id, item);
      this.sortItemsByPriority();

      // Notify listeners
      this.notifyItemAdded(item);

      // An added or updated item might unblock a waiting pop() call.
      this.resolveWaitingPop();
    });
  }

  /**
   * Removes and returns the highest priority item that is not blocked by dependencies.
   * @returns A promise that resolves to the highest priority unblocked item.
   * @throws Error if the wait times out (default: 30 seconds).
   */
  async pop(): Promise<CognitiveItem> {
    // Note: Async operations can't be measured with our sync measureSync
    const unblockedItemIndex = this.items.findIndex(item => !this.isBlocked(item));

    if (unblockedItemIndex !== -1) {
      const item = this.items.splice(unblockedItemIndex, 1)[0];
      this.itemMap.delete(item.id);

      this.trackPopStatistics();
      this.notifyItemRemoved(item.id);
      return item;
    }

    // Wait for an item to become available.
    return new Promise<CognitiveItem>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.indexOf(resolver);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Timeout waiting for an unblocked item to become available'));
      }, this.getConfig().maxWaitTime || 30000); // Default 30-second timeout

      const resolver = () => {
        clearTimeout(timeout);
        this.pop().then(resolve).catch(reject);
      };

      this.waitingQueue.push(resolver);
    });
  }

  /**
   * Returns the highest priority unblocked item without removing it from the agenda.
   * @returns The highest priority unblocked item, or null if none exists.
   */
  peek(): CognitiveItem | null {
    return this.measureSync('peek', () => {
      const unblockedItemIndex = this.items.findIndex(item => !this.isBlocked(item));
      return unblockedItemIndex !== -1 ? this.items[unblockedItemIndex] : null;
    });
  }

  /**
   * Gets the total number of items currently in the agenda.
   * @returns The number of items.
   */
  size(): number {
    return this.measureSync('size', () => {
      return this.items.length;
    });
  }

  /**
   * Updates the attention value of an item and re-sorts the agenda.
   * @param id The ID of the item to update.
   * @param newVal The new attention value for the item.
   */
  updateAttention(id: string, newVal: AttentionValue): void {
    return this.measureSync('updateAttention', () => {
      const item = this.itemMap.get(id);
      if (item) {
        item.attention = newVal;
        this.sortItemsByPriority();
        this.resolveWaitingPop();
        this.notifyItemUpdated(item);
      }
    });
  }

  /**
   * Removes an item from the agenda by its ID.
   * @param id The ID of the item to remove.
   * @returns True if the item was found and removed, false otherwise.
   */
  remove(id: string): boolean {
    return this.measureSync('remove', () => {
      if (!this.itemMap.has(id)) {
        return false;
      }
      this.items = this.items.filter(item => item.id !== id);
      this.itemMap.delete(id);
      // Removing an item could unblock a dependency.
      this.resolveWaitingPop();
      this.notifyItemRemoved(id);
      return true;
    });
  }

  /**
   * Retrieves an item from the agenda by its ID without removing it.
   * @param id The ID of the item to retrieve.
   * @returns The found item, or null if it does not exist.
   */
  get(id: string): CognitiveItem | null {
    return this.measureSync('get', () => {
      return this.itemMap.get(id) || null;
    });
  }

  /**
   * Retrieves tasks from the agenda based on a set of filter criteria.
   * @param filter The filter criteria.
   * @returns An array of tasks that match the filter criteria.
   */
  getTasksBy(filter: { tag?: string; category?: string; status?: TaskMetadata['status'] }): CognitiveItem[] {
    return this.measureSync('getTasksBy', () => {
      return this.items.filter(item => {
        if (item.type !== 'TASK' || !item.task_metadata) return false;

        const metadata = item.task_metadata;
        if (filter.status && metadata.status !== filter.status) return false;
        if (filter.tag && (!metadata.tags || !metadata.tags.includes(filter.tag))) return false;
        if (filter.category && (!metadata.categories || !metadata.categories.includes(filter.category))) return false;

        return true;
      });
    });
  }

  /**
   * Retrieves all tasks belonging to a specific group.
   * @param groupId The ID of the group to retrieve tasks for.
   * @returns An array of tasks that belong to the specified group.
   */
  getTasksByGroup(groupId: string): CognitiveItem[] {
    return this.measureSync('getTasksByGroup', () => {
      return this.items.filter(item =>
        item.type === 'TASK' &&
        item.task_metadata?.group_id === groupId
      );
    });
  }

  /**
   * Calculates the combined priority score for a cognitive item.
   * @private
   * @param item The item to score.
   * @returns The calculated priority score, clamped between 0 and 1.
   */
  private getCombinedPriority(item: CognitiveItem): number {
    const attentionPriority = item.attention.priority;

    if (item.type === 'TASK' && item.task_metadata) {
      const priorityMap = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
      const taskPriority = priorityMap[item.task_metadata.priority_level] || 0.5;

      let deadlineFactor = 0;
      if (item.task_metadata.deadline) {
        const now = Date.now();
        const timeLeft = item.task_metadata.deadline - now;
        if (timeLeft < 0) {
          deadlineFactor = 1.0; // Overdue tasks get max factor.
        } else if (timeLeft < (this.getConfig().deadlineWindowMs || UnifiedPriorityAgenda.DEFAULT_DEADLINE_WINDOW_MS)) {
          // Urgency increases as the deadline approaches.
          deadlineFactor = 1.0 - (timeLeft / (this.getConfig().deadlineWindowMs || UnifiedPriorityAgenda.DEFAULT_DEADLINE_WINDOW_MS));
        }
      }

      // Factor in the completion percentage.
      let completionFactor = 0;
      if (item.task_metadata.completion_percentage) {
        // Normalize to a 0-1 scale.
        completionFactor = item.task_metadata.completion_percentage / 100;
      }

      const score = (
        taskPriority * this.weighting.taskPriority +
        deadlineFactor * this.weighting.deadlineFactor +
        attentionPriority * this.weighting.attentionPriority +
        completionFactor * this.weighting.completionFactor
      );

      // Clamp the score between 0 and 1 to ensure it's a valid priority.
      return Math.max(0, Math.min(1, score));
    }

    return attentionPriority;
  }

  /**
   * Sorts the internal items array by priority in descending order.
   * @private
   */
  private sortItemsByPriority(): void {
    this.items.sort((a, b) => this.getCombinedPriority(b) - this.getCombinedPriority(a));
  }

  /**
   * Checks if a task is blocked by any of its dependencies.
   * @private
   * @param item The task to check.
   * @returns True if the task is blocked, false otherwise.
   */
  private isBlocked(item: CognitiveItem): boolean {
    if (!this.getConfig().enableDependencyTracking) {
      return false;
    }
    
    if (item.type !== 'TASK' || !item.task_metadata?.dependencies?.length) {
      return false;
    }

    for (const depId of item.task_metadata.dependencies) {
      const dependencyStatus = this.getTaskStatus(depId);
      if (dependencyStatus !== 'completed') {
        // Notify that item is blocked if listeners are registered
        if (this.listenerCount('itemBlocked') > 0) {
          this.notifyEvent('itemBlocked', { 
            itemId: item.id, 
            reason: `Blocked by dependency ${depId}` 
          }, {
            operation: 'isBlocked',
            itemId: item.id,
            dependencyId: depId
          });
        }
        return true; // Blocked if dependency is not completed or status is unknown.
      }
    }

    return false;
  }

  /**
   * Updates statistics related to pop operations.
   * @private
   */
  private trackPopStatistics(): void {
    const now = Date.now();
    this.popCount++;

    if (this.lastPopTime > 0) {
      const waitTime = now - this.lastPopTime;
      this.totalWaitTime += waitTime;
      if (waitTime > this.maxWaitTime) {
        this.maxWaitTime = waitTime;
      }
    }

    this.lastPopTime = now;
  }

  /**
   * Resolves the oldest pending pop promise if any exist.
   * @private
   */
  private resolveWaitingPop(): void {
    if (this.waitingQueue.length > 0) {
      const resolver = this.waitingQueue.shift();
      if (resolver) {
        resolver();
      }
    }
  }

  /**
   * Notify listeners that an item was added
   */
  private notifyItemAdded(item: CognitiveItem): void {
    this.notifyEvent('itemAdded', { item }, { 
      operation: 'addItem', 
      itemId: item.id, 
      itemType: item.type 
    });
  }
  
  /**
   * Notify listeners that an item was removed
   */
  private notifyItemRemoved(itemId: string): void {
    this.notifyEvent('itemRemoved', { itemId }, { 
      operation: 'removeItem', 
      itemId 
    });
  }
  
  /**
   * Notify listeners that an item was updated
   */
  private notifyItemUpdated(item: CognitiveItem): void {
    this.notifyEvent('itemUpdated', { item }, { 
      operation: 'updateItem', 
      itemId: item.id, 
      itemType: item.type 
    });
  }
  
  /**
   * Notify listeners that a task status was updated
   */
  private notifyTaskStatusUpdated(taskId: string, status: TaskMetadata['status']): void {
    this.notifyEvent('taskStatusUpdated', { taskId, status }, { 
      operation: 'updateTaskStatus', 
      taskId, 
      status 
    });
  }
}