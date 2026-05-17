import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type {
  ChatConversation,
  ChatMember,
  ConversationListItem,
} from '../types/chat.types';

type ProfileLite = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export const chatConversationsKey = ['chat', 'conversations'] as const;

/**
 * Loads the conversations the current user participates in, with display
 * metadata (channel name OR the other DM participant's name + avatar)
 * and an unread count derived from `last_read_message_id`.
 */
export function useConversations() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: chatConversationsKey,
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<ConversationListItem[]> => {
      if (!user?.id) return [];

      // 1. all my memberships
      const { data: myMemberships, error: mErr } = await supabase
        .from('chat_members')
        .select('conversation_id, last_read_message_id, role, joined_at')
        .eq('user_id', user.id);
      if (mErr) throw mErr;
      if (!myMemberships?.length) return [];

      const convIds = myMemberships.map((m) => m.conversation_id);

      // 2. conversations
      const { data: convs, error: cErr } = await supabase
        .from('chat_conversations')
        .select('*')
        .in('id', convIds);
      if (cErr) throw cErr;

      // 3. all members of those conversations (for DM resolution and member list)
      const { data: allMembers, error: amErr } = await supabase
        .from('chat_members')
        .select('conversation_id, user_id, role')
        .in('conversation_id', convIds);
      if (amErr) throw amErr;

      // 4. profile lookup for everyone involved
      const userIds = Array.from(new Set((allMembers ?? []).map((m) => m.user_id)));
      const profileMap = new Map<string, ProfileLite>();
      if (userIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        for (const p of profs ?? []) {
          profileMap.set(p.user_id, p as ProfileLite);
        }
      }

      // 5. unread count per conversation = messages newer than my last_read_message_id (or all if null), excluding mine
      const myLastReadByConv = new Map<string, string | null>();
      for (const m of myMemberships) {
        myLastReadByConv.set(m.conversation_id, m.last_read_message_id);
      }

      const unreadCounts = new Map<string, number>();
      for (const cid of convIds) {
        const lastRead = myLastReadByConv.get(cid);
        let q = supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', cid)
          .neq('user_id', user.id)
          .is('deleted_at', null);
        if (lastRead) {
          // count messages with created_at > created_at of the lastRead message
          const { data: ref } = await supabase
            .from('chat_messages')
            .select('created_at')
            .eq('id', lastRead)
            .maybeSingle();
          if (ref?.created_at) {
            q = q.gt('created_at', ref.created_at);
          }
        }
        const { count } = await q;
        unreadCounts.set(cid, count ?? 0);
      }

      // 6. build list items
      const list: ConversationListItem[] = (convs ?? []).map((c) => {
        const memberRows = (allMembers ?? []).filter((m) => m.conversation_id === c.id);
        const members = memberRows.map((m) => {
          const p = profileMap.get(m.user_id);
          return {
            user_id: m.user_id,
            role: m.role as ChatMember['role'],
            display_name: p?.display_name ?? null,
            avatar_url: p?.avatar_url ?? null,
          };
        });

        let displayName = c.name ?? '';
        let displayAvatar: string | null = null;

        if (c.type === 'dm') {
          const other = members.find((m) => m.user_id !== user.id) ?? members[0];
          displayName = other?.display_name ?? 'Conversa direta';
          displayAvatar = other?.avatar_url ?? null;
        } else {
          displayName = c.name ?? 'canal';
        }

        return {
          ...(c as ChatConversation),
          display_name: displayName,
          display_avatar_url: displayAvatar,
          members,
          unread_count: unreadCounts.get(c.id) ?? 0,
          last_read_message_id: myLastReadByConv.get(c.id) ?? null,
        };
      });

      // sort by last_message_at DESC, falling back to created_at
      list.sort((a, b) => {
        const at = a.last_message_at ?? a.created_at;
        const bt = b.last_message_at ?? b.created_at;
        return bt.localeCompare(at);
      });
      return list;
    },
  });

  // Realtime: re-fetch when my membership changes (new conversation joined / removed),
  // or when ANY message in conversations I'm in is inserted (bumps last_message_at + unread).
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`chat-conv-list-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_members', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: chatConversationsKey }),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => queryClient.invalidateQueries({ queryKey: chatConversationsKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, queryClient]);

  return query;
}

/**
 * Creates a new channel (admin only — RLS will reject otherwise).
 * Auto-adds the creator as `admin` member.
 */
export function useCreateChannel() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useCallback(
    async (params: { name: string; description?: string; memberUserIds?: string[] }) => {
      if (!user?.id) throw new Error('not authenticated');
      const slug = params.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);

      const { data: conv, error } = await supabase
        .from('chat_conversations')
        .insert({
          type: 'channel',
          name: params.name.trim(),
          slug: slug || null,
          description: params.description?.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      const memberIds = Array.from(new Set([user.id, ...(params.memberUserIds ?? [])]));
      const rows = memberIds.map((uid) => ({
        conversation_id: conv.id,
        user_id: uid,
        role: uid === user.id ? 'admin' : 'member',
      }));
      const { error: mErr } = await supabase.from('chat_members').insert(rows);
      if (mErr) throw mErr;

      await queryClient.invalidateQueries({ queryKey: chatConversationsKey });
      return conv;
    },
    [user?.id, queryClient],
  );
}

/**
 * Opens (or reuses) a 1:1 DM between the current user and `otherUserId`.
 * Returns the conversation id.
 */
export function useOpenDM() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useCallback(
    async (otherUserId: string): Promise<string> => {
      if (!user?.id) throw new Error('not authenticated');
      if (otherUserId === user.id) throw new Error('cannot DM yourself');

      // find existing DM between the two users
      const { data: myDms } = await supabase
        .from('chat_members')
        .select('conversation_id, chat_conversations!inner(id, type)')
        .eq('user_id', user.id)
        .eq('chat_conversations.type', 'dm');

      const myDmIds = (myDms ?? []).map((r) => r.conversation_id);
      if (myDmIds.length) {
        const { data: shared } = await supabase
          .from('chat_members')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', myDmIds);
        const existing = shared?.[0]?.conversation_id;
        if (existing) return existing;
      }

      // create new DM
      const { data: conv, error } = await supabase
        .from('chat_conversations')
        .insert({ type: 'dm', created_by: user.id })
        .select()
        .single();
      if (error) throw error;

      const { error: mErr } = await supabase.from('chat_members').insert([
        { conversation_id: conv.id, user_id: user.id, role: 'admin' },
        { conversation_id: conv.id, user_id: otherUserId, role: 'admin' },
      ]);
      if (mErr) throw mErr;

      await queryClient.invalidateQueries({ queryKey: chatConversationsKey });
      return conv.id;
    },
    [user?.id, queryClient],
  );
}

/** Total unread across all my conversations — for sidebar badge. */
export function useTotalUnread() {
  const { data } = useConversations();
  return (data ?? []).reduce((acc, c) => acc + (c.unread_count ?? 0), 0);
}
