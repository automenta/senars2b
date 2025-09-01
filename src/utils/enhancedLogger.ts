/**
 * Enhanced logger with standardized formatting and context handling
 */

export interface LogContext {
  component: string;
  operation: string;
  [key: string]: any;
}

export class EnhancedLogger {
  private static instance: EnhancedLogger;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  private constructor() {}

  static getInstance(): EnhancedLogger {
    if (!EnhancedLogger.instance) {
      EnhancedLogger.instance = new EnhancedLogger();
    }
    return EnhancedLogger.instance;
  }

  /**
   * Set the logging level
   */
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context: LogContext, error?: Error): void {
    if (this.shouldLog('debug')) {
      this.log('DEBUG', message, context, error);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context: LogContext, error?: Error): void {
    if (this.shouldLog('info')) {
      this.log('INFO', message, context, error);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context: LogContext, error?: Error): void {
    if (this.shouldLog('warn')) {
      this.log('WARN', message, context, error);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, context: LogContext, error?: Error): void {
    if (this.shouldLog('error')) {
      this.log('ERROR', message, context, error);
    }
  }

  /**
   * Log a message with standardized formatting
   */
  private log(
    level: string, 
    message: string, 
    context: LogContext, 
    error?: Error
  ): void {
    const timestamp = new Date().toISOString();
    const formattedContext = this.formatContext(context);
    
    const logEntry = {
      timestamp,
      level,
      message,
      context: formattedContext,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    // Output to console
    switch (level) {
      case 'ERROR':
        console.error(JSON.stringify(logEntry, null, 2));
        break;
      case 'WARN':
        console.warn(JSON.stringify(logEntry, null, 2));
        break;
      case 'INFO':
        console.info(JSON.stringify(logEntry, null, 2));
        break;
      case 'DEBUG':
        console.debug(JSON.stringify(logEntry, null, 2));
        break;
      default:
        console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  /**
   * Format context for logging
   */
  private formatContext(context: LogContext): Record<string, any> {
    const formatted: Record<string, any> = {
      component: context.component || 'Unknown',
      operation: context.operation || 'Unknown'
    };

    // Add any additional context properties
    for (const [key, value] of Object.entries(context)) {
      if (key !== 'component' && key !== 'operation') {
        formatted[key] = value;
      }
    }

    return formatted;
  }

  /**
   * Determine if a message should be logged based on the current log level
   */
  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }
}

// Export a singleton instance
export const enhancedLogger = EnhancedLogger.getInstance();

// Export the class for those who need to create their own instances
export default EnhancedLogger;