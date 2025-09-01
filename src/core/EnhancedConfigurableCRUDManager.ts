import { CognitiveItem } from '@/interfaces/types';
import { WorldModel } from '@/core/worldModel';
import { Agenda } from '@/core/agenda';
import { UnifiedBaseComponent, BaseConfig } from './UnifiedBaseComponent';
import { isItemType } from '@/utils/typeGuards';

interface ManagerConfig extends BaseConfig {
  enableHistoryTracking?: boolean;
  maxHistorySize?: number;
}

interface ManagerEvents<T> {
  itemAdded: { item: T };
  itemUpdated: { item: T };
  itemRemoved: { itemId: string };
  itemHistoryUpdated?: { itemId: string; history: T[] };
}

interface Identifiable {
  id: string;
}

/**
 * Enhanced generic CRUD manager with built-in type safety, standardized operations, and configuration support
 */
export abstract class EnhancedConfigurableCRUDManager<
  T extends CognitiveItem & Identifiable,
  C extends ManagerConfig
> extends UnifiedBaseComponent<C, ManagerEvents<T>> {
  protected items: Map<string, T> = new Map();
  protected itemHistory: Map<string, T[]> = new Map();
  protected itemType: T['type'];
  protected worldModel: WorldModel;
  protected agenda: Agenda;

  constructor(
    componentName: string,
    itemType: T['type'],
    worldModel: WorldModel,
    agenda: Agenda,
    defaultConfig: C,
    userConfig: Partial<C> = {}
  ) {
    super(componentName, defaultConfig, userConfig);
    this.itemType = itemType;
    this.worldModel = worldModel;
    this.agenda = agenda;
  }

  /**
   * Type-safe item retrieval with automatic type checking
   */
  getItem(id: string): T | null {
    const item = this.items.get(id);
    if (item && isItemType(item, this.itemType)) {
      return item as T;
    }
    return null;
  }

  /**
   * Type-safe item update with automatic validation
   */
  updateItem(id: string, updates: Partial<T>): T | null {
    const item = this.getItem(id);
    if (!item) return null;

    const updatedItem = { ...item, ...updates } as T;
    this.items.set(id, updatedItem);
    
    // Track history if enabled
    if (this.getConfig().enableHistoryTracking) {
      this.updateItemHistory(id, updatedItem);
    }
    
    this.notifyItemUpdated(updatedItem);
    return updatedItem;
  }

  /**
   * Type-safe item removal
   */
  removeItem(id: string): boolean {
    const result = this.items.delete(id);
    if (result) {
      this.notifyItemRemoved(id);
    }
    return result;
  }

  /**
   * Add an item with automatic type validation
   */
  addItem(item: T): void {
    if (!isItemType(item, this.itemType)) {
      throw this.createValidationError(
        `Item type mismatch. Expected ${this.itemType}, got ${item.type}`,
        { expectedType: this.itemType, actualType: item.type }
      );
    }
    this.items.set(item.id, item);
    
    // Track history if enabled
    if (this.getConfig().enableHistoryTracking) {
      this.initializeItemHistory(item.id, item);
    }
    
    this.notifyItemAdded(item);
  }

  /**
   * Get all items of the specified type
   */
  getAllItems(): T[] {
    return Array.from(this.items.values());
  }

  /**
   * Get item count
   */
  size(): number {
    return this.items.size;
  }

  /**
   * Clear all items
   */
  clear(): void {
    const ids = Array.from(this.items.keys());
    this.items.clear();
    ids.forEach(id => this.notifyItemRemoved(id));
  }

  /**
   * Find items by a key-value pair with type safety
   */
  findBy<K extends keyof T>(key: K, value: T[K]): T[] {
    return this.getAllItems().filter(item => item[key] === value);
  }

  /**
   * Find a single item by a key-value pair
   */
  findOneBy<K extends keyof T>(key: K, value: T[K]): T | null {
    const items = this.findBy(key, value);
    return items.length > 0 ? items[0] : null;
  }

  /**
   * Get item history if tracking is enabled
   */
  getItemHistory(id: string): T[] | null {
    if (!this.getConfig().enableHistoryTracking) {
      return null;
    }
    return this.itemHistory.get(id) || [];
  }

  /**
   * Load items from world model on initialization
   */
  protected loadItemsFromWorldModel(): void {
    const allItems = this.worldModel.getAllItems();
    const typedItems = allItems.filter(item => isItemType(item, this.itemType)) as T[];
    typedItems.forEach(item => {
      this.items.set(item.id, item);
      if (this.getConfig().enableHistoryTracking) {
        this.initializeItemHistory(item.id, item);
      }
    });
  }

  /**
   * Notify listeners that an item was added
   */
  protected notifyItemAdded(item: T): void {
    this.notifyEvent('itemAdded', { item }, { 
      component: this.componentName,
      operation: 'addItem', 
      itemId: item.id, 
      itemType: item.type 
    });
  }

  /**
   * Notify listeners that an item was updated
   */
  protected notifyItemUpdated(item: T): void {
    this.notifyEvent('itemUpdated', { item }, { 
      component: this.componentName,
      operation: 'updateItem', 
      itemId: item.id, 
      itemType: item.type 
    });
  }

  /**
   * Notify listeners that an item was removed
   */
  protected notifyItemRemoved(itemId: string): void {
    this.notifyEvent('itemRemoved', { itemId }, { 
      component: this.componentName,
      operation: 'removeItem', 
      itemId 
    });
  }

  /**
   * Notify listeners that an item history was updated
   */
  protected notifyItemHistoryUpdated(itemId: string, history: T[]): void {
    if (this.listenerCount('itemHistoryUpdated') > 0) {
      this.notifyEvent('itemHistoryUpdated', { itemId, history }, { 
        component: this.componentName,
        operation: 'updateItemHistory', 
        itemId 
      });
    }
  }

  /**
   * Initialize item history tracking
   */
  private initializeItemHistory(id: string, item: T): void {
    if (!this.itemHistory.has(id)) {
      this.itemHistory.set(id, [item]);
      this.notifyItemHistoryUpdated(id, [item]);
    }
  }

  /**
   * Update item history tracking
   */
  private updateItemHistory(id: string, item: T): void {
    if (!this.itemHistory.has(id)) {
      this.itemHistory.set(id, [item]);
    } else {
      const history = this.itemHistory.get(id)!;
      history.push(item);
      
      // Limit history size
      const maxSize = this.getConfig().maxHistorySize || 10;
      if (history.length > maxSize) {
        this.itemHistory.set(id, history.slice(-maxSize));
      }
    }
    
    this.notifyItemHistoryUpdated(id, this.itemHistory.get(id)!);
  }
}