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
    private tasks: Map<string, CognitiveItem> = new Map();
    private agenda: Agenda;
    private worldModel: WorldModel;
    private eventListeners: ((event: { type: string; task: CognitiveItem }) => void)[] = [];

    constructor(agenda: Agenda, worldModel: WorldModel) {
        this.agenda = agenda;
        this.worldModel = worldModel;
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

        // Add task-specific properties
        if (taskData.task_metadata) {
            task.task_metadata = { ...task.task_metadata, ...taskData.task_metadata };
        }

        this.tasks.set(task.id, task);
        this.notifyListeners({ type: 'taskAdded', task });
        return task;
    }

    updateTask(id: string, updates: Partial<CognitiveItem>): CognitiveItem | null {
        const task = this.tasks.get(id);
        if (!task || !isTask(task)) return null;

        // Update task properties
        Object.assign(task, updates);
        task.updated_at = Date.now();

        this.tasks.set(id, task);
        this.notifyListeners({ type: 'taskUpdated', task });
        return task;
    }

    getTaskStatistics(): {
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        failed: number;
        deferred: number;
    } {
        const tasks = Array.from(this.tasks.values()).filter(isTask);
        return {
            total: tasks.length,
            pending: tasks.filter(t => t.task_metadata?.status === 'pending').length,
            inProgress: tasks.filter(t => t.task_metadata?.status === 'in_progress').length,
            completed: tasks.filter(t => t.task_metadata?.status === 'completed').length,
            failed: tasks.filter(t => t.task_metadata?.status === 'failed').length,
            deferred: tasks.filter(t => t.task_metadata?.status === 'deferred').length
        };
    }

    removeTask(id: string): boolean {
        const task = this.tasks.get(id);
        if (!task || !isTask(task)) return false;

        // Remove from parent's subtasks if it has a parent
        if (task.parent_id) {
            const parent = this.tasks.get(task.parent_id);
            if (parent && isTask(parent) && parent.subtasks) {
                parent.subtasks = parent.subtasks.filter(subtaskId => subtaskId !== id);
                this.tasks.set(parent.id, parent);
            }
        }

        // Remove subtasks
        if (task.subtasks) {
            for (const subtaskId of task.subtasks) {
                this.removeTask(subtaskId);
            }
        }

        this.tasks.delete(id);
        this.notifyListeners({ type: 'taskRemoved', task: task });
        return true;
    }

    getTask(id: string): CognitiveItem | null {
        const task = this.tasks.get(id);
        return (task && isTask(task)) ? task : null;
    }

    getAllTasks(): CognitiveItem[] {
        return Array.from(this.tasks.values()).filter(isTask);
    }

    getTasksByStatus(status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred'): CognitiveItem[] {
        return Array.from(this.tasks.values())
            .filter(isTask)
            .filter(task => task.task_metadata?.status === status);
    }

    getTasksByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): CognitiveItem[] {
        return Array.from(this.tasks.values())
            .filter(isTask)
            .filter(task => task.task_metadata?.priority_level === priority);
    }

    updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred'): CognitiveItem | null {
        const task = this.getTask(id);
        if (!task || !isTask(task)) return null;

        if (task.task_metadata) {
            task.task_metadata.status = status;
        }
        task.updated_at = Date.now();

        this.tasks.set(id, task);
        this.notifyListeners({ type: 'taskStatusChanged', task });

        // If task is completed, mark subtasks as completed if they were in-progress
        if (status === 'completed' && task.subtasks) {
            for (const subtaskId of task.subtasks) {
                const subtask = this.getTask(subtaskId);
                if (subtask && isTask(subtask) && subtask.task_metadata?.status === 'in_progress') {
                    this.updateTaskStatus(subtaskId, 'completed');
                }
            }
        }

        // If task is marked as failed, propagate to subtasks
        if (status === 'failed' && task.subtasks) {
            for (const subtaskId of task.subtasks) {
                const subtask = this.getTask(subtaskId);
                if (subtask && isTask(subtask) && subtask.task_metadata?.status !== 'completed') {
                    this.updateTaskStatus(subtaskId, 'failed');
                }
            }
        }

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

        // Add subtask-specific properties
        if (subtaskData.task_metadata) {
            subtask.task_metadata = { ...subtask.task_metadata, ...subtaskData.task_metadata };
        }

        // Add subtask to parent
        if (!parentTask.subtasks) {
            parentTask.subtasks = [];
        }
        parentTask.subtasks.push(subtask.id);
        this.tasks.set(parentId, parentTask);

        this.tasks.set(subtask.id, subtask);
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
            .filter((task): task is CognitiveItem => task !== null && isTask(task));
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