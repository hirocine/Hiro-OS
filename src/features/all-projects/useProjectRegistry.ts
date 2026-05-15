/**
 * ════════════════════════════════════════════════════════════════
 * useProjectRegistry
 * ════════════════════════════════════════════════════════════════
 *
 * Fonte de dados pra página "Todos os projetos". Lê / escreve em
 * `public.project_registry` — uma tabela órfã (sem FK pra
 * orcamentos / audiovisual_projects) que o time popula
 * manualmente como um registro histórico.
 *
 * Campos:
 *   - project_number → "Número controlador" (string única, 3-4
 *     dígitos por convenção)
 *   - project_name   → nome do projeto
 *   - client_name    → empresa
 *   - project_date   → data do projeto (nullable)
 *   - value_brl      → valor em BRL (nullable)
 *   - notes          → notas livres
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectRegistryRow {
  id: string;
  project_number: string;
  project_name: string;
  client_name: string;
  project_date: string | null;
  value_brl: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProjectRegistryInput {
  project_number: string;
  project_name: string;
  client_name: string;
  project_date: string | null;
  value_brl: number | null;
  notes: string | null;
}

export const PROJECT_REGISTRY_QUERY_KEY = ['project-registry'] as const;

// `project_registry` is a recent table; the auto-generated supabase types
// haven't been refreshed yet. Cast the client locally to keep type-safety
// at the call site without polluting the global supabase typing.
type AnyTableClient = {
  from(table: string): {
    select(cols: string): {
      order(col: string, opts?: { ascending: boolean }): { limit(n: number): Promise<{ data: unknown; error: Error | null }> };
    };
    insert(row: Record<string, unknown>): { select(): { single(): Promise<{ data: unknown; error: Error | null }> } };
    update(patch: Record<string, unknown>): { eq(col: string, val: string): { select(): { single(): Promise<{ data: unknown; error: Error | null }> } } };
    delete(): { eq(col: string, val: string): Promise<{ data: unknown; error: Error | null }> };
  };
};
const sb = supabase as unknown as AnyTableClient;

export function useProjectRegistry() {
  return useQuery({
    queryKey: PROJECT_REGISTRY_QUERY_KEY,
    queryFn: async (): Promise<ProjectRegistryRow[]> => {
      const { data, error } = await sb
        .from('project_registry')
        .select(
          'id, project_number, project_name, client_name, project_date, value_brl, notes, created_at, updated_at, created_by',
        )
        .order('project_number', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data as ProjectRegistryRow[] | null) ?? [];
    },
    staleTime: 60_000,
  });
}

export function useProjectRegistryMutations() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: PROJECT_REGISTRY_QUERY_KEY });

  const create = useMutation({
    mutationFn: async (input: ProjectRegistryInput): Promise<ProjectRegistryRow> => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await sb
        .from('project_registry')
        .insert({
          ...input,
          created_by: userData.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ProjectRegistryRow;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Projeto adicionado');
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'erro desconhecido';
      toast.error(`Erro ao adicionar projeto: ${msg}`);
    },
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: ProjectRegistryInput & { id: string }): Promise<ProjectRegistryRow> => {
      const { data, error } = await sb
        .from('project_registry')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectRegistryRow;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Projeto atualizado');
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'erro desconhecido';
      toast.error(`Erro ao atualizar projeto: ${msg}`);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await sb.from('project_registry').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Projeto removido');
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'erro desconhecido';
      toast.error(`Erro ao remover projeto: ${msg}`);
    },
  });

  return { create, update, remove };
}
