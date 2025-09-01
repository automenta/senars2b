import { CognitiveItem } from '../interfaces/types';

/**
 * Generic type guard utility for checking CognitiveItem types
 */
export function isItemType<T extends CognitiveItem['type']>(
  item: CognitiveItem,
  type: T
): item is CognitiveItem & { type: T } {
  return item.type === type;
}

/**
 * Type guard for checking if a CognitiveItem is a Task
 */
export function isTask(item: CognitiveItem): item is CognitiveItem & { type: 'TASK' } {
  return isItemType(item, 'TASK');
}

/**
 * Type guard for checking if a CognitiveItem is a Goal
 */
export function isGoal(item: CognitiveItem): item is CognitiveItem & { type: 'GOAL' } {
  return isItemType(item, 'GOAL');
}

/**
 * Type guard for checking if a CognitiveItem is a Belief
 */
export function isBelief(item: CognitiveItem): item is CognitiveItem & { type: 'BELIEF' } {
  return isItemType(item, 'BELIEF');
}

/**
 * Type guard for checking if a CognitiveItem is a Query
 */
export function isQuery(item: CognitiveItem): item is CognitiveItem & { type: 'QUERY' } {
  return isItemType(item, 'QUERY');
}

/**
 * Type guard for checking if a CognitiveItem is an Event
 */
export function isEvent(item: CognitiveItem): item is CognitiveItem & { type: 'EVENT' } {
  return isItemType(item, 'EVENT');
}