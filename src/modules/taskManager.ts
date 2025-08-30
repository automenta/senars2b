import { CognitiveItem, AttentionValue, TaskStatus } from '../interfaces/types';
import { TaskFactory } from './taskFactory';
import { Agenda } from '../core/agenda';
import { WorldModel } from '../core/worldModel';
import { DEFAULT_TASK_DURABILITY, TASK_PRIORITY_LEVELS, TASK_PRIORITY_VALUES } from '../utils/constants';

// Type guard to check if a CognitiveItem is a Task
function isTask(item: CognitiveItem): item is CognitiveItem & { type: 'TASK' } {
    return item.type === 'TASK';
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
    addSubtask(parentId: string, subtask: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'stamp' | 'type'> & {
        type?: 'TASK';
        task_metadata?: Partial<CognitiveItem['task_metadata']>;
    }): CognitiveItem;
    getSubtasks(parentId: string): CognitiveItem[];
    addEventListener(listener: (event: { type: string; task: CognitiveItem }) => void): void;
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

export class UnifiedTaskManager implements TaskManager {
    private agenda: Agenda;
    private worldModel: WorldModel;
    private eventListeners: ((event: { type: string; task: CognitiveItem }) => void)[] = [];

    constructor(agenda: Agenda, worldModel: WorldModel) {
        this.agenda = agenda;
        this.worldModel = worldModel;
        this.loadTasksFromWorldModel();
    }

    private loadTasksFromWorldModel(): void {
        const allItems = this.worldModel.getAllItems();
        const tasks = allItems.filter(isTask);
        for (const task of tasks) {
            // If the task is not in a terminal state, it should be on the agenda.
            const terminalStates: TaskStatus[] = ['completed', 'failed', 'deferred'];
            if (task.task_metadata && !terminalStates.includes(task.task_metadata.status)) {
                this.agenda.push(task);
            }
        }
    }

    addTask(taskData: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp' | 'type'> & {
        type?: 'TASK';
        task_metadata?: Partial<CognitiveItem['task_metadata']>;
    }): CognitiveItem {
        return this._createAndStoreTask(taskData);
    }

    updateTask(id: string, updates: Partial<CognitiveItem>): CognitiveItem | null {
        const task = this.getTask(id);
        if (!task) return null;

        Object.assign(task, updates);
        task.updated_at = Date.now();

        this.worldModel.update_item(task);
        this.notifyListeners({ type: 'taskUpdated', task });
        return task;
    }

    removeTask(id: string): boolean {
        const task = this.getTask(id);
        if (!task) {
            return false;
        }
        const removedFromWorldModel = this.worldModel.remove_item(id);
        if (removedFromWorldModel) {
            this.agenda.remove(id);
            this.notifyListeners({ type: 'taskRemoved', task });
        }
        return removedFromWorldModel;
    }

    getTask(id: string): CognitiveItem | null {
        const item = this.worldModel.get_item(id);
        return item && isTask(item) ? item : null;
    }

    getAllTasks(): CognitiveItem[] {
        return this.worldModel.getAllItems().filter(isTask);
    }

    getTasksByStatus(status: TaskStatus): CognitiveItem[] {
        return this.getAllTasks().filter(task => task.task_metadata?.status === status);
    }

    getTasksByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): CognitiveItem[] {
        return this.getAllTasks().filter(task => task.task_metadata?.priority_level === priority);
    }

    getTasksByGroupId(groupId: string): CognitiveItem[] {
        return this.getAllTasks().filter(task => task.task_metadata?.group_id === groupId);
    }

    assignTaskToGroup(taskId: string, groupId: string): CognitiveItem | null {
        const task = this.getTask(taskId);
        if (!task || !isTask(task)) return null;

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
    }

    updateTaskStatus(id: string, status: TaskStatus): CognitiveItem | null {
        const task = this.getTask(id);
        if (!task || !isTask(task)) return null;

        if (task.task_metadata) {
            task.task_metadata.status = status;
        }
        task.updated_at = Date.now();

        this.worldModel.update_item(task);
        this.notifyListeners({ type: 'taskStatusChanged', task });

        return task;
    }

    completeTask(id: string): CognitiveItem | null {
        const task = this.updateTaskStatus(id, 'completed');
        if (!task || !isTask(task)) return null;

        if (task.task_metadata) {
            task.task_metadata.completion_percentage = 100;
        }
        this.worldModel.update_item(task);

        this.agenda.remove(id);
        this.notifyListeners({ type: 'taskCompleted', task });

        // Future: Check for dependent tasks and unblock them.
        return task;
    }

    failTask(id: string, reason?: string): CognitiveItem | null {
        const task = this.updateTaskStatus(id, 'failed');
        if (!task || !task.task_metadata) return null;

        this.agenda.remove(id);
        this.notifyListeners({ type: 'taskFailed', task });

        // Propagate failure to subtasks
        if (task.task_metadata.subtasks) {
            for (const subtaskId of task.task_metadata.subtasks) {
                const subtask = this.getTask(subtaskId);
                if (subtask && isTask(subtask) && subtask.task_metadata?.status !== 'completed') {
                    this.failTask(subtaskId, "Parent task failed");
                }
            }
        }
        return task;
    }

    deferTask(id: string): CognitiveItem | null {
        const task = this.updateTaskStatus(id, 'deferred');
        if (!task) return null;

        this.agenda.remove(id);
        this.notifyListeners({ type: 'taskDeferred', task });
        return task;
    }

    addSubtask(parentId: string, subtaskData: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'stamp' | 'type'> & {
        type?: 'TASK';
        task_metadata?: Partial<CognitiveItem['task_metadata']>;
    }): CognitiveItem {
        const parentTask = this.getTask(parentId);
        if (!parentTask || !isTask(parentTask) || !parentTask.task_metadata) {
            throw new Error(`Parent task with ID ${parentId} not found or is missing metadata`);
        }

        const subtask = this._createAndStoreTask(subtaskData, parentId);

        if (!parentTask.task_metadata.subtasks) {
            parentTask.task_metadata.subtasks = [];
        }
        parentTask.task_metadata.subtasks.push(subtask.id);
        this.worldModel.update_item(parentTask);

        return subtask;
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
        this.notifyListeners({ type: 'taskAdded', task });
        return task;
    }

    getSubtasks(parentId: string): CognitiveItem[] {
        const parentTask = this.getTask(parentId);
        if (!parentTask || !isTask(parentTask) || !parentTask.task_metadata || !parentTask.task_metadata.subtasks) {
            return [];
        }

        return parentTask.task_metadata.subtasks
            .map(subtaskId => this.getTask(subtaskId))
            .filter((task): task is CognitiveItem => task !== null);
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
    }

    addEventListener(listener: (event: { type: string; task: CognitiveItem }) => void): void {
        this.eventListeners.push(listener);
    }

    private notifyListeners(event: { type: string; task: CognitiveItem }): void {
        for (const listener of this.eventListeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in task event listener:', error);
            }
        }
    }

    private mapPriorityLevelToValue(priority_level: 'low' | 'medium' | 'high' | 'critical' = TASK_PRIORITY_LEVELS.MEDIUM): number {
        return TASK_PRIORITY_VALUES[priority_level] || TASK_PRIORITY_VALUES.medium;
    }
}