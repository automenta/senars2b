import { CognitiveItem } from '@/interfaces/types';
import { UnifiedBaseComponent, BaseConfig } from '@/core/UnifiedBaseComponent';

/**
 * Configuration for the cognitive item validator
 */
interface CognitiveItemValidatorConfig extends BaseConfig {
  enableStrictValidation?: boolean;
  enableTypeChecking?: boolean;
  enableStructureValidation?: boolean;
  enableMetadataValidation?: boolean;
}

/**
 * Events emitted by the cognitive item validator
 */
interface CognitiveItemValidatorEvents {
  itemValidated: { itemId: string; isValid: boolean; errors?: string[] };
  validationError: { itemId: string; error: string };
}

/**
 * Utility class for validating cognitive items
 */
export class CognitiveItemValidator extends UnifiedBaseComponent<CognitiveItemValidatorConfig, CognitiveItemValidatorEvents> {
  constructor(userConfig: Partial<CognitiveItemValidatorConfig> = {}) {
    const defaultConfig: CognitiveItemValidatorConfig = {
      enableStrictValidation: false,
      enableTypeChecking: true,
      enableStructureValidation: true,
      enableMetadataValidation: true
    };
    
    super('CognitiveItemValidator', defaultConfig, userConfig);
  }

  /**
   * Validate a cognitive item
   */
  validate(item: CognitiveItem): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Type checking
    if (this.getConfig().enableTypeChecking) {
      if (!item.type) {
        errors.push('Item must have a type');
      }
      
      if (!['TASK', 'GOAL', 'BELIEF', 'QUERY', 'EVENT'].includes(item.type)) {
        errors.push(`Invalid item type: ${item.type}`);
      }
    }

    // Structure validation
    if (this.getConfig().enableStructureValidation) {
      if (!item.id) {
        errors.push('Item must have an ID');
      }

      if (!item.attention) {
        errors.push('Item must have an attention value');
      } else {
        if (typeof item.attention.priority !== 'number' || 
            item.attention.priority < 0 || 
            item.attention.priority > 1) {
          errors.push('Item attention priority must be a number between 0 and 1');
        }

        if (typeof item.attention.durability !== 'number' || 
            item.attention.durability < 0 || 
            item.attention.durability > 1) {
          errors.push('Item attention durability must be a number between 0 and 1');
        }
      }

      if (!item.stamp) {
        errors.push('Item must have a stamp');
      } else {
        if (!item.stamp.timestamp) {
          errors.push('Item stamp must have a timestamp');
        }
      }
    }

    // Metadata validation
    if (this.getConfig().enableMetadataValidation && item.meta) {
      if (typeof item.meta !== 'object') {
        errors.push('Item metadata must be an object');
      }
    }

    // Specific validation based on item type
    if (item.type === 'TASK' && item.task_metadata) {
      if (!item.task_metadata.status) {
        errors.push('Task items must have a status');
      }
    }

    if (item.type === 'BELIEF' && item.truth) {
      if (typeof item.truth.frequency !== 'number' || 
          item.truth.frequency < 0 || 
          item.truth.frequency > 1) {
        errors.push('Belief frequency must be a number between 0 and 1');
      }

      if (typeof item.truth.confidence !== 'number' || 
          item.truth.confidence < 0 || 
          item.truth.confidence > 1) {
        errors.push('Belief confidence must be a number between 0 and 1');
      }
    }

    const isValid = errors.length === 0;
    
    // Emit validation event
    this.notifyEvent('itemValidated', { 
      itemId: item.id, 
      isValid, 
      errors: isValid ? undefined : errors 
    }, {
      component: 'CognitiveItemValidator',
      operation: 'validate',
      itemId: item.id
    });

    if (!isValid) {
      const errorMessage = `Validation failed for item ${item.id}: ${errors.join(', ')}`;
      this.notifyEvent('validationError', { 
        itemId: item.id, 
        error: errorMessage 
      }, {
        component: 'CognitiveItemValidator',
        operation: 'validate',
        itemId: item.id
      });
    }

    return { isValid, errors };
  }

  /**
   * Validate a batch of cognitive items
   */
  validateBatch(items: CognitiveItem[]): { 
    validItems: CognitiveItem[]; 
    invalidItems: { item: CognitiveItem; errors: string[] }[] 
  } {
    const validItems: CognitiveItem[] = [];
    const invalidItems: { item: CognitiveItem; errors: string[] }[] = [];

    for (const item of items) {
      const result = this.validate(item);
      if (result.isValid) {
        validItems.push(item);
      } else {
        invalidItems.push({ item, errors: result.errors });
      }
    }

    return { validItems, invalidItems };
  }
}