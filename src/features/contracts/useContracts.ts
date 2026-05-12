import { useCallback, useMemo, useState } from 'react';
import type { Contract, ContractStatus, ContractTab } from './types';
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
