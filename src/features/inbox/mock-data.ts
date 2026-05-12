import type { InboxItem } from './types';

/**
 * Mock items used to design the inbox UI before the real Supabase
 * table exists. Once the schema is finalised, this file goes away
 * and the page reads from `useInbox()`.
 *
 * Times are computed at module-load so the relative-time copy in
 * the UI stays plausible regardless of when you open it.
 */

const now = Date.now();
const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
const future = (msAhead: number) => new Date(now + msAhead).toISOString();

export const MOCK_INBOX: InboxItem[] = [
  // ─── Today ─────────────────────────────────────────────────────
  {
    id: 'i-001',
    type: 'task',
    reason: 'assigned',
    title: 'Gabriel atribuiu uma tarefa pra você',
    preview: 'Editar vídeo institucional — Banco XYZ',
    deep_link: '/tarefas/abc-123',
    actor: { name: 'Gabriel Soares' },
    metadata: { priority: 'high', due_date: future(4 * hour) },
    created_at: iso(45 * minute),
    read_at: null,
    done_at: null,
    snooze_until: null,
  },
  {
    id: 'i-002',
    type: 'pp',
    reason: 'new_version',
    title: 'Nova versão de "Vídeo Banco XYZ"',
    preview: 'v3 — Color grading aplicado',
    deep_link: '/esteira-de-pos/pp-456',
    actor: { name: 'Marina Costa' },
    created_at: iso(2 * hour),
    read_at: null,
    done_at: null,
    snooze_until: null,
  },
  {
    id: 'i-003',
    type: 'loan',
    reason: 'overdue',
    title: 'Câmera Sony A7S III está atrasada',
    preview: 'Retirada por Lucas Mendes · prazo era ontem',
    deep_link: '/retiradas/loan-789',
    metadata: { overdue_days: 1 },
    created_at: iso(3 * hour),
    read_at: null,
    done_at: null,
    snooze_until: null,
  },
  {
    id: 'i-004',
    type: 'proposal',
    reason: 'viewed',
    title: 'Cliente abriu sua proposta',
    preview: 'Cliente ABC — proposta v2 · primeiro acesso',
    deep_link: '/orcamentos/cliente-abc-v2',
    actor: { name: 'Cliente ABC' },
    created_at: iso(5 * hour),
    read_at: null,
    done_at: null,
    snooze_until: null,
  },
  {
    id: 'i-005',
    type: 'project',
    reason: 'status_change',
    title: 'Etapa "Color Grading" foi concluída',
    preview: 'Projeto: Vídeo Banco XYZ · avançou pra "Entrega"',
    deep_link: '/projetos-av/proj-xyz',
    actor: { name: 'Marina Costa' },
    created_at: iso(6 * hour),
    read_at: null,
    done_at: null,
    snooze_until: null,
  },
  {
    id: 'i-006',
    type: 'task',
    reason: 'mentioned',
    title: 'Pedro Lima mencionou você num comentário',
    preview: 'Tarefa: Roteiro Comercial NPS — "@gabriel confere?"',
    deep_link: '/tarefas/task-nps#comment-12',
    actor: { name: 'Pedro Lima' },
    created_at: iso(8 * hour),
    read_at: iso(7 * hour),
    done_at: null,
    snooze_until: null,
  },

  // ─── Yesterday ─────────────────────────────────────────────────
  {
    id: 'i-007',
    type: 'deal',
    reason: 'status_change',
    title: 'Deal "Cliente ABC — Renovação" foi pra Ganho',
    preview: 'R$ 48.500 · você é responsável',
    deep_link: '/crm/deals/deal-abc',
    actor: { name: 'Gabriel Soares' },
    created_at: iso(1 * day + 2 * hour),
    read_at: null,
    done_at: null,
    snooze_until: null,
  },
  {
    id: 'i-008',
    type: 'task',
    reason: 'due_soon',
    title: 'Tarefa vence amanhã',
    preview: 'Revisar roteiro — Documentário Natureza',
    deep_link: '/tarefas/task-doc-nat',
    metadata: { priority: 'medium', due_date: future(20 * hour) },
    created_at: iso(1 * day + 4 * hour),
    read_at: iso(1 * day + 3 * hour),
    done_at: null,
    snooze_until: null,
  },
  {
    id: 'i-009',
    type: 'proposal',
    reason: 'approved',
    title: 'Proposta "Cliente DEF" foi aprovada',
    preview: 'R$ 32.000 · cliente assinou às 16:42',
    deep_link: '/orcamentos/cliente-def',
    actor: { name: 'Cliente DEF' },
    created_at: iso(1 * day + 6 * hour),
    read_at: null,
    done_at: null,
    snooze_until: null,
  },
  {
    id: 'i-010',
    type: 'access',
    reason: 'due_soon',
    title: 'Senha do GitHub vai rotacionar em 3 dias',
    preview: 'Plataforma: GitHub · rotação trimestral',
    deep_link: '/plataformas',
    created_at: iso(1 * day + 8 * hour),
    read_at: null,
    done_at: null,
    snooze_until: null,
  },

  // ─── This week ─────────────────────────────────────────────────
  {
    id: 'i-011',
    type: 'marketing',
    reason: 'completed',
    title: 'Post agendado foi publicado no Instagram',
    preview: 'Reels: "Bastidores Vídeo Banco XYZ"',
    deep_link: '/marketing/social-media/instagram',
    created_at: iso(2 * day + 5 * hour),
    read_at: iso(2 * day + 4 * hour),
    done_at: iso(2 * day + 4 * hour),
    snooze_until: null,
  },
  {
    id: 'i-012',
    type: 'pp',
    reason: 'commented',
    title: 'Cliente comentou no vídeo de aprovação',
    preview: '"Adorei o ritmo, só ajusta a thumb final"',
    deep_link: '/esteira-de-pos/pp-456#comment-3',
    actor: { name: 'Cliente XYZ' },
    created_at: iso(3 * day),
    read_at: iso(2 * day + 22 * hour),
    done_at: null,
    snooze_until: null,
  },
  {
    id: 'i-013',
    type: 'system',
    reason: 'completed',
    title: 'Verificação de segurança mensal concluída',
    preview: 'Sem alertas · próxima em 30 dias',
    deep_link: '/administracao/logs',
    created_at: iso(4 * day),
    read_at: iso(4 * day),
    done_at: iso(4 * day),
    snooze_until: null,
  },

  // ─── Snoozed ───────────────────────────────────────────────────
  {
    id: 'i-014',
    type: 'task',
    reason: 'assigned',
    title: 'Revisar orçamento Q3',
    preview: 'Tarefa que você snoozou até segunda',
    deep_link: '/tarefas/task-orc-q3',
    actor: { name: 'Mariana Reis' },
    created_at: iso(2 * day),
    read_at: iso(2 * day),
    done_at: null,
    snooze_until: future(2 * day),
  },
];
