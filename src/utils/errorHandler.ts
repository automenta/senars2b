/**
 * Standardized error handling utilities for consistent error management across components
 */

export class CognitiveError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'CognitiveError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CognitiveError);
    }
  }
}

export interface ErrorHandlerContext {
  component: string;
  operation: string;
  itemId?: string;
  [key: string]: any;
}

export class ErrorHandler {
  /**
   * Handle an error with standardized logging and optional recovery
   */
  static handleError(
    error: Error | CognitiveError,
    context: ErrorHandlerContext,
    recoveryStrategy?: () => any
  ): any {
    // Create a cognitive error if it isn't already one
    const cognitiveError = error instanceof CognitiveError 
      ? error 
      : new CognitiveError(
          error.message,
          'UNKNOWN_ERROR',
          { originalError: error }
        );

    // Log the error with context
    console.error('Cognitive System Error:', {
      error: cognitiveError,
      context,
      timestamp: cognitiveError.timestamp
    });

    // Attempt recovery if a strategy is provided
    if (recoveryStrategy) {
      try {
        return recoveryStrategy();
      } catch (recoveryError) {
        console.error('Error recovery failed:', {
          error: recoveryError,
          originalError: cognitiveError,
          context
        });
        throw cognitiveError; // Re-throw the original error
      }
    }

    // Re-throw the error if no recovery strategy
    throw cognitiveError;
  }

  /**
   * Create a standardized error for invalid input
   */
  static createValidationError(
    message: string,
    details?: Record<string, any>
  ): CognitiveError {
    return new CognitiveError(
      message,
      'VALIDATION_ERROR',
      details
    );
  }

  /**
   * Create a standardized error for missing resources
   */
  static createNotFoundError(
    resourceType: string,
    resourceId: string
  ): CognitiveError {
    return new CognitiveError(
      `${resourceType} with ID ${resourceId} not found`,
      'NOT_FOUND_ERROR',
      { resourceType, resourceId }
    );
  }

  /**
   * Create a standardized error for operation failures
   */
  static createOperationError(
    operation: string,
    reason: string,
    details?: Record<string, any>
  ): CognitiveError {
    return new CognitiveError(
      `Failed to ${operation}: ${reason}`,
      'OPERATION_ERROR',
      { operation, reason, ...details }
    );
  }
}