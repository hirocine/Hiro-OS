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
  project_number: string | null;
  project_name: string | null;
  client_name: string | null;
  project_date: string | null;
  value_brl: number | null;
  notes: string | null;
}

/** A single field update — used by inline cell edits. */
export type ProjectRegistryPatch = Partial<ProjectRegistryInput>;

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
    mutationFn: async (
      input: ProjectRegistryPatch = {},
    ): Promise<ProjectRegistryRow> => {
      const { data: userData } = await supabase.auth.getUser();
      // Insert a fully-nullable row so the user can start filling cells
      // inline. Defaults below match the column nullability after the
      // `project_registry_allow_partial_rows` migration.
      const { data, error } = await sb
        .from('project_registry')
        .insert({
          project_number: input.project_number ?? null,
          project_name: input.project_name ?? null,
          client_name: input.client_name ?? null,
          project_date: input.project_date ?? null,
          value_brl: input.value_brl ?? null,
          notes: input.notes ?? null,
          created_by: userData.user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ProjectRegistryRow;
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'erro desconhecido';
      toast.error(`Erro ao adicionar projeto: ${msg}`);
    },
    // Optimistic-ish: invalidate only after success. Toast is omitted on
    // success because inline-add creates a blank row visibly already.
    onSuccess: () => {
      invalidate();
    },
  });

  /**
   * Update a single field (or several) — used by inline cell edits.
   * Silent on success: no toast, just an invalidation, so editing feels
   * spreadsheet-quiet. Errors still surface a toast.
   */
  const update = useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: ProjectRegistryPatch & { id: string }): Promise<ProjectRegistryRow> => {
      const { data, error } = await sb
        .from('project_registry')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectRegistryRow;
    },
    onSuccess: () => invalidate(),
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
