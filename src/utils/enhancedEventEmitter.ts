import { EventEmitter as BaseEventEmitter, EventHandler } from '@/utils/EventEmitter';
import { StatisticsTracker } from '@/utils/StatisticsTracker';
import { Logger } from '@/utils/standardLogger';
import { PerformanceMonitor } from '@/utils/performanceMonitor';

/**
 * Enhanced event emitter with performance monitoring, error handling, and statistics tracking
 */
export class EnhancedEventEmitter<EventMap extends Record<string, any>> extends BaseEventEmitter<EventMap> {
  private statisticsTracker: StatisticsTracker = new StatisticsTracker();
  private performanceTracker: Map<keyof EventMap, number[]> = new Map();
  private performanceMonitor: PerformanceMonitor;

  constructor(componentName: string) {
    super();
    this.performanceMonitor = new PerformanceMonitor(`${componentName}_EventEmitter`);
  }

  /**
   * Emit an event with performance tracking and error handling
   */
  emit<K extends keyof EventMap>(eventType: K, event: EventMap[K]): void {
    return this.performanceMonitor.measureSync(`emit_${String(eventType)}`, () => {
      const startTime = performance.now();
      const listeners = this.eventListeners.get(eventType);
      const listenerCount = listeners ? listeners.length : 0;

      // Track emission statistics
      this.statisticsTracker.increment(`${String(eventType)}Emissions`);
      this.statisticsTracker.increment('totalEmissions');

      try {
        super.emit(eventType, event);
        
        // Calculate and track performance
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (!this.performanceTracker.has(eventType)) {
          this.performanceTracker.set(eventType, []);
        }
        
        const durations = this.performanceTracker.get(eventType)!;
        durations.push(duration);
        
        // Keep only the last 100 measurements
        if (durations.length > 100) {
          durations.shift();
        }
        
        // Log performance if it exceeds threshold
        if (duration > 100) { // 100ms threshold
          Logger.warn(`Slow event emission detected`, {
            component: 'EnhancedEventEmitter',
            operation: 'emit',
            eventType: String(eventType),
            duration: duration,
            listenerCount: listenerCount
          });
        }
      } catch (error) {
        Logger.error('Error during event emission', {
          component: 'EnhancedEventEmitter',
          operation: 'emit',
          eventType: String(eventType)
        }, error);
        throw error;
      }
    });
  }

  /**
   * Add an event listener with automatic error handling
   */
  on<K extends keyof EventMap>(eventType: K, handler: EventHandler<EventMap[K]>): void {
    // Wrap handler with error handling
    const wrappedHandler: EventHandler<EventMap[K]> = (event: EventMap[K]) => {
      try {
        handler(event);
      } catch (error) {
        Logger.error(`Error in event listener for ${String(eventType)}`, {
          component: 'EnhancedEventEmitter',
          operation: 'eventListener'
        }, error);
        
        // Track listener errors
        this.statisticsTracker.increment(`${String(eventType)}ListenerErrors`);
        this.statisticsTracker.increment('totalListenerErrors');
      }
    };

    super.on(eventType, wrappedHandler);
    this.statisticsTracker.increment(`${String(eventType)}ListenersAdded`);
  }

  /**
   * Get event statistics
   */
  getStatistics(): Record<string, number> {
    return this.statisticsTracker.getAll();
  }

  /**
   * Get average emission duration for an event type
   */
  getAverageEmissionDuration(eventType: keyof EventMap): number | null {
    const durations = this.performanceTracker.get(eventType);
    if (!durations || durations.length === 0) {
      return null;
    }
    
    const sum = durations.reduce((acc, duration) => acc + duration, 0);
    return sum / durations.length;
  }

  /**
   * Get all performance data
   */
  getPerformanceData(): Record<string, { average: number | null; count: number }> {
    const result: Record<string, { average: number | null; count: number }> = {};
    
    for (const [eventType, durations] of this.performanceTracker.entries()) {
      const average = durations.length > 0 
        ? durations.reduce((acc, duration) => acc + duration, 0) / durations.length 
        : null;
      
      result[String(eventType)] = {
        average,
        count: durations.length
      };
    }
    
    return result;
  }

  /**
   * Get the performance monitor for this event emitter
   */
  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }
}