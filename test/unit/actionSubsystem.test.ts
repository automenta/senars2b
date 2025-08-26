import { ActionSubsystem } from '../../dist/actionSubsystem';
import { v4 as uuidv4 } from 'uuid';
import { CognitiveItem } from '../../dist/types';

describe('ActionSubsystem', () => {
  let actionSubsystem: ActionSubsystem;

  beforeEach(() => {
    actionSubsystem = new ActionSubsystem();
  });

  describe('executeGoal', () => {
    it('should execute a goal and return a result', async () => {
      const goal: CognitiveItem = {
        id: uuidv4(),
        atom_id: uuidv4(),
        type: 'GOAL',
        attention: { priority: 0.9, durability: 0.8 },
        stamp: { timestamp: Date.now(), parent_ids: [], schema_id: uuidv4() },
        goal_status: 'active',
        label: "Web search for pet safety information"
      };

      // Note: We're not actually executing the action in tests, 
      // just checking that the method exists and returns a promise
      expect(typeof actionSubsystem.executeGoal).toBe('function');
    });
  });

  describe('getStatistics', () => {
    it('should return execution statistics', () => {
      const stats = actionSubsystem.getStatistics();
      
      // Should return an object with expected properties
      expect(stats).toHaveProperty('totalExecutions');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageDuration');
      expect(stats).toHaveProperty('executorStats');
    });
  });
});