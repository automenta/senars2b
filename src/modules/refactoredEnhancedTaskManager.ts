import { AttentionValue, CognitiveItem, TaskStatus } from '@/interfaces/types';
import { TaskFactory } from '@/modules/taskFactory';
import { 
  DEFAULT_TASK_DURABILITY, 
  TASK_PRIORITY_LEVELS, 
  TASK_PRIORITY_VALUES 
} from '@/utils/constants';
import { EnhancedCRUDManager } from '@/core/EnhancedCRUDManager';
import { isTask } from '@/utils/typeGuards';
import { EnhancedEventEmitter } from '@/utils/enhancedEventEmitter';
import { enhancedLogger as EnhancedLogger } from '@/utils/enhancedLogger';
import { EnhancedErrorHandler } from '@/utils/enhancedErrorHandler';
import { PerformanceMonitor } from '@/utils/performanceMonitor';

// Define terminal task statuses for easy checking
const TERMINAL_TASK_STATUSES: TaskStatus[] = ['completed', 'failed', 'deferred'];

interface TaskEvents {
  taskAdded: { task: CognitiveItem };
  taskUpdated: { task: CognitiveItem };
  taskRemoved: { task: CognitiveItem };
  taskStatusChanged: { task: CognitiveItem; oldStatus: TaskStatus; newStatus: TaskStatus };
  taskFailed: { task: CognitiveItem; reason?: string };
}

export interface TaskManager {
  addTask(task: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'stamp' | 'type'> & {
    type?: 'TASK';
    task_metadata?: Partial<CognitiveItem['task_metadata']>;
  }): CognitiveItem;

  updateTask(id: string, updates: Partial<CognitiveItem>): CognitiveItem | null;

  removeTask(id: string): boolean;

  getTask(id: string): CognitiveItem | null;

  getAllTasks(): CognitiveItem[];

  getTasksByStatus(status: TaskStatus): CognitiveItem[];

  getTasksByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): CognitiveItem[];

  getTasksByGroupId(groupId: string): CognitiveItem[];

  assignTaskToGroup(taskId: string, groupId: string): CognitiveItem | null;

  updateTaskStatus(id: string, status: TaskStatus): CognitiveItem | null;

  completeTask(id: string): CognitiveItem | null;

  failTask(id: string, reason?: string): CognitiveItem | null;

  deferTask(id: string): CognitiveItem | null;

  addSubtask(parentId: string, subtask: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'stamp' | 'type'> & {
    type?: 'TASK';
    task_metadata?: Partial<CognitiveItem['task_metadata']>;
  }): CognitiveItem;

  getSubtasks(parentId: string): CognitiveItem[];

  getTaskStatistics(): {
    total: number;
    pending: number;
    awaiting_dependencies: number;
    decomposing: number;
    awaiting_subtasks: number;
    ready_for_execution: number;
    completed: number;
    failed: number;
    deferred: number;
  };
}

export class RefactoredTaskManager 
  extends EnhancedCRUDManager<CognitiveItem & { type: 'TASK' }> 
  implements TaskManager {
  
  private eventEmitter: EnhancedEventEmitter<TaskEvents> = new EnhancedEventEmitter();
  private eventListeners: ((event: { type: string; task: CognitiveItem }) => void)[] = [];

  constructor(agenda: Agenda, worldModel: WorldModel) {
    super(worldModel, agenda, 'TASK');
    this.loadTasksFromWorldModel();
  }

  addTask(taskData: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp' | 'type'> & {
    type?: 'TASK';
    task_metadata?: Partial<CognitiveItem['task_metadata']>;
  }): CognitiveItem {
    return PerformanceMonitor.measureSync('addTask', () => {
      try {
        const task = this._createAndStoreTask(taskData);
        this.eventEmitter.emit('taskAdded', { task });
        this.notifyEvent('itemAdded', { item: task }, { 
          component: 'TaskManager',
          operation: 'addTask',
          taskId: task.id
        });
        return task;
      } catch (error) {
        throw EnhancedErrorHandler.handleError(
          error,
          { component: 'TaskManager', operation: 'addTask' },
          () => {
            EnhancedLogger.warn('Task creation failed, using fallback', {
              component: 'TaskManager',
              operation: 'addTask'
            });
            // Fallback implementation could go here
            throw error;
          }
        );
      }
    });
  }

  updateTask(id: string, updates: Partial<CognitiveItem>): CognitiveItem | null {
    return PerformanceMonitor.measureSync('updateTask', () => {
      const task = this.getItem(id);
      if (!task) return null;

      Object.assign(task, updates);
      task.updated_at = Date.now();

      this.worldModel.update_item(task);
      this.eventEmitter.emit('taskUpdated', { task });
      this.notifyEvent('itemUpdated', { item: task }, { 
        component: 'TaskManager',
        operation: 'updateTask',
        taskId: task.id
      });
      
      return task;
    });
  }

  removeTask(id: string): boolean {
    return PerformanceMonitor.measureSync('removeTask', () => {
      const task = this.getItem(id);
      if (!task) {
        return false;
      }
      
      const removedFromWorldModel = this.worldModel.remove_item(id);
      if (removedFromWorldModel) {
        this.agenda.remove(id);
        this.eventEmitter.emit('taskRemoved', { task });
        this.notifyEvent('itemRemoved', { itemId: id }, { 
          component: 'TaskManager',
          operation: 'removeTask',
          taskId: id
        });
      }
      
      return removedFromWorldModel;
    });
  }

  getTask(id: string): CognitiveItem | null {
    return PerformanceMonitor.measureSync('getTask', () => {
      return this.getItem(id);
    });
  }

  getAllTasks(): CognitiveItem[] {
    return PerformanceMonitor.measureSync('getAllTasks', () => {
      return this.getAllItems();
    });
  }

  getTasksByStatus(status: TaskStatus): CognitiveItem[] {
    return PerformanceMonitor.measureSync('getTasksByStatus', () => {
      return this.getAllTasks().filter(task => task.task_metadata?.status === status);
    });
  }

  getTasksByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): CognitiveItem[] {
    return PerformanceMonitor.measureSync('getTasksByPriority', () => {
      return this.getAllTasks().filter(task => task.task_metadata?.priority_level === priority);
    });
  }

  getTasksByGroupId(groupId: string): CognitiveItem[] {
    return PerformanceMonitor.measureSync('getTasksByGroupId', () => {
      return this.getAllTasks().filter(task => task.task_metadata?.group_id === groupId);
    });
  }

  assignTaskToGroup(taskId: string, groupId: string): CognitiveItem | null {
    return PerformanceMonitor.measureSync('assignTaskToGroup', () => {
      const task = this.getItem(taskId);
      if (!task) return null;

      if (task.task_metadata) {
        task.task_metadata.group_id = groupId;
      } else {
        task.task_metadata = {
          status: 'pending',
          priority_level: 'medium',
          group_id: groupId
        };
      }

      return this.updateTask(taskId, { task_metadata: task.task_metadata });
    });
  }

  updateTaskStatus(id: string, status: TaskStatus): CognitiveItem | null {
    return PerformanceMonitor.measureSync('updateTaskStatus', () => {
      const task = this.getItem(id);
      if (!task) return null;

      const oldStatus = task.task_metadata?.status || 'pending';
      
      // Special handling for terminal states that require agenda removal
      const wasTerminal = task.task_metadata && TERMINAL_TASK_STATUSES.includes(task.task_metadata.status);
      const isTerminal = TERMINAL_TASK_STATUSES.includes(status);

      if (task.task_metadata) {
        task.task_metadata.status = status;
      }
      task.updated_at = Date.now();

      this.worldModel.update_item(task);

      // Remove from agenda if transitioning to a terminal state
      if (!wasTerminal && isTerminal) {
        this.agenda.remove(id);
      }

      this.eventEmitter.emit('taskStatusChanged', { task, oldStatus, newStatus: status });
      this.notifyEvent('itemUpdated', { item: task }, { 
        component: 'TaskManager',
        operation: 'updateTaskStatus',
        taskId: task.id
      });
      
      return task;
    });
  }

  completeTask(id: string): CognitiveItem | null {
    return PerformanceMonitor.measureSync('completeTask', () => {
      return this.updateTaskStatus(id, 'completed');
    });
  }

  failTask(id: string, reason?: string): CognitiveItem | null {
    return PerformanceMonitor.measureSync('failTask', () => {
      const task = this.getItem(id);
      if (!task || !task.task_metadata) return null;

      // Update task status
      const updatedTask = this.updateTaskStatus(id, 'failed');
      if (!updatedTask) return null;

      this.eventEmitter.emit('taskFailed', { task: updatedTask, reason });
      
      // Propagate failure to subtasks
      if (task.task_metadata.subtasks) {
        for (const subtaskId of task.task_metadata.subtasks) {
          const subtask = this.getItem(subtaskId);
          if (subtask && subtask.task_metadata?.status !== 'completed') {
            this.failTask(subtaskId, "Parent task failed");
          }
        }
      }
      
      return updatedTask;
    });
  }

  deferTask(id: string): CognitiveItem | null {
    return PerformanceMonitor.measureSync('deferTask', () => {
      return this.updateTaskStatus(id, 'deferred');
    });
  }

  addSubtask(parentId: string, subtaskData: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'stamp' | 'type'> & {
    type?: 'TASK';
    task_metadata?: Partial<CognitiveItem['task_metadata']>;
  }): CognitiveItem {
    return PerformanceMonitor.measureSync('addSubtask', () => {
      const parentTask = this.getItem(parentId);
      if (!parentTask || !parentTask.task_metadata) {
        throw EnhancedErrorHandler.createNotFoundError('Task', parentId);
      }

      const subtask = this._createAndStoreTask(subtaskData, parentId);

      if (!parentTask.task_metadata.subtasks) {
        parentTask.task_metadata.subtasks = [];
      }
      parentTask.task_metadata.subtasks.push(subtask.id);
      this.worldModel.update_item(parentTask);

      return subtask;
    });
  }

  getSubtasks(parentId: string): CognitiveItem[] {
    return PerformanceMonitor.measureSync('getSubtasks', () => {
      const parentTask = this.getItem(parentId);
      if (!parentTask || !parentTask.task_metadata || !parentTask.task_metadata.subtasks) {
        return [];
      }

      return parentTask.task_metadata.subtasks
        .map(subtaskId => this.getItem(subtaskId))
        .filter((task): task is CognitiveItem => task !== null);
    });
  }

  getTaskStatistics(): {
    total: number;
    pending: number;
    awaiting_dependencies: number;
    decomposing: number;
    awaiting_subtasks: number;
    ready_for_execution: number;
    completed: number;
    failed: number;
    deferred: number;
  } {
    return PerformanceMonitor.measureSync('getTaskStatistics', () => {
      const tasks = this.getAllTasks();
      return {
        total: tasks.length,
        pending: tasks.filter(t => t.task_metadata?.status === 'pending').length,
        awaiting_dependencies: tasks.filter(t => t.task_metadata?.status === 'awaiting_dependencies').length,
        decomposing: tasks.filter(t => t.task_metadata?.status === 'decomposing').length,
        awaiting_subtasks: tasks.filter(t => t.task_metadata?.status === 'awaiting_subtasks').length,
        ready_for_execution: tasks.filter(t => t.task_metadata?.status === 'ready_for_execution').length,
        completed: tasks.filter(t => t.task_metadata?.status === 'completed').length,
        failed: tasks.filter(t => t.task_metadata?.status === 'failed').length,
        deferred: tasks.filter(t => t.task_metadata?.status === 'deferred').length,
      };
    });
  }

  // Event listener management
  addEventListener(listener: (event: { type: string; task: CognitiveItem }) => void): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: { type: string; task: CognitiveItem }) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // Event emitter methods for external listeners
  on<K extends keyof TaskEvents>(eventType: K, handler: (event: TaskEvents[K]) => void): void {
    this.eventEmitter.on(eventType, handler);
  }

  off<K extends keyof TaskEvents>(eventType: K, handler: (event: TaskEvents[K]) => void): void {
    this.eventEmitter.off(eventType, handler);
  }

  private loadTasksFromWorldModel(): void {
    const allItems = this.worldModel.getAllItems();
    const tasks = allItems.filter(isTask);
    for (const task of tasks) {
      // If the task is not in a terminal state, it should be on the agenda.
      if (task.task_metadata && !TERMINAL_TASK_STATUSES.includes(task.task_metadata.status)) {
        this.agenda.push(task);
      }
      this.items.set(task.id, task);
    }
  }

  private _createAndStoreTask(
    taskData: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'stamp' | 'type'> & {
      type?: 'TASK';
      task_metadata?: Partial<CognitiveItem['task_metadata']>;
    },
    parentId?: string
  ): CognitiveItem {
    const priorityLevel = taskData.task_metadata?.priority_level || TASK_PRIORITY_LEVELS.MEDIUM;
    const attention: AttentionValue = {
      priority: this.mapPriorityLevelToValue(priorityLevel),
      durability: DEFAULT_TASK_DURABILITY,
    };

    const task = parentId
      ? TaskFactory.createSubtask(
        parentId,
        taskData.label || (taskData.content as string) || 'Unnamed Subtask',
        attention,
        priorityLevel,
        taskData.meta
      )
      : TaskFactory.createTask(
        taskData.label || (taskData.content as string) || 'Unnamed Task',
        attention,
        priorityLevel,
        taskData.meta
      );

    if (taskData.task_metadata) {
      task.task_metadata = { ...task.task_metadata, ...taskData.task_metadata };
    }

    if (typeof task.task_metadata!.completion_percentage !== 'number') {
      task.task_metadata!.completion_percentage = 0;
    }

    this.worldModel.add_item(task);
    this.agenda.push(task);
    this.addItem(task);
    
    return task;
  }

  private notifyListeners(event: { type: string; task: CognitiveItem }): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        EnhancedLogger.error('Error in task event listener', {
          component: 'TaskManager',
          operation: 'notifyListeners'
        }, error);
      }
    }
  }

  private mapPriorityLevelToValue(priority_level: 'low' | 'medium' | 'high' | 'critical' = TASK_PRIORITY_LEVELS.MEDIUM): number {
    return TASK_PRIORITY_VALUES[priority_level] || TASK_PRIORITY_VALUES.medium;
  }
}