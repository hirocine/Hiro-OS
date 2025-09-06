/**
 * Structured logging system
 * Replaces console.log/error/warn with proper logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  module?: string;
  userId?: string;
  action?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
  requestId?: string;
  error?: Error | string;
}

export interface LogEntry extends LogContext {
  level: LogLevel;
  message: string;
  error?: Error | string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private minLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.minLevel];
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp || new Date().toISOString();
    const module = entry.module ? `[${entry.module}]` : '';
    const action = entry.action ? `{${entry.action}}` : '';
    
    return `${timestamp} ${entry.level.toUpperCase()} ${module}${action} ${entry.message}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    const formattedMessage = this.formatLogEntry(entry);

    // In development, use console with colors
    if (this.isDevelopment) {
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green  
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      };
      const reset = '\x1b[0m';
      
      const coloredMessage = `${colors[level]}${formattedMessage}${reset}`;
      
      if (level === 'error') {
        console.error(coloredMessage, context?.data);
        if (context?.error) {
          console.error(context.error);
        }
      } else if (level === 'warn') {
        console.warn(coloredMessage, context?.data);
      } else {
        console.log(coloredMessage, context?.data);
      }
    } else {
      // In production, could send to external service
      // For now, just use console for errors and warnings
      if (level === 'error' || level === 'warn') {
        console[level](formattedMessage, context?.data);
        if (context?.error) {
          console.error(context.error);
        }
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  // Convenience methods for common patterns
  apiCall(method: string, endpoint: string, data?: unknown): void {
    this.debug(`API ${method} ${endpoint}`, {
      module: 'api',
      action: `${method.toLowerCase()}_${endpoint.replace('/', '_')}`,
      data: data ? { requestData: data } as Record<string, unknown> : undefined,
    });
  }

  apiResponse(method: string, endpoint: string, success: boolean, data?: unknown): void {
    const level = success ? 'debug' : 'error';
    const message = `API ${method} ${endpoint} ${success ? 'succeeded' : 'failed'}`;
    
    this[level](message, {
      module: 'api',
      action: `${method.toLowerCase()}_${endpoint.replace('/', '_')}_response`,
      data: data ? { responseData: data } as Record<string, unknown> : undefined,
    });
  }

  userAction(action: string, userId?: string, data?: unknown): void {
    this.info(`User action: ${action}`, {
      module: 'user',
      action,
      userId,
      data: data as Record<string, unknown>,
    });
  }

  security(message: string, context?: LogContext): void {
    this.warn(`Security: ${message}`, {
      module: 'security',
      ...context,
    });
  }

  auth(message: string, userId?: string, data?: unknown): void {
    this.info(`Auth: ${message}`, {
      module: 'auth',
      userId,
      data: data as Record<string, unknown>,
    });
  }

  database(action: string, table: string, success: boolean, error?: Error): void {
    const level = success ? 'debug' : 'error';
    const message = `DB ${action} on ${table} ${success ? 'succeeded' : 'failed'}`;
    
    this[level](message, {
      module: 'database',
      action: `${action}_${table}`,
      error,
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions for migration
export const debugLog = (module: string, message: string, data?: unknown) =>
  logger.debug(message, { module, data: data as Record<string, unknown> });

export const authDebug = (message: string, data?: unknown) =>
  logger.auth(message, undefined, data as Record<string, unknown>);

export const adminDebug = (message: string, data?: unknown) =>
  logger.debug(message, { module: 'admin', data: data as Record<string, unknown> });

export const profileDebug = (message: string, data?: unknown) =>
  logger.debug(message, { module: 'profile', data: data as Record<string, unknown> });

export const importDebug = (message: string, data?: unknown) =>
  logger.debug(message, { module: 'import', data: data as Record<string, unknown> });

export const equipmentDebug = (message: string, data?: unknown) =>
  logger.debug(message, { module: 'equipment', data: data as Record<string, unknown> });

export const projectDebug = (message: string, data?: unknown) =>
  logger.debug(message, { module: 'project', data: data as Record<string, unknown> });

export const roleDebug = (message: string, data?: unknown) =>
  logger.debug(message, { module: 'role', data: data as Record<string, unknown> });