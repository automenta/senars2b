import { v4 as uuidv4 } from 'uuid';
import { CognitiveItem, AttentionValue, TruthValue } from '../interfaces/types';
import { Agenda } from '../core/agenda';
import { WorldModel } from '../core/worldModel';
import { CognitiveItemFactory } from './cognitiveItemFactory';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    priority: number; // 0-1 scale
    createdAt: number;
    updatedAt: number;
    dueDate?: number;
    dependencies: string[]; // IDs of tasks this task depends on
    subtasks: string[]; // IDs of subtasks
    parentId?: string; // ID of parent task
    cognitiveItemId?: string; // Link to CognitiveItem in agenda
    metadata?: Record<string, any>;
}

export interface TaskManager {
    addTask(task: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Task;
    updateTask(id: string, updates: Partial<Task>): Task | null;
    removeTask(id: string): boolean;
    getTask(id: string): Task | null;
    getAllTasks(): Task[];
    getTasksByStatus(status: Task['status']): Task[];
    updateTaskStatus(id: string, status: Task['status']): Task | null;
    linkToCognitiveItem(taskId: string, cognitiveItemId: string): void;
    syncWithAgenda(): void;
    addEventListener(listener: (event: { type: string; task: Task }) => void): void;
    getTaskStatistics(): { // Added method for task statistics
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        failed: number;
    };
}

export class RealTimeTaskManager implements TaskManager {
    private tasks: Map<string, Task> = new Map();
    private agenda: Agenda;
    private worldModel: WorldModel;
    private eventListeners: ((event: { type: string; task: Task }) => void)[] = [];
    private taskHistory: Task[] = []; // Added task history tracking

    constructor(agenda: Agenda, worldModel: WorldModel) {
        this.agenda = agenda;
        this.worldModel = worldModel;
    }

    addTask(taskData: Omit<Task, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Task {
        const task: Task = {
            id: uuidv4(),
            title: taskData.title,
            description: taskData.description,
            status: 'pending',
            priority: taskData.priority || 0.5,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            dueDate: taskData.dueDate,
            dependencies: taskData.dependencies || [],
            subtasks: taskData.subtasks || [],
            parentId: taskData.parentId,
            metadata: taskData.metadata
        };

        this.tasks.set(task.id, task);
        this.notifyListeners({ type: 'taskAdded', task });
        return task;
    }

    updateTask(id: string, updates: Partial<Task>): Task | null {
        const task = this.tasks.get(id);
        if (!task) return null;

        // Update task properties
        Object.assign(task, updates);
        task.updatedAt = Date.now();

        this.tasks.set(id, task);
        this.notifyListeners({ type: 'taskUpdated', task });
        return task;
    }

    getTaskStatistics(): { // Implementation of the new method
        total: number;
        pending: number;
        inProgress: number;
        completed: number;
        failed: number;
    } {
        const tasks = Array.from(this.tasks.values());
        return {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            failed: tasks.filter(t => t.status === 'failed').length
        };
    }

    removeTask(id: string): boolean {
        const task = this.tasks.get(id);
        if (!task) return false;

        // Add to history before removing
        this.taskHistory.push({ ...task });

        // Remove from parent's subtasks
        if (task.parentId) {
            const parent = this.tasks.get(task.parentId);
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

    updateTaskStatus(id: string, status: Task['status']): Task | null {
        const task = this.getTask(id);
        if (!task) return null;

        const oldStatus = task.status;
        task.status = status;
        task.updatedAt = Date.now();

        this.tasks.set(id, task);
        this.notifyListeners({ type: 'taskStatusChanged', task });

        // If task is completed, mark subtasks as completed if they were in-progress
        if (status === 'completed') {
            for (const subtaskId of task.subtasks) {
                const subtask = this.getTask(subtaskId);
                if (subtask && subtask.status === 'in-progress') {
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

    linkToCognitiveItem(taskId: string, cognitiveItemId: string): void {
        const task = this.getTask(taskId);
        if (task) {
            task.cognitiveItemId = cognitiveItemId;
            this.tasks.set(taskId, task);
        }
    }

    syncWithAgenda(): void {
        // Convert pending tasks to CognitiveItems and add to agenda
        const pendingTasks = this.getTasksByStatus('pending');
        
        for (const task of pendingTasks) {
            // Check if all dependencies are completed
            const allDependenciesCompleted = task.dependencies.every(depId => {
                const depTask = this.getTask(depId);
                return depTask && depTask.status === 'completed';
            });

            if (allDependenciesCompleted) {
                // Convert task to CognitiveItem
                const attention: AttentionValue = {
                    priority: task.priority,
                    durability: 0.5 // Default durability
                };

                // Create a SemanticAtom for the task
                const atomId = uuidv4();
                const atom = {
                    id: atomId,
                    content: task.title,
                    embedding: [], // Will be populated by the system
                    creationTime: Date.now(),
                    lastAccessTime: Date.now(),
                    meta: {
                        type: "Task",
                        source: "user_todo",
                        taskId: task.id,
                        ...task.metadata
                    }
                };

                // Add atom to world model
                this.worldModel.add_atom(atom);

                // Create CognitiveItem (GOAL)
                const cognitiveItem = CognitiveItemFactory.createGoal(atomId, attention);
                cognitiveItem.label = task.title;
                cognitiveItem.goal_status = "active";

                // Add to agenda
                this.agenda.push(cognitiveItem);

                // Link task to CognitiveItem
                this.linkToCognitiveItem(task.id, cognitiveItem.id);

                // Update task status
                this.updateTaskStatus(task.id, 'in-progress');
            }
        }
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
}