/**
 * Performance monitoring utility for tracking operation performance
 */

export class PerformanceMonitor {
  private componentName: string;
  private operationStats: Map<string, { 
    count: number; 
    totalTime: number; 
    minTime: number; 
    maxTime: number;
    lastTime: number;
  }> = new Map();

  constructor(componentName: string) {
    this.componentName = componentName;
  }

  /**
   * Measure the performance of a synchronous operation
   */
  measureSync<T>(operation: string, fn: () => T): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const endTime = performance.now();
      this.recordOperation(operation, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordOperation(operation, endTime - startTime);
      throw error;
    }
  }

  /**
   * Measure the performance of an asynchronous operation
   */
  async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const endTime = performance.now();
      this.recordOperation(operation, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordOperation(operation, endTime - startTime);
      throw error;
    }
  }

  /**
   * Record an operation's performance metrics
   */
  private recordOperation(operation: string, duration: number): void {
    if (!this.operationStats.has(operation)) {
      this.operationStats.set(operation, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        lastTime: 0
      });
    }

    const stats = this.operationStats.get(operation)!;
    stats.count++;
    stats.totalTime += duration;
    stats.minTime = Math.min(stats.minTime, duration);
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.lastTime = duration;

    // Log slow operations
    if (duration > 1000) { // 1 second threshold
      console.warn(`[${this.componentName}] Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getOperationStats(operation: string): {
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    lastTime: number;
  } | null {
    const stats = this.operationStats.get(operation);
    if (!stats) return null;

    return {
      count: stats.count,
      totalTime: stats.totalTime,
      averageTime: stats.totalTime / stats.count,
      minTime: stats.minTime,
      maxTime: stats.maxTime,
      lastTime: stats.lastTime
    };
  }

  /**
   * Get all performance statistics
   */
  getAllStats(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [operation, stats] of this.operationStats.entries()) {
      result[operation] = {
        count: stats.count,
        totalTime: stats.totalTime,
        averageTime: stats.totalTime / stats.count,
        minTime: stats.minTime,
        maxTime: stats.maxTime,
        lastTime: stats.lastTime
      };
    }
    return result;
  }

  /**
   * Reset statistics for an operation
   */
  resetOperationStats(operation: string): void {
    this.operationStats.delete(operation);
  }

  /**
   * Reset all statistics
   */
  resetAllStats(): void {
    this.operationStats.clear();
  }
}