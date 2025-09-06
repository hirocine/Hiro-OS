/**
 * Standardized error handling system
 */

import { logger } from './logger';
import type { JsonValue } from '@/types/common';

// Base error class
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  public readonly timestamp: string;
  public readonly context?: Record<string, JsonValue>;

  constructor(
    message: string,
    context?: Record<string, JsonValue>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.context = context;
    
    // Ensure prototype chain is maintained
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Log error immediately (use class name since we can't access abstract code here)
    logger.error(`${this.constructor.name}: ${message}`, {
      module: 'error',
      error: this,
      data: context as Record<string, unknown>,
    });
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      context: this.context,
    };
  }
}

// Validation errors
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly field?: string,
    context?: Record<string, JsonValue>
  ) {
    super(message, { field, ...context });
  }
}

// Database errors
export class DatabaseError extends AppError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;

  constructor(
    message: string,
    public readonly operation?: string,
    public readonly table?: string,
    context?: Record<string, JsonValue>
  ) {
    super(message, { operation, table, ...context });
  }
}

// Authentication errors
export class AuthenticationError extends AppError {
  readonly code = 'AUTH_ERROR';
  readonly statusCode = 401;

  constructor(
    message: string,
    public readonly reason?: string,
    context?: Record<string, JsonValue>
  ) {
    super(message, { reason, ...context });
  }
}

// Authorization errors
export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;

  constructor(
    message: string,
    public readonly resource?: string,
    public readonly action?: string,
    context?: Record<string, JsonValue>
  ) {
    super(message, { resource, action, ...context });
  }
}

// Not found errors
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(
    message: string,
    public readonly resource?: string,
    public readonly id?: string,
    context?: Record<string, JsonValue>
  ) {
    super(message, { resource, id, ...context });
  }
}

// Business logic errors
export class BusinessLogicError extends AppError {
  readonly code = 'BUSINESS_LOGIC_ERROR';
  readonly statusCode = 422;

  constructor(
    message: string,
    public readonly rule?: string,
    context?: Record<string, JsonValue>
  ) {
    super(message, { rule, ...context });
  }
}

// Rate limiting errors
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;

  constructor(
    message: string,
    public readonly limit?: number,
    public readonly retryAfter?: number,
    context?: Record<string, JsonValue>
  ) {
    super(message, { limit, retryAfter, ...context });
  }
}

// File upload errors
export class UploadError extends AppError {
  readonly code = 'UPLOAD_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly fileName?: string,
    public readonly fileSize?: number,
    context?: Record<string, JsonValue>
  ) {
    super(message, { fileName, fileSize, ...context });
  }
}

// Type for all possible app errors
export type AppErrorType = 
  | ValidationError
  | DatabaseError
  | AuthenticationError
  | AuthorizationError
  | NotFoundError
  | BusinessLogicError
  | RateLimitError
  | UploadError;

// Error factory functions
export const createValidationError = (message: string, field?: string) =>
  new ValidationError(message, field);

export const createDatabaseError = (message: string, operation?: string, table?: string) =>
  new DatabaseError(message, operation, table);

export const createAuthError = (message: string, reason?: string) =>
  new AuthenticationError(message, reason);

export const createAuthorizationError = (message: string, resource?: string, action?: string) =>
  new AuthorizationError(message, resource, action);

export const createNotFoundError = (resource: string, id?: string) =>
  new NotFoundError(`${resource} not found`, resource, id);

export const createBusinessError = (message: string, rule?: string) =>
  new BusinessLogicError(message, rule);

// Error handling utilities
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

export function getErrorCode(error: unknown): string {
  if (isAppError(error)) {
    return error.code;
  }
  
  return 'UNKNOWN_ERROR';
}

// Result wrapper for operations that might fail
export function wrapAsync<T>(
  operation: () => Promise<T>
): Promise<{ data?: T; error?: AppError }> {
  return operation()
    .then(data => ({ data }))
    .catch(error => ({ error: isAppError(error) ? error : new DatabaseError(getErrorMessage(error)) }));
}

// Utility to convert legacy error handling to new system
export function handleLegacyError(error: unknown, context?: Record<string, JsonValue>): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Try to determine error type from message patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('validation') || message.includes('invalid')) {
      return new ValidationError(error.message, undefined, context);
    }
    
    if (message.includes('not found')) {
      return new NotFoundError(error.message, undefined, undefined, context);
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return new AuthorizationError(error.message, undefined, undefined, context);
    }
    
    if (message.includes('database') || message.includes('sql')) {
      return new DatabaseError(error.message, undefined, undefined, context);
    }
    
    // Default to business logic error
    return new BusinessLogicError(error.message, undefined, context);
  }
  
  return new BusinessLogicError(typeof error === 'string' ? error : 'Unknown error', undefined, context);
}