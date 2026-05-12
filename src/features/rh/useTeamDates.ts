/**
 * ════════════════════════════════════════════════════════════════
 * useTeamDates — aniversários do time + datas importantes
 * ════════════════════════════════════════════════════════════════
 *
 * Combina três fontes:
 *   - profiles.birth_date      → kind: 'birthday'
 *   - profiles.hired_at        → kind: 'work_anniversary' (+ years)
 *   - important_dates          → kind: 'important'
 *
 * Saída: `TeamDate[]` já ordenada pela próxima ocorrência (calculada
 * em local time `America/Sao_Paulo`). Aniversário que já passou esse
 * ano vira "próximo ano" — sempre futuro.
 */

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TeamDate } from './types';

const PROFILES_KEY = ['rh', 'profile_dates'] as const;
const IMPORTANT_KEY = ['rh', 'important_dates'] as const;

interface ProfileDateRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  hired_at: string | null;
  is_approved: boolean;
}

interface ImportantDateRow {
  id: string;
  type: 'company_milestone' | 'commemorative' | 'client_anniversary' | 'custom';
  title: string;
  date: string;
  recurring: boolean;
  notes: string | null;
}

const MS_DAY = 24 * 60 * 60 * 1000;

/**
 * Calcula a próxima ocorrência anual de uma data (mês+dia).
 * Se já passou esse ano, retorna ano que vem.
 */
function nextAnnualOccurrence(isoDate: string): { date: Date; daysUntil: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const base = new Date(isoDate + 'T00:00:00');
  const month = base.getMonth();
  const day = base.getDate();

  let occurrence = new Date(today.getFullYear(), month, day);
  if (occurrence.getTime() < today.getTime()) {
    occurrence = new Date(today.getFullYear() + 1, month, day);
  }

  const daysUntil = Math.round((occurrence.getTime() - today.getTime()) / MS_DAY);
  return { date: occurrence, daysUntil };
}

async function fetchProfileDates(): Promise<ProfileDateRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url, birth_date, hired_at, is_approved')
    .eq('is_approved', true);
  if (error) throw error;
  return (data ?? []) as ProfileDateRow[];
}

async function fetchImportantDates(): Promise<ImportantDateRow[]> {
  const { data, error } = await supabase
    .from('important_dates')
    .select('id, type, title, date, recurring, notes')
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ImportantDateRow[];
}

export function useTeamDates() {
  const queryClient = useQueryClient();

  const profilesQuery = useQuery({
    queryKey: PROFILES_KEY,
    queryFn: fetchProfileDates,
    staleTime: 5 * 60 * 1000,
  });

  const importantQuery = useQuery({
    queryKey: IMPORTANT_KEY,
    queryFn: fetchImportantDates,
    staleTime: 5 * 60 * 1000,
  });

  const items: TeamDate[] = useMemo(() => {
    const out: TeamDate[] = [];

    // Birthdays + work anniversaries
    for (const p of profilesQuery.data ?? []) {
      if (p.birth_date) {
        const { date, daysUntil } = nextAnnualOccurrence(p.birth_date);
        out.push({
          id: `birthday-${p.user_id}`,
          kind: 'birthday',
          title: p.display_name ?? 'Colaborador',
          next_occurrence: date.toISOString(),
          days_until: daysUntil,
          user_id: p.user_id,
          user_avatar_url: p.avatar_url,
          base_date: p.birth_date,
          recurring: true,
        });
      }
      if (p.hired_at) {
        const { date, daysUntil } = nextAnnualOccurrence(p.hired_at);
        const yearsBefore = date.getFullYear() - new Date(p.hired_at + 'T00:00:00').getFullYear();
        if (yearsBefore >= 1) {
          out.push({
            id: `work-${p.user_id}`,
            kind: 'work_anniversary',
            title: p.display_name ?? 'Colaborador',
            next_occurrence: date.toISOString(),
            days_until: daysUntil,
            user_id: p.user_id,
            user_avatar_url: p.avatar_url,
            years: yearsBefore,
            base_date: p.hired_at,
            recurring: true,
          });
        }
      }
    }

    // Important dates
    for (const d of importantQuery.data ?? []) {
      if (d.recurring) {
        const { date, daysUntil } = nextAnnualOccurrence(d.date);
        out.push({
          id: d.id,
          kind: 'important',
          title: d.title,
          next_occurrence: date.toISOString(),
          days_until: daysUntil,
          important_type: d.type,
          base_date: d.date,
          notes: d.notes,
          recurring: true,
        });
      } else {
        // One-shot: usa a própria data; se passou, days_until negativo
        const base = new Date(d.date + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysUntil = Math.round((base.getTime() - today.getTime()) / MS_DAY);
        out.push({
          id: d.id,
          kind: 'important',
          title: d.title,
          next_occurrence: base.toISOString(),
          days_until: daysUntil,
          important_type: d.type,
          base_date: d.date,
          notes: d.notes,
          recurring: false,
        });
      }
    }

    // Ordena pela próxima ocorrência (mais cedo primeiro). Itens
    // passados (one-shot) ficam no fim.
    return out.sort((a, b) => {
      if (a.days_until < 0 && b.days_until >= 0) return 1;
      if (b.days_until < 0 && a.days_until >= 0) return -1;
      return a.days_until - b.days_until;
    });
  }, [profilesQuery.data, importantQuery.data]);

  // ─── Mutations (admin only — RLS protege) ─────────────────────
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: IMPORTANT_KEY });
  };

  const createMut = useMutation({
    mutationFn: async (input: {
      type: 'company_milestone' | 'commemorative' | 'client_anniversary' | 'custom';
      title: string;
      date: string;
      recurring: boolean;
      notes?: string | null;
    }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      const { error } = await supabase.from('important_dates').insert({
        type: input.type,
        title: input.title,
        date: input.date,
        recurring: input.recurring,
        notes: input.notes ?? null,
        created_by: userId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateMut = useMutation({
    mutationFn: async (input: {
      id: string;
      type?: 'company_milestone' | 'commemorative' | 'client_anniversary' | 'custom';
      title?: string;
      date?: string;
      recurring?: boolean;
      notes?: string | null;
    }) => {
      const { id, ...patch } = input;
      const { error } = await supabase.from('important_dates').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('important_dates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    items,
    loading: profilesQuery.isLoading || importantQuery.isLoading,
    error: profilesQuery.error ?? importantQuery.error,
    createImportantDate: createMut.mutate,
    updateImportantDate: updateMut.mutate,
    deleteImportantDate: deleteMut.mutate,
  };
}

/**
 * Realtime subscription pra important_dates. Aniversários do time
 * mudam quando admin edita profiles — não precisa realtime separado
 * pra isso porque a invalidação manual depois do EditUserDialog basta.
 */
export function useTeamDatesRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('important_dates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'important_dates' },
        () => queryClient.invalidateQueries({ queryKey: IMPORTANT_KEY }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
