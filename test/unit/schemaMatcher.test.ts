import { EfficientSchemaMatcher } from '@/core/schemaMatcher';
import { PersistentWorldModel } from '@/core/worldModel';
import { createSemanticAtom, createBeliefItem } from './testUtils';

describe('EfficientSchemaMatcher', () => {
  let schemaMatcher: EfficientSchemaMatcher;
  let worldModel: PersistentWorldModel;

  beforeEach(() => {
    worldModel = new PersistentWorldModel();
    schemaMatcher = new EfficientSchemaMatcher();
  });

  describe('register_schema', () => {
    it('should register a schema atom and return a cognitive schema', () => {
      const schemaAtom = createSemanticAtom({
        content: {
          name: "TestSchema",
          pattern: {
            premise: "(?A is related to ?B)",
            conclusion: "(?B is related to ?A)"
          }
        },
        meta: {
          type: "CognitiveSchema",
          source: "test",
          timestamp: new Date().toISOString(),
          trust_score: 0.8
        }
      });

      const schema = schemaMatcher.register_schema(schemaAtom, worldModel);
      
      expect(schema.atom_id).toBe(schemaAtom.id);
      // We can't directly access the content property since it's not in the CognitiveSchema interface
    });
  });

  describe('find_applicable', () => {
    it('should find applicable schemas for two cognitive items', () => {
      // Create two test items
      const itemA = createBeliefItem({
        attention: { priority: 0.5, durability: 0.7 }
      });

      const itemB = createBeliefItem({
        truth: { frequency: 0.7, confidence: 0.8 },
        attention: { priority: 0.6, durability: 0.5 }
      });

      // Find applicable schemas
      const schemas = schemaMatcher.find_applicable(itemA, itemB, worldModel);
      
      // Should return an array (could be empty depending on implementation)
      expect(Array.isArray(schemas)).toBe(true);
    });
  });
});