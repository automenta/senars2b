import { CognitiveItem, TaskMetadata } from '../interfaces/types';
import { WorldModel } from '../core/worldModel';
import { TaskManager } from './taskManager';
import { CognitiveItemFactory } from './cognitiveItemFactory';
import { v4 as uuidv4 } from 'uuid';

// A type guard to ensure we are dealing with a task.
function isTask(item: CognitiveItem): item is CognitiveItem & { type: 'TASK'; task_metadata: NonNullable<CognitiveItem['task_metadata']> } {
    return item.type === 'TASK' && item.task_metadata != null;
}

/**
 * The result of an orchestration step, containing the updated task and any new items to be added to the agenda.
 */
export interface OrchestrationResult {
    updatedTask: CognitiveItem;
    newItems: CognitiveItem[];
}

/**
 * TaskOrchestrator is responsible for determining the next state of a task based on its current state and the world model.
 * It is a pure logic module that does not perform side effects.
 */
export class TaskOrchestrator {
    private worldModel: WorldModel;
    private taskManager: TaskManager;

    constructor(worldModel: WorldModel, taskManager: TaskManager) {
        this.worldModel = worldModel;
        this.taskManager = taskManager;
    }

    /**
     * Determines the next state of a task and any resulting new cognitive items.
     * @param task The task to orchestrate.
     * @returns An OrchestrationResult, or null if the item is not a task.
     */
    public orchestrate(task: CognitiveItem): OrchestrationResult | null {
        if (!isTask(task)) {
            return null;
        }

        // Deep copy to avoid direct mutation
        let updatedTask = JSON.parse(JSON.stringify(task));
        const newItems: CognitiveItem[] = [];

        switch (updatedTask.task_metadata.status) {
            case 'pending':
                updatedTask.task_metadata.status = 'awaiting_dependencies';
                break;

            case 'awaiting_dependencies':
                if (!this.hasUnresolvedDependencies(updatedTask)) {
                    updatedTask.task_metadata.status = 'decomposing';
                }
                break;

            case 'decomposing':
                if (this.shouldDecompose(updatedTask)) {
                    // Create a goal to trigger the new DecompositionSchema.
                    const decompositionGoal = CognitiveItemFactory.createGoal(
                        uuidv4(), // placeholder atomId
                        { ...updatedTask.attention, priority: 0.95 } // Decomposition is high priority
                    );
                    decompositionGoal.label = `Decompose: ${updatedTask.label}`;
                    decompositionGoal.meta = {
                        isSystemGoal: true,
                        targetTaskId: updatedTask.id
                    };
                    newItems.push(decompositionGoal);

                    // The task now waits for the CognitiveCore to produce subtasks.
                    updatedTask.task_metadata.status = 'awaiting_subtasks';
                } else {
                    // Not a complex task, ready for execution.
                    updatedTask.task_metadata.status = 'ready_for_execution';
                }
                break;

            case 'awaiting_subtasks':
                if (this.areSubtasksComplete(updatedTask)) {
                    updatedTask.task_metadata.status = 'completed';
                } else {
                    updatedTask = this.updateCompletionPercentage(updatedTask);
                }
                break;

            case 'ready_for_execution':
                const goal = CognitiveItemFactory.createGoal(
                    uuidv4(), // Placeholder atomId
                    updatedTask.attention
                );
                goal.label = `Execute atomic task: ${updatedTask.label}`;
                goal.meta = { taskId: updatedTask.id, isAtomicExecution: true };
                newItems.push(goal);
                // Task remains in this state until an external actor (ActionSubsystem) marks it completed.
                break;

            case 'completed':
            case 'failed':
            case 'deferred':
                // Terminal states, no change.
                break;
        }

        // Ensure the timestamp is updated if the status changed
        if (updatedTask.task_metadata.status !== task.task_metadata.status) {
            updatedTask.updated_at = Date.now();
        }

        return { updatedTask, newItems };
    }

    private hasUnresolvedDependencies(task: CognitiveItem & { task_metadata: TaskMetadata }): boolean {
        if (!task.task_metadata.dependencies || task.task_metadata.dependencies.length === 0) {
            return false;
        }

        return task.task_metadata.dependencies.some(depId => {
            const depTask = this.taskManager.getTask(depId);
            return !depTask || depTask.task_metadata?.status !== 'completed';
        });
    }

    private shouldDecompose(task: CognitiveItem & { task_metadata: TaskMetadata }): boolean {
        // Decompose if it's a "complex" task and has no subtasks yet.
        // This is a placeholder for more sophisticated logic.
        const label = task.label.toLowerCase();
        const keywords = ['plan', 'develop', 'create', 'organize', 'manage', 'refactor'];
        return keywords.some(kw => label.includes(kw)) && (!task.subtasks || task.subtasks.length === 0);
    }


    private areSubtasksComplete(task: CognitiveItem & { task_metadata: TaskMetadata }): boolean {
        if (!task.subtasks || task.subtasks.length === 0) {
            return true; // No subtasks means this check passes.
        }

        return task.subtasks.every(subId => {
            const subTask = this.taskManager.getTask(subId);
            return subTask?.task_metadata?.status === 'completed';
        });
    }

    private updateCompletionPercentage(task: CognitiveItem & { task_metadata: TaskMetadata }): CognitiveItem {
        if (!task.subtasks || task.subtasks.length === 0) {
            return task;
        }

        const completedSubtasksCount = task.subtasks.filter(subId => {
            const subTask = this.taskManager.getTask(subId);
            return subTask?.task_metadata?.status === 'completed';
        }).length;

        const percentage = Math.round((completedSubtasksCount / task.subtasks.length) * 100);

        if (task.task_metadata.completion_percentage !== percentage) {
            // Return a new object with the updated percentage and timestamp
            return {
                ...task,
                updated_at: Date.now(),
                task_metadata: {
                    ...task.task_metadata,
                    completion_percentage: percentage,
                }
            };
        }

        return task;
    }
}
