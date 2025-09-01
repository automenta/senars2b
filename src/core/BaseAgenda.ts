import { AttentionValue, CognitiveItem, TaskMetadata } from '@/interfaces/types';
import { EventEmitter } from '@/utils/EventEmitter';
import { StatisticsTracker } from '@/utils/StatisticsTracker';
import { Logger } from '@/utils/standardLogger';

export interface Agenda {
  push(item: CognitiveItem): void;
  pop(): Promise<CognitiveItem>;
  peek(): CognitiveItem | null;
  size(): number;
  updateAttention(id: string, newVal: AttentionValue): void;
  remove(id: string): boolean;
  get(id: string): CognitiveItem | null;
  updateTaskStatus(taskId: string, status: TaskMetadata['status']): boolean;
  getTasksBy(filter: { 
    tag?: string; 
    category?: string; 
    status?: TaskMetadata['status'] 
  }): CognitiveItem[];
  getTasksByGroup(groupId: string): CognitiveItem[];
}

/**
 * Events emitted by the agenda
 */
interface AgendaEvents {
  itemAdded: { item: CognitiveItem };
  itemRemoved: { itemId: string };
  itemUpdated: { item: CognitiveItem };
  taskStatusUpdated: { taskId: string; status: TaskMetadata['status'] };
}

/**
 * Abstract base class for agenda implementations
 * Provides common functionality for managing and prioritizing cognitive items
 */
export abstract class BaseAgenda extends EventEmitter<AgendaEvents> {
  protected statisticsTracker: StatisticsTracker = new StatisticsTracker();
  
  /**
   * Adds or updates a cognitive item in the agenda
   */
  abstract push(item: CognitiveItem): void;
  
  /**
   * Removes and returns the highest priority unblocked item from the agenda
   */
  abstract pop(): Promise<CognitiveItem>;
  
  /**
   * Returns the highest priority unblocked item without removing it
   */
  abstract peek(): CognitiveItem | null;
  
  /**
   * Returns the number of items in the agenda
   */
  abstract size(): number;
  
  /**
   * Updates the attention value of a specific item
   */
  abstract updateAttention(id: string, newVal: AttentionValue): void;
  
  /**
   * Removes an item from the agenda by its ID
   */
  abstract remove(id: string): boolean;
  
  /**
   * Retrieves an item by its ID without removing it
   */
  abstract get(id: string): CognitiveItem | null;
  
  /**
   * Updates the status of a specific task within the agenda
   */
  abstract updateTaskStatus(taskId: string, status: TaskMetadata['status']): boolean;
  
  /**
   * Retrieves tasks from the agenda based on a set of filter criteria
   */
  abstract getTasksBy(filter: { 
    tag?: string; 
    category?: string; 
    status?: TaskMetadata['status'] 
  }): CognitiveItem[];
  
  /**
   * Retrieves all tasks belonging to a specific group
   */
  abstract getTasksByGroup(groupId: string): CognitiveItem[];
  
  /**
   * Notify listeners that an item was added
   */
  protected notifyItemAdded(item: CognitiveItem): void {
    this.emit('itemAdded', { item });
    this.statisticsTracker.increment('itemsAdded');
    Logger.info('Item added to agenda', { 
      component: 'Agenda', 
      operation: 'addItem', 
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
    Logger.info('Item removed from agenda', { 
      component: 'Agenda', 
      operation: 'removeItem', 
      itemId 
    });
  }
  
  /**
   * Notify listeners that an item was updated
   */
  protected notifyItemUpdated(item: CognitiveItem): void {
    this.emit('itemUpdated', { item });
    this.statisticsTracker.increment('itemsUpdated');
    Logger.info('Item updated in agenda', { 
      component: 'Agenda', 
      operation: 'updateItem', 
      itemId: item.id, 
      itemType: item.type 
    });
  }
  
  /**
   * Notify listeners that a task status was updated
   */
  protected notifyTaskStatusUpdated(taskId: string, status: TaskMetadata['status']): void {
    this.emit('taskStatusUpdated', { taskId, status });
    this.statisticsTracker.increment('taskStatusUpdates');
    Logger.info('Task status updated in agenda', { 
      component: 'Agenda', 
      operation: 'updateTaskStatus', 
      taskId, 
      status 
    });
  }
  
  /**
   * Get statistics tracker
   */
  getStatisticsTracker(): StatisticsTracker {
    return this.statisticsTracker;
  }
  
  /**
   * Get agenda statistics
   */
  getStatistics(): {
    size: number;
    totalItemsAdded: number;
    totalItemsRemoved: number;
    totalTaskStatusUpdates: number;
  } {
    return {
      size: this.size(),
      totalItemsAdded: this.statisticsTracker.get('itemsAdded') || 0,
      totalItemsRemoved: this.statisticsTracker.get('itemsRemoved') || 0,
      totalTaskStatusUpdates: this.statisticsTracker.get('taskStatusUpdates') || 0
    };
  }
}