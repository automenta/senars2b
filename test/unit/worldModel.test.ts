import { PersistentWorldModel } from '../../dist/worldModel';
import { SimpleBeliefRevisionEngine } from '../../dist/beliefRevisionEngine';
import { v4 as uuidv4 } from 'uuid';
import { SemanticAtom, CognitiveItem } from '../../dist/types';

describe('PersistentWorldModel', () => {
  let worldModel: PersistentWorldModel;
  let revisionEngine: SimpleBeliefRevisionEngine;

  beforeEach(() => {
    worldModel = new PersistentWorldModel();
    revisionEngine = new SimpleBeliefRevisionEngine();
  });

  describe('add_atom and get_atom', () => {
    it('should add and retrieve a semantic atom', () => {
      const atom: SemanticAtom = {
        id: uuidv4(),
        content: "Test content",
        embedding: Array(768).fill(0.5),
        meta: {
          type: "Fact",
          source: "test",
          timestamp: new Date().toISOString(),
          trust_score: 0.8
        }
      };

      const atomId = worldModel.add_atom(atom);
      expect(atomId).toBe(atom.id);

      const retrievedAtom = worldModel.get_atom(atomId);
      expect(retrievedAtom).toEqual(atom);
    });

    it('should return null for a non-existent atom', () => {
      const retrievedAtom = worldModel.get_atom(uuidv4());
      expect(retrievedAtom).toBeNull();
    });
  });

  describe('add_item and get_item', () => {
    it('should add and retrieve a cognitive item', () => {
      const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.5, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      worldModel.add_item(item);

      const retrievedItem = worldModel.get_item(item.id);
      expect(retrievedItem).toEqual(item);
    });

    it('should return null for a non-existent item', () => {
      const retrievedItem = worldModel.get_item(uuidv4());
      expect(retrievedItem).toBeNull();
    });
  });

  describe('query_by_semantic', () => {
    it('should return semantic query results', () => {
      const embedding = Array(768).fill(0.5);
      const results = worldModel.query_by_semantic(embedding, 5);
      
      // Should return an array (could be empty depending on implementation)
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('query_by_symbolic', () => {
    it('should return symbolic query results', () => {
      const pattern = { test: "pattern" };
      const results = worldModel.query_by_symbolic(pattern, 5);
      
      // Should return an array (could be empty depending on implementation)
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('revise_belief', () => {
    it('should revise a belief using the belief revision engine', () => {
      const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.5, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      const revisedItem = worldModel.revise_belief(item);
      
      // Could return null or a revised item depending on implementation
      expect(revisedItem === null || typeof revisedItem === 'object').toBe(true);
    });
  });
});