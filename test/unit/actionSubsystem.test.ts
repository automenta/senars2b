import { ActionSubsystem } from '@/actions/actionSubsystem';
import { TaskManager } from '@/modules/taskManager';
import { createGoalItem, createTaskItem } from './testUtils';

// Create a mock TaskManager
const mockTaskManager: jest.Mocked<TaskManager> = {
    updateTaskStatus: jest.fn(),
    getTask: jest.fn(),
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


describe('ActionSubsystem', () => {
    let actionSubsystem: ActionSubsystem;

    beforeEach(() => {
        jest.clearAllMocks();
        actionSubsystem = new ActionSubsystem(mockTaskManager);
    });

    describe('executeGoal', () => {
        it('should find the WebSearchExecutor for a search goal', async () => {
            const goal = createGoalItem({
                label: "Web search for pet safety information"
            });

            const result = await actionSubsystem.executeGoal(goal);

            expect(result).not.toBeNull();
            expect(result?.label).toContain('Search results for');
        });

        it('should execute an atomic task goal using AtomicTaskExecutor', async () => {
            const goal = createGoalItem({
                label: 'Execute atomic task: My Task',
                meta: { isAtomicExecution: true, taskId: 'task123' }
            });

            const result = await actionSubsystem.executeGoal(goal);

            expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith('task123', 'completed');
            expect(result).not.toBeNull();
            expect(result?.label).toContain('Successfully executed atomic task task123');
        });

        it('should return a failure belief if no executor is found', async () => {
            const goal = createGoalItem({ label: 'An unhandled goal' });
            const result = await actionSubsystem.executeGoal(goal);
            expect(result).not.toBeNull();
            expect(result?.label).toContain('No executor found for goal');
        });
    });

    describe('getStatistics', () => {
        it('should return initial empty statistics', () => {
            const stats = actionSubsystem.getStatistics();

            expect(stats.totalExecutions).toBe(0);
            expect(stats.successRate).toBe(0);
            expect(stats.averageDuration).toBe(0);
        });

        it('should update statistics after a successful execution', async () => {
            const goal = createGoalItem({ label: 'search for something' });
            await actionSubsystem.executeGoal(goal);
            const stats = actionSubsystem.getStatistics();

            expect(stats.totalExecutions).toBe(1);
            expect(stats.successRate).toBe(1);
            expect(stats.averageDuration).toBeGreaterThan(0);
            expect(stats.executorStats['WebSearchExecutor'].count).toBe(1);
        });
    });
});