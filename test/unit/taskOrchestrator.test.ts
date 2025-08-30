import { TaskOrchestrator, OrchestrationResult } from '@/modules/taskOrchestrator';
import { TaskManager } from '@/modules/taskManager';
import { WorldModel } from '@/core/worldModel';
import { createTaskItem } from './testUtils';
import { CognitiveItem } from '@/interfaces/types';

// Mock dependencies
const mockTaskManager: jest.Mocked<TaskManager> = {
    getTask: jest.fn(),
    // We only need getTask for the orchestrator's logic
    updateTaskStatus: jest.fn(),
    addSubtask: jest.fn(),
    updateTask: jest.fn(),
    addTask: jest.fn(),
    removeTask: jest.fn(),
    getAllTasks: jest.fn(),
    getTasksByStatus: jest.fn(),
    getTasksByPriority: jest.fn(),
    getTasksByGroupId: jest.fn(),
    assignTaskToGroup: jest.fn(),
    getSubtasks: jest.fn(),
    addEventListener: jest.fn(),
    getTaskStatistics: jest.fn(),
};

// WorldModel is not used in the current orchestrator logic, but it's a dependency
const mockWorldModel: jest.Mocked<WorldModel> = jest.fn() as any;

describe('TaskOrchestrator', () => {
    let orchestrator: TaskOrchestrator;

    beforeEach(() => {
        jest.clearAllMocks();
        orchestrator = new TaskOrchestrator(mockWorldModel, mockTaskManager);
    });

    it('should return null if the item is not a task', () => {
        const item = createTaskItem({ type: 'BELIEF' } as any);
        const result = orchestrator.orchestrate(item);
        expect(result).toBeNull();
    });

    it('should transition status from pending to awaiting_dependencies', () => {
        const task = createTaskItem({ task_metadata: { status: 'pending', priority_level: 'medium' } });
        const result = orchestrator.orchestrate(task) as OrchestrationResult;
        expect(result.updatedTask.task_metadata!.status).toBe('awaiting_dependencies');
        expect(result.newItems).toHaveLength(0);
    });

    it('should transition to decomposing when dependencies are met', () => {
        const task = createTaskItem({
            task_metadata: { status: 'awaiting_dependencies', dependencies: ['dep1'], priority_level: 'medium' },
        });
        const depTask = createTaskItem({ id: 'dep1', task_metadata: { status: 'completed', priority_level: 'medium' } });
        mockTaskManager.getTask.mockReturnValue(depTask);

        const result = orchestrator.orchestrate(task) as OrchestrationResult;
        expect(result.updatedTask.task_metadata!.status).toBe('decomposing');
    });

    it('should remain in awaiting_dependencies if dependencies are not met', () => {
        const task = createTaskItem({
            task_metadata: { status: 'awaiting_dependencies', dependencies: ['dep1'], priority_level: 'medium' },
        });
        const depTask = createTaskItem({ id: 'dep1', task_metadata: { status: 'pending', priority_level: 'medium' } });
        mockTaskManager.getTask.mockReturnValue(depTask);

        const result = orchestrator.orchestrate(task) as OrchestrationResult;
        // Status should not change
        expect(result.updatedTask.task_metadata!.status).toBe('awaiting_dependencies');
    });

    it('should create a decomposition goal for a complex task', () => {
        const task = createTaskItem({
            label: 'Plan a party',
            task_metadata: { status: 'decomposing', priority_level: 'medium' },
        });
        const result = orchestrator.orchestrate(task) as OrchestrationResult;

        expect(result.updatedTask.task_metadata!.status).toBe('awaiting_subtasks');
        expect(result.newItems).toHaveLength(1);
        const newGoal = result.newItems[0];
        expect(newGoal.type).toBe('GOAL');
        expect(newGoal.label).toBe(`Decompose: ${task.label}`);
        expect(newGoal.meta?.targetTaskId).toBe(task.id);
    });

    it('should transition a simple task from decomposing to ready_for_execution', () => {
        const task = createTaskItem({
            label: 'Just do it',
            task_metadata: { status: 'decomposing', priority_level: 'medium' },
        });
        const result = orchestrator.orchestrate(task) as OrchestrationResult;

        expect(result.updatedTask.task_metadata!.status).toBe('ready_for_execution');
        expect(result.newItems).toHaveLength(0);
    });

    it('should transition from awaiting_subtasks to completed when subtasks are done', () => {
        const task = createTaskItem({
            subtasks: ['sub1'],
            task_metadata: { status: 'awaiting_subtasks', priority_level: 'medium' },
        });
        const subtask = createTaskItem({ id: 'sub1', task_metadata: { status: 'completed', priority_level: 'medium' } });
        mockTaskManager.getTask.mockReturnValue(subtask);

        const result = orchestrator.orchestrate(task) as OrchestrationResult;
        expect(result.updatedTask.task_metadata!.status).toBe('completed');
    });

    it('should update completion percentage if subtasks are not done', () => {
        const task = createTaskItem({
            subtasks: ['sub1', 'sub2'],
            task_metadata: { status: 'awaiting_subtasks', priority_level: 'medium', completion_percentage: 0 },
        });
        const subtask1 = createTaskItem({ id: 'sub1', task_metadata: { status: 'completed', priority_level: 'medium' } });
        const subtask2 = createTaskItem({ id: 'sub2', task_metadata: { status: 'pending', priority_level: 'medium' } });
        mockTaskManager.getTask.mockImplementation(id => {
            if (id === 'sub1') return subtask1;
            if (id === 'sub2') return subtask2;
            return null;
        });

        const result = orchestrator.orchestrate(task) as OrchestrationResult;
        expect(result.updatedTask.task_metadata!.status).toBe('awaiting_subtasks');
        expect(result.updatedTask.task_metadata!.completion_percentage).toBe(50);
    });

    it('should return a new GOAL when a task is ready_for_execution', () => {
        const task = createTaskItem({
            task_metadata: { status: 'ready_for_execution', priority_level: 'medium' },
        });
        const result = orchestrator.orchestrate(task) as OrchestrationResult;

        expect(result.newItems).toHaveLength(1);
        const newGoal = result.newItems[0];
        expect(newGoal.type).toBe('GOAL');
        expect(newGoal.label).toBe(`Execute atomic task: ${task.label}`);
        expect(newGoal.meta?.taskId).toBe(task.id);
    });
});
