export type ConversationType = 'channel' | 'dm';
export type MemberRole = 'admin' | 'member';

export interface ChatConversation {
  id: string;
  type: ConversationType;
  name: string | null;
  slug: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface ChatMember {
  conversation_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  last_read_message_id: string | null;
  last_read_at: string | null;
  muted: boolean;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  body: string;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

/** Conversation as shown in the sidebar, with display metadata resolved. */
export interface ConversationListItem extends ChatConversation {
  /** For DMs: name/avatar of the OTHER participant. For channels: the channel name. */
  display_name: string;
  display_avatar_url: string | null;
  /** Member rows of this conversation visible to the current user. */
  members: Array<{
    user_id: string;
    role: MemberRole;
    display_name: string | null;
    avatar_url: string | null;
  }>;
  unread_count: number;
  last_read_message_id: string | null;
}

export interface ChatMessageWithAuthor extends ChatMessage {
  author_name: string | null;
  author_avatar_url: string | null;
}
