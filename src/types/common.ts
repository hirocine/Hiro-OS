/**
 * Common types and utilities for type safety
 */

// Result pattern for operations that can fail
export type Result<T, E = string> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

// API Response pattern
export type ApiResponse<T> = {
  data?: T;
  error?: string | null;
  loading?: boolean;
};

// Database operation result
export type DbResult<T> = {
  data: T | null;
  error: string | null;
};

// Form state types
export type FormState<T> = {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isDirty: boolean;
};

// Pagination types
export type PaginationParams = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

// Upload types
export type UploadResult = {
  success: boolean;
  url?: string;
  error?: string;
};

// IP Address type (instead of unknown)
export type IpAddress = string;

// User Agent type
export type UserAgent = string;

// Generic ID type
export type EntityId = string;

// Timestamp type
export type Timestamp = string;

// JSON value type (more specific than any)
export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonValue[] 
  | { [key: string]: JsonValue };

// Database row metadata
export type RowMetadata = {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// Audit log data
export type AuditLogData = {
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: JsonValue;
  newValues?: JsonValue;
  userId?: EntityId;
  userEmail?: string;
  ipAddress?: IpAddress;
  userAgent?: UserAgent;
};

// Security alert types
export type SecurityAlertType = 
  | 'unauthorized_access'
  | 'suspicious_login'
  | 'data_breach'
  | 'rate_limit_exceeded'
  | 'malicious_activity';

export type SecurityAlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Equipment specific types
export type EquipmentValue = number;
export type PatrimonyNumber = string;
export type SerialNumber = string;

// Project specific types  
export type ProjectNumber = string;
export type CompanyName = string;

// Type guards
export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUrl(value: unknown): value is string {
  try {
    return typeof value === 'string' && Boolean(new URL(value));
  } catch {
    return false;
  }
}

export function isValidUuid(value: unknown): value is EntityId {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof value === 'string' && uuidRegex.test(value);
}

export function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !isNaN(Date.parse(value));
}

// Utility types for form handling
export type FormErrors<T> = Partial<Record<keyof T, string>>;

export type FormSubmissionResult<T = void> = Result<T, FormErrors<any>>;