import { CognitiveItem, AttentionValue } from '../interfaces/types';
import { TaskFactory } from './taskFactory';
import { Agenda } from '../core/agenda';
import { WorldModel } from '../core/worldModel';

// Type guard to check if a CognitiveItem is a Task
function isTask(item: CognitiveItem): item is CognitiveItem & { type: 'TASK' } {
    return item.type === 'TASK';
}

export interface TaskManager {
    addTask(task: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp' | 'type'> & { 
        type?: 'TASK';
        task_metadata?: Partial<CognitiveItem['task_metadata']>;
    }): CognitiveItem;
    updateTask(id: string, updates: Partial<CognitiveItem>): CognitiveItem | null;
    removeTask(id: string): boolean;
    getTask(id: string): CognitiveItem | null;
    getAllTasks(): CognitiveItem[];
    getTasksByStatus(status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred'): CognitiveItem[];
    getTasksByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): CognitiveItem[];
    updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred'): CognitiveItem | null;
    addSubtask(parentId: string, subtask: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp' | 'parent_id' | 'type'> & { 
        type?: 'TASK';
        task_metadata?: Partial<CognitiveItem['task_metadata']>;
    }): CognitiveItem;
    getSubtasks(parentId: string): CognitiveItem[];
    executeTask(task: CognitiveItem): Promise<void>;
    addEventListener(listener: (event: { type: string; task: CognitiveItem }) => void): void;
    getTaskStatistics(): {
        total: number;
        pending: number;
        inProgress: number;
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
            // If the task is pending or in_progress, it should be on the agenda.
            if (task.task_metadata?.status === 'pending' || task.task_metadata?.status === 'in_progress') {
                this.agenda.push(task);
            }
        }
    }

    addTask(taskData: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp' | 'type'> & { 
        type?: 'TASK';
        task_metadata?: Partial<CognitiveItem['task_metadata']>;
    }): CognitiveItem {
        const attention: AttentionValue = {
            priority: this.mapPriorityLevelToValue(taskData.task_metadata?.priority_level || 'medium'),
            durability: 0.5 // Default durability
        };

        const task = TaskFactory.createTask(
            taskData.label || (taskData.content as string) || 'Unnamed Task',
            attention,
            taskData.task_metadata?.priority_level || 'medium',
            taskData.meta
        );

        if (taskData.task_metadata) {
            task.task_metadata = { ...task.task_metadata, ...taskData.task_metadata };
        }

        this.worldModel.add_item(task);
        this.agenda.push(task);
        this.notifyListeners({ type: 'taskAdded', task });
        return task;
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
        const removedFromWorldModel = this.worldModel.remove_item(id);
        if (removedFromWorldModel) {
            this.agenda.remove(id);
            // We don't have the task object here to notify listeners, which is a flaw.
            // A better `remove_item` would return the removed item.
            // For now, we can't notify.
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

    getTasksByStatus(status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred'): CognitiveItem[] {
        return this.getAllTasks().filter(task => task.task_metadata?.status === status);
    }

    getTasksByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): CognitiveItem[] {
        return this.getAllTasks().filter(task => task.task_metadata?.priority_level === priority);
    }

    updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred'): CognitiveItem | null {
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
        if (!task) return null;

        this.agenda.remove(id); // Remove from agenda if it was there
        this.notifyListeners({ type: 'taskCompleted', task });

        // Future: Check for dependent tasks and unblock them.
        // This requires querying the world model for items that have `id` in their `dependencies` array.
        // e.g., this.worldModel.query_by_meta('dependencies', id)
        return task;
    }

    failTask(id: string, reason?: string): CognitiveItem | null {
        const task = this.updateTaskStatus(id, 'failed');
        if (!task) return null;

        this.agenda.remove(id);
        this.notifyListeners({ type: 'taskFailed', task });

        // Propagate failure to subtasks
        if (task.subtasks) {
            for (const subtaskId of task.subtasks) {
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

    addSubtask(parentId: string, subtaskData: Omit<CognitiveItem, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp' | 'parent_id' | 'type'> & { 
        type?: 'TASK';
        task_metadata?: Partial<CognitiveItem['task_metadata']>;
    }): CognitiveItem {
        const parentTask = this.getTask(parentId);
        if (!parentTask || !isTask(parentTask)) {
            throw new Error(`Parent task with ID ${parentId} not found`);
        }

        const attention: AttentionValue = {
            priority: this.mapPriorityLevelToValue(subtaskData.task_metadata?.priority_level || 'medium'),
            durability: 0.5 // Default durability
        };

        const subtask = TaskFactory.createSubtask(
            parentId,
            subtaskData.label || (subtaskData.content as string) || 'Unnamed Subtask',
            attention,
            subtaskData.task_metadata?.priority_level || 'medium',
            subtaskData.meta
        );

        if (subtaskData.task_metadata) {
            subtask.task_metadata = { ...subtask.task_metadata, ...subtaskData.task_metadata };
        }

        if (!parentTask.subtasks) {
            parentTask.subtasks = [];
        }
        parentTask.subtasks.push(subtask.id);
        this.worldModel.update_item(parentTask);

        this.worldModel.add_item(subtask);
        this.agenda.push(subtask);
        this.notifyListeners({ type: 'taskAdded', task: subtask });
        return subtask;
    }

    getSubtasks(parentId: string): CognitiveItem[] {
        const parentTask = this.getTask(parentId);
        if (!parentTask || !isTask(parentTask) || !parentTask.subtasks) {
            return [];
        }

        return parentTask.subtasks
            .map(subtaskId => this.getTask(subtaskId))
            .filter((task): task is CognitiveItem => task !== null);
    }

    async executeTask(task: CognitiveItem): Promise<void> {
        if (!isTask(task)) {
            return;
        }
        console.log(`Executing task ${task.id}: ${task.label}`);

        // Simulate doing work
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay

        // For now, we assume the task is successful.
        // In a real scenario, this is where the task's work would be done,
        // and the result would determine if it's completed or failed.
        this.completeTask(task.id);
        console.log(`Execution finished for task ${task.id}`);
    }

    getTaskStatistics(): {
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        failed: number;
        deferred: number;
    } {
        const tasks = this.getAllTasks();
        return {
            total: tasks.length,
            pending: tasks.filter(t => t.task_metadata?.status === 'pending').length,
            inProgress: tasks.filter(t => t.task_metadata?.status === 'in_progress').length,
            completed: tasks.filter(t => t.task_metadata?.status === 'completed').length,
            failed: tasks.filter(t => t.task_metadata?.status === 'failed').length,
            deferred: tasks.filter(t => t.task_metadata?.status === 'deferred').length
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

    private mapPriorityLevelToValue(priority_level: 'low' | 'medium' | 'high' | 'critical' = 'medium'): number {
        switch (priority_level) {
            case 'low': return 0.25;
            case 'medium': return 0.5;
            case 'high': return 0.75;
            case 'critical': return 1.0;
            default: return 0.5;
        }
    }
}