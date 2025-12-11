import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface GoogleProfileData {
  hasGoogleAvatar: boolean;
  googleAvatarUrl: string | null;
  displayName: string | null;
  isGoogleUser: boolean;
}

export function useGoogleProfile() {
  const { user } = useAuthContext();
  const [googleProfile, setGoogleProfile] = useState<GoogleProfileData>({
    hasGoogleAvatar: false,
    googleAvatarUrl: null,
    displayName: null,
    isGoogleUser: false,
  });

  useEffect(() => {
    if (!user) {
      setGoogleProfile({
        hasGoogleAvatar: false,
        googleAvatarUrl: null,
        displayName: null,
        isGoogleUser: false,
      });
      return;
    }

    const isGoogleUser = user.app_metadata?.provider === 'google';
    const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name;

    setGoogleProfile({
      hasGoogleAvatar: !!googleAvatarUrl,
      googleAvatarUrl,
      displayName,
      isGoogleUser,
    });

    logger.debug('Google profile data detected', {
      module: 'google-profile',
      data: {
        isGoogleUser,
        hasGoogleAvatar: !!googleAvatarUrl,
        hasDisplayName: !!displayName
      }
    });
  }, [user]);

  const syncGoogleAvatarToProfile = async () => {
    if (!user?.id || !googleProfile.googleAvatarUrl) {
      return { success: false, error: 'No Google avatar to sync' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: googleProfile.googleAvatarUrl })
        .eq('user_id', user.id);

      if (error) throw error;

      logger.info('Google avatar synced to profile', {
        module: 'google-profile',
        data: { userId: user.id }
      });

      return { success: true };
    } catch (error: any) {
      logger.error('Failed to sync Google avatar', {
        module: 'google-profile',
        error: error.message
      });
      return { success: false, error: error.message };
    }
  };

  return {
    ...googleProfile,
    syncGoogleAvatarToProfile,
  };
}