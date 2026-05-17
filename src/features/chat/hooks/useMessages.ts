import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import type { ChatMessage, ChatMessageWithAuthor } from '../types/chat.types';
import { chatConversationsKey } from './useConversations';

type ProfileLite = { user_id: string; display_name: string | null; avatar_url: string | null };

/**
 * Loads messages for a conversation + subscribes to realtime INSERT/UPDATE/DELETE.
 * Returns a flat array ordered ASC by created_at (oldest at top).
 */
export function useMessages(conversationId: string | null) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessageWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const profileCacheRef = useRef<Map<string, ProfileLite>>(new Map());

  const enrichWithAuthors = useCallback(
    async (rows: ChatMessage[]): Promise<ChatMessageWithAuthor[]> => {
      const needed = Array.from(new Set(rows.map((r) => r.user_id))).filter(
        (uid) => !profileCacheRef.current.has(uid),
      );
      if (needed.length) {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', needed);
        for (const p of data ?? []) {
          profileCacheRef.current.set(p.user_id, p as ProfileLite);
        }
      }
      return rows.map((r) => {
        const p = profileCacheRef.current.get(r.user_id);
        return {
          ...r,
          author_name: p?.display_name ?? null,
          author_avatar_url: p?.avatar_url ?? null,
        };
      });
    },
    [],
  );

  // initial load
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (error) {
        setMessages([]);
        setLoading(false);
        return;
      }
      const enriched = await enrichWithAuthors((data ?? []) as ChatMessage[]);
      if (!cancelled) {
        setMessages(enriched);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, enrichWithAuthors]);

  // realtime
  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase
      .channel(`chat-msgs-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const row = payload.new as ChatMessage;
          const [enriched] = await enrichWithAuthors([row]);
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, enriched];
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === row.id
                ? { ...m, body: row.body, edited_at: row.edited_at, deleted_at: row.deleted_at }
                : m,
            ),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.old as ChatMessage;
          setMessages((prev) => prev.filter((m) => m.id !== row.id));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId, enrichWithAuthors]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!user?.id || !conversationId) return;
      const trimmed = body.trim();
      if (!trimmed) return;
      const { error } = await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        user_id: user.id,
        body: trimmed,
      });
      if (error) throw error;
    },
    [user?.id, conversationId],
  );

  const editMessage = useCallback(async (messageId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from('chat_messages')
      .update({ body: trimmed, edited_at: new Date().toISOString() })
      .eq('id', messageId);
    if (error) throw error;
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase.from('chat_messages').delete().eq('id', messageId);
    if (error) throw error;
  }, []);

  // mark conversation as read: set last_read_message_id to the latest one
  const markAsRead = useCallback(async () => {
    if (!user?.id || !conversationId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    await supabase
      .from('chat_members')
      .update({
        last_read_message_id: last.id,
        last_read_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: chatConversationsKey });
  }, [user?.id, conversationId, messages, queryClient]);

  return { messages, loading, sendMessage, editMessage, deleteMessage, markAsRead };
}
