/**
 * ════════════════════════════════════════════════════════════════
 * useInbox — Supabase-backed (substitui o mock)
 * ════════════════════════════════════════════════════════════════
 *
 * Lê de `public.inbox_items` filtrando por `user_id = auth.uid()`
 * (RLS já garante isso no banco — o `.eq` aqui é só por clareza
 * e cache key). A página `/caixa-de-entrada` continua igual — o
 * shape público desse hook é exatamente o que o mock retornava.
 *
 * Realtime: `useInboxRealtime()` subscribe nas mudanças e invalida
 * o cache do react-query. Monte uma vez próximo da raiz da app.
 */

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type { InboxItem, InboxReason, InboxType } from './types';

const QUERY_KEY = ['inbox', 'list'] as const;
const COUNT_KEY = ['inbox', 'unread_count'] as const;

interface DbInboxRow {
  id: string;
  user_id: string;
  type: string;
  reason: string;
  title: string;
  preview: string | null;
  deep_link: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
  done_at: string | null;
  snooze_until: string | null;
}

/** Maps a Supabase row into the public `InboxItem` shape the page expects. */
function rowToItem(row: DbInboxRow): InboxItem {
  const meta = (row.metadata ?? {}) as InboxItem['metadata'];
  return {
    id: row.id,
    type: row.type as InboxType,
    reason: row.reason as InboxReason,
    title: row.title,
    preview: row.preview ?? undefined,
    deep_link: row.deep_link,
    actor: row.actor_name
      ? { name: row.actor_name, avatar_url: row.actor_avatar_url ?? undefined }
      : undefined,
    metadata: meta && Object.keys(meta).length > 0 ? meta : undefined,
    created_at: row.created_at,
    read_at: row.read_at,
    done_at: row.done_at,
    snooze_until: row.snooze_until,
  };
}

async function fetchItems(userId: string): Promise<InboxItem[]> {
  const { data, error } = await supabase
    .from('inbox_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as DbInboxRow[]).map(rowToItem);
}

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('inbox_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)
    .is('done_at', null)
    .or(`snooze_until.is.null,snooze_until.lt.${new Date().toISOString()}`);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Public hook used by the Inbox page. API matches the previous mock
 * implementation so the page UI is untouched.
 */
export function useInbox() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: [...QUERY_KEY, userId],
    queryFn: () => fetchItems(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const items: InboxItem[] = query.data ?? [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: COUNT_KEY });
  };

  const update = async (id: string, patch: Partial<DbInboxRow>) => {
    const { error } = await supabase.from('inbox_items').update(patch).eq('id', id);
    if (error) throw error;
  };

  const markReadMut = useMutation({
    mutationFn: (id: string) => update(id, { read_at: new Date().toISOString() }),
    onSuccess: refresh,
  });
  const markUnreadMut = useMutation({
    mutationFn: (id: string) => update(id, { read_at: null }),
    onSuccess: refresh,
  });
  const markDoneMut = useMutation({
    mutationFn: (id: string) => {
      const stamp = new Date().toISOString();
      return update(id, { done_at: stamp, read_at: stamp });
    },
    onSuccess: refresh,
  });
  const unmarkDoneMut = useMutation({
    mutationFn: (id: string) => update(id, { done_at: null }),
    onSuccess: refresh,
  });
  const snoozeMut = useMutation({
    mutationFn: ({ id, hours }: { id: string; hours: number }) => {
      const stamp = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      return update(id, { snooze_until: stamp });
    },
    onSuccess: refresh,
  });
  const unsnoozeMut = useMutation({
    mutationFn: (id: string) => update(id, { snooze_until: null }),
    onSuccess: refresh,
  });
  const markAllReadMut = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from('inbox_items')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  return {
    items,
    markRead: (id: string) => markReadMut.mutate(id),
    markUnread: (id: string) => markUnreadMut.mutate(id),
    markDone: (id: string) => markDoneMut.mutate(id),
    unmarkDone: (id: string) => unmarkDoneMut.mutate(id),
    snooze: (id: string, hours: number) => snoozeMut.mutate({ id, hours }),
    unsnooze: (id: string) => unsnoozeMut.mutate(id),
    markAllRead: () => markAllReadMut.mutate(),
  };
}

/** Lightweight unread badge count for the sidebar. */
export function useInboxUnreadCount(): number {
  const { user } = useAuthContext();
  const userId = user?.id;

  const { data } = useQuery({
    queryKey: [...COUNT_KEY, userId],
    queryFn: () => fetchUnreadCount(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  return data ?? 0;
}

/**
 * Subscribe nas mudanças realtime de `inbox_items` pro user logado.
 * Invalida o cache do react-query em qualquer INSERT/UPDATE/DELETE
 * — uma vez setado, lista e badge se atualizam sozinhos.
 */
export function useInboxRealtime() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`inbox:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inbox_items',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          queryClient.invalidateQueries({ queryKey: COUNT_KEY });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}
