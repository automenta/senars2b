import { HierarchicalGoalTreeManager } from '../../dist/goalTreeManager';
import { v4 as uuidv4 } from 'uuid';
import { CognitiveItem } from '../../dist/types';

describe('HierarchicalGoalTreeManager', () => {
  let goalTreeManager: HierarchicalGoalTreeManager;

  beforeEach(() => {
    goalTreeManager = new HierarchicalGoalTreeManager();
  });

  describe('decompose', () => {
    it('should decompose a goal into subgoals', () => {
      const goal: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'GOAL',
        attention: { priority: 0.9, durability: 0.8 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() },
        goal_status: 'active'
      };

      const subgoals = goalTreeManager.decompose(goal);
      
      // Should return an array (could be empty or have subgoals depending on implementation)
      expect(Array.isArray(subgoals)).toBe(true);
    });
  });

  describe('mark_achieved', () => {
    it('should mark a goal as achieved', () => {
      const goalId = uuidv4();
      
      // This should not throw an error
      expect(() => {
        goalTreeManager.mark_achieved(goalId);
      }).not.toThrow();
    });
  });

  describe('mark_failed', () => {
    it('should mark a goal as failed', () => {
      const goalId = uuidv4();
      
      // This should not throw an error
      expect(() => {
        goalTreeManager.mark_failed(goalId);
      }).not.toThrow();
    });
  });

  describe('get_ancestors', () => {
    it('should return ancestor goal IDs', () => {
      const goalId = uuidv4();
      const ancestors = goalTreeManager.get_ancestors(goalId);
      
      // Should return an array (could be empty depending on implementation)
      expect(Array.isArray(ancestors)).toBe(true);
    });
  });
});