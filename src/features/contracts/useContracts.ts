/**
 * ════════════════════════════════════════════════════════════════
 * useContracts — Supabase-backed (substitui o mock)
 * ════════════════════════════════════════════════════════════════
 *
 * Lê de `public.contracts` (toda a tabela — RLS filtra por
 * `juridico.contratos` permission no banco). Mutations cobrem
 * apenas os campos de enriquecimento (linkagem, notas, classe,
 * recurrence) — o mirror do ZapSign vem só via webhook na Edge
 * Function.
 *
 * A página continua igual: a API pública (items + linkContract +
 * setNotes + selectors STATUS_LABEL/STATUS_TONE/etc) é a mesma.
 */

import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  Contract,
  ContractStatus,
  ContractTab,
  ProjectTab,
  RecurringTab,
  RecurringVigencia,
} from './types';
import { MOCK_CONTRACTS } from './mockData';

const QUERY_KEY = ['contracts', 'list'] as const;

interface DbContractRow {
  id: string;
  zapsign_doc_token: string;
  title: string;
  status: string;
  party_type: string;
  zapsign_description: string | null;
  zapsign_doc_url: string;
  signed_pdf_url: string | null;
  zapsign_created_at: string;
  sent_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  signers: unknown;
  contract_class: string;
  recurrence: unknown;
  linked_client_id: string | null;
  linked_client_name: string | null;
  linked_project_id: string | null;
  linked_project_name: string | null;
  linked_supplier_id: string | null;
  linked_supplier_name: string | null;
  value_brl: number | null;
  linked_at: string | null;
  linked_by: string | null;
  notes: string | null;
  imported_at: string;
  updated_at: string;
}

function rowToContract(row: DbContractRow): Contract {
  return {
    id: row.id,
    zapsign_doc_token: row.zapsign_doc_token,
    title: row.title,
    status: row.status as Contract['status'],
    party_type: row.party_type as Contract['party_type'],
    signers: (row.signers as Contract['signers']) ?? [],
    zapsign_description: row.zapsign_description,
    zapsign_doc_url: row.zapsign_doc_url,
    signed_pdf_url: row.signed_pdf_url,
    created_at: row.zapsign_created_at,
    sent_at: row.sent_at,
    completed_at: row.completed_at,
    expires_at: row.expires_at,
    contract_class: row.contract_class as Contract['contract_class'],
    recurrence: (row.recurrence as Contract['recurrence']) ?? null,
    linked_client_id: row.linked_client_id,
    linked_client_name: row.linked_client_name,
    linked_project_id: row.linked_project_id,
    linked_project_name: row.linked_project_name,
    linked_supplier_id: row.linked_supplier_id,
    linked_supplier_name: row.linked_supplier_name,
    value_brl: row.value_brl,
    linked_at: row.linked_at,
    notes: row.notes,
    imported_at: row.imported_at,
  };
}

async function fetchContracts(): Promise<Contract[]> {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('zapsign_created_at', { ascending: false })
    .limit(500);

  // Backend ZapSign + tabela `contracts` ainda não estão em prod:
  // se a query falhar (tabela ausente / RLS negando) ou vier vazia,
  // mostramos o mock para a página não ficar inacessível. Some
  // automaticamente quando o webhook do ZapSign começar a popular
  // a tabela.
  if (error) return MOCK_CONTRACTS;
  const rows = (data as DbContractRow[] | null) ?? [];
  if (rows.length === 0) return MOCK_CONTRACTS;
  return rows.map(rowToContract);
}

/**
 * Public hook used by the Contracts pages. API matches the previous
 * mock implementation so the page UI is untouched.
 */
export function useContracts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchContracts,
    staleTime: 30_000,
  });

  const items: Contract[] = query.data ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const linkMut = useMutation({
    mutationFn: async (input: {
      id: string;
      project_id?: string | null;
      project_name?: string | null;
      client_id?: string | null;
      client_name?: string | null;
      supplier_id?: string | null;
      supplier_name?: string | null;
    }) => {
      const { error } = await supabase
        .from('contracts')
        .update({
          linked_project_id: input.project_id ?? null,
          linked_project_name: input.project_name ?? null,
          linked_client_id: input.client_id ?? null,
          linked_client_name: input.client_name ?? null,
          linked_supplier_id: input.supplier_id ?? null,
          linked_supplier_name: input.supplier_name ?? null,
          linked_at: new Date().toISOString(),
        })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const notesMut = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from('contracts')
        .update({ notes: notes.trim() || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const linkContract = (
    id: string,
    links: Parameters<typeof linkMut.mutate>[0] extends infer T
      ? Omit<Extract<T, { id: string }>, 'id'>
      : never,
  ) => linkMut.mutate({ id, ...links });

  const setNotes = (id: string, notes: string) => notesMut.mutate({ id, notes });

  return { items, linkContract, setNotes };
}

/**
 * Realtime subscription pra invalidar o cache quando algo muda
 * (webhook do ZapSign escreve, outra aba edita, etc.). Mount uma
 * vez na raiz da app, próximo ao session bootstrap.
 */
export function useContractsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('contracts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contracts' },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/** Sidebar-level count of contracts that need attention. */
export function useContractsNeedingAttention(): number {
  const { items } = useContracts();
  return useMemo(() => {
    return items.filter((c) => {
      if (!c.linked_at) return true;
      if (c.status === 'awaiting_internal') return true;
      if (c.contract_class === 'recurring') {
        const v = recurringVigencia(c);
        if (v === 'expiring_critical' || v === 'expired') return true;
      }
      return false;
    }).length;
  }, [items]);
}

// ─────────────────────────────────────────────────────────────────
// Selectors + tab filtering — kept here so the page stays simple.
// Idênticos à versão mock anterior.
// ─────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<ContractStatus, string> = {
  draft:              'Rascunho',
  awaiting_internal: 'Aguardando interno',
  awaiting_client:   'Pendente cliente',
  signed:            'Assinado',
  refused:           'Recusado',
  expired:           'Expirado',
  cancelled:         'Cancelado',
};

export const STATUS_TONE: Record<ContractStatus, 'muted' | 'info' | 'warning' | 'success' | 'danger' | 'accent'> = {
  draft:              'muted',
  awaiting_internal: 'warning',
  awaiting_client:   'accent',
  signed:            'success',
  refused:           'danger',
  expired:           'danger',
  cancelled:         'muted',
};

export function isVisibleInTab(c: Contract, tab: ContractTab): boolean {
  switch (tab) {
    case 'unlinked':
      return !c.linked_at;
    case 'in_progress':
      return ['draft', 'awaiting_internal', 'awaiting_client'].includes(c.status);
    case 'signed':
      return c.status === 'signed';
    case 'archived':
      return ['refused', 'expired', 'cancelled'].includes(c.status);
    case 'all':
      return true;
  }
}

export function countSignedSigners(c: Contract): { signed: number; total: number } {
  const total = c.signers.length;
  const signed = c.signers.filter((s) => s.signed_at).length;
  return { signed, total };
}

// ─────────────────────────────────────────────────────────────────
// Recorrentes — derived state focused on vigência (juridical view)
// ─────────────────────────────────────────────────────────────────

const MS_DAY = 24 * 60 * 60 * 1000;

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - Date.now()) / MS_DAY);
}

export function recurringVigencia(c: Contract): RecurringVigencia | null {
  if (c.contract_class !== 'recurring' || !c.recurrence) return null;
  if (['cancelled', 'refused', 'expired'].includes(c.status)) return 'terminated';
  if (c.status !== 'signed') return 'pending';
  const days = daysUntil(c.recurrence.end_date);
  if (days === null) return 'active';
  if (days < 0) {
    return c.recurrence.auto_renew ? 'active' : 'expired';
  }
  if (days <= 30) return 'expiring_critical';
  if (days <= 90) return 'expiring_soon';
  return 'active';
}

export const VIGENCIA_LABEL: Record<RecurringVigencia, string> = {
  pending:           'Em assinatura',
  active:            'Vigente',
  expiring_soon:     'Vence em breve',
  expiring_critical: 'Vence em < 30d',
  expired:           'Vencido',
  terminated:        'Encerrado',
};

export const VIGENCIA_TONE: Record<RecurringVigencia, 'muted' | 'info' | 'success' | 'warning' | 'danger' | 'accent'> = {
  pending:           'info',
  active:            'success',
  expiring_soon:     'warning',
  expiring_critical: 'danger',
  expired:           'danger',
  terminated:        'muted',
};

export function isVisibleInRecurringTab(c: Contract, tab: RecurringTab): boolean {
  if (c.contract_class !== 'recurring') return false;
  const v = recurringVigencia(c);
  switch (tab) {
    case 'active':     return v === 'active';
    case 'expiring':   return v === 'expiring_soon' || v === 'expiring_critical';
    case 'expired':    return v === 'expired';
    case 'terminated': return v === 'terminated';
    case 'pending':    return v === 'pending';
    case 'all':        return true;
  }
}

export function noticeDeadline(c: Contract): { date: string; days_left: number } | null {
  if (c.contract_class !== 'recurring' || !c.recurrence) return null;
  const end = new Date(c.recurrence.end_date).getTime();
  const deadline = end - c.recurrence.notice_period_days * MS_DAY;
  return {
    date: new Date(deadline).toISOString(),
    days_left: Math.floor((deadline - Date.now()) / MS_DAY),
  };
}

export const FREQUENCY_LABEL: Record<NonNullable<Contract['recurrence']>['frequency'], string> = {
  monthly:   'Mensal',
  quarterly: 'Trimestral',
  semestral: 'Semestral',
  annual:    'Anual',
};
