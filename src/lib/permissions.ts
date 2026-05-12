/**
 * ════════════════════════════════════════════════════════════════
 * PERMISSIONS — single source of truth
 * ════════════════════════════════════════════════════════════════
 *
 * Each `PermissionKey` corresponds to one navigable area in the app.
 * Roles get a mapping of `key → boolean`. Admin always has everything.
 *
 * Today this data is hardcoded here (Etapa 1 — static defaults).
 * Etapa 2 will move it to a Supabase `role_permissions` table, but
 * everything that reads from `useCanAccess()` keeps working.
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
  },
  user: {
    home: true,
    inbox: true,
    tarefas: true,
    politicas: true,
  },
  convidado: {
    home: true,
    inbox: true,
  },
};

/**
 * Stateless permission check — given a role and a key, returns whether
 * the role is allowed. Admin always passes. Null/unknown role denies.
 *
 * In Etapa 2, swap this to read from a Supabase-cached map instead of
 * DEFAULT_PERMISSIONS, keeping the same signature so call sites don't
 * need to change.
 */
export function canAccess(role: UserRole | null | undefined, key: PermissionKey): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  return DEFAULT_PERMISSIONS[role]?.[key] === true;
}
