import { taskUtils } from '../../src/web/frontend/src/utils/taskUtils';
import { Task, TaskStatus, TaskPriority } from '../../src/interfaces/sharedTypes';

// Helper to create a mock task
const createTask = (id: string, status: TaskStatus, priority: TaskPriority): Task => ({
    id,
    type: 'REGULAR',
    title: `Task ${id}`,
    status,
    priority,
    subtasks: [],
});

describe('taskUtils', () => {
    describe('isCompleted', () => {
        it('should return true for completed tasks', () => {
            const task = createTask('1', 'completed', 'medium');
            expect(taskUtils.isCompleted(task)).toBe(true);
        });

        it('should return false for non-completed tasks', () => {
            const task = createTask('1', 'pending', 'medium');
            expect(taskUtils.isCompleted(task)).toBe(false);
        });
    });

    describe('isFailed', () => {
        it('should return true for failed tasks', () => {
            const task = createTask('1', 'failed', 'medium');
            expect(taskUtils.isFailed(task)).toBe(true);
        });

        it('should return false for non-failed tasks', () => {
            const task = createTask('1', 'completed', 'medium');
            expect(taskUtils.isFailed(task)).toBe(false);
        });
    });

    describe('isInProgress', () => {
        it('should return true for tasks in an active state', () => {
            const decomposingTask = createTask('1', 'decomposing', 'high');
            const awaitingSubtasksTask = createTask('2', 'awaiting_subtasks', 'high');
            const readyForExecutionTask = createTask('3', 'ready_for_execution', 'high');

            expect(taskUtils.isInProgress(decomposingTask)).toBe(true);
            expect(taskUtils.isInProgress(awaitingSubtasksTask)).toBe(true);
            expect(taskUtils.isInProgress(readyForExecutionTask)).toBe(true);
        });

        it('should return false for tasks in a terminal or pending state', () => {
            const pendingTask = createTask('1', 'pending', 'medium');
            const completedTask = createTask('2', 'completed', 'medium');
            const failedTask = createTask('3', 'failed', 'medium');
            const deferredTask = createTask('4', 'deferred', 'low');
            const awaitingDependenciesTask = createTask('5', 'awaiting_dependencies', 'medium');

            expect(taskUtils.isInProgress(pendingTask)).toBe(false);
            expect(taskUtils.isInProgress(completedTask)).toBe(false);
            expect(taskUtils.isInProgress(failedTask)).toBe(false);
            expect(taskUtils.isInProgress(deferredTask)).toBe(false);
            expect(taskUtils.isInProgress(awaitingDependenciesTask)).toBe(false);
        });
    });

    describe('getStatusText', () => {
        it('should return the correct display text for a status', () => {
            expect(taskUtils.getStatusText('pending')).toBe('Pending');
            expect(taskUtils.getStatusText('ready_for_execution')).toBe('Ready for Execution');
            expect(taskUtils.getStatusText('completed')).toBe('Completed');
        });
    });

    describe('getStatusClass', () => {
        it('should return the correct CSS class for a status', () => {
            expect(taskUtils.getStatusClass('pending')).toBe('status-pending');
            expect(taskUtils.getStatusClass('failed')).toBe('status-failed');
        });
    });

    describe('sortByStatus', () => {
        it('should sort tasks by their status order', () => {
            const tasks = [
                createTask('c', 'completed', 'medium'),
                createTask('a', 'pending', 'medium'),
                createTask('b', 'ready_for_execution', 'medium'),
                createTask('d', 'failed', 'medium'),
            ];

            const sortedTasks = taskUtils.sortByStatus(tasks);
            const sortedIds = sortedTasks.map(t => t.id);

            expect(sortedIds).toEqual(['a', 'b', 'c', 'd']);
        });
    });

    describe('sortByPriority', () => {
        it('should sort tasks by priority in descending order by default', () => {
            const tasks = [
                createTask('c', 'pending', 'medium'),
                createTask('a', 'pending', 'low'),
                createTask('b', 'pending', 'critical'),
                createTask('d', 'pending', 'high'),
            ];

            const sortedTasks = taskUtils.sortByPriority(tasks);
            const sortedPriorities = sortedTasks.map(t => t.priority);

            expect(sortedPriorities).toEqual(['critical', 'high', 'medium', 'low']);
        });

        it('should sort tasks by priority in ascending order when specified', () => {
            const tasks = [
                createTask('c', 'pending', 'medium'),
                createTask('a', 'pending', 'low'),
                createTask('b', 'pending', 'critical'),
                createTask('d', 'pending', 'high'),
            ];

            const sortedTasks = taskUtils.sortByPriority(tasks, true);
            const sortedPriorities = sortedTasks.map(t => t.priority);

            expect(sortedPriorities).toEqual(['low', 'medium', 'high', 'critical']);
        });
    });
});
