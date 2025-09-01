import { 
  CognitiveItem, 
  AttentionValue, 
  TruthValue, 
  TaskMetadata 
} from '@/interfaces/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Enhanced cognitive item factory with better type safety and validation
 */
export class EnhancedCognitiveItemFactory {
  /**
   * Create a task with enhanced metadata
   */
  static createTask(
    id: string | undefined,
    attention: AttentionValue,
    taskMetadata: Omit<TaskMetadata, 'status'> & { status?: TaskMetadata['status'] }
  ): CognitiveItem & { type: 'TASK' } {
    return {
      id: id || uuidv4(),
      type: 'TASK',
      attention,
      stamp: {
        timestamp: Date.now(),
        module: 'taskFactory'
      },
      task_metadata: {
        status: taskMetadata.status || 'pending',
        priority_level: taskMetadata.priority_level || 'medium',
        ...taskMetadata
      }
    };
  }

  /**
   * Create a goal with validation
   */
  static createGoal(
    id: string | undefined,
    attention: AttentionValue,
    parentId?: string
  ): CognitiveItem & { type: 'GOAL' } {
    const goal: CognitiveItem & { type: 'GOAL' } = {
      id: id || uuidv4(),
      type: 'GOAL',
      attention,
      stamp: {
        timestamp: Date.now(),
        module: 'goalFactory'
      }
    };

    if (parentId) {
      goal.goal_parent_id = parentId;
    }

    return goal;
  }

  /**
   * Create a belief with truth value validation
   */
  static createBelief(
    id: string | undefined,
    truth: TruthValue,
    attention: AttentionValue
  ): CognitiveItem & { type: 'BELIEF' } {
    // Validate truth values
    if (truth.frequency < 0 || truth.frequency > 1) {
      throw new Error('Truth frequency must be between 0 and 1');
    }
    
    if (truth.confidence < 0 || truth.confidence > 1) {
      throw new Error('Truth confidence must be between 0 and 1');
    }

    return {
      id: id || uuidv4(),
      type: 'BELIEF',
      truth,
      attention,
      stamp: {
        timestamp: Date.now(),
        module: 'beliefFactory'
      }
    };
  }

  /**
   * Create a query with validation
   */
  static createQuery(
    id: string | undefined,
    attention: AttentionValue
  ): CognitiveItem & { type: 'QUERY' } {
    return {
      id: id || uuidv4(),
      type: 'QUERY',
      attention,
      stamp: {
        timestamp: Date.now(),
        module: 'queryFactory'
      }
    };
  }

  /**
   * Create an event with validation
   */
  static createEvent(
    id: string | undefined,
    eventData: Record<string, any>,
    attention: AttentionValue
  ): CognitiveItem & { type: 'EVENT' } {
    return {
      id: id || uuidv4(),
      type: 'EVENT',
      attention,
      stamp: {
        timestamp: Date.now(),
        module: 'eventFactory'
      },
      event_data: eventData
    };
  }

  /**
   * Clone a cognitive item with a new ID
   */
  static cloneItem(item: CognitiveItem): CognitiveItem {
    return {
      ...item,
      id: uuidv4(),
      stamp: {
        ...item.stamp,
        timestamp: Date.now(),
        parent_ids: item.stamp.parent_ids ? [...item.stamp.parent_ids, item.id] : [item.id]
      }
    };
  }

  /**
   * Update an item's attention value
   */
  static updateAttention(item: CognitiveItem, attention: AttentionValue): CognitiveItem {
    return {
      ...item,
      attention
    };
  }

  /**
   * Add metadata to an item
   */
  static addMetadata(item: CognitiveItem, metadata: Record<string, any>): CognitiveItem {
    return {
      ...item,
      meta: {
        ...item.meta,
        ...metadata
      }
    };
  }

  /**
   * Create a batch of similar items
   */
  static createBatch<T extends CognitiveItem>(
    count: number,
    factoryFunction: (index: number) => T
  ): T[] {
    return Array.from({ length: count }, (_, i) => factoryFunction(i));
  }
}