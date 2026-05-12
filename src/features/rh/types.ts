/**
 * ════════════════════════════════════════════════════════════════
 * RH — types
 * ════════════════════════════════════════════════════════════════
 *
 * Duas features pequenas convivem aqui:
 *
 *  1. Datas (`/rh/datas`) — aniversários de nascimento e aniversários
 *     de Hiro (tempo de casa) derivados de `profiles`, mais entries
 *     livres administradas via tabela `important_dates`.
 *
 *  2. Wiki (`/rh/wiki`) — artigos com markdown/HTML, categorizados.
 *     Substitui a ideia separada de "FAQ" — FAQ é só uma categoria
 *     dentro da Wiki.
 */

// ─── Datas ────────────────────────────────────────────────────────

export type TeamDateKind =
  | 'birthday'          // aniversário de nascimento
  | 'work_anniversary'  // aniversário de casa (X anos de Hiro)
  | 'important';        // entry livre da tabela important_dates

export interface TeamDate {
  /** ID único: profile user_id pra birthday/work_anniversary, ou important_dates.id */
  id: string;
  kind: TeamDateKind;
  title: string;
  /** Próxima ocorrência calculada (ISO date). */
  next_occurrence: string;
  /** Quantos dias faltam (negativo = passou esse ano). */
  days_until: number;
  /** Para birthdays / work anniversaries do time. */
  user_id?: string;
  user_avatar_url?: string | null;
  /** Para work_anniversary: anos completados na próxima ocorrência. */
  years?: number;
  /** Para important: o tipo do enum important_date_type. */
  important_type?: 'company_milestone' | 'commemorative' | 'client_anniversary' | 'custom';
  /** Para important: data base (não a próxima). */
  base_date?: string;
  notes?: string | null;
  recurring?: boolean;
}

export const IMPORTANT_DATE_TYPE_LABEL: Record<NonNullable<TeamDate['important_type']>, string> = {
  company_milestone: 'Marco da empresa',
  commemorative:     'Comemorativa',
  client_anniversary: 'Cliente',
  custom:            'Outros',
};

// ─── Wiki ─────────────────────────────────────────────────────────

export type WikiCategory =
  | 'faq'
  | 'onboarding'
  | 'processos'
  | 'ferramentas'
  | 'beneficios'
  | 'cultura'
  | 'outros';

export interface WikiArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;              // HTML do TipTap
  category: WikiCategory;
  tags: string[];
  published: boolean;
  author_id: string | null;
  author_name?: string | null;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export const WIKI_CATEGORY_LABEL: Record<WikiCategory, string> = {
  faq:          'FAQ',
  onboarding:   'Onboarding',
  processos:    'Processos',
  ferramentas:  'Ferramentas',
  beneficios:   'Benefícios',
  cultura:      'Cultura',
  outros:       'Outros',
};

export const WIKI_CATEGORIES: WikiCategory[] = [
  'faq',
  'onboarding',
  'processos',
  'ferramentas',
  'beneficios',
  'cultura',
  'outros',
];
