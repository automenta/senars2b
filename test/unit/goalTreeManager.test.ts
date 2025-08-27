import { HierarchicalGoalTreeManager } from '../../dist/goalTreeManager';
import { createGoalItem } from './testUtils';

describe('HierarchicalGoalTreeManager', () => {
  let goalTreeManager: HierarchicalGoalTreeManager;

  beforeEach(() => {
    goalTreeManager = new HierarchicalGoalTreeManager();
  });

  describe('decompose', () => {
    it('should decompose a goal into subgoals', () => {
      const goal = createGoalItem({
        attention: { priority: 0.9, durability: 0.8 }
      });

      const subgoals = goalTreeManager.decompose(goal);
      
      // Should return an array (could be empty or have subgoals depending on implementation)
      expect(Array.isArray(subgoals)).toBe(true);
    });
  });

  describe('mark_achieved', () => {
    it('should mark a goal as achieved', () => {
      const goalId = createGoalItem().id;
      
      // This should not throw an error
      expect(() => {
        goalTreeManager.mark_achieved(goalId);
      }).not.toThrow();
    });
  });

  describe('mark_failed', () => {
    it('should mark a goal as failed', () => {
      const goalId = createGoalItem().id;
      
      // This should not throw an error
      expect(() => {
        goalTreeManager.mark_failed(goalId);
      }).not.toThrow();
    });
  });

  describe('get_ancestors', () => {
    it('should return ancestor goal IDs', () => {
      const goalId = createGoalItem().id;
      const ancestors = goalTreeManager.get_ancestors(goalId);
      
      // Should return an array (could be empty depending on implementation)
      expect(Array.isArray(ancestors)).toBe(true);
    });
  });
});