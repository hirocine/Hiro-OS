import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivePersona {
  id: string;
  name: string;
  segment?: string | null;
  company_size?: string | null;
  channels_consumed?: string[] | null;
  main_pains?: string[] | null;
  updated_at: string;
}

export function useMarketingActivePersona() {
  const [persona, setPersona] = useState<ActivePersona | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('marketing_personas')
      .select('id,name,segment,company_size,channels_consumed,main_pains,updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setPersona((data as unknown as ActivePersona) ?? null);
        setLoading(false);
      });
  }, []);

  return { persona, loading };
}
