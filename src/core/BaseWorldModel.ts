import { CognitiveItem, SemanticAtom } from '@/interfaces/types';
import { CognitiveSchema } from './worldModel';
import { EventEmitter } from '@/utils/EventEmitter';
import { StatisticsTracker } from '@/utils/StatisticsTracker';
import { Logger } from '@/utils/standardLogger';

/**
 * Events emitted by the world model
 */
interface WorldModelEvents {
  itemAdded: { item: CognitiveItem };
  itemUpdated: { item: CognitiveItem };
  itemRemoved: { itemId: string };
  schemaRegistered: { schemaId: string };
}

/**
 * Abstract base class for world model implementations
 * Provides common functionality for managing cognitive items and schemas
 */
export abstract class BaseWorldModel extends EventEmitter<WorldModelEvents> {
  protected statisticsTracker: StatisticsTracker = new StatisticsTracker();
  
  /**
   * Add a semantic atom to the world model
   */
  abstract add_atom(atom: SemanticAtom): string;
  
  /**
   * Add a cognitive item to the world model
   */
  abstract add_item(item: CognitiveItem): void;
  
  /**
   * Update a cognitive item in the world model
   */
  abstract update_item(item: CognitiveItem): void;
  
  /**
   * Remove a cognitive item from the world model
   */
  abstract remove_item(id: string): boolean;
  
  /**
   * Get a semantic atom by ID
   */
  abstract get_atom(id: string): SemanticAtom | null;
  
  /**
   * Get a cognitive item by ID
   */
  abstract get_item(id: string): CognitiveItem | null;
  
  /**
   * Query items by semantic similarity
   */
  abstract query_by_semantic(embedding: number[], k: number): CognitiveItem[];
  
  /**
   * Query items by symbolic pattern
   */
  abstract query_by_symbolic(pattern: any, k?: number): CognitiveItem[];
  
  /**
   * Query items by structural pattern
   */
  abstract query_by_structure(pattern: any, k?: number): CognitiveItem[];
  
  /**
   * Query items by metadata
   */
  abstract query_by_meta(key: string, value: any): CognitiveItem[];
  
  /**
   * Query atoms by metadata
   */
  abstract query_atoms_by_meta(key: string, value: any): SemanticAtom[];
  
  /**
   * Revise a belief with a new item
   */
  abstract revise_belief(new_item: CognitiveItem): [CognitiveItem | null, CognitiveItem | null];
  
  /**
   * Register a schema atom
   */
  abstract register_schema_atom(atom: SemanticAtom): CognitiveSchema;
  
  /**
   * Get world model statistics
   */
  abstract getStatistics(): {
    atomCount: number;
    itemCount: number;
    schemaCount: number;
    averageItemDurability: number;
  };
  
  /**
   * Get item history
   */
  abstract getItemHistory(itemId: string): CognitiveItem[];
  
  /**
   * Get confidence distribution
   */
  abstract getConfidenceDistribution(): { bins: string[], counts: number[] };
  
  /**
   * Get all items
   */
  abstract getAllItems(): CognitiveItem[];
  
  /**
   * Notify listeners that an item was added
   */
  protected notifyItemAdded(item: CognitiveItem): void {
    this.emit('itemAdded', { item });
    this.statisticsTracker.increment('itemsAdded');
    Logger.info('Item added to world model', { 
      component: 'WorldModel', 
      operation: 'addItem', 
      itemId: item.id, 
      itemType: item.type 
    });
  }
  
  /**
   * Notify listeners that an item was updated
   */
  protected notifyItemUpdated(item: CognitiveItem): void {
    this.emit('itemUpdated', { item });
    this.statisticsTracker.increment('itemsUpdated');
    Logger.info('Item updated in world model', { 
      component: 'WorldModel', 
      operation: 'updateItem', 
      itemId: item.id, 
      itemType: item.type 
    });
  }
  
  /**
   * Notify listeners that an item was removed
   */
  protected notifyItemRemoved(itemId: string): void {
    this.emit('itemRemoved', { itemId });
    this.statisticsTracker.increment('itemsRemoved');
    Logger.info('Item removed from world model', { 
      component: 'WorldModel', 
      operation: 'removeItem', 
      itemId 
    });
  }
  
  /**
   * Notify listeners that a schema was registered
   */
  protected notifySchemaRegistered(schemaId: string): void {
    this.emit('schemaRegistered', { schemaId });
    this.statisticsTracker.increment('schemasRegistered');
    Logger.info('Schema registered in world model', { 
      component: 'WorldModel', 
      operation: 'registerSchema', 
      schemaId 
    });
  }
  
  /**
   * Get statistics tracker
   */
  getStatisticsTracker(): StatisticsTracker {
    return this.statisticsTracker;
  }
  
  /**
   * Compact the world model by removing old, low-priority items
   */
  compact(): void {
    // Default implementation does nothing
    // Subclasses should implement specific compaction logic
    Logger.info('World model compaction requested', { 
      component: 'WorldModel', 
      operation: 'compact' 
    });
  }
}