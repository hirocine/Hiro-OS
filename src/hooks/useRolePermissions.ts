/**
 * ════════════════════════════════════════════════════════════════
 * useRolePermissions — Supabase-backed role → permission map
 * ════════════════════════════════════════════════════════════════
 *
 * Lê a tabela `public.role_permissions` uma vez, monta o mapa
 * `role → key → granted` e empurra no cache runtime de
 * `src/lib/permissions.ts` para `canAccess()` ler sem precisar
 * passar dados por context.
 *
 * Também expõe `useUpdateRolePermission()` pra UI de admin atualizar
 * um toggle individual (otimismo opcional via react-query).
 */

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DEFAULT_PERMISSIONS,
  setRuntimePermissions,
  type PermissionKey,
} from '@/lib/permissions';
import type { UserRole } from '@/hooks/useUserRole';

type RoleMap = Partial<Record<PermissionKey, boolean>>;
type PermissionsMap = Record<UserRole, RoleMap>;

const QUERY_KEY = ['role_permissions'] as const;

interface RolePermissionRow {
  role: UserRole;
  permission_key: PermissionKey;
  granted: boolean;
}

async function fetchRolePermissions(): Promise<PermissionsMap> {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('role, permission_key, granted');
  if (error) throw error;

  const map = {} as PermissionsMap;
  for (const row of (data ?? []) as RolePermissionRow[]) {
    if (!map[row.role]) map[row.role] = {};
    map[row.role][row.permission_key] = row.granted;
  }
  return map;
}

/**
 * Loads the whole role_permissions table once and keeps the runtime
 * cache fresh. Mount this somewhere near the root (e.g. inside
 * `AuthProvider`) so `canAccess()` everywhere else just works.
 *
 * Fallback: `placeholderData` returns `DEFAULT_PERMISSIONS` so the
 * runtime cache is *always* populated, even on first render before
 * the query resolves.
 */
export function useRolePermissions() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchRolePermissions,
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_PERMISSIONS,
  });

  // Push into module-level cache whenever data changes
  useEffect(() => {
    if (query.data) setRuntimePermissions(query.data);
  }, [query.data]);

  return query;
}

/**
 * Mutation hook for toggling a single (role, permission_key) cell
 * from the admin permissions page. Optimistic update keeps the UI
 * responsive; on failure it rolls back and surfaces the error.
 */
export function useUpdateRolePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      role: UserRole;
      permission_key: PermissionKey;
      granted: boolean;
    }) => {
      const { error } = await supabase
        .from('role_permissions')
        .update({ granted: input.granted })
        .eq('role', input.role)
        .eq('permission_key', input.permission_key);
      if (error) throw error;
    },

    // Optimistic update: patch the cached map immediately
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<PermissionsMap>(QUERY_KEY);
      if (previous) {
        const next: PermissionsMap = {
          ...previous,
          [input.role]: {
            ...previous[input.role],
            [input.permission_key]: input.granted,
          },
        };
        queryClient.setQueryData(QUERY_KEY, next);
        setRuntimePermissions(next);
      }
      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
        setRuntimePermissions(context.previous);
      }
    },

    // On settle, re-fetch to make sure the cache reflects the truth
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Convenience selector: returns the permissions map for a single role,
 * derived from the cached query. Used by AdminPermissions.
 */
export function useRolePermissionsFor(role: UserRole) {
  const { data } = useRolePermissions();
  return useMemo<RoleMap>(() => data?.[role] ?? {}, [data, role]);
}
