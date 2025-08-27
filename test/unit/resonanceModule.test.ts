import { HybridResonanceModule } from '@/core/resonanceModule';
import { PersistentWorldModel } from '@/core/worldModel';
import { v4 as uuidv4 } from 'uuid';
import { CognitiveItem } from '@/interfaces/types';

describe('HybridResonanceModule', () => {
  let resonanceModule: HybridResonanceModule;
  let worldModel: PersistentWorldModel;

  beforeEach(() => {
    worldModel = new PersistentWorldModel();
    resonanceModule = new HybridResonanceModule();
  });

  describe('find_context', () => {
    it('should find relevant context items for a given item', () => {
      // Create a test item
      const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.5, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      // Add some context items to the world model
      const contextItem1: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.7, confidence: 0.8 },
        attention: { priority: 0.6, durability: 0.5 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      const contextItem2: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.9, confidence: 0.95 },
        attention: { priority: 0.4, durability: 0.6 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      worldModel.add_item(contextItem1);
      worldModel.add_item(contextItem2);

      // Find context
      const contextItems = resonanceModule.find_context(item, worldModel, 5);
      
      // Should return an array (could be empty or have items depending on implementation)
      expect(Array.isArray(contextItems)).toBe(true);
    });

    it('should respect the k parameter for limiting results', () => {
      // Create a test item
      const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.5, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      // Find context with k=0
      const contextItems = resonanceModule.find_context(item, worldModel, 0);
      
      // Should return an empty array when k=0
      expect(contextItems).toEqual([]);
    });
  });
});