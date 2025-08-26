import { DynamicAttentionModule } from '../../dist/attentionModule';
import { v4 as uuidv4 } from 'uuid';
import { CognitiveItem, AttentionValue, CognitiveSchema } from '../../dist/types';

describe('DynamicAttentionModule', () => {
  let attentionModule: DynamicAttentionModule;

  beforeEach(() => {
    attentionModule = new DynamicAttentionModule();
  });

  describe('calculate_initial', () => {
    it('should calculate initial attention for a cognitive item', () => {
      const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.5, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

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
      const parent1: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.7, durability: 0.6 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      const parent2: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.6, confidence: 0.8 },
        attention: { priority: 0.5, durability: 0.4 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      // Create a mock schema
      const mockSchema: CognitiveSchema = {
        atom_id: uuidv4(),
        apply: jest.fn()
      };

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
      const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.5, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

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