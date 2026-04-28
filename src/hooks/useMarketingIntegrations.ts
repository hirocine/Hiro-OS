import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type IntegrationStatus = 'disconnected' | 'connected' | 'expired' | 'error';

export interface MarketingIntegration {
  id: string;
  platform: string;
  account_id: string | null;
  account_name: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  connected_by: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
  status: IntegrationStatus;
  status_message: string | null;
  profile_picture_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationInput {
  platform: string;
  account_id?: string | null;
  account_name?: string | null;
  access_token?: string | null;
  token_expires_at?: string | null;
  status?: IntegrationStatus;
  status_message?: string | null;
}

export function useMarketingIntegrations() {
  const [integrations, setIntegrations] = useState<MarketingIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_integrations')
        .select('*')
        .order('platform', { ascending: true });
      if (error) {
        // Likely non-admin user without RLS access — silently treat as empty
        if (error.code !== 'PGRST301' && !error.message?.includes('permission')) {
          logger.error('Failed to fetch marketing integrations', { module: 'marketing', error });
        }
        setIntegrations([]);
        return;
      }
      setIntegrations((data ?? []) as MarketingIntegration[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const upsertIntegration = async (input: IntegrationInput) => {
    const { data: userRes } = await supabase.auth.getUser();
    const payload = {
      ...input,
      connected_by: userRes.user?.id ?? null,
      connected_at: input.access_token ? new Date().toISOString() : null,
      status: input.status ?? (input.access_token ? 'connected' : 'disconnected'),
    };
    const { data, error } = await supabase
      .from('marketing_integrations')
      .upsert(payload, { onConflict: 'platform' })
      .select()
      .single();
    if (error) throw error;
    setIntegrations((prev) => {
      const idx = prev.findIndex((p) => p.platform === data.platform);
      if (idx === -1) return [...prev, data as MarketingIntegration];
      const copy = [...prev];
      copy[idx] = data as MarketingIntegration;
      return copy;
    });
    return data as MarketingIntegration;
  };

  const disconnect = async (platform: string) => {
    const { error } = await supabase
      .from('marketing_integrations')
      .update({
        access_token: null,
        status: 'disconnected',
        status_message: null,
      })
      .eq('platform', platform);
    if (error) throw error;
    await fetchIntegrations();
  };

  const get = (platform: string) => integrations.find((i) => i.platform === platform) ?? null;
  const instagram = get('instagram');
  const linkedin = get('linkedin');

  return {
    integrations,
    loading,
    fetchIntegrations,
    upsertIntegration,
    disconnect,
    instagram,
    linkedin,
    instagramConnected: instagram?.status === 'connected' && !!instagram?.access_token,
    linkedinConnected: linkedin?.status === 'connected' && !!linkedin?.access_token,
  };
}
