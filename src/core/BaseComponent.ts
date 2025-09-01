import { EventEmitter, EventHandler } from '@/utils/EventEmitter';
import { StatisticsTracker } from '@/utils/StatisticsTracker';
import { Logger } from '@/utils/standardLogger';
import { ErrorHandler, CognitiveError, ErrorHandlerContext } from '@/utils/errorHandler';

/**
 * Abstract base class for all cognitive system components
 * Provides common functionality for event handling, statistics tracking, logging, and error management
 */
export abstract class BaseComponent<EventMap extends Record<string, any>> extends EventEmitter<EventMap> {
  protected statisticsTracker: StatisticsTracker = new StatisticsTracker();
  protected componentName: string;

  constructor(componentName: string) {
    super();
    this.componentName = componentName;
  }

  /**
   * Get the statistics tracker for this component
   */
  getStatisticsTracker(): StatisticsTracker {
    return this.statisticsTracker;
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