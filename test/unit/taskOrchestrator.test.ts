import { TaskOrchestrator } from '@/modules/taskOrchestrator';
import { TaskManager } from '@/modules/taskManager';
import { Agenda } from '@/core/agenda';
import { WorldModel } from '@/core/worldModel';
import { createTaskItem } from './testUtils';
import { CognitiveItem } from '@/interfaces/types';

// Mock dependencies
const mockTaskManager: jest.Mocked<TaskManager> = {
    updateTaskStatus: jest.fn(),
    getTask: jest.fn(),
    addSubtask: jest.fn(),
    updateTask: jest.fn(),
    // Add mocks for any other TaskManager methods used by the orchestrator
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

const mockAgenda: jest.Mocked<Agenda> = {
    push: jest.fn(),
    pop: jest.fn(),
    peek: jest.fn(),
    size: jest.fn(),
    updateAttention: jest.fn(),
    remove: jest.fn(),
    get: jest.fn(),
    updateTaskStatus: jest.fn(),
    getTasksBy: jest.fn(),
    getTasksByGroup: jest.fn(),
};

const mockWorldModel: jest.Mocked<WorldModel> = {
    add_atom: jest.fn(),
    add_item: jest.fn(),
    update_item: jest.fn(),
    remove_item: jest.fn(),
    get_atom: jest.fn(),
    get_item: jest.fn(),
    getAllItems: jest.fn(),
    query_by_semantic: jest.fn(),
    query_by_symbolic: jest.fn(),
    query_by_structure: jest.fn(),
    query_by_meta: jest.fn(),
    query_atoms_by_meta: jest.fn(),
    revise_belief: jest.fn(),
    register_schema_atom: jest.fn(),
    getStatistics: jest.fn(),
    getItemHistory: jest.fn(),
    getConfidenceDistribution: jest.fn(),
};

describe('TaskOrchestrator', () => {
    let orchestrator: TaskOrchestrator;

    beforeEach(() => {
        jest.clearAllMocks();
        orchestrator = new TaskOrchestrator(mockWorldModel, mockTaskManager, mockAgenda);
    });

    it('should update status from pending to awaiting_dependencies', () => {
        const task = createTaskItem({ task_metadata: { status: 'pending', priority_level: 'medium' } });
        orchestrator.orchestrate(task);
        expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(task.id, 'awaiting_dependencies');
    });

    it('should update status to decomposing when dependencies are met', () => {
        const task = createTaskItem({
            task_metadata: { status: 'awaiting_dependencies', dependencies: ['dep1'], priority_level: 'medium' },
        });
        const depTask = createTaskItem({ id: 'dep1', task_metadata: { status: 'completed', priority_level: 'medium' } });
        mockTaskManager.getTask.mockReturnValue(depTask);

        orchestrator.orchestrate(task);
        expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(task.id, 'decomposing');
    });

    it('should remain in awaiting_dependencies if dependencies are not met', () => {
        const task = createTaskItem({
            task_metadata: { status: 'awaiting_dependencies', dependencies: ['dep1'], priority_level: 'medium' },
        });
        const depTask = createTaskItem({ id: 'dep1', task_metadata: { status: 'pending', priority_level: 'medium' } });
        mockTaskManager.getTask.mockReturnValue(depTask);

        orchestrator.orchestrate(task);
        expect(mockTaskManager.updateTaskStatus).not.toHaveBeenCalled();
    });

    it('should decompose a complex task and move to awaiting_subtasks', () => {
        const task = createTaskItem({
            label: 'Plan a party',
            task_metadata: { status: 'decomposing', priority_level: 'medium' },
        });
        orchestrator.orchestrate(task);
        expect(mockTaskManager.addSubtask).toHaveBeenCalled();
        expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(task.id, 'awaiting_subtasks');
    });

    it('should move a simple task from decomposing to ready_for_execution', () => {
        const task = createTaskItem({
            label: 'Just do it',
            task_metadata: { status: 'decomposing', priority_level: 'medium' },
        });
        orchestrator.orchestrate(task);
        expect(mockTaskManager.addSubtask).not.toHaveBeenCalled();
        expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(task.id, 'ready_for_execution');
    });

    it('should move from awaiting_subtasks to completed when subtasks are done', () => {
        const task = createTaskItem({
            subtasks: ['sub1'],
            task_metadata: { status: 'awaiting_subtasks', priority_level: 'medium' },
        });
        const subtask = createTaskItem({ id: 'sub1', task_metadata: { status: 'completed', priority_level: 'medium' } });
        mockTaskManager.getTask.mockReturnValue(subtask);

        orchestrator.orchestrate(task);
        expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(task.id, 'completed');
    });

    it('should remain in awaiting_subtasks and update progress if subtasks are not done', () => {
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

        orchestrator.orchestrate(task);
        expect(mockTaskManager.updateTaskStatus).not.toHaveBeenCalledWith(task.id, 'completed');
        expect(mockTaskManager.updateTask).toHaveBeenCalledWith(task.id, expect.objectContaining({
            task_metadata: expect.objectContaining({ completion_percentage: 50 }),
        }));
    });

    it('should create an execution goal when a task is ready_for_execution', () => {
        const task = createTaskItem({
            task_metadata: { status: 'ready_for_execution', priority_level: 'medium' },
        });
        orchestrator.orchestrate(task);
        expect(mockAgenda.push).toHaveBeenCalledWith(expect.objectContaining({
            type: 'GOAL',
            label: `Execute atomic task: ${task.label}`,
            meta: expect.objectContaining({ isAtomicExecution: true, taskId: task.id }),
        }));
    });
});
