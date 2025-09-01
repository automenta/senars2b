import { AttentionValue, CognitiveItem, TaskStatus } from '@/interfaces/types';
import { TaskFactory } from '@/modules/taskFactory';
import { 
  DEFAULT_TASK_DURABILITY, 
  TASK_PRIORITY_LEVELS, 
  TASK_PRIORITY_VALUES 
} from '@/utils/constants';
import { EnhancedCRUDManager } from '@/core/EnhancedCRUDManager';
import { isTask } from '@/utils/typeGuards';

// Define terminal task statuses for easy checking
const TERMINAL_TASK_STATUSES: TaskStatus[] = ['completed', 'failed', 'deferred'];

interface TaskConfig {
  enableHistoryTracking?: boolean;
  maxHistorySize?: number;
  enableValidation?: boolean;
  defaultPriorityLevel?: 'low' | 'medium' | 'high' | 'critical';
}

interface TaskEvents {
  taskAdded: { task: CognitiveItem };
  taskUpdated: { task: CognitiveItem };
  taskRemoved: { taskId: string };
  taskStatusChanged: { task: CognitiveItem; oldStatus: TaskStatus; newStatus: TaskStatus };
  taskFailed: { task: CognitiveItem; reason?: string };
  taskCompleted: { task: CognitiveItem };
  taskDeferred: { task: CognitiveItem };
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

export class UnifiedTaskManager 
  extends EnhancedCRUDManager<CognitiveItem & { type: 'TASK' }, TaskConfig> 
  implements TaskManager {
  
  private agenda: any; // We'll need to properly type this
  private worldModel: any; // We'll need to properly type this

  constructor(
    agenda: any, 
    worldModel: any,
    defaultConfig: TaskConfig = {}
  ) {
    const finalConfig: TaskConfig = {
      enableHistoryTracking: false,
      maxHistorySize: 10,
      enableValidation: true,
      defaultPriorityLevel: 'medium',
      ...defaultConfig
    };
    
    super('TaskManager', 'TASK', finalConfig);
    
    this.agenda = agenda;
    this.worldModel = worldModel;
    
    // Add task-specific validators
    this.addValidator(this.validateTask);
    
    this.loadTasksFromWorldModel();
  }

  addTask(taskData: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp' | 'type'> & {
    type?: 'TASK';
    task_metadata?: Partial<CognitiveItem['task_metadata']>;
  }): CognitiveItem {
    return this.measureSync('addTask', () => {
      try {
        const task = this._createAndStoreTask(taskData);
        this.notifyEvent('taskAdded', { task }, { 
          operation: 'addTask',
          taskId: task.id
        });
        return task;
      } catch (error) {
        throw this.handleError(
          error as Error,
          { operation: 'addTask' },
          () => {
            this.getLogger().warn('Task creation failed, using fallback', {
              operation: 'addTask'
            });
            throw error;
          }
        );
      }
    });
  }

  updateTask(id: string, updates: Partial<CognitiveItem>): CognitiveItem | null {
    return this.measureSync('updateTask', () => {
      const task = this.getItem(id);
      if (!task) return null;

      Object.assign(task, updates);
      task.updated_at = Date.now();

      // Update in world model if available
      if (this.worldModel && this.worldModel.update_item) {
        this.worldModel.update_item(task);
      }
      
      this.notifyEvent('taskUpdated', { task }, { 
        operation: 'updateTask',
        taskId: task.id
      });
      
      return task;
    });
  }

  removeTask(id: string): boolean {
    return this.measureSync('removeTask', () => {
      const task = this.getItem(id);
      if (!task) {
        return false;
      }
      
      // Remove from world model if available
      let removedFromWorldModel = true;
      if (this.worldModel && this.worldModel.remove_item) {
        removedFromWorldModel = this.worldModel.remove_item(id);
      }
      
      if (removedFromWorldModel) {
        // Remove from agenda if available
        if (this.agenda && this.agenda.remove) {
          this.agenda.remove(id);
        }
        
        this.notifyEvent('taskRemoved', { taskId: id }, { 
          operation: 'removeTask',
          taskId: id
        });
      }
      
      return super.removeItem(id);
    });
  }

  getTask(id: string): CognitiveItem | null {
    return this.measureSync('getTask', () => {
      return this.getItem(id);
    });
  }

  getAllTasks(): CognitiveItem[] {
    return this.measureSync('getAllTasks', () => {
      return this.getAllItems();
    });
  }

  getTasksByStatus(status: TaskStatus): CognitiveItem[] {
    return this.measureSync('getTasksByStatus', () => {
      return this.getAllTasks().filter(task => task.task_metadata?.status === status);
    });
  }

  getTasksByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): CognitiveItem[] {
    return this.measureSync('getTasksByPriority', () => {
      return this.getAllTasks().filter(task => task.task_metadata?.priority_level === priority);
    });
  }

  getTasksByGroupId(groupId: string): CognitiveItem[] {
    return this.measureSync('getTasksByGroupId', () => {
      return this.getAllTasks().filter(task => task.task_metadata?.group_id === groupId);
    });
  }

  assignTaskToGroup(taskId: string, groupId: string): CognitiveItem | null {
    return this.measureSync('assignTaskToGroup', () => {
      const task = this.getItem(taskId);
      if (!task) return null;

      if (task.task_metadata) {
        task.task_metadata.group_id = groupId;
      } else {
        task.task_metadata = {
          status: 'pending',
          priority_level: this.getConfig().defaultPriorityLevel || 'medium',
          group_id: groupId
        };
      }

      return this.updateTask(taskId, { task_metadata: task.task_metadata });
    });
  }

  updateTaskStatus(id: string, status: TaskStatus): CognitiveItem | null {
    return this.measureSync('updateTaskStatus', () => {
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

      // Update in world model if available
      if (this.worldModel && this.worldModel.update_item) {
        this.worldModel.update_item(task);
      }

      // Remove from agenda if transitioning to a terminal state and agenda is available
      if (!wasTerminal && isTerminal && this.agenda && this.agenda.remove) {
        this.agenda.remove(id);
      }

      this.notifyEvent('taskStatusChanged', { task, oldStatus, newStatus: status }, { 
        operation: 'updateTaskStatus',
        taskId: task.id
      });
      
      return task;
    });
  }

  completeTask(id: string): CognitiveItem | null {
    return this.measureSync('completeTask', () => {
      const result = this.updateTaskStatus(id, 'completed');
      if (result) {
        this.notifyEvent('taskCompleted', { task: result }, { 
          operation: 'completeTask',
          taskId: id
        });
      }
      return result;
    });
  }

  failTask(id: string, reason?: string): CognitiveItem | null {
    return this.measureSync('failTask', () => {
      const task = this.getItem(id);
      if (!task || !task.task_metadata) return null;

      // Update task status
      const updatedTask = this.updateTaskStatus(id, 'failed');
      if (!updatedTask) return null;

      this.notifyEvent('taskFailed', { task: updatedTask, reason }, { 
        operation: 'failTask',
        taskId: id
      });
      
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
    return this.measureSync('deferTask', () => {
      const result = this.updateTaskStatus(id, 'deferred');
      if (result) {
        this.notifyEvent('taskDeferred', { task: result }, { 
          operation: 'deferTask',
          taskId: id
        });
      }
      return result;
    });
  }

  addSubtask(parentId: string, subtaskData: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'stamp' | 'type'> & {
    type?: 'TASK';
    task_metadata?: Partial<CognitiveItem['task_metadata']>;
  }): CognitiveItem {
    return this.measureSync('addSubtask', () => {
      const parentTask = this.getItem(parentId);
      if (!parentTask || !parentTask.task_metadata) {
        throw this.createNotFoundError('Task', parentId);
      }

      const subtask = this._createAndStoreTask(subtaskData, parentId);

      if (!parentTask.task_metadata.subtasks) {
        parentTask.task_metadata.subtasks = [];
      }
      parentTask.task_metadata.subtasks.push(subtask.id);
      
      // Update parent in world model if available
      if (this.worldModel && this.worldModel.update_item) {
        this.worldModel.update_item(parentTask);
      }

      return subtask;
    });
  }

  getSubtasks(parentId: string): CognitiveItem[] {
    return this.measureSync('getSubtasks', () => {
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
    return this.measureSync('getTaskStatistics', () => {
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

  private loadTasksFromWorldModel(): void {
    // This would load tasks from the world model if available
    // Implementation depends on the specific world model interface
    this.getLogger().info('Loading tasks from world model', { operation: 'loadTasksFromWorldModel' });
  }

  private _createAndStoreTask(
    taskData: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'stamp' | 'type'> & {
      type?: 'TASK';
      task_metadata?: Partial<CognitiveItem['task_metadata']>;
    },
    parentId?: string
  ): CognitiveItem {
    const priorityLevel = taskData.task_metadata?.priority_level || this.getConfig().defaultPriorityLevel || TASK_PRIORITY_LEVELS.MEDIUM;
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

    // Add to world model if available
    if (this.worldModel && this.worldModel.add_item) {
      this.worldModel.add_item(task);
    }
    
    // Add to agenda if available
    if (this.agenda && this.agenda.push) {
      this.agenda.push(task);
    }
    
    // Add to our internal collection
    this.addItem(task);
    
    return task;
  }

  private validateTask(task: CognitiveItem & { type: 'TASK' }): boolean {
    // Validate required fields
    if (!task.id) {
      this.getLogger().warn('Task validation failed: missing id', { operation: 'validateTask' });
      return false;
    }
    
    if (!task.type || task.type !== 'TASK') {
      this.getLogger().warn('Task validation failed: invalid type', { operation: 'validateTask' });
      return false;
    }
    
    if (!task.attention) {
      this.getLogger().warn('Task validation failed: missing attention', { operation: 'validateTask' });
      return false;
    }
    
    if (!task.stamp) {
      this.getLogger().warn('Task validation failed: missing stamp', { operation: 'validateTask' });
      return false;
    }
    
    return true;
  }

  private mapPriorityLevelToValue(priority_level: 'low' | 'medium' | 'high' | 'critical' = TASK_PRIORITY_LEVELS.MEDIUM): number {
    return TASK_PRIORITY_VALUES[priority_level] || TASK_PRIORITY_VALUES.medium;
  }
}