import { CognitiveItem } from '@/interfaces/types';
import { WorldModel } from '@/core/worldModel';
import { Agenda } from '@/core/agenda';
import logger from '../services/logger';

/**
 * Abstract base class for manager components
 * Captures common patterns like event handling, statistics tracking, and world model interaction
 */
export abstract class BaseManager {
  protected worldModel: WorldModel;
  protected agenda: Agenda;
  protected eventListeners: Array<(event: any) => void> = [];
  protected statistics: Map<string, number> = new Map();

  constructor(worldModel: WorldModel, agenda: Agenda) {
    this.worldModel = worldModel;
    this.agenda = agenda;
  }

  /**
   * Add an event listener
   */
  addEventListener(listener: (event: any) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Notify all event listeners of an event
   */
  protected notifyListeners(event: any): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        logger.error({ error, event }, 'Error in event listener');
      }
    }
  }

  /**
   * Update a statistic counter
   */
  protected updateStatistic(key: string, value: number): void {
    this.statistics.set(key, value);
  }

  /**
   * Increment a statistic counter
   */
  protected incrementStatistic(key: string, amount: number = 1): void {
    const current = this.statistics.get(key) || 0;
    this.statistics.set(key, current + amount);
  }

  /**
   * Get all statistics
   */
  getStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [key, value] of this.statistics.entries()) {
      stats[key] = value;
    }
    return stats;
  }

  /**
   * Abstract method that must be implemented by subclasses
   */
  abstract getItem(id: string): CognitiveItem | null;
  abstract updateItem(id: string, updates: Partial<CognitiveItem>): CognitiveItem | null;
  abstract removeItem(id: string): boolean;
}