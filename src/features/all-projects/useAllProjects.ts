/**
 * ════════════════════════════════════════════════════════════════
 * useAllProjects
 * ════════════════════════════════════════════════════════════════
 *
 * Fonte de dados pra página "Todos os projetos". Pulamos a tabela
 * `audiovisual_projects` (Esteira) e lemos direto de `orcamentos`,
 * onde mora a história completa:
 *
 *   - project_number → "Número controlador" (CPF do projeto)
 *   - project_name   → nome do projeto
 *   - client_name    → empresa
 *   - sent_date / created_at → data do projeto
 *   - final_value    → valor
 *   - status         → draft | opened | sent | approved | expired | new_version
 *
 * Filtramos por `is_latest_version` pra mostrar uma linha por
 * projeto, e não cada versão do orçamento.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AllProjectStatus =
  | 'draft'
  | 'sent'
  | 'opened'
  | 'new_version'
  | 'approved'
  | 'expired';

export interface AllProjectRow {
  id: string;
  slug: string;
  project_number: string | null;
  project_name: string;
  client_name: string;
  final_value: number | null;
  sent_date: string | null;
  created_at: string;
  status: AllProjectStatus;
}

export const ALL_PROJECTS_QUERY_KEY = ['all-projects'] as const;

export function useAllProjects() {
  return useQuery({
    queryKey: ALL_PROJECTS_QUERY_KEY,
    queryFn: async (): Promise<AllProjectRow[]> => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(
          'id, slug, project_number, project_name, client_name, final_value, sent_date, created_at, status',
        )
        .eq('is_latest_version', true)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as AllProjectRow[];
    },
    staleTime: 60_000,
  });
}

/** "best date" for ordering / filtering — sent_date when set, falls back to created_at. */
export function projectEffectiveDate(p: AllProjectRow): string {
  return p.sent_date ?? p.created_at.slice(0, 10);
}
