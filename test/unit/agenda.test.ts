import {AttentionValue, CognitiveItem, SemanticAtom, TruthValue} from '@/interfaces/types';
import {CognitiveSchema, WorldModel} from '@/core/worldModel';
import {PriorityAgenda} from '@/core/agenda';
import {createCognitiveItem, createSemanticAtom, createTruthValue, createAttentionValue, createMockSchema, createBeliefItem, createGoalItem, createTaskItem} from './testUtils';

describe('PriorityAgenda', () => {
    let agenda: PriorityAgenda;

    beforeEach(() => {
        agenda = new PriorityAgenda();
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

    describe('Task-Specific Functionality', () => {
        it('should prioritize tasks based on combined priority', async () => {
            const highAttentionItem = createBeliefItem({
                attention: { priority: 0.9, durability: 0.5 }
            });

            const highPriorityTask = createTaskItem({
                attention: { priority: 0.5, durability: 0.5 },
                task_metadata: {
                    status: 'pending',
                    priority_level: 'critical',
                }
            });

            agenda.push(highAttentionItem);
            agenda.push(highPriorityTask);

            const poppedItem = await agenda.pop();
            expect(poppedItem.id).toBe(highPriorityTask.id);
        });

        it('should not pop a task with an unmet dependency', async () => {
            const dependencyTask = createTaskItem();
            const dependentTask = createTaskItem({
                task_metadata: {
                    status: 'pending',
                    priority_level: 'high',
                    dependencies: [dependencyTask.id]
                }
            });

            agenda.push(dependencyTask);
            agenda.push(dependentTask);

            const poppedItem = await agenda.pop();
            expect(poppedItem.id).toBe(dependencyTask.id);
            expect(agenda.size()).toBe(1);
        });

        it('should pop a dependent task once its dependency is completed', async () => {
            const dependencyTask = createTaskItem({ id: 'dep1' });
            const dependentTask = createTaskItem({
                id: 'dep2',
                attention: { priority: 1.0, durability: 1.0 },
                task_metadata: {
                    status: 'pending',
                    priority_level: 'critical',
                    dependencies: [dependencyTask.id]
                }
            });

            agenda.push(dependencyTask);
            agenda.push(dependentTask);

            // Pop the dependency first
            let poppedItem = await agenda.pop();
            expect(poppedItem.id).toBe(dependencyTask.id);

            // Now, mark the dependency as completed and push it back
            dependencyTask.task_metadata!.status = 'completed';
            agenda.push(dependencyTask);

            // Remove the completed dependency from the agenda (simulating it being processed and finished)
            agenda.remove(dependencyTask.id);

            // Now the dependent task should be poppable
            poppedItem = await agenda.pop();
            expect(poppedItem.id).toBe(dependentTask.id);
        });

        it('should peek the highest priority unblocked item', () => {
            const dependencyTask = createTaskItem();
            const dependentTask = createTaskItem({
                attention: { priority: 1.0, durability: 1.0 },
                task_metadata: {
                    status: 'pending',
                    priority_level: 'critical',
                    dependencies: [dependencyTask.id]
                }
            });
            const anotherTask = createTaskItem({
                attention: { priority: 0.5, durability: 0.5 }
            });

            agenda.push(dependencyTask);
            agenda.push(dependentTask);
            agenda.push(anotherTask);

            const peekedItem = agenda.peek();
            // Should peek `dependencyTask` as it has higher default priority than `anotherTask`
            // and `dependentTask` is blocked
            expect(peekedItem!.id).toBe(dependencyTask.id);
        });
    });
});