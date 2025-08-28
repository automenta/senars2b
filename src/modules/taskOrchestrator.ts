import { CognitiveItem } from '../interfaces/types';
import { WorldModel } from '../core/worldModel';
import { TaskManager } from './taskManager';
import { Agenda } from '../core/agenda';
import { CognitiveItemFactory } from './cognitiveItemFactory';
import { v4 as uuidv4 } from 'uuid';

// A type guard to ensure we are dealing with a task.
function isTask(item: CognitiveItem): item is CognitiveItem & { type: 'TASK'; task_metadata: NonNullable<CognitiveItem['task_metadata']> } {
    return item.type === 'TASK' && item.task_metadata != null;
}

export class TaskOrchestrator {
    private worldModel: WorldModel;
    private taskManager: TaskManager;
    private agenda: Agenda;

    constructor(worldModel: WorldModel, taskManager: TaskManager, agenda: Agenda) {
        this.worldModel = worldModel;
        this.taskManager = taskManager;
        this.agenda = agenda;
    }

    public orchestrate(task: CognitiveItem): void {
        if (!isTask(task)) {
            return;
        }

        console.log(`Orchestrating task ${task.id}: ${task.label} with status ${task.task_metadata.status}`);

        switch (task.task_metadata.status) {
            case 'pending':
                // A new task. Start by checking dependencies.
                this.taskManager.updateTaskStatus(task.id, 'awaiting_dependencies');
                break;

            case 'awaiting_dependencies':
                if (this.hasUnresolvedDependencies(task)) {
                    console.log(`Task ${task.id} is blocked by dependencies.`);
                    // The task remains in this state until dependencies are resolved.
                    // Future enhancement: generate goals to resolve dependencies.
                } else {
                    // Dependencies are met, move to decomposition.
                    this.taskManager.updateTaskStatus(task.id, 'decomposing');
                }
                break;

            case 'decomposing':
                if (this.shouldDecompose(task)) {
                    this.decomposeTask(task);
                    this.taskManager.updateTaskStatus(task.id, 'awaiting_subtasks');
                } else {
                    // Not a complex task, ready for execution.
                    this.taskManager.updateTaskStatus(task.id, 'ready_for_execution');
                }
                break;

            case 'awaiting_subtasks':
                if (this.areSubtasksComplete(task)) {
                    this.taskManager.updateTaskStatus(task.id, 'completed');
                } else {
                    // Still waiting for subtasks. We can update the completion percentage.
                    this.updateCompletionPercentage(task);
                }
                break;

            case 'ready_for_execution':
                // This task is ready to be executed by the action subsystem.
                // We create a goal to trigger this.
                console.log(`Generating execution goal for task ${task.id}`);
                const goal = CognitiveItemFactory.createGoal(
                    uuidv4(), // Placeholder atomId
                    task.attention
                );
                goal.label = `Execute atomic task: ${task.label}`;
                goal.meta = { taskId: task.id, isAtomicExecution: true };
                this.agenda.push(goal);
                // The task remains in 'ready_for_execution' state.
                // The ActionSubsystem will mark it as 'completed' once the goal is executed.
                break;

            case 'completed':
            case 'failed':
            case 'deferred':
                // These are terminal states, do nothing.
                break;
        }
    }

    private hasUnresolvedDependencies(task: CognitiveItem): boolean {
        if (!isTask(task) || !task.task_metadata.dependencies || task.task_metadata.dependencies.length === 0) {
            return false;
        }

        return task.task_metadata.dependencies.some(depId => {
            const depTask = this.taskManager.getTask(depId);
            return !depTask || depTask.task_metadata?.status !== 'completed';
        });
    }

    private shouldDecompose(task: CognitiveItem): boolean {
        if (!isTask(task)) return false;
        // Decompose if it's a "complex" task and has no subtasks yet.
        // This is a placeholder for more sophisticated logic.
        const label = task.label.toLowerCase();
        const keywords = ['plan', 'develop', 'create', 'organize', 'manage', 'refactor'];
        return keywords.some(kw => label.includes(kw)) && (!task.subtasks || task.subtasks.length === 0);
    }

    private decomposeTask(task: CognitiveItem): void {
        if (!isTask(task)) return;

        console.log(`Decomposing task ${task.id}: ${task.label}`);
        // Placeholder decomposition logic.
        const subtaskContents = [`Research for '${task.label}'`, `Outline for '${task.label}'`, `Draft for '${task.label}'`];
        for (const content of subtaskContents) {
            this.taskManager.addSubtask(task.id, {
                label: content,
                attention: task.attention,
                task_metadata: {
                    status: 'pending',
                    priority_level: task.task_metadata.priority_level
                }
            });
        }
    }

    private areSubtasksComplete(task: CognitiveItem): boolean {
        if (!isTask(task) || !task.subtasks || task.subtasks.length === 0) {
            return true; // No subtasks means this check passes.
        }

        const completedSubtasks = task.subtasks.filter(subId => {
            const subTask = this.taskManager.getTask(subId);
            return subTask && subTask.task_metadata?.status === 'completed';
        });

        return completedSubtasks.length === task.subtasks.length;
    }

    private updateCompletionPercentage(task: CognitiveItem): void {
        if (!isTask(task) || !task.subtasks || task.subtasks.length === 0) {
            return;
        }

        const completedSubtasks = task.subtasks.filter(subId => {
            const subTask = this.taskManager.getTask(subId);
            return subTask && subTask.task_metadata?.status === 'completed';
        });

        const percentage = Math.round((completedSubtasks.length / task.subtasks.length) * 100);
        if (task.task_metadata.completion_percentage !== percentage) {
            this.taskManager.updateTask(task.id, {
                task_metadata: {
                    ...task.task_metadata,
                    completion_percentage: percentage
                }
            });
        }
    }
}
