/**
 * ════════════════════════════════════════════════════════════════
 * INBOX — types
 * ════════════════════════════════════════════════════════════════
 *
 * One row per "something the recipient should know about". An item
 * lives in three orthogonal states:
 *
 *   read_at      → marked seen (visited or marked manually)
 *   done_at      → marked resolved (no longer needs attention)
 *   snooze_until → hidden until this date (then re-surfaces)
 *
 * Visible to the user in the inbox view:
 *   tab="unread"  → read_at null, done_at null, snooze_until ≤ now
 *   tab="all"     → done_at null, snooze_until ≤ now
 *   tab="done"    → done_at not null
 *   tab="snoozed" → snooze_until > now
 */

/** What part of the platform the item came from. Drives icon + grouping. */
export type InboxType =
  | 'task'
  | 'project'
  | 'loan'
  | 'pp'         // post-production
  | 'deal'       // CRM deal
  | 'proposal'
  | 'marketing'
  | 'access'     // platform access
  | 'system';

/** Why this item is in the user's inbox. Drives the chip label. */
export type InboxReason =
  | 'assigned'
  | 'mentioned'
  | 'status_change'
  | 'due_soon'
  | 'overdue'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'viewed'
  | 'commented'
  | 'new_version';

export interface InboxActor {
  name: string;
  avatar_url?: string;
}

export interface InboxItem {
  id: string;

  // Source
  type: InboxType;
  reason: InboxReason;

  // Display
  title: string;
  /** Optional second line — usually the entity title (e.g. task name). */
  preview?: string;
  /** Where the row links to when clicked. */
  deep_link: string;
  /** Who triggered the event. Null for system events. */
  actor?: InboxActor;

  // Context — used for the inline metadata row (priority pill, due chip).
  metadata?: {
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;       // ISO
    overdue_days?: number;
  };

  // State
  created_at: string;        // ISO
  read_at: string | null;
  done_at: string | null;
  snooze_until: string | null;
}

export type InboxTab = 'unread' | 'all' | 'done' | 'snoozed';
export type InboxTypeFilter = InboxType | 'all';
