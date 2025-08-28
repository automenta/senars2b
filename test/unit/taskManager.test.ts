import { UnifiedTaskManager } from '@/modules/taskManager';
import { Agenda } from '@/core/agenda';
import { WorldModel } from '@/core/worldModel';
import { createTaskItem } from './testUtils';
import { CognitiveItem, AttentionValue, TruthValue, DerivationStamp } from '@/interfaces/types';

// Mock the dependencies using jest.Mocked
const mockAgenda: jest.Mocked<Agenda> = {
    push: jest.fn(),
    pop: jest.fn().mockResolvedValue(createTaskItem()), // pop returns a Promise
    peek: jest.fn(),
    size: jest.fn(),
    updateAttention: jest.fn(),
    remove: jest.fn(),
    get: jest.fn(),
};

const mockWorldModel: jest.Mocked<WorldModel> = {
    add_atom: jest.fn(),
    add_item: jest.fn(),
    update_item: jest.fn(),
    remove_item: jest.fn().mockReturnValue(true),
    get_atom: jest.fn(),
    get_item: jest.fn(),
    getAllItems: jest.fn().mockReturnValue([]),
    query_by_semantic: jest.fn().mockReturnValue([]),
    query_by_symbolic: jest.fn().mockReturnValue([]),
    query_by_structure: jest.fn().mockReturnValue([]),
    query_by_meta: jest.fn().mockReturnValue([]),
    query_atoms_by_meta: jest.fn().mockReturnValue([]),
    revise_belief: jest.fn().mockReturnValue([null, null]),
    register_schema_atom: jest.fn(),
    getStatistics: jest.fn(),
    getItemHistory: jest.fn().mockReturnValue([]),
    getConfidenceDistribution: jest.fn(),
};


describe('UnifiedTaskManager', () => {
    let taskManager: UnifiedTaskManager;

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    describe('Constructor', () => {
        it('should load existing tasks from the WorldModel on initialization', () => {
            const pendingTask = createTaskItem({ task_metadata: { status: 'pending', priority_level: 'medium' } });
            const completedTask = createTaskItem({ task_metadata: { status: 'completed', priority_level: 'medium' } });
            mockWorldModel.getAllItems.mockReturnValue([pendingTask, completedTask]);

            const taskManager = new UnifiedTaskManager(mockAgenda, mockWorldModel);

            expect(mockWorldModel.getAllItems).toHaveBeenCalledTimes(1);
            expect(mockAgenda.push).toHaveBeenCalledTimes(1);
            expect(mockAgenda.push).toHaveBeenCalledWith(pendingTask);
        });
    });

    describe('addTask', () => {
        it('should create a task, add it to the world model, and push it to the agenda', () => {
            taskManager = new UnifiedTaskManager(mockAgenda, mockWorldModel);
            const taskData = { label: 'Test Task', attention: { priority: 0.5, durability: 0.5 } };
            const task = taskManager.addTask(taskData);

            expect(task.label).toBe('Test Task');
            expect(mockWorldModel.add_item).toHaveBeenCalledWith(task);
            expect(mockAgenda.push).toHaveBeenCalledWith(task);
        });
    });

    describe('updateTask', () => {
        it('should update an existing task in the world model', () => {
            taskManager = new UnifiedTaskManager(mockAgenda, mockWorldModel);
            const task = createTaskItem({ id: 'task1' });
            mockWorldModel.get_item.mockReturnValue(task);

            const updates = { label: 'Updated Task Label' };
            const updatedTask = taskManager.updateTask('task1', updates);

            expect(updatedTask?.label).toBe('Updated Task Label');
            expect(mockWorldModel.update_item).toHaveBeenCalledWith(expect.objectContaining({
                id: 'task1',
                label: 'Updated Task Label'
            }));
        });
    });

    describe('removeTask', () => {
        it('should remove a task from the world model and agenda', () => {
            taskManager = new UnifiedTaskManager(mockAgenda, mockWorldModel);
            taskManager.removeTask('task1');

            expect(mockWorldModel.remove_item).toHaveBeenCalledWith('task1');
            expect(mockAgenda.remove).toHaveBeenCalledWith('task1');
        });
    });

    describe('Task Lifecycle Management', () => {
        beforeEach(() => {
            taskManager = new UnifiedTaskManager(mockAgenda, mockWorldModel);
        });

        it('completeTask should update status and remove from agenda', () => {
            const task = createTaskItem({ id: 'task1' });
            mockWorldModel.get_item.mockReturnValue(task);

            taskManager.completeTask('task1');

            expect(mockWorldModel.update_item).toHaveBeenCalledWith(expect.objectContaining({
                id: 'task1',
                task_metadata: expect.objectContaining({ status: 'completed' }),
            }));
            expect(mockAgenda.remove).toHaveBeenCalledWith('task1');
        });

        it('failTask should update status and propagate to subtasks', () => {
            const subtask = createTaskItem({ id: 'sub1' });
            const parentTask = createTaskItem({ id: 'parent1', subtasks: ['sub1'] });

            mockWorldModel.get_item.mockImplementation(id => {
                if (id === 'parent1') return parentTask;
                if (id === 'sub1') return subtask;
                return null;
            });

            taskManager.failTask('parent1');

            // Check parent task failure
            expect(mockWorldModel.update_item).toHaveBeenCalledWith(expect.objectContaining({
                id: 'parent1',
                task_metadata: expect.objectContaining({ status: 'failed' }),
            }));
            expect(mockAgenda.remove).toHaveBeenCalledWith('parent1');

            // Check subtask failure propagation
            expect(mockWorldModel.update_item).toHaveBeenCalledWith(expect.objectContaining({
                id: 'sub1',
                task_metadata: expect.objectContaining({ status: 'failed' }),
            }));
            expect(mockAgenda.remove).toHaveBeenCalledWith('sub1');
        });

        it('deferTask should update status and remove from agenda', () => {
            const task = createTaskItem({ id: 'task1' });
            mockWorldModel.get_item.mockReturnValue(task);

            taskManager.deferTask('task1');

            expect(mockWorldModel.update_item).toHaveBeenCalledWith(expect.objectContaining({
                id: 'task1',
                task_metadata: expect.objectContaining({ status: 'deferred' }),
            }));
            expect(mockAgenda.remove).toHaveBeenCalledWith('task1');
        });
    });

    describe('executeTask', () => {
        it('should execute a task and mark it as completed', async () => {
            taskManager = new UnifiedTaskManager(mockAgenda, mockWorldModel);
            const task = createTaskItem({ id: 'task1' });
            mockWorldModel.get_item.mockReturnValue(task);

            await taskManager.executeTask(task);

            expect(mockWorldModel.update_item).toHaveBeenCalledWith(expect.objectContaining({
                id: 'task1',
                task_metadata: expect.objectContaining({ status: 'completed' }),
            }));
            expect(mockAgenda.remove).toHaveBeenCalledWith('task1');
        });
    });
});
