/**
 * ════════════════════════════════════════════════════════════════
 * PERMISSIONS — single source of truth
 * ════════════════════════════════════════════════════════════════
 *
 * Each `PermissionKey` corresponds to one navigable area in the app.
 * Roles get a mapping of `key → boolean`. Admin always has everything.
 *
 * Runtime model:
 *   - Backend: Supabase `public.role_permissions` table (one row per
 *     role × key with `granted boolean`).
 *   - Frontend: `useRolePermissions()` (in src/hooks) fetches the
 *     whole table once and calls `setRuntimePermissions()` below,
 *     populating an in-memory map. `canAccess()` reads from that map.
 *   - Fallback: if the cache hasn't loaded yet (or fails), we fall
 *     back to `DEFAULT_PERMISSIONS` so the app keeps rendering
 *     sensibly. Keep that map in sync with the seed in the
 *     `create_role_permissions` migration.
 */

import type { UserRole } from '@/hooks/useUserRole';

export type PermissionKey =
  | 'home'
  | 'inbox'
  | 'tarefas'
  | 'esteira_de_pos'
  | 'projetos'
  | 'equipamentos.retiradas'
  | 'equipamentos.inventario'
  | 'fornecedores.freelancers'
  | 'fornecedores.empresas'
  | 'marketing.dashboard'
  | 'marketing.calendario'
  | 'marketing.instagram'
  | 'marketing.ideias'
  | 'marketing.referencias'
  | 'marketing.site'
  | 'crm.pipeline'
  | 'crm.contatos'
  | 'crm.atividades'
  | 'crm.dashboard'
  | 'orcamentos'
  | 'financeiro.dashboard'
  | 'financeiro.capex'
  | 'plataformas'
  | 'armazenamento'
  | 'politicas'
  | 'juridico.contratos'
  | 'rh.datas'
  | 'rh.wiki'
  | 'admin';

/** All known permission keys (handy for iteration / seed). */
export const ALL_PERMISSION_KEYS: PermissionKey[] = [
  'home',
  'inbox',
  'tarefas',
  'esteira_de_pos',
  'projetos',
  'equipamentos.retiradas',
  'equipamentos.inventario',
  'fornecedores.freelancers',
  'fornecedores.empresas',
  'marketing.dashboard',
  'marketing.calendario',
  'marketing.instagram',
  'marketing.ideias',
  'marketing.referencias',
  'marketing.site',
  'crm.pipeline',
  'crm.contatos',
  'crm.atividades',
  'crm.dashboard',
  'orcamentos',
  'financeiro.dashboard',
  'financeiro.capex',
  'plataformas',
  'armazenamento',
  'politicas',
  'juridico.contratos',
  'rh.datas',
  'rh.wiki',
  'admin',
];

type RoleMap = Partial<Record<PermissionKey, boolean>>;

const ALL_TRUE: RoleMap = Object.fromEntries(
  ALL_PERMISSION_KEYS.map((k) => [k, true]),
) as RoleMap;

/**
 * Default permission grants per role. Admin is always granted everything
 * via short-circuit in `canAccess()` — but we keep it in the map for the
 * Permissões UI to read against the same source of truth.
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, RoleMap> = {
  admin: ALL_TRUE,
  producao: {
    home: true,
    inbox: true,
    tarefas: true,
    esteira_de_pos: true,
    projetos: true,
    'equipamentos.retiradas': true,
    'equipamentos.inventario': true,
    'fornecedores.freelancers': true,
    'fornecedores.empresas': true,
    'marketing.dashboard': true,
    'marketing.calendario': true,
    'marketing.instagram': true,
    'marketing.ideias': true,
    'marketing.referencias': true,
    'marketing.site': true,
    'crm.pipeline': true,
    'crm.contatos': true,
    'crm.atividades': true,
    'crm.dashboard': true,
    orcamentos: true,
    'juridico.contratos': true,
    plataformas: true,
    armazenamento: true,
    politicas: true,
    'rh.datas': true,
    'rh.wiki': true,
  },
  marketing: {
    home: true,
    inbox: true,
    'marketing.dashboard': true,
    'marketing.calendario': true,
    'marketing.instagram': true,
    'marketing.ideias': true,
    'marketing.referencias': true,
    'marketing.site': true,
    politicas: true,
    'rh.datas': true,
    'rh.wiki': true,
  },
  comercial: {
    home: true,
    inbox: true,
    tarefas: true,
    'crm.pipeline': true,
    'crm.contatos': true,
    'crm.atividades': true,
    'crm.dashboard': true,
    orcamentos: true,
    'juridico.contratos': true,
    politicas: true,
    'rh.datas': true,
    'rh.wiki': true,
  },
  edicao: {
    home: true,
    inbox: true,
    tarefas: true,
    esteira_de_pos: true,
    projetos: true,
    'equipamentos.retiradas': true,
    'equipamentos.inventario': true,
    armazenamento: true,
    politicas: true,
    'rh.datas': true,
    'rh.wiki': true,
  },
  financeiro: {
    home: true,
    inbox: true,
    tarefas: true,
    'financeiro.dashboard': true,
    'financeiro.capex': true,
    orcamentos: true,
    'equipamentos.inventario': true,
    'juridico.contratos': true,
    politicas: true,
    'rh.datas': true,
    'rh.wiki': true,
  },
  user: {
    home: true,
    inbox: true,
    tarefas: true,
    politicas: true,
    'rh.datas': true,
    'rh.wiki': true,
  },
  convidado: {
    home: true,
    inbox: true,
    'rh.datas': true,
    'rh.wiki': true,
  },
};

/**
 * Module-level runtime cache populated by `useRolePermissions()` when
 * the Supabase query lands. `canAccess()` reads from this when set,
 * else falls back to `DEFAULT_PERMISSIONS`.
 *
 * Module-level (instead of React context) so `canAccess()` stays a
 * stateless function callable from anywhere — utilities, route
 * guards, even outside React.
 */
let RUNTIME_PERMISSIONS: Record<UserRole, RoleMap> | null = null;

/** Called by `useRolePermissions()` after fetching the Supabase table. */
export function setRuntimePermissions(map: Record<UserRole, RoleMap>): void {
  RUNTIME_PERMISSIONS = map;
}

/** Test/escape hatch: reset the runtime cache back to defaults. */
export function resetRuntimePermissions(): void {
  RUNTIME_PERMISSIONS = null;
}

/**
 * Stateless permission check — given a role and a key, returns whether
 * the role is allowed. Admin always passes. Null/unknown role denies.
 *
 * Source order:
 *   1. Runtime cache from Supabase (populated by `useRolePermissions`)
 *   2. Hardcoded `DEFAULT_PERMISSIONS` fallback (first paint, query
 *      not landed yet, or fetch failed)
 */
export function canAccess(role: UserRole | null | undefined, key: PermissionKey): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  const map = RUNTIME_PERMISSIONS ?? DEFAULT_PERMISSIONS;
  return map[role]?.[key] === true;
}
