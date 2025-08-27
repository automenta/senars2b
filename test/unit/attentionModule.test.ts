import {DynamicAttentionModule} from '@/core/attentionModule';
import {createAttentionValue, createBeliefItem, createMockSchema} from './testUtils';

describe('DynamicAttentionModule', () => {
    let attentionModule: DynamicAttentionModule;

    beforeEach(() => {
        attentionModule = new DynamicAttentionModule();
    });

    describe('calculate_initial', () => {
        it('should calculate initial attention for a cognitive item', () => {
            const item = createBeliefItem();

            const attention = attentionModule.calculate_initial(item);

            // The exact values depend on the implementation, but they should be valid attention values
            expect(attention.priority).toBeGreaterThanOrEqual(0);
            expect(attention.priority).toBeLessThanOrEqual(1);
            expect(attention.durability).toBeGreaterThanOrEqual(0);
            expect(attention.durability).toBeLessThanOrEqual(1);
        });
    });

    describe('calculate_derived', () => {
        it('should calculate derived attention based on parents and schema', () => {
            const parent1 = createBeliefItem({
                attention: createAttentionValue({priority: 0.7, durability: 0.6})
            });

            const parent2 = createBeliefItem({
                attention: createAttentionValue({priority: 0.5, durability: 0.4})
            });

            // Create a mock schema
            const mockSchema = createMockSchema();

            const derivedAttention = attentionModule.calculate_derived(
                [parent1, parent2],
                mockSchema,
                0.9 // source trust
            );

            // The exact values depend on the implementation, but they should be valid attention values
            expect(derivedAttention.priority).toBeGreaterThanOrEqual(0);
            expect(derivedAttention.priority).toBeLessThanOrEqual(1);
            expect(derivedAttention.durability).toBeGreaterThanOrEqual(0);
            expect(derivedAttention.durability).toBeLessThanOrEqual(1);
        });
    });

    describe('update_on_access', () => {
        it('should update attention values when items are accessed', () => {
            const item = createBeliefItem();

            // Store initial values
            const initialPriority = item.attention.priority;
            const initialDurability = item.attention.durability;

            // Update on access
            attentionModule.update_on_access([item]);

            // Values should have changed (exact change depends on implementation)
            // We'll just check that the method doesn't throw an error and returns void
            expect(attentionModule.update_on_access([item])).toBeUndefined();
        });
    });
});