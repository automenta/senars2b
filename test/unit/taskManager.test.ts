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
    updateTaskStatus: jest.fn(),
    getTasksBy: jest.fn().mockReturnValue([]),
    getTasksByGroup: jest.fn().mockReturnValue([]),
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
        it('should load non-terminal tasks from the WorldModel on initialization', () => {
            const pendingTask = createTaskItem({ id: 'task1', task_metadata: { status: 'pending', priority_level: 'medium' } });
            const awaitingTask = createTaskItem({ id: 'task2', task_metadata: { status: 'awaiting_dependencies', priority_level: 'medium' } });
            const completedTask = createTaskItem({ id: 'task3', task_metadata: { status: 'completed', priority_level: 'medium' } });
            const failedTask = createTaskItem({ id: 'task4', task_metadata: { status: 'failed', priority_level: 'medium' } });
            mockWorldModel.getAllItems.mockReturnValue([pendingTask, awaitingTask, completedTask, failedTask]);

            const taskManager = new UnifiedTaskManager(mockAgenda, mockWorldModel);

            expect(mockWorldModel.getAllItems).toHaveBeenCalledTimes(1);
            expect(mockAgenda.push).toHaveBeenCalledTimes(2);
            expect(mockAgenda.push).toHaveBeenCalledWith(pendingTask);
            expect(mockAgenda.push).toHaveBeenCalledWith(awaitingTask);
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
            const parentTask = createTaskItem({ id: 'parent1', task_metadata: { subtasks: ['sub1'], status: 'pending', priority_level: 'medium' } });

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


    describe('Task Grouping', () => {
        beforeEach(() => {
            taskManager = new UnifiedTaskManager(mockAgenda, mockWorldModel);
        });

        it('should assign a task to a group', () => {
            const task = createTaskItem({ id: 'task1' });
            mockWorldModel.get_item.mockReturnValue(task);

            // Mock updateTask to return the modified task
            taskManager.updateTask = jest.fn().mockImplementation((id, updates) => {
                const updated = { ...task, ...updates };
                updated.task_metadata = { ...task.task_metadata, ...updates.task_metadata };
                return updated;
            });

            const updatedTask = taskManager.assignTaskToGroup('task1', 'group1');

            expect(taskManager.updateTask).toHaveBeenCalledWith('task1', {
                task_metadata: expect.objectContaining({ group_id: 'group1' }),
            });
            expect(updatedTask?.task_metadata?.group_id).toBe('group1');
        });

        it('should return null when assigning a non-existent task to a group', () => {
            mockWorldModel.get_item.mockReturnValue(null);
            const result = taskManager.assignTaskToGroup('non-existent-task', 'group1');
            expect(result).toBeNull();
            expect(mockWorldModel.update_item).not.toHaveBeenCalled();
        });

        it('should retrieve tasks by group ID', () => {
            const task1 = createTaskItem({ id: 'task1', task_metadata: { group_id: 'group1', status: 'pending', priority_level: 'medium' } });
            const task2 = createTaskItem({ id: 'task2', task_metadata: { group_id: 'group2', status: 'pending', priority_level: 'medium' } });
            const task3 = createTaskItem({ id: 'task3', task_metadata: { group_id: 'group1', status: 'pending', priority_level: 'medium' } });
            mockWorldModel.getAllItems.mockReturnValue([task1, task2, task3]);

            const group1Tasks = taskManager.getTasksByGroupId('group1');

            expect(group1Tasks).toHaveLength(2);
            expect(group1Tasks).toContain(task1);
            expect(group1Tasks).toContain(task3);
        });

        it('should return an empty array if no tasks match the group ID', () => {
            const task1 = createTaskItem({ id: 'task1', task_metadata: { group_id: 'group1', status: 'pending', priority_level: 'medium' } });
            mockWorldModel.getAllItems.mockReturnValue([task1]);

            const group2Tasks = taskManager.getTasksByGroupId('group2');

            expect(group2Tasks).toHaveLength(0);
        });
    });

    describe('getTaskStatistics', () => {
        it('should return correct counts for each task status', () => {
            taskManager = new UnifiedTaskManager(mockAgenda, mockWorldModel);
            const tasks = [
                createTaskItem({ task_metadata: { status: 'pending', priority_level: 'medium' } }),
                createTaskItem({ task_metadata: { status: 'awaiting_dependencies', priority_level: 'medium' } }),
                createTaskItem({ task_metadata: { status: 'awaiting_dependencies', priority_level: 'medium' } }),
                createTaskItem({ task_metadata: { status: 'decomposing', priority_level: 'medium' } }),
                createTaskItem({ task_metadata: { status: 'completed', priority_level: 'medium' } }),
            ];
            mockWorldModel.getAllItems.mockReturnValue(tasks);

            const stats = taskManager.getTaskStatistics();

            expect(stats.total).toBe(5);
            expect(stats.pending).toBe(1);
            expect(stats.awaiting_dependencies).toBe(2);
            expect(stats.decomposing).toBe(1);
            expect(stats.ready_for_execution).toBe(0);
            expect(stats.completed).toBe(1);
            expect(stats.failed).toBe(0);
            expect(stats.deferred).toBe(0);
        });
    });
});
