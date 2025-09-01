import {taskUtils} from '../src/web/frontend/src/utils/taskUtils';
import {Task} from '../src/interfaces/task';
import {TaskStatus} from '../src/interfaces/sharedTypes';

describe('taskUtils', () => {
    const task: Task = {
        id: 'task-1',
        atom_id: 'atom-1',
        type: 'TASK',
        label: 'Test Task',
        attention: {priority: 0.5, durability: 0.5},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'test-schema'},
        task_metadata: {
            status: 'completed',
            priority_level: 'medium',
            completion_percentage: 100
        }
    };

    const incompleteTask: Task = {
        id: 'task-2',
        atom_id: 'atom-2',
        type: 'TASK',
        label: 'Incomplete Task',
        attention: {priority: 0.5, durability: 0.5},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'test-schema'},
        task_metadata: {
            status: 'pending',
            priority_level: 'medium',
            completion_percentage: 50
        }
    };

    const failedTask: Task = {
        id: 'task-3',
        atom_id: 'atom-3',
        type: 'TASK',
        label: 'Failed Task',
        attention: {priority: 0.5, durability: 0.5},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'test-schema'},
        task_metadata: {
            status: 'failed',
            priority_level: 'medium',
            completion_percentage: 0
        }
    };

    const inProgressTask: Task = {
        id: 'task-4',
        atom_id: 'atom-4',
        type: 'TASK',
        label: 'In Progress Task',
        attention: {priority: 0.5, durability: 0.5},
        stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'test-schema'},
        task_metadata: {
            status: 'decomposing',
            priority_level: 'medium',
            completion_percentage: 25
        }
    };

    describe('isCompleted', () => {
        it('should return true for completed tasks', () => {
            expect(taskUtils.isCompleted(task)).toBe(true);
        });

        it('should return false for non-completed tasks', () => {
            expect(taskUtils.isCompleted(incompleteTask)).toBe(false);
        });
    });

    describe('isFailed', () => {
        it('should return true for failed tasks', () => {
            expect(taskUtils.isFailed(failedTask)).toBe(true);
        });

        it('should return false for non-failed tasks', () => {
            expect(taskUtils.isFailed(task)).toBe(false);
        });
    });

    describe('isInProgress', () => {
        it('should return true for tasks in an active state', () => {
            expect(taskUtils.isInProgress(inProgressTask)).toBe(true);
        });

        it('should return false for tasks in a terminal or pending state', () => {
            expect(taskUtils.isInProgress(task)).toBe(false);
            expect(taskUtils.isInProgress(incompleteTask)).toBe(false);
            expect(taskUtils.isInProgress(failedTask)).toBe(false);
        });
    });

    describe('getStatusText', () => {
        it('should return the correct display text for a status', () => {
            expect(taskUtils.getStatusText('pending')).toBe('Pending');
            expect(taskUtils.getStatusText('completed')).toBe('Completed');
            expect(taskUtils.getStatusText('failed')).toBe('Failed');
        });
    });

    describe('getStatusClass', () => {
        it('should return the correct CSS class for a status', () => {
            expect(taskUtils.getStatusClass('pending')).toBe('status-pending');
            expect(taskUtils.getStatusClass('completed')).toBe('status-completed');
            expect(taskUtils.getStatusClass('failed')).toBe('status-failed');
        });
    });

    describe('sortByStatus', () => {
        it('should sort tasks by their status order', () => {
            const tasks = [incompleteTask, task, failedTask, inProgressTask];
            const sortedTasks = taskUtils.sortByStatus(tasks);

            // Should be ordered: pending → in progress → completed → failed
            expect(sortedTasks[0]).toBe(incompleteTask);  // pending
            expect(sortedTasks[1]).toBe(inProgressTask);  // decomposing (in progress)
            expect(sortedTasks[2]).toBe(task);            // completed
            expect(sortedTasks[3]).toBe(failedTask);      // failed
        });
    });

    describe('sortByPriority', () => {
        const lowPriorityTask: Task = {
            id: 'task-low',
            atom_id: 'atom-low',
            type: 'TASK',
            label: 'Low Priority Task',
            attention: {priority: 0.2, durability: 0.5},
            stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'test-schema'},
            task_metadata: {
                status: 'pending',
                priority_level: 'low',
                completion_percentage: 0
            }
        };

        const highPriorityTask: Task = {
            id: 'task-high',
            atom_id: 'atom-high',
            type: 'TASK',
            label: 'High Priority Task',
            attention: {priority: 0.8, durability: 0.5},
            stamp: {timestamp: Date.now(), parent_ids: [], schema_id: 'test-schema'},
            task_metadata: {
                status: 'pending',
                priority_level: 'high',
                completion_percentage: 0
            }
        };

        it('should sort tasks by priority in descending order by default', () => {
            const tasks = [lowPriorityTask, highPriorityTask];
            const sortedTasks = taskUtils.sortByPriority(tasks);

            expect(sortedTasks[0]).toBe(highPriorityTask);
            expect(sortedTasks[1]).toBe(lowPriorityTask);
        });

        it('should sort tasks by priority in ascending order when specified', () => {
            const tasks = [lowPriorityTask, highPriorityTask];
            const sortedTasks = taskUtils.sortByPriority(tasks, true);

            expect(sortedTasks[0]).toBe(lowPriorityTask);
            expect(sortedTasks[1]).toBe(highPriorityTask);
        });
    });
});