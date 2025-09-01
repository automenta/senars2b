import {CognitiveItem, TaskMetadata, TaskStatus} from '../interfaces/types';
import {WorldModel} from '../core/worldModel';
import {TaskManager} from './taskManager';
import {CognitiveItemFactory} from './cognitiveItemFactory';
import {v4 as uuidv4} from 'uuid';

// A type guard to ensure we are dealing with a task.
function isTask(item: CognitiveItem): item is CognitiveItem & {
    type: 'TASK';
    task_metadata: NonNullable<CognitiveItem['task_metadata']>
} {
    return item.type === 'TASK' && item.task_metadata != null;
}

/**
 * The result of an orchestration step, containing the updated task and any new items to be added to the agenda.
 */
export interface OrchestrationResult {
    updatedTask: CognitiveItem;
    newItems: CognitiveItem[];
}

// Define terminal task statuses for easy checking
const TERMINAL_TASK_STATUSES: TaskStatus[] = ['completed', 'failed', 'deferred'];

// Define complex task keywords for decomposition logic
const COMPLEX_TASK_KEYWORDS = ['plan', 'develop', 'create', 'organize', 'manage', 'refactor'];

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
        let updatedTask: CognitiveItem = JSON.parse(JSON.stringify(task));
        let newItems: CognitiveItem[] = [];

        // Skip orchestration for terminal states
        if (this.isTerminalStatus(updatedTask.task_metadata!.status)) {
            return {updatedTask, newItems};
        }

        switch (updatedTask.task_metadata!.status) {
            case 'pending':
                updatedTask = this.transitionFromPending(updatedTask);
                break;

            case 'awaiting_dependencies':
                updatedTask = this.transitionFromAwaitingDependencies(updatedTask);
                break;

            case 'decomposing':
                const decompositionResult = this.transitionFromDecomposing(updatedTask);
                updatedTask = decompositionResult.updatedTask;
                newItems = decompositionResult.newItems;
                break;

            case 'awaiting_subtasks':
                updatedTask = this.transitionFromAwaitingSubtasks(updatedTask);
                break;

            case 'ready_for_execution':
                newItems = this.transitionFromReadyForExecution(updatedTask);
                break;
        }

        // Ensure the timestamp is updated if the status changed
        if (updatedTask.task_metadata!.status !== task.task_metadata!.status) {
            updatedTask.updated_at = Date.now();
        }

        return {updatedTask, newItems};
    }

    private isTerminalStatus(status: TaskStatus): boolean {
        return TERMINAL_TASK_STATUSES.includes(status);
    }

    private transitionFromPending(task: CognitiveItem): CognitiveItem {
        task.task_metadata!.status = 'awaiting_dependencies';
        return task;
    }

    private transitionFromAwaitingDependencies(task: CognitiveItem): CognitiveItem {
        // The agenda is now responsible for blocking tasks with unresolved dependencies.
        // If a task in this state is popped, it means its dependencies are met.
        task.task_metadata!.status = 'decomposing';
        return task;
    }

    private transitionFromDecomposing(task: CognitiveItem): { updatedTask: CognitiveItem, newItems: CognitiveItem[] } {
        const newItems: CognitiveItem[] = [];

        if (this.shouldDecompose(task as CognitiveItem & { task_metadata: TaskMetadata })) {
            // Create a goal to trigger the new DecompositionSchema.
            const decompositionGoal = CognitiveItemFactory.createGoal(
                uuidv4(), // placeholder atomId
                {...task.attention, priority: 0.95} // Decomposition is high priority
            );
            decompositionGoal.label = `Decompose: ${task.label}`;
            decompositionGoal.meta = {
                isSystemGoal: true,
                targetTaskId: task.id
            };
            newItems.push(decompositionGoal);

            // The task now waits for the CognitiveCore to produce subtasks.
            task.task_metadata!.status = 'awaiting_subtasks';
        } else {
            // Not a complex task, ready for execution.
            task.task_metadata!.status = 'ready_for_execution';
        }

        return {updatedTask: task, newItems};
    }

    private transitionFromAwaitingSubtasks(task: CognitiveItem): CognitiveItem {
        if (this.areSubtasksComplete(task as CognitiveItem & { task_metadata: TaskMetadata })) {
            task.task_metadata!.status = 'completed';
        }
        // The agenda will now be responsible for updating the completion percentage.
        return task;
    }

    private transitionFromReadyForExecution(task: CognitiveItem): CognitiveItem[] {
        const goal = CognitiveItemFactory.createGoal(
            uuidv4(), // Placeholder atomId
            task.attention
        );
        goal.label = `Execute atomic task: ${task.label}`;
        goal.meta = {taskId: task.id, isAtomicExecution: true};
        // Task remains in this state until an external actor (ActionSubsystem) marks it completed.
        return [goal];
    }

    private shouldDecompose(task: CognitiveItem & { task_metadata: TaskMetadata }): boolean {
        // Decompose if it's a "complex" task and has no subtasks yet.
        // This is a placeholder for more sophisticated logic.
        const label = task.label.toLowerCase();
        return COMPLEX_TASK_KEYWORDS.some(kw => label.includes(kw)) &&
            (!task.task_metadata.subtasks || task.task_metadata.subtasks.length === 0);
    }

    private areSubtasksComplete(task: CognitiveItem & { task_metadata: TaskMetadata }): boolean {
        if (!task.task_metadata.subtasks || task.task_metadata.subtasks.length === 0) {
            return true; // No subtasks means this check passes.
        }

        return task.task_metadata.subtasks.every(subId => {
            const subTask = this.taskManager.getTask(subId);
            return subTask?.task_metadata?.status === 'completed';
        });
    }
}
