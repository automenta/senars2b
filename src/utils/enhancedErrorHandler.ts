/**
 * Enhanced error handling utilities with standardized error types and recovery strategies
 */

export interface ErrorContext {
  component: string;
  operation: string;
  [key: string]: any;
}

export class EnhancedError extends Error {
  public readonly context: ErrorContext;
  public readonly timestamp: number;
  public readonly errorCode: string;

  constructor(message: string, context: ErrorContext, errorCode: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'EnhancedError';
    this.context = context;
    this.timestamp = Date.now();
    this.errorCode = errorCode;
  }
}

export class ValidationError extends EnhancedError {
  constructor(message: string, context: ErrorContext) {
    super(message, context, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends EnhancedError {
  constructor(resourceType: string, resourceId: string, context: ErrorContext) {
    super(`${resourceType} with ID ${resourceId} not found`, context, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class OperationError extends EnhancedError {
  constructor(operation: string, reason: string, context: ErrorContext) {
    super(`Operation '${operation}' failed: ${reason}`, context, 'OPERATION_ERROR');
    this.name = 'OperationError';
  }
}

export class EnhancedErrorHandler {
  private static errorCount: Map<string, number> = new Map();
  private static lastErrors: Map<string, EnhancedError> = new Map();

  /**
   * Handle an error with standardized logging and optional recovery
   */
  static handleError(
    error: Error | EnhancedError,
    context: ErrorContext,
    recoveryStrategy?: () => any
  ): any {
    // Update error statistics
    const component = context.component || 'Unknown';
    this.errorCount.set(component, (this.errorCount.get(component) || 0) + 1);
    if (error instanceof EnhancedError) {
      this.lastErrors.set(component, error);
    }

    // Log the error
    console.error(`[${component}] Error in ${context.operation}: ${error.message}`, {
      error,
      context,
      timestamp: Date.now()
    });

    // Attempt recovery if strategy provided
    if (recoveryStrategy) {
      try {
        console.info(`[${component}] Attempting error recovery for ${context.operation}`);
        const result = recoveryStrategy();
        console.info(`[${component}] Error recovery successful for ${context.operation}`);
        return result;
      } catch (recoveryError) {
        console.error(`[${component}] Error recovery failed for ${context.operation}: ${recoveryError.message}`);
        throw recoveryError;
      }
    }

    // Re-throw if no recovery strategy
    throw error;
  }

  /**
   * Create a standardized validation error
   */
  static createValidationError(message: string, details?: Record<string, any>): ValidationError {
    return new ValidationError(message, {
      component: 'EnhancedErrorHandler',
      operation: 'createValidationError',
      ...details
    });
  }

  /**
   * Create a standardized not found error
   */
  static createNotFoundError(resourceType: string, resourceId: string): NotFoundError {
    return new NotFoundError(resourceType, resourceId, {
      component: 'EnhancedErrorHandler',
      operation: 'createNotFoundError',
      resourceType,
      resourceId
    });
  }

  /**
   * Create a standardized operation error
   */
  static createOperationError(
    operation: string,
    reason: string,
    details?: Record<string, any>
  ): OperationError {
    return new OperationError(operation, reason, {
      component: 'EnhancedErrorHandler',
      operation: 'createOperationError',
      ...details
    });
  }

  /**
   * Get error statistics for a component
   */
  static getErrorStatistics(component: string): {
    errorCount: number;
    lastError?: EnhancedError;
  } {
    return {
      errorCount: this.errorCount.get(component) || 0,
      lastError: this.lastErrors.get(component)
    };
  }

  /**
   * Get overall error statistics
   */
  static getOverallErrorStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [component, count] of this.errorCount.entries()) {
      stats[component] = count;
    }
    return stats;
  }
}