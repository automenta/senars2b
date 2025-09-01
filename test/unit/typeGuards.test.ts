import { isTask, isBelief, isGoal } from '../../src/utils/typeGuards';
import { createCognitiveItem } from './testUtils';

describe('Type Guards', () => {
  test('should correctly identify task items', () => {
    const task = createCognitiveItem({ type: 'TASK' });
    expect(isTask(task)).toBe(true);
    expect(isBelief(task)).toBe(false);
    expect(isGoal(task)).toBe(false);
  });

  test('should correctly identify belief items', () => {
    const belief = createCognitiveItem({ type: 'BELIEF' });
    expect(isBelief(belief)).toBe(true);
    expect(isTask(belief)).toBe(false);
    expect(isGoal(belief)).toBe(false);
  });

  test('should correctly identify goal items', () => {
    const goal = createCognitiveItem({ type: 'GOAL' });
    expect(isGoal(goal)).toBe(true);
    expect(isTask(goal)).toBe(false);
    expect(isBelief(goal)).toBe(false);
  });
});