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
});