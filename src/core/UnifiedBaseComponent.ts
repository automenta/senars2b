import { EventEmitter, EventHandler } from '@/utils/EventEmitter';
import { StatisticsTracker } from '@/utils/StatisticsTracker';
import { Logger, LogContext } from '@/utils/standardLogger';
import { ErrorHandler, CognitiveError, ErrorHandlerContext } from '@/utils/errorHandler';
import { ConfigManager, BaseConfig } from '@/utils/configUtils';

/**
 * Unified abstract base class for all cognitive system components
 * Provides common functionality for event handling, statistics tracking, logging, error management, and configuration
 */
export abstract class UnifiedBaseComponent<
  T extends BaseConfig, 
  EventMap extends Record<string, any>
> extends EventEmitter<EventMap> {
  protected statisticsTracker: StatisticsTracker = new StatisticsTracker();
  protected configManager: ConfigManager<T>;
  protected componentName: string;

  constructor(componentName: string, defaultConfig: T, userConfig: Partial<T> = {}) {
    super();
    this.componentName = componentName;
    this.configManager = new ConfigManager(defaultConfig, userConfig);
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
   * Standardized notification method for emitting events with logging and statistics
   */
  protected notifyEvent<K extends keyof EventMap>(
    eventType: K, 
    event: EventMap[K], 
    context: Record<string, any>
  ): void {
    this.emit(eventType, event);
    Logger.info(`${String(eventType)} event emitted`, { 
      ...context,
      component: this.componentName
    });
    this.statisticsTracker.increment(`${String(eventType)}Count`);
  }

  /**
   * Unified error handling with standardized logging
   */
  protected handleError(
    error: Error | CognitiveError,
    context: ErrorHandlerContext,
    recoveryStrategy?: () => any
  ): any {
    return ErrorHandler.handleError(error, { ...context, component: this.componentName }, recoveryStrategy);
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
}