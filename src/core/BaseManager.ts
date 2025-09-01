import { CognitiveItem } from '@/interfaces/types';
import { WorldModel } from '@/core/worldModel';
import { Agenda } from '@/core/agenda';
import { BaseComponent } from './BaseComponent';

interface ManagerEvents {
  itemAdded: { item: CognitiveItem };
  itemUpdated: { item: CognitiveItem };
  itemRemoved: { itemId: string };
}

/**
 * Abstract base class for manager components
 * Captures common patterns like event handling, statistics tracking, and world model interaction
 */
export abstract class BaseManager extends BaseComponent<ManagerEvents> {
  protected worldModel: WorldModel;
  protected agenda: Agenda;

  constructor(worldModel: WorldModel, agenda: Agenda) {
    super('Manager');
    this.worldModel = worldModel;
    this.agenda = agenda;
  }

  /**
   * Notify listeners that an item was added
   */
  protected notifyItemAdded(item: CognitiveItem): void {
    this.notifyEvent('itemAdded', { item }, { 
      component: 'Manager',
      operation: 'addItem', 
      itemId: item.id, 
      itemType: item.type 
    });
  }

  /**
   * Notify listeners that an item was updated
   */
  protected notifyItemUpdated(item: CognitiveItem): void {
    this.notifyEvent('itemUpdated', { item }, { 
      component: 'Manager',
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
      component: 'Manager',
      operation: 'removeItem', 
      itemId 
    });
  }

  /**
   * Abstract method that must be implemented by subclasses
   */
  abstract getItem(id: string): CognitiveItem | null;
  abstract updateItem(id: string, updates: Partial<CognitiveItem>): CognitiveItem | null;
  abstract removeItem(id: string): boolean;
}