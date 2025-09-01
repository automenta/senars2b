import { CognitiveItem } from '@/interfaces/types';
import { EnhancedUnifiedBaseComponent, BaseConfig } from './EnhancedUnifiedBaseComponent';
import { isItemType } from '@/utils/typeGuards';

interface ManagerConfig extends BaseConfig {
  enableHistoryTracking?: boolean;
  maxHistorySize?: number;
  enableValidation?: boolean;
}

interface ManagerEvents<T> {
  itemAdded: { item: T };
  itemUpdated: { item: T };
  itemRemoved: { itemId: string };
  itemHistoryUpdated?: { itemId: string; history: T[] };
  validationError?: { error: Error; item: T };
}

interface Identifiable {
  id: string;
}

/**
 * Enhanced generic CRUD manager with built-in type safety, standardized operations, 
 * configuration support, history tracking, and validation
 */
export abstract class EnhancedCRUDManager<
  T extends CognitiveItem & Identifiable,
  C extends ManagerConfig = ManagerConfig
> extends EnhancedUnifiedBaseComponent<C, ManagerEvents<T>> {
  protected items: Map<string, T> = new Map();
  protected itemHistory: Map<string, T[]> = new Map();
  protected itemType: T['type'];
  protected validators: Array<(item: T) => boolean> = [];

  constructor(
    componentName: string,
    itemType: T['type'],
    defaultConfig: C,
    userConfig: Partial<C> = {}
  ) {
    super(componentName, defaultConfig, userConfig);
    this.itemType = itemType;
  }

  /**
   * Type-safe item retrieval with automatic type checking
   */
  getItem(id: string): T | null {
    return this.measureSync('getItem', () => {
      const item = this.items.get(id);
      if (item && isItemType(item, this.itemType)) {
        return item as T;
      }
      return null;
    });
  }

  /**
   * Type-safe item update with automatic validation
   */
  updateItem(id: string, updates: Partial<T>): T | null {
    return this.measureSync('updateItem', () => {
      const item = this.getItem(id);
      if (!item) return null;

      const updatedItem = { ...item, ...updates } as T;
      
      // Validate if enabled
      if (this.getConfig().enableValidation && !this.validateItem(updatedItem)) {
        return null;
      }
      
      this.items.set(id, updatedItem);
      
      // Track history if enabled
      if (this.getConfig().enableHistoryTracking) {
        this.updateItemHistory(id, updatedItem);
      }
      
      this.notifyItemUpdated(updatedItem);
      return updatedItem;
    });
  }

  /**
   * Type-safe item removal
   */
  removeItem(id: string): boolean {
    return this.measureSync('removeItem', () => {
      const result = this.items.delete(id);
      if (result) {
        this.notifyItemRemoved(id);
      }
      return result;
    });
  }

  /**
   * Add an item with automatic type validation
   */
  addItem(item: T): void {
    this.measureSync('addItem', () => {
      // Type validation
      if (!isItemType(item, this.itemType)) {
        throw this.createValidationError(
          `Item type mismatch. Expected ${this.itemType}, got ${item.type}`,
          { expectedType: this.itemType, actualType: item.type }
        );
      }
      
      // Custom validation
      if (this.getConfig().enableValidation && !this.validateItem(item)) {
        return;
      }
      
      this.items.set(item.id, item);
      
      // Track history if enabled
      if (this.getConfig().enableHistoryTracking) {
        this.initializeItemHistory(item.id, item);
      }
      
      this.notifyItemAdded(item);
    });
  }

  /**
   * Get all items of the specified type
   */
  getAllItems(): T[] {
    return this.measureSync('getAllItems', () => {
      return Array.from(this.items.values());
    });
  }

  /**
   * Get item count
   */
  size(): number {
    return this.measureSync('size', () => {
      return this.items.size;
    });
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.measureSync('clear', () => {
      const ids = Array.from(this.items.keys());
      this.items.clear();
      ids.forEach(id => this.notifyItemRemoved(id));
    });
  }

  /**
   * Find items by a key-value pair with type safety
   */
  findBy<K extends keyof T>(key: K, value: T[K]): T[] {
    return this.measureSync('findBy', () => {
      return this.getAllItems().filter(item => item[key] === value);
    });
  }

  /**
   * Find a single item by a key-value pair
   */
  findOneBy<K extends keyof T>(key: K, value: T[K]): T | null {
    return this.measureSync('findOneBy', () => {
      const items = this.findBy(key, value);
      return items.length > 0 ? items[0] : null;
    });
  }

  /**
   * Get item history if tracking is enabled
   */
  getItemHistory(id: string): T[] | null {
    return this.measureSync('getItemHistory', () => {
      if (!this.getConfig().enableHistoryTracking) {
        return null;
      }
      return this.itemHistory.get(id) || [];
    });
  }

  /**
   * Add a custom validator function
   */
  addValidator(validator: (item: T) => boolean): void {
    this.validators.push(validator);
  }

  /**
   * Validate an item against all registered validators
   */
  protected validateItem(item: T): boolean {
    try {
      for (const validator of this.validators) {
        if (!validator(item)) {
          this.notifyEvent('validationError', { 
            error: new Error('Item validation failed'), 
            item 
          }, {
            component: this.componentName,
            operation: 'validateItem'
          });
          return false;
        }
      }
      return true;
    } catch (error) {
      this.notifyEvent('validationError', { 
        error: error as Error, 
        item 
      }, {
        component: this.componentName,
        operation: 'validateItem'
      });
      return false;
    }
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