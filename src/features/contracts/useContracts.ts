import { useCallback, useMemo, useState } from 'react';
import type {
  Contract,
  ContractStatus,
  ContractTab,
  ProjectTab,
  RecurringTab,
  RecurringVigencia,
} from './types';
import { MOCK_CONTRACTS } from './mock-data';

/**
 * Mock-backed state hook. Public surface matches what the real
 * Supabase-backed version will expose, so swapping later doesn't
 * touch the page.
 */
export function useContracts() {
  const [items, setItems] = useState<Contract[]>(MOCK_CONTRACTS);

  const update = useCallback((id: string, patch: Partial<Contract>) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  /**
   * Manually attach a contract to a project / client / supplier.
   * Sets `linked_at` so the row leaves the "Aguardando vinculação"
   * bucket.
   */
  const linkContract = useCallback(
    (
      id: string,
      links: {
        project_id?: string | null;
        project_name?: string | null;
        client_id?: string | null;
        client_name?: string | null;
        supplier_id?: string | null;
        supplier_name?: string | null;
      },
    ) => {
      update(id, {
        linked_project_id: links.project_id ?? null,
        linked_project_name: links.project_name ?? null,
        linked_client_id: links.client_id ?? null,
        linked_client_name: links.client_name ?? null,
        linked_supplier_id: links.supplier_id ?? null,
        linked_supplier_name: links.supplier_name ?? null,
        linked_at: new Date().toISOString(),
      });
    },
    [update],
  );

  /** Update the free-form notes. */
  const setNotes = useCallback(
    (id: string, notes: string) => update(id, { notes: notes.trim() || null }),
    [update],
  );

  return { items, linkContract, setNotes };
}

/** Sidebar-level count of contracts that need attention. */
export function useContractsNeedingAttention(): number {
  return useMemo(() => {
    return MOCK_CONTRACTS.filter((c) => {
      // Needs linking (just landed via webhook)
      if (!c.linked_at) return true;
      // Stuck — internal hasn't signed for a while
      if (c.status === 'awaiting_internal') return true;
      // Recorrente vencendo em ≤ 30 dias OU já vencido sem renovação
      if (c.contract_class === 'recurring') {
        const v = recurringVigencia(c);
        if (v === 'expiring_critical' || v === 'expired') return true;
      }
      return false;
    }).length;
  }, []);
}

// ─────────────────────────────────────────────────────────────────
// Selectors + tab filtering — kept here so the page stays simple.
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

/** ms / day, for date math throughout. */
const MS_DAY = 24 * 60 * 60 * 1000;

/** Whole number of days from now until `iso`. Negative means in the past. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((new Date(iso).getTime() - Date.now()) / MS_DAY);
}

/**
 * Compute the juridical lifecycle bucket for a recurring contract.
 * Returns `null` for project-class contracts (callers should ignore).
 *
 *   pending             — recurring contract not yet fully signed
 *   active              — signed and dentro da vigência (mais de 90 dias até o fim)
 *   expiring_soon       — vence em 31..90 dias
 *   expiring_critical   — vence em ≤ 30 dias (atenção, aviso prévio pode ter passado)
 *   expired             — passou da end_date e não renovou
 *   terminated          — cancelled / refused / expired (status terminal)
 */
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

/**
 * Computes when the latest moment to send a rescision notice is —
 * i.e. `end_date - notice_period_days`. Used by the detail UI to show
 * "última chance de rescindir sem ônus" type messaging.
 */
export function noticeDeadline(c: Contract): { date: string; days_left: number } | null {
  if (c.contract_class !== 'recurring' || !c.recurrence) return null;
  const end = new Date(c.recurrence.end_date).getTime();
  const deadline = end - c.recurrence.notice_period_days * MS_DAY;
  return {
    date: new Date(deadline).toISOString(),
    days_left: Math.floor((deadline - Date.now()) / MS_DAY),
  };
}

/** Lookup for the label of a recurrence frequency. */
export const FREQUENCY_LABEL: Record<NonNullable<Contract['recurrence']>['frequency'], string> = {
  monthly:   'Mensal',
  quarterly: 'Trimestral',
  semestral: 'Semestral',
  annual:    'Anual',
};
