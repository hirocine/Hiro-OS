import type { User } from '@supabase/supabase-js';

interface AvatarData {
  url: string | null;
  initials: string;
  displayName: string | null;
  isGoogleUser: boolean;
}

/**
 * Extrai dados de avatar de diferentes fontes (profile, Google, fallback)
 */
export function getAvatarData(
  user: User | null,
  profileAvatarUrl?: string | null,
  profileDisplayName?: string | null
): AvatarData {
  if (!user) {
    return {
      url: null,
      initials: 'U',
      displayName: null,
      isGoogleUser: false,
    };
  }

  const isGoogleUser = user.app_metadata?.provider === 'google';
  const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const googleDisplayName = user.user_metadata?.full_name || user.user_metadata?.name;
  
  // Prioridade: avatar do perfil local -> avatar do Google -> null
  const avatarUrl = profileAvatarUrl || googleAvatarUrl || null;
  
  // Prioridade: nome do perfil local -> nome do Google -> email
  const displayName = profileDisplayName || googleDisplayName || null;
  
  // Gerar iniciais
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || 'U';

  return {
    url: avatarUrl,
    initials,
    displayName,
    isGoogleUser,
  };
}

/**
 * Obtém URL do avatar do Google do usuário
 */
export function getGoogleAvatarUrl(user: User | null): string | null {
  if (!user || user.app_metadata?.provider !== 'google') {
    return null;
  }
  
  return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
}