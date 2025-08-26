import { PriorityAgenda } from '../../dist/agenda';
import { v4 as uuidv4 } from 'uuid';
import { CognitiveItem } from '../../dist/types';

describe('PriorityAgenda', () => {
  let agenda: PriorityAgenda;
  
  beforeEach(() => {
    agenda = new PriorityAgenda();
  });

  describe('push and size', () => {
    it('should add items and update size correctly', () => {
      const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.5, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      expect(agenda.size()).toBe(0);
      agenda.push(item);
      expect(agenda.size()).toBe(1);
    });
  });

  describe('pop and peek', () => {
    it('should return items in priority order', async () => {
      const item1: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.3, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      const item2: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'GOAL',
        attention: { priority: 0.9, durability: 0.8 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() },
        goal_status: 'active'
      };

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
      const item1: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.3, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      const item2: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'GOAL',
        attention: { priority: 0.9, durability: 0.8 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() },
        goal_status: 'active'
      };

      agenda.push(item1);
      agenda.push(item2);

      const peekedItem = agenda.peek();
      expect(peekedItem?.id).toBe(item2.id);
      expect(agenda.size()).toBe(2); // Peek shouldn't remove the item
    });
  });

  describe('updateAttention', () => {
    it('should update the attention value of an item', () => {
      const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.5, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      agenda.push(item);
      
      // Update the attention
      agenda.updateAttention(item.id, { priority: 0.9, durability: 0.2 });
      
      // The item should now be at the top when peeking
      const peekedItem = agenda.peek();
      expect(peekedItem?.attention.priority).toBe(0.9);
      expect(peekedItem?.attention.durability).toBe(0.2);
    });
  });

  describe('remove', () => {
    it('should remove an item by ID', () => {
      const item: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'BELIEF',
        truth: { frequency: 0.8, confidence: 0.9 },
        attention: { priority: 0.5, durability: 0.7 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() }
      };

      agenda.push(item);
      expect(agenda.size()).toBe(1);
      
      const removed = agenda.remove(item.id);
      expect(removed).toBe(true);
      expect(agenda.size()).toBe(0);
    });

    it('should return false when trying to remove a non-existent item', () => {
      const removed = agenda.remove(uuidv4());
      expect(removed).toBe(false);
    });
  });
});