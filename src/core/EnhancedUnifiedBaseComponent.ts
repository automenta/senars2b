import { EventEmitter, EventHandler } from '@/utils/EventEmitter';
import { StatisticsTracker } from '@/utils/StatisticsTracker';
import { Logger, LogContext } from '@/utils/standardLogger';
import { ErrorHandler, CognitiveError, ErrorHandlerContext } from '@/utils/errorHandler';
import { ConfigManager, BaseConfig } from '@/utils/configUtils';
import { PerformanceMonitor } from '@/utils/performanceMonitor';

/**
 * Enhanced abstract base class for all cognitive system components
 * Provides unified functionality for event handling, statistics tracking, logging, 
 * error management, configuration, and performance monitoring
 */
export abstract class EnhancedUnifiedBaseComponent<
  T extends BaseConfig, 
  EventMap extends Record<string, any>
> extends EventEmitter<EventMap> {
  protected statisticsTracker: StatisticsTracker = new StatisticsTracker();
  protected configManager: ConfigManager<T>;
  protected componentName: string;
  protected performanceMonitor: PerformanceMonitor;

  constructor(componentName: string, defaultConfig: T, userConfig: Partial<T> = {}) {
    super();
    this.componentName = componentName;
    this.configManager = new ConfigManager(defaultConfig, userConfig);
    this.performanceMonitor = new PerformanceMonitor(componentName);
  }

  /**
   * Get the statistics tracker for this component
   */
  getStatisticsTracker(): StatisticsTracker {
    return this.statisticsTracker;
  }

  /**
   * Get the current configuration
   */
  getConfig(): T {
    return this.configManager.getConfig();
  }

  /**
   * Update the configuration with partial updates
   */
  updateConfig(updates: Partial<T>): void {
    this.configManager.updateConfig(updates);
    this.getLogger().info(`${this.componentName} configuration updated`, { 
      component: this.constructor.name, 
      operation: 'updateConfig' 
    });
  }

  /**
   * Get a specific configuration value
   */
  protected getConfigValue<K extends keyof T>(key: K): T[K] {
    return this.configManager.get(key);
  }

  /**
   * Set a specific configuration value
   */
  protected setConfigValue<K extends keyof T>(key: K, value: T[K]): void {
    this.configManager.set(key, value);
    this.getLogger().info(`${this.componentName} configuration value updated`, { 
      component: this.constructor.name, 
      operation: 'setConfigValue',
      key: key as string
    });
  }

  /**
   * Get the logger for this component
   */
  getLogger(): typeof Logger {
    return Logger;
  }

  /**
   * Get the performance monitor for this component
   */
  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * Standardized notification method for emitting events with logging and statistics
   */
  protected notifyEvent<K extends keyof EventMap>(
    eventType: K, 
    event: EventMap[K], 
    context: Record<string, any> = {}
  ): void {
    // Automatic context injection
    const fullContext = {
      component: this.componentName,
      timestamp: Date.now(),
      ...context
    };
    
    // Automatic statistics tracking
    this.statisticsTracker.increment(`${String(eventType)}Count`);
    
    // Automatic performance monitoring
    const startTime = performance.now();
    
    try {
      this.emit(eventType, event);
      
      // Log successful event emission
      Logger.info(`${String(eventType)} event emitted`, fullContext);
    } catch (error) {
      // Log event emission errors
      Logger.error(`Error emitting ${String(eventType)} event`, fullContext, error);
      throw error;
    } finally {
      // Track performance
      const duration = performance.now() - startTime;
      this.statisticsTracker.update(`${String(eventType)}Duration`, duration);
    }
  }

  /**
   * Unified error handling with standardized logging and recovery
   */
  protected handleError(
    error: Error | CognitiveError,
    context: ErrorHandlerContext,
    recoveryStrategy?: () => any
  ): any {
    // Enrich context with component information
    const fullContext = { 
      ...context, 
      component: this.componentName,
      timestamp: Date.now()
    };

    // Log the error
    Logger.error('Component error occurred', fullContext, error);

    // Track error statistics
    this.statisticsTracker.increment('errorCount');
    this.statisticsTracker.update('lastError', error.message);

    // Attempt recovery if strategy provided
    if (recoveryStrategy) {
      try {
        Logger.info('Attempting error recovery', fullContext);
        const result = recoveryStrategy();
        Logger.info('Error recovery successful', fullContext);
        return result;
      } catch (recoveryError) {
        Logger.error('Error recovery failed', fullContext, recoveryError);
        throw recoveryError;
      }
    }

    // Re-throw if no recovery strategy
    throw error;
  }

  /**
   * Create a standardized validation error
   */
  protected createValidationError(message: string, details?: Record<string, any>): CognitiveError {
    return ErrorHandler.createValidationError(message, details);
  }

  /**
   * Create a standardized not found error
   */
  protected createNotFoundError(resourceType: string, resourceId: string): CognitiveError {
    return ErrorHandler.createNotFoundError(resourceType, resourceId);
  }

  /**
   * Create a standardized operation error
   */
  protected createOperationError(
    operation: string,
    reason: string,
    details?: Record<string, any>
  ): CognitiveError {
    return ErrorHandler.createOperationError(operation, reason, details);
  }

  /**
   * Measure performance of synchronous operations
   */
  protected measureSync<K>(operation: string, fn: () => K): K {
    return this.performanceMonitor.measureSync(operation, fn);
  }

  /**
   * Measure performance of asynchronous operations
   */
  protected async measureAsync<K>(operation: string, fn: () => Promise<K>): Promise<K> {
    return this.performanceMonitor.measureAsync(operation, fn);
  }
}