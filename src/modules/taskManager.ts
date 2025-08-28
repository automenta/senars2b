import { Task, AttentionValue } from '../interfaces/task';
import { TaskFactory } from './taskFactory';
import { Agenda } from '../core/agenda';
import { WorldModel } from '../core/worldModel';

export interface TaskManager {
    addTask(task: Omit<Task, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp'>): Task;
    updateTask(id: string, updates: Partial<Task>): Task | null;
    removeTask(id: string): boolean;
    getTask(id: string): Task | null;
    getAllTasks(): Task[];
    getTasksByStatus(status: Task['status']): Task[];
    getTasksByPriority(priority: Task['priority_level']): Task[];
    updateTaskStatus(id: string, status: Task['status']): Task | null;
    addSubtask(parentId: string, subtask: Omit<Task, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp' | 'parent_id'>): Task;
    getSubtasks(parentId: string): Task[];
    addEventListener(listener: (event: { type: string; task: Task }) => void): void;
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
    private tasks: Map<string, Task> = new Map();
    private agenda: Agenda;
    private worldModel: WorldModel;
    private eventListeners: ((event: { type: string; task: Task }) => void)[] = [];

    constructor(agenda: Agenda, worldModel: WorldModel) {
        this.agenda = agenda;
        this.worldModel = worldModel;
    }

    addTask(taskData: Omit<Task, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp'>): Task {
        const attention: AttentionValue = {
            priority: this.mapPriorityLevelToValue(taskData.priority_level),
            durability: 0.5 // Default durability
        };

        const task = TaskFactory.createTask(
            taskData.content,
            attention,
            taskData.priority_level,
            taskData.metadata
        );

        // Add task-specific properties
        task.status = taskData.status;
        task.dependencies = taskData.dependencies;
        task.deadline = taskData.deadline;
        task.estimated_effort = taskData.estimated_effort;
        task.required_resources = taskData.required_resources;
        task.outcomes = taskData.outcomes;
        task.confidence = taskData.confidence;
        task.tags = taskData.tags;
        task.categories = taskData.categories;
        task.context = taskData.context;

        this.tasks.set(task.id, task);
        this.notifyListeners({ type: 'taskAdded', task });
        return task;
    }

    updateTask(id: string, updates: Partial<Task>): Task | null {
        const task = this.tasks.get(id);
        if (!task) return null;

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
        const tasks = Array.from(this.tasks.values());
        return {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            failed: tasks.filter(t => t.status === 'failed').length,
            deferred: tasks.filter(t => t.status === 'deferred').length
        };
    }

    removeTask(id: string): boolean {
        const task = this.tasks.get(id);
        if (!task) return false;

        // Remove from parent's subtasks if it has a parent
        if (task.parent_id) {
            const parent = this.tasks.get(task.parent_id);
            if (parent) {
                parent.subtasks = parent.subtasks.filter(subtaskId => subtaskId !== id);
                this.tasks.set(parent.id, parent);
            }
        }

        // Remove subtasks
        for (const subtaskId of task.subtasks) {
            this.removeTask(subtaskId);
        }

        this.tasks.delete(id);
        this.notifyListeners({ type: 'taskRemoved', task });
        return true;
    }

    getTask(id: string): Task | null {
        return this.tasks.get(id) || null;
    }

    getAllTasks(): Task[] {
        return Array.from(this.tasks.values());
    }

    getTasksByStatus(status: Task['status']): Task[] {
        return Array.from(this.tasks.values()).filter(task => task.status === status);
    }

    getTasksByPriority(priority: Task['priority_level']): Task[] {
        return Array.from(this.tasks.values()).filter(task => task.priority_level === priority);
    }

    updateTaskStatus(id: string, status: Task['status']): Task | null {
        const task = this.getTask(id);
        if (!task) return null;

        const oldStatus = task.status;
        task.status = status;
        task.updated_at = Date.now();

        this.tasks.set(id, task);
        this.notifyListeners({ type: 'taskStatusChanged', task });

        // If task is completed, mark subtasks as completed if they were in-progress
        if (status === 'completed') {
            for (const subtaskId of task.subtasks) {
                const subtask = this.getTask(subtaskId);
                if (subtask && subtask.status === 'in_progress') {
                    this.updateTaskStatus(subtaskId, 'completed');
                }
            }
        }

        // If task is marked as failed, propagate to subtasks
        if (status === 'failed') {
            for (const subtaskId of task.subtasks) {
                const subtask = this.getTask(subtaskId);
                if (subtask && subtask.status !== 'completed') {
                    this.updateTaskStatus(subtaskId, 'failed');
                }
            }
        }

        return task;
    }

    addSubtask(parentId: string, subtaskData: Omit<Task, 'id' | 'atom_id' | 'created_at' | 'updated_at' | 'subtasks' | 'stamp' | 'parent_id'>): Task {
        const parentTask = this.getTask(parentId);
        if (!parentTask) {
            throw new Error(`Parent task with ID ${parentId} not found`);
        }

        const attention: AttentionValue = {
            priority: this.mapPriorityLevelToValue(subtaskData.priority_level),
            durability: 0.5 // Default durability
        };

        const subtask = TaskFactory.createSubtask(
            parentId,
            subtaskData.content,
            attention,
            subtaskData.priority_level,
            subtaskData.metadata
        );

        // Add subtask-specific properties
        subtask.status = subtaskData.status;
        subtask.dependencies = subtaskData.dependencies;
        subtask.deadline = subtaskData.deadline;
        subtask.estimated_effort = subtaskData.estimated_effort;
        subtask.required_resources = subtaskData.required_resources;
        subtask.outcomes = subtaskData.outcomes;
        subtask.confidence = subtaskData.confidence;
        subtask.tags = subtaskData.tags;
        subtask.categories = subtaskData.categories;
        subtask.context = subtaskData.context;

        // Add subtask to parent
        parentTask.subtasks.push(subtask.id);
        this.tasks.set(parentId, parentTask);

        this.tasks.set(subtask.id, subtask);
        this.notifyListeners({ type: 'taskAdded', task: subtask });
        return subtask;
    }

    getSubtasks(parentId: string): Task[] {
        const parentTask = this.getTask(parentId);
        if (!parentTask) {
            return [];
        }

        return parentTask.subtasks
            .map(subtaskId => this.getTask(subtaskId))
            .filter((task): task is Task => task !== null);
    }

    addEventListener(listener: (event: { type: string; task: Task }) => void): void {
        this.eventListeners.push(listener);
    }

    private notifyListeners(event: { type: string; task: Task }): void {
        for (const listener of this.eventListeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in task event listener:', error);
            }
        }
    }

    private mapPriorityLevelToValue(priority_level: Task['priority_level']): number {
        switch (priority_level) {
            case 'low': return 0.25;
            case 'medium': return 0.5;
            case 'high': return 0.75;
            case 'critical': return 1.0;
            default: return 0.5;
        }
    }
}