/**
 * Statistics tracking utilities for consistent metrics collection across components
 */

export interface StatisticEntry {
  value: number;
  timestamp: number;
}

export class StatisticsTracker {
  private stats: Map<string, StatisticEntry> = new Map();
  private history: Map<string, StatisticEntry[]> = new Map();

  /**
   * Update a statistic value
   */
  update(key: string, value: number): void {
    const entry: StatisticEntry = {
      value,
      timestamp: Date.now()
    };
    
    this.stats.set(key, entry);
    
    // Keep history of the last 100 values
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }
    
    const history = this.history.get(key)!;
    history.push(entry);
    
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Increment a statistic value
   */
  increment(key: string, amount: number = 1): void {
    const current = this.stats.get(key)?.value || 0;
    this.update(key, current + amount);
  }

  /**
   * Decrement a statistic value
   */
  decrement(key: string, amount: number = 1): void {
    const current = this.stats.get(key)?.value || 0;
    this.update(key, current - amount);
  }

  /**
   * Get a statistic value
   */
  get(key: string): number | undefined {
    return this.stats.get(key)?.value;
  }

  /**
   * Get all current statistics
   */
  getAll(): Record<string, number> {
    const result: Record<string, number> = {};
    const entries = Array.from(this.stats.entries());
    for (let i = 0; i < entries.length; i++) {
      const [key, entry] = entries[i];
      result[key] = entry.value;
    }
    return result;
  }

  /**
   * Get statistics history
   */
  getHistory(key: string): StatisticEntry[] {
    return this.history.get(key) || [];
  }

  /**
   * Reset a statistic
   */
  reset(key: string): void {
    this.stats.delete(key);
    this.history.delete(key);
  }

  /**
   * Reset all statistics
   */
  resetAll(): void {
    this.stats.clear();
    this.history.clear();
  }

  /**
   * Calculate average for a statistic over time period
   */
  getAverage(key: string, timeWindowMs?: number): number | undefined {
    const history = this.history.get(key);
    if (!history || history.length === 0) {
      return undefined;
    }

    const now = Date.now();
    const filteredHistory = timeWindowMs 
      ? history.filter(entry => (now - entry.timestamp) <= timeWindowMs)
      : history;

    if (filteredHistory.length === 0) {
      return undefined;
    }

    const sum = filteredHistory.reduce((acc, entry) => acc + entry.value, 0);
    return sum / filteredHistory.length;
  }
}