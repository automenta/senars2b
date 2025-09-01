import { v4 as uuidv4 } from 'uuid';
import { CognitiveItem, AttentionValue, TruthValue, DerivationStamp } from '../interfaces/types';
import { DEFAULT_TASK_DURABILITY } from '../utils/constants';

/**
 * Generic factory base class for creating cognitive items
 */
export abstract class BaseCognitiveItemFactory {
  /**
   * Create a basic cognitive item with common properties
   */
  protected createBaseItem(
    type: CognitiveItem['type'],
    label: string,
    attention?: Partial<AttentionValue>
  ): CognitiveItem {
    const now = Date.now();
    
    return {
      id: uuidv4(),
      atom_id: uuidv4(),
      type,
      label,
      attention: {
        priority: attention?.priority ?? 0.5,
        durability: attention?.durability ?? DEFAULT_TASK_DURABILITY
      },
      stamp: {
        timestamp: now,
        parent_ids: [],
        schema_id: uuidv4()
      },
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Create a derivation stamp
   */
  protected createDerivationStamp(
    parentIds: string[] = [],
    schemaId?: string,
    module?: string
  ): DerivationStamp {
    return {
      timestamp: Date.now(),
      parent_ids: parentIds,
      schema_id: schemaId || uuidv4(),
      module
    };
  }

  /**
   * Create a truth value
   */
  protected createTruthValue(frequency: number = 1.0, confidence: number = 1.0): TruthValue {
    return {
      frequency: Math.max(0, Math.min(1, frequency)),
      confidence: Math.max(0, Math.min(1, confidence))
    };
  }

  /**
   * Create an attention value
   */
  protected createAttentionValue(priority: number = 0.5, durability: number = 0.5): AttentionValue {
    return {
      priority: Math.max(0, Math.min(1, priority)),
      durability: Math.max(0, Math.min(1, durability))
    };
  }

  /**
   * Deep clone a cognitive item
   */
  protected cloneItem(item: CognitiveItem): CognitiveItem {
    return JSON.parse(JSON.stringify(item));
  }

  /**
   * Merge metadata into an item
   */
  protected mergeMetadata(item: CognitiveItem, metadata: Record<string, any>): CognitiveItem {
    const clonedItem = this.cloneItem(item);
    clonedItem.meta = { ...(clonedItem.meta || {}), ...metadata };
    return clonedItem;
  }
}