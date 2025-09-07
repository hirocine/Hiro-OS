/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/on\w+=/gi, '') // Remove onXXX= event handlers
    .replace(/expression\(/gi, '') // Remove CSS expression
    .replace(/url\(/gi, '') // Remove CSS url()
    .replace(/import\s/gi, '') // Remove import statements
    .replace(/@import/gi, '') // Remove @import
    .replace(/eval\(/gi, '') // Remove eval calls
    .trim();
}

/**
 * Validates email format with enhanced security checks
 * @param email - Email string to validate
 * @returns Boolean indicating if email is valid
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Additional security checks
  const suspiciousPatterns = [
    /\.\./,           // Double dots
    /^\.|\.$/, // Starting or ending with dot
    /@\.|\@$/,        // @ followed by dot or at end
    /\s/,             // Whitespace
    /[<>]/,           // HTML characters
    /javascript:/i,   // JavaScript protocol
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(email));
}

/**
 * Validates that input doesn't contain malicious patterns
 * @param input - Input to validate
 * @returns Boolean indicating if input is safe
 */
export function validateSafeInput(input: string): boolean {
  if (!input || typeof input !== 'string') return true;
  
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i
  ];
  
  return !maliciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitizes form data object
 * @param data - Object with form data to sanitize
 * @returns Sanitized object
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

/**
 * Rate limiting utility for preventing brute force attacks
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) { // 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - attempt.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Increment attempts
    attempt.count++;
    attempt.lastAttempt = now;

    return attempt.count <= this.maxAttempts;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}