import { useCallback, useState } from 'react';
import type { InboxItem } from './types';
import { MOCK_INBOX } from './mock-data';

/**
 * Inbox state hook — exposes the shape the page UI consumes and the
 * mutation calls (markRead/markDone/snooze).
 *
 * Today it just keeps the mock array in local state. When the real
 * Supabase table lands, swap the implementation for a useQuery +
 * mutations against `inbox_items` — the public surface here stays
 * the same so the page code doesn't move.
 */
export function useInbox() {
  const [items, setItems] = useState<InboxItem[]>(MOCK_INBOX);

  const update = useCallback((id: string, patch: Partial<InboxItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const markRead = useCallback(
    (id: string) => update(id, { read_at: new Date().toISOString() }),
    [update],
  );

  const markUnread = useCallback((id: string) => update(id, { read_at: null }), [update]);

  const markDone = useCallback(
    (id: string) => {
      const stamp = new Date().toISOString();
      update(id, { done_at: stamp, read_at: stamp });
    },
    [update],
  );

  const unmarkDone = useCallback((id: string) => update(id, { done_at: null }), [update]);

  /** Snooze for an arbitrary number of hours from now. */
  const snooze = useCallback(
    (id: string, hours: number) => {
      const stamp = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      update(id, { snooze_until: stamp });
    },
    [update],
  );

  const unsnooze = useCallback((id: string) => update(id, { snooze_until: null }), [update]);

  const markAllRead = useCallback(() => {
    const stamp = new Date().toISOString();
    setItems((prev) => prev.map((it) => (it.read_at ? it : { ...it, read_at: stamp })));
  }, []);

  return {
    items,
    markRead,
    markUnread,
    markDone,
    unmarkDone,
    snooze,
    unsnooze,
    markAllRead,
  };
}

/**
 * Lightweight version for the sidebar badge — only needs the unread
 * count, not the whole list. Real impl will be a head-count query.
 */
export function useInboxUnreadCount(): number {
  const nowMs = Date.now();
  return MOCK_INBOX.filter((it) => {
    if (it.read_at) return false;
    if (it.done_at) return false;
    if (it.snooze_until && new Date(it.snooze_until).getTime() > nowMs) return false;
    return true;
  }).length;
}
