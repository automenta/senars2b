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

        if (typeof task.task_metadata!.completion_percentage !== 'number') {
            task.task_metadata!.completion_percentage = 0;
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

        if (typeof subtask.task_metadata!.completion_percentage !== 'number') {
            subtask.task_metadata!.completion_percentage = 0;
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
        if (!isTask(task) || !task.task_metadata) {
            return;
        }

        console.log(`Processing task ${task.id}: ${task.label} with status ${task.task_metadata.status}`);

        // Update status to 'in_progress' if it's pending
        if (task.task_metadata.status === 'pending') {
            const updatedTask = this.updateTaskStatus(task.id, 'in_progress');
            if (!updatedTask) return; // Exit if task was not found
            task = updatedTask; // Safely reassign to the updated task
        }

        // After potential reassignment, task_metadata could be undefined again for the compiler.
        // A simple re-check ensures type safety for the rest of the function.
        if (!task.task_metadata) return;

        // 1. Check for dependencies
        if (task.task_metadata.dependencies && task.task_metadata.dependencies.length > 0) {
            const unresolvedDependencies = task.task_metadata.dependencies.filter(depId => {
                const depTask = this.getTask(depId);
                return !depTask || depTask.task_metadata?.status !== 'completed';
            });

            if (unresolvedDependencies.length > 0) {
                console.log(`Task ${task.id} is blocked by dependencies: ${unresolvedDependencies.join(', ')}.`);
                return;
            }
        }

        // 2. Handle subtasks (if they exist)
        if (task.subtasks && task.subtasks.length > 0) {
            const completedSubtasks = task.subtasks.filter(subId => {
                const subTask = this.getTask(subId);
                return subTask && subTask.task_metadata?.status === 'completed';
            });

            const percentage = Math.round((completedSubtasks.length / task.subtasks.length) * 100);
            if (task.task_metadata.completion_percentage !== percentage) {
                task.task_metadata.completion_percentage = percentage;
                this.worldModel.update_item(task); // Persist progress
            }

            if (completedSubtasks.length === task.subtasks.length) {
                console.log(`All subtasks for ${task.id} are complete. Completing parent task.`);
                this.completeTask(task.id);
                return;
            } else {
                console.log(`Task ${task.id} is waiting for subtasks to complete. Progress: ${percentage}%`);
                return;
            }
        }

        // 3. Decompose complex tasks (if they have no subtasks yet)
        if (this.shouldDecompose(task)) {
            console.log(`Decomposing task ${task.id}: ${task.label}`);
            const subtaskContents = [`Research for '${task.label}'`, `Outline for '${task.label}'`, `Draft for '${task.label}'`];
            for (const content of subtaskContents) {
                this.addSubtask(task.id, {
                    label: content,
                    attention: task.attention,
                    task_metadata: {
                        status: 'pending', // Explicitly set status
                        priority_level: task.task_metadata.priority_level
                    }
                });
            }
            return;
        }

        // 4. Execute atomic task (no dependencies, no subtasks, no decomposition needed)
        console.log(`Executing atomic task ${task.id}: ${task.label}`);
        await new Promise(resolve => setTimeout(resolve, 100));

        this.completeTask(task.id);
        console.log(`Execution finished for task ${task.id}`);
    }

    private shouldDecompose(task: CognitiveItem): boolean {
        if (!isTask(task)) return false;
        const label = task.label.toLowerCase();
        const keywords = ['plan', 'develop', 'create', 'organize', 'manage'];
        // Decompose if it has a decomposition keyword AND it has no subtasks yet.
        return keywords.some(kw => label.includes(kw)) && (!task.subtasks || task.subtasks.length === 0);
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