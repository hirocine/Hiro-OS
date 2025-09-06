/**
 * Database-specific types with proper typing instead of 'any'
 */

import type { 
  EntityId, 
  Timestamp, 
  JsonValue, 
  IpAddress, 
  UserAgent,
  EquipmentValue,
  PatrimonyNumber,
  SerialNumber,
  ProjectNumber,
  CompanyName
} from './common';

// Equipment database types
export interface EquipmentDbRow {
  id: EntityId;
  name: string;
  brand: string;
  category: string;
  subcategory?: string;
  custom_category?: string;
  status: 'available' | 'maintenance';
  item_type: 'main' | 'accessory';
  parent_id?: EntityId;
  serial_number?: SerialNumber;
  purchase_date?: string;
  last_maintenance?: string;
  description?: string;
  image?: string;
  value?: EquipmentValue;
  patrimony_number?: PatrimonyNumber;
  depreciated_value?: EquipmentValue;
  receive_date?: string;
  store?: string;
  invoice?: string;
  current_loan_id?: EntityId;
  current_borrower?: string;
  last_loan_date?: string;
  simplified_status?: 'available';
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface EquipmentDbInsert extends Omit<EquipmentDbRow, 'id' | 'created_at' | 'updated_at'> {
  id?: EntityId;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface EquipmentDbUpdate extends Partial<Omit<EquipmentDbRow, 'id' | 'created_at'>> {
  updated_at?: Timestamp;
}

// Project database types
export interface ProjectDbRow {
  id: EntityId;
  name: string;
  description?: string;
  start_date: string;
  expected_end_date: string;
  actual_end_date?: string;
  status: 'active' | 'completed' | 'archived';
  step: 'pending_separation' | 'ready_for_pickup' | 'in_use' | 'pending_verification' | 'office_receipt' | 'verified';
  step_history: JsonValue;
  responsible_name: string;
  responsible_email?: string;
  responsible_user_id?: EntityId;
  department?: string;
  equipment_count: number;
  loan_ids: EntityId[];
  notes?: string;
  project_number?: ProjectNumber;
  company?: CompanyName;
  project_name?: string;
  withdrawal_date?: string;
  separation_date?: string;
  recording_type?: string;
  withdrawal_user_id?: EntityId;
  withdrawal_user_name?: string;
  withdrawal_time?: Timestamp;
  withdrawal_notes?: string;
  return_condition?: string;
  return_notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ProjectDbInsert extends Omit<ProjectDbRow, 'id' | 'created_at' | 'updated_at'> {
  id?: EntityId;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface ProjectDbUpdate extends Partial<Omit<ProjectDbRow, 'id' | 'created_at'>> {
  updated_at?: Timestamp;
}

// Loan database types
export interface LoanDbRow {
  id: EntityId;
  equipment_id: EntityId;
  equipment_name: string;
  borrower_name: string;
  project?: string;
  loan_date: string;
  expected_return_date: string;
  actual_return_date?: string;
  status: 'active' | 'returned' | 'overdue';
  notes?: string;
  return_condition?: 'excellent' | 'good' | 'fair' | 'damaged';
  return_notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface LoanDbInsert extends Omit<LoanDbRow, 'id' | 'created_at' | 'updated_at'> {
  id?: EntityId;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface LoanDbUpdate extends Partial<Omit<LoanDbRow, 'id' | 'created_at'>> {
  updated_at?: Timestamp;
}

// Borrower contact database types
export interface BorrowerContactDbRow {
  id: EntityId;
  loan_id: EntityId;
  borrower_email?: string;
  borrower_phone?: string;
  department?: string;
  created_by?: EntityId;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// User profile database types
export interface ProfileDbRow {
  id: EntityId;
  user_id: EntityId;
  display_name?: string;
  position?: string;
  department?: string;
  avatar_url?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ProfileDbInsert extends Omit<ProfileDbRow, 'id' | 'created_at' | 'updated_at'> {
  id?: EntityId;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface ProfileDbUpdate extends Partial<Omit<ProfileDbRow, 'id' | 'created_at'>> {
  updated_at?: Timestamp;
}

// Notification database types
export interface NotificationDbRow {
  id: EntityId;
  title: string;
  description?: string;
  type: 'project' | 'equipment' | 'loan' | 'system';
  related_entity?: 'projects' | 'equipments' | 'loans';
  entity_id?: EntityId;
  responsible_user_id?: EntityId;
  responsible_user_name?: string;
  responsible_user_email?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// User notification status
export interface UserNotificationStatusDbRow {
  id: EntityId;
  user_id: EntityId;
  notification_id: EntityId;
  is_read: boolean;
  read_at?: Timestamp;
  created_at: Timestamp;
}

// Audit log database types
export interface AuditLogDbRow {
  id: EntityId;
  user_id?: EntityId;
  user_email?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: JsonValue;
  new_values?: JsonValue;
  ip_address?: IpAddress;
  user_agent?: UserAgent;
  created_at: Timestamp;
}

// Security alert database types
export interface SecurityAlertDbRow {
  id: EntityId;
  title: string;
  description?: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: JsonValue;
  resolved: boolean;
  resolved_at?: Timestamp;
  resolved_by?: EntityId;
  created_at: Timestamp;
}

// Login attempt database types
export interface LoginAttemptDbRow {
  id: EntityId;
  ip_address: IpAddress;
  user_email?: string;
  success: boolean;
  failure_reason?: string;
  user_agent?: UserAgent;
  attempt_time: Timestamp;
}

// Equipment category database types
export interface EquipmentCategoryDbRow {
  id: EntityId;
  category: string;
  subcategory: string;
  is_custom: boolean;
  created_by?: EntityId;
  created_at: Timestamp;
}

// Saved filter database types
export interface SavedFilterDbRow {
  id: EntityId;
  user_id: EntityId;
  name: string;
  filters: JsonValue;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// User role database types
export interface UserRoleDbRow {
  id: EntityId;
  user_id: EntityId;
  role: 'admin' | 'user';
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Database transformation utilities
export type DbTransform<TDb, TApp> = {
  toApp: (dbRow: TDb) => TApp;
  toDb: (appData: Partial<TApp>) => Partial<TDb>;
};

// Generic database operation types
export interface DbInsertOperation<T> {
  table: string;
  data: T;
  returning?: string[];
}

export interface DbUpdateOperation<T> {
  table: string;
  id: EntityId;
  data: Partial<T>;
  returning?: string[];
}

export interface DbDeleteOperation {
  table: string;
  id: EntityId;
}

export interface DbSelectOperation {
  table: string;
  columns?: string[];
  where?: Record<string, unknown>;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
}