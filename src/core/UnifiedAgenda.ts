import { AttentionValue, CognitiveItem, TaskMetadata } from '@/interfaces/types';
import { UnifiedBaseComponent, BaseConfig } from './UnifiedBaseComponent';

interface AgendaConfig extends BaseConfig {
  maxWaitTime?: number;
  enableDependencyTracking?: boolean;
  priorityWeighting?: PriorityWeighting;
}

export interface PriorityWeighting {
  taskPriority: number;
  deadlineFactor: number;
  attentionPriority: number;
  completionFactor: number;
}

interface AgendaEvents {
  itemAdded: { item: CognitiveItem };
  itemRemoved: { itemId: string };
  itemUpdated: { item: CognitiveItem };
  taskStatusUpdated: { taskId: string; status: TaskMetadata['status'] };
  itemBlocked?: { itemId: string; reason: string };
  itemUnblocked?: { itemId: string };
}

/**
 * Abstract base class for agenda implementations with unified base component functionality
 */
export abstract class UnifiedAgenda extends UnifiedBaseComponent<AgendaConfig, AgendaEvents> {
  constructor(defaultConfig: AgendaConfig, userConfig: Partial<AgendaConfig> = {}) {
    super('Agenda', defaultConfig, userConfig);
  }
  
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