import { ActionSubsystem } from '@/actions/actionSubsystem';
import { TaskManager } from '@/modules/taskManager';
import { createGoalItem } from './testUtils';

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
        label: 'Web search for pet safety information',
      });

      const result = await actionSubsystem.executeGoal(goal);

      expect(result).not.toBeNull();
      expect(result?.label).toContain('Search results for');
    });

    it('should execute an atomic task goal using AtomicTaskExecutor', async () => {
      const goal = createGoalItem({
        label: 'Execute atomic task: My Task',
        meta: { isAtomicExecution: true, taskId: 'task123' },
      });

      const result = await actionSubsystem.executeGoal(goal);

      expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith(
        'task123',
        'completed'
      );
      expect(result).not.toBeNull();
      expect(result?.label).toContain(
        'Successfully executed atomic task task123'
      );
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

      let currentTime = 1000000;
      const dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => {
        currentTime += 100; // Increment time by 100ms on each call
        return currentTime;
      });

      await actionSubsystem.executeGoal(goal);
      const stats = actionSubsystem.getStatistics();

      // There are multiple calls to Date.now() inside the execution path
      // (logger, item factory), which affects the duration calculation.
      // The mock increments by 100ms each time.
      // 1. startTime = 1000100
      // 2. logger = 1000200
      // 3. createBelief = 1000300
      // 4. duration = 1000400 - 1000100 = 300
      expect(stats.totalExecutions).toBe(1);
      expect(stats.successRate).toBe(1);
      expect(stats.averageDuration).toBe(300);
      expect(stats.executorStats['WebSearchExecutor'].count).toBe(1);

      dateNowSpy.mockRestore();
    });
  });
});
