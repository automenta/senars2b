import {AttentionValue, CognitiveItem, SemanticAtom, TruthValue} from '@/interfaces/types';
import {CognitiveSchema, WorldModel} from '@/core/worldModel';
import {PriorityAgenda} from '@/core/agenda';
import {createCognitiveItem, createSemanticAtom, createTruthValue, createAttentionValue, createMockSchema, createBeliefItem, createGoalItem, createTaskItem} from './testUtils';

describe('PriorityAgenda', () => {
    let agenda: PriorityAgenda;
    let taskStatuses: Map<string, 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred'>;
    let getTaskStatus: (taskId: string) => 'pending' | 'in_progress' | 'completed' | 'failed' | 'deferred' | null;


    beforeEach(() => {
        taskStatuses = new Map();
        getTaskStatus = (taskId: string) => taskStatuses.get(taskId) || null;
        agenda = new PriorityAgenda(getTaskStatus);
    });

    describe('push and size', () => {
        it('should add items and update size correctly', () => {
            const item = createBeliefItem();

            expect(agenda.size()).toBe(0);
            agenda.push(item);
            expect(agenda.size()).toBe(1);
        });
    });

    describe('pop and peek', () => {
        it('should return items in priority order', async () => {
            const item1 = createBeliefItem({
                attention: {priority: 0.3, durability: 0.7}
            });

            const item2 = createGoalItem({
                attention: {priority: 0.9, durability: 0.8}
            });

            agenda.push(item1);
            agenda.push(item2);

            // Should return the higher priority item first
            const poppedItem = await agenda.pop();
            expect(poppedItem.id).toBe(item2.id);
            expect(agenda.size()).toBe(1);
        });

        it('should return null when peeking an empty agenda', () => {
            expect(agenda.peek()).toBeNull();
        });

        it('should return the highest priority item when peeking', () => {
            const item1 = createBeliefItem({
                attention: {priority: 0.3, durability: 0.7}
            });

            const item2 = createGoalItem({
                attention: {priority: 0.9, durability: 0.8}
            });

            agenda.push(item1);
            agenda.push(item2);

            const peekedItem = agenda.peek();
            expect(peekedItem?.id).toBe(item2.id);
            expect(agenda.size()).toBe(2); // Peek shouldn't remove the item
        });
    });

    describe('updateAttention', () => {
        it('should update the attention value of an item', () => {
            const item = createBeliefItem();

            agenda.push(item);

            // Update the attention
            agenda.updateAttention(item.id, {priority: 0.9, durability: 0.2});

            // The item should now be at the top when peeking
            const peekedItem = agenda.peek();
            expect(peekedItem?.attention.priority).toBe(0.9);
            expect(peekedItem?.attention.durability).toBe(0.2);
        });
    });

    describe('remove', () => {
        it('should remove an item by ID', () => {
            const item = createBeliefItem();

            agenda.push(item);
            expect(agenda.size()).toBe(1);

            const removed = agenda.remove(item.id);
            expect(removed).toBe(true);
            expect(agenda.size()).toBe(0);
        });

        it('should return false when trying to remove a non-existent item', () => {
            const removed = agenda.remove(createBeliefItem().id);
            expect(removed).toBe(false);
        });
    });

    describe('Enhanced Task Functionality', () => {

        describe('Dependency Checking', () => {
            it('should block a task if its dependency is not completed, then unblock it', async () => {
                const depTask = createTaskItem({ id: 'dep1', attention: {priority: 0.9, durability: 0.5 } });
                const mainTask = createTaskItem({ id: 'main1', attention: {priority: 0.8, durability: 0.5 }, task_metadata: { dependencies: ['dep1'], status: 'pending', priority_level: 'high' } });

                taskStatuses.set('dep1', 'pending');
                agenda.push(depTask);
                agenda.push(mainTask);

                // The dependency should be popped first as it's unblocked and has high priority
                const popped = await agenda.pop();
                expect(popped.id).toBe('dep1');

                // After popping, we simulate that the system processed it and it's now complete.
                taskStatuses.set('dep1', 'completed');

                // Now that the dependency is complete, the main task should be the next item to be popped.
                // Pushing a new item will resolve the waiting promise in pop() if it's waiting.
                agenda.push(createTaskItem({id: 'dummy'}));

                const nextPopped = await agenda.pop();
                expect(nextPopped.id).toBe('main1');
            });

            it('should not pop a blocked task', async () => {
                const depTask = createTaskItem({ id: 'dep1' });
                const mainTask = createTaskItem({ id: 'main1', task_metadata: { dependencies: ['dep1'], status: 'pending', priority_level: 'high' } });
                const unblockedTask = createTaskItem({ id: 'unblocked1', attention: { priority: 0.1, durability: 0.1 } });

                taskStatuses.set('dep1', 'in_progress'); // Not completed
                agenda.push(mainTask);
                agenda.push(unblockedTask);

                const popped = await agenda.pop();
                expect(popped.id).toBe('unblocked1');
            });

            it('should pop a task once its dependency is completed', async () => {
                const mainTask = createTaskItem({ id: 'main1', task_metadata: { dependencies: ['dep1'], status: 'pending', priority_level: 'high' } });
                agenda.push(mainTask);

                // Initially blocked
                expect(agenda.peek()).toBeNull();

                // Mark dependency as completed
                taskStatuses.set('dep1', 'completed');

                // Create a dummy item and push it to resolve the waiting pop
                const dummy = createTaskItem({id: "dummy"});
                agenda.push(dummy);

                const popped = await agenda.pop();
                expect(popped.id).toBe(mainTask.id);
            });
        });

        describe('Prioritization with Deadlines', () => {
            it('should prioritize task with an imminent deadline', async () => {
                const normalTask = createTaskItem({ id: 'normal', attention: { priority: 0.8, durability: 0.5 } });
                const urgentTask = createTaskItem({
                    id: 'urgent',
                    attention: { priority: 0.5, durability: 0.5 },
                    task_metadata: {
                        status: 'pending',
                        priority_level: 'medium',
                        deadline: Date.now() + 1000 * 60 * 30 // 30 minutes from now
                    }
                });
                agenda.push(normalTask);
                agenda.push(urgentTask);

                const popped = await agenda.pop();
                expect(popped.id).toBe('urgent');
            });

            it('should prioritize an overdue task very highly', async () => {
                const highPriorityTask = createTaskItem({ id: 'highPrio', task_metadata: { status: 'pending', priority_level: 'high' } });
                const overdueTask = createTaskItem({
                    id: 'overdue',
                    task_metadata: {
                        status: 'pending',
                        priority_level: 'low',
                        deadline: Date.now() - 1000 // 1 second ago
                    }
                });
                agenda.push(highPriorityTask);
                agenda.push(overdueTask);

                const popped = await agenda.pop();
                expect(popped.id).toBe('overdue');
            });
        });

        describe('Lifecycle Management on Pop', () => {
            it('should change task status to in_progress on pop', async () => {
                const task = createTaskItem({ task_metadata: { status: 'pending', priority_level: 'medium' } });
                agenda.push(task);

                const popped = await agenda.pop();
                expect(popped.task_metadata?.status).toBe('in_progress');
            });

            it('should update the updated_at timestamp on pop', async () => {
                const task = createTaskItem();
                const originalTimestamp = task.updated_at!;
                agenda.push(task);

                // Add a small delay to ensure Date.now() will be different
                await new Promise(resolve => setTimeout(resolve, 5));

                const popped = await agenda.pop();
                expect(popped.updated_at).toBeGreaterThan(originalTimestamp);
            });
        });
    });

    describe('getStatistics', () => {
        it('should calculate popRate correctly over a time interval', async () => {
            agenda.push(createTaskItem({ id: 't1' }));
            agenda.push(createTaskItem({ id: 't2' }));
            await agenda.pop();
            await agenda.pop();

            // Wait for 1 second to get a stable rate
            await new Promise(resolve => setTimeout(resolve, 1000));

            const stats = agenda.getStatistics();
            // Expected rate is 2 pops / 1 second = 2 pops/sec.
            // Allow for timing inaccuracies of async operations.
            expect(stats.popRate).toBeCloseTo(2, 0);
            expect(stats.totalPops).toBe(2);
        });
    });

    describe('updateTaskStatus', () => {
        it('should update a task status and its timestamp', async () => {
            const task = createTaskItem({ task_metadata: { status: 'pending', priority_level: 'low' } });
            const originalTimestamp = task.updated_at!;
            agenda.push(task);

            // Add a small delay to ensure the timestamp will be different
            await new Promise(resolve => setTimeout(resolve, 5));

            const result = agenda.updateTaskStatus(task.id, 'completed');
            expect(result).toBe(true);

            const updatedTask = agenda.get(task.id)!;
            expect(updatedTask.task_metadata?.status).toBe('completed');
            expect(updatedTask.updated_at).toBeGreaterThan(originalTimestamp);
        });

        it('should return false for a non-existent task', () => {
            const result = agenda.updateTaskStatus('non-existent-id', 'completed');
            expect(result).toBe(false);
        });

        it('should wait for a blocked task, then pop it when its dependency is completed', async () => {
            const depId = 'dep1';
            const mainTask = createTaskItem({ id: 'main1', task_metadata: { dependencies: [depId], status: 'pending', priority_level: 'high' } });

            // The dependency's status is 'in_progress', so mainTask is blocked.
            taskStatuses.set(depId, 'in_progress');
            agenda.push(mainTask);

            // With only a blocked task in the agenda, peek() should return null.
            expect(agenda.peek()).toBeNull();

            // Start a pop operation. It should wait because the task is blocked.
            const popPromise = agenda.pop();

            // In parallel, simulate the dependency completing after a short delay.
            setTimeout(() => {
                taskStatuses.set(depId, 'completed');
                // Push a new dummy item to the agenda. This action will trigger
                // the waiting pop() promise to re-evaluate its condition.
                agenda.push(createTaskItem({ id: 'dummy' }));
            }, 50);

            // The pop promise should now resolve with the unblocked mainTask.
            const poppedItem = await popPromise;
            expect(poppedItem.id).toBe(mainTask.id);
        }, 1000); // Increase timeout for this test
    });

    describe('getTasksBy', () => {
        beforeEach(() => {
            agenda.push(createTaskItem({ id: 'task1', task_metadata: { status: 'pending', priority_level: 'low', tags: ['urgent', 'backend'], categories: ['dev'] } }));
            agenda.push(createTaskItem({ id: 'task2', task_metadata: { status: 'in_progress', priority_level: 'medium', tags: ['frontend'], categories: ['dev'] } }));
            agenda.push(createTaskItem({ id: 'task3', task_metadata: { status: 'completed', priority_level: 'high', tags: ['urgent', 'frontend'], categories: ['ops'] } }));
            agenda.push(createBeliefItem()); // This non-task item should be ignored.
        });

        it('should filter tasks by status', () => {
            const pendingTasks = agenda.getTasksBy({ status: 'pending' });
            expect(pendingTasks.length).toBe(1);
            expect(pendingTasks[0].id).toBe('task1');
        });

        it('should filter tasks by tag', () => {
            const urgentTasks = agenda.getTasksBy({ tag: 'urgent' });
            expect(urgentTasks.length).toBe(2);
            expect(urgentTasks.map(t => t.id).sort()).toEqual(['task1', 'task3']);
        });

        it('should filter tasks by category', () => {
            const devTasks = agenda.getTasksBy({ category: 'dev' });
            expect(devTasks.length).toBe(2);
            expect(devTasks.map(t => t.id).sort()).toEqual(['task1', 'task2']);
        });

        it('should filter by a combination of status and tag', () => {
            const completedUrgent = agenda.getTasksBy({ status: 'completed', tag: 'urgent' });
            expect(completedUrgent.length).toBe(1);
            expect(completedUrgent[0].id).toBe('task3');
        });

        it('should return an empty array if no tasks match the filter', () => {
            const noMatch = agenda.getTasksBy({ tag: 'non-existent-tag' });
            expect(noMatch.length).toBe(0);
        });

        it('should return an empty array if a combination of filters has no match', () => {
            const noMatch = agenda.getTasksBy({ status: 'pending', tag: 'frontend' });
            expect(noMatch.length).toBe(0);
        });
    });

    describe('Advanced Prioritization and Grouping', () => {
        it('should throw an error if getTaskStatus is not provided', () => {
            // Pass null as getTaskStatus and expect constructor to throw
            expect(() => new PriorityAgenda(null!)).toThrow("A getTaskStatus function must be provided for robust dependency checking.");
        });

        it('should prioritize tasks based on custom weights', async () => {
            // Custom weights that heavily favor attention priority over task priority
            const customWeights = { taskPriority: 0.1, attentionPriority: 0.9, deadlineFactor: 0, completionFactor: 0 };
            agenda = new PriorityAgenda(getTaskStatus, customWeights);

            const highAttentionTask = createTaskItem({ id: 'high-attention', attention: { priority: 0.9, durability: 0.5 }, task_metadata: { status: 'pending', priority_level: 'low' } });
            const highPriorityTask = createTaskItem({ id: 'high-priority', attention: { priority: 0.2, durability: 0.5 }, task_metadata: { status: 'pending', priority_level: 'critical' } });

            agenda.push(highAttentionTask);
            agenda.push(highPriorityTask);

            const popped = await agenda.pop();
            expect(popped.id).toBe('high-attention');
        });

        it('should penalize tasks with higher completion percentage', async () => {
            const newTask = createTaskItem({ id: 'new', attention: { priority: 0.5, durability: 0.5 }, task_metadata: { status: 'pending', priority_level: 'medium', completion_percentage: 0 } });
            const inProgressTask = createTaskItem({ id: 'inprogress', attention: { priority: 0.5, durability: 0.5 }, task_metadata: { status: 'pending', priority_level: 'medium', completion_percentage: 50 } });

            agenda.push(newTask);
            agenda.push(inProgressTask);

            const popped = await agenda.pop();
            // Expect the new task to be popped first due to the negative completionFactor
            expect(popped.id).toBe('new');
        });

        it('should update parent task completion percentage when a subtask is completed', () => {
            const parentTask = createTaskItem({ id: 'parent1', subtasks: ['child1', 'child2'] });
            const childTask1 = createTaskItem({ id: 'child1', parent_id: 'parent1' });
            const childTask2 = createTaskItem({ id: 'child2', parent_id: 'parent1' });

            agenda.push(parentTask);
            agenda.push(childTask1);
            agenda.push(childTask2);

            // Mark child1 as completed in the external status tracker
            taskStatuses.set('child1', 'completed');
            // Mark child2 as still pending
            taskStatuses.set('child2', 'pending');

            // Update status of child1 within the agenda, which should trigger the parent update
            agenda.updateTaskStatus('child1', 'completed');

            const updatedParent = agenda.get('parent1');
            expect(updatedParent?.task_metadata?.completion_percentage).toBe(50);

            // Now complete the second child
            taskStatuses.set('child2', 'completed');
            agenda.updateTaskStatus('child2', 'completed');

            const finalParent = agenda.get('parent1');
            expect(finalParent?.task_metadata?.completion_percentage).toBe(100);
        });

        it('should retrieve tasks by group ID', () => {
            const group1Task1 = createTaskItem({ task_metadata: { status: 'pending', priority_level: 'medium', group_id: 'group1' } });
            const group1Task2 = createTaskItem({ task_metadata: { status: 'pending', priority_level: 'medium', group_id: 'group1' } });
            const group2Task1 = createTaskItem({ task_metadata: { status: 'pending', priority_level: 'medium', group_id: 'group2' } });
            const noGroupTask = createTaskItem();

            agenda.push(group1Task1);
            agenda.push(group1Task2);
            agenda.push(group2Task1);
            agenda.push(noGroupTask);

            const group1Tasks = agenda.getTasksByGroup('group1');
            expect(group1Tasks.length).toBe(2);
            expect(group1Tasks.map(t => t.id).sort()).toEqual([group1Task1.id, group1Task2.id].sort());

            const group2Tasks = agenda.getTasksByGroup('group2');
            expect(group2Tasks.length).toBe(1);
            expect(group2Tasks[0].id).toBe(group2Task1.id);
        });
    });
});