import { CognitiveItem } from '@/interfaces/types';
import { WorldModel } from '@/core/worldModel';
import { Agenda } from '@/core/agenda';
import { BaseManager } from './BaseManager';

/**
 * Generic interface for identifiable items
 */
export interface Identifiable {
  id: string;
  [key: string]: any;
}

/**
 * Generic CRUD manager for managing identifiable items
 * Provides common CRUD operations with event notifications
 */
export abstract class GenericCRUDManager<T extends Identifiable> extends BaseManager {
  protected items: Map<string, T> = new Map();

  constructor(worldModel: WorldModel, agenda: Agenda) {
    super(worldModel, agenda);
  }

  /**
   * Add an item to the manager
   */
  addItem(item: T): void {
    this.items.set(item.id, item);
    this.notifyItemAdded(item as unknown as CognitiveItem);
  }

  /**
   * Get an item by its ID
   */
  getItem(id: string): T | null {
    return this.items.get(id) || null;
  }

  /**
   * Get all items
   */
  getAllItems(): T[] {
    return Array.from(this.items.values());
  }

  /**
   * Update an item with partial updates
   */
  updateItem(id: string, updates: Partial<T>): T | null {
    const item = this.items.get(id);
    if (!item) return null;

    const updatedItem = { ...item, ...updates };
    this.items.set(id, updatedItem);
    this.notifyItemUpdated(updatedItem as unknown as CognitiveItem);
    return updatedItem;
  }

  /**
   * Remove an item by its ID
   */
  removeItem(id: string): boolean {
    const result = this.items.delete(id);
    if (result) {
      this.notifyItemRemoved(id);
    }
    return result;
  }

  /**
   * Get items count
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
}