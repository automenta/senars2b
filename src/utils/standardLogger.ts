import logger from '../services/logger';
import { CognitiveError } from '@/utils/errorHandler';

/**
 * Standardized logging utilities for consistent logging across components
 */

export interface LogContext {
  component: string;
  operation?: string;
  itemId?: string;
  [key: string]: any;
}

export class Logger {
  /**
   * Log an info message with standardized context
   */
  static info(message: string, context: LogContext, data?: Record<string, any>): void {
    logger.info({ ...context, ...data }, message);
  }

  /**
   * Log a debug message with standardized context
   */
  static debug(message: string, context: LogContext, data?: Record<string, any>): void {
    logger.debug({ ...context, ...data }, message);
  }

  /**
   * Log a warning message with standardized context
   */
  static warn(message: string, context: LogContext, data?: Record<string, any>): void {
    logger.warn({ ...context, ...data }, message);
  }

  /**
   * Log an error message with standardized context
   */
  static error(
    message: string,
    context: LogContext,
    error?: Error | CognitiveError,
    data?: Record<string, any>
  ): void {
    const logData: Record<string, any> = { ...context, ...data };
    
    if (error) {
      logData.error = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
      
      if (error instanceof CognitiveError) {
        logData.error.code = error.code;
        logData.error.details = error.details;
        logData.error.timestamp = error.timestamp;
      }
    }
    
    logger.error(logData, message);
  }

  /**
   * Log a trace message with standardized context
   */
  static trace(message: string, context: LogContext, data?: Record<string, any>): void {
    logger.trace({ ...context, ...data }, message);
  }
}

export default Logger;