/**
 * ════════════════════════════════════════════════════════════════
 * /rh/datas — Aniversários do time + datas importantes
 * ════════════════════════════════════════════════════════════════
 *
 * Lista única, ordenada pela próxima ocorrência. 3 tabs filtram a
 * janela temporal: 30 dias, mês atual, todos.
 *
 * Admin pode adicionar/editar/deletar datas livres (important_dates).
 * Aniversários do time (birth_date / hired_at) são gerenciados via
 * EditUserDialog em /administracao/usuarios.
 */

import { useMemo, useState } from 'react';
import { Plus, Gift, Calendar, Cake, Star, Pencil, Trash2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTeamDates, IMPORTANT_DATE_TYPE_LABEL } from '@/features/rh';
import type { TeamDate } from '@/features/rh';
import { LoadingScreen } from '@/components/ui/loading-screen';
import {
  PageHeader,
  PageToolbar,
  FilterChip,
  FilterChipRow,
} from '@/ds/components/toolbar';
import { EmptyState } from '@/ds/components/EmptyState';
import { ImportantDateDialog } from '@/features/rh/components/ImportantDateDialog';
import { enhancedToast } from '@/components/ui/enhanced-toast';

type Tab = 'next30' | 'thisMonth' | 'all';

const TAB_LABEL: Record<Tab, string> = {
  next30:    'Próximos 30 dias',
  thisMonth: 'Mês atual',
  all:       'Todos',
};

function filterByTab(items: TeamDate[], tab: Tab): TeamDate[] {
  if (tab === 'all') return items;
  if (tab === 'next30') return items.filter((it) => it.days_until >= 0 && it.days_until <= 30);
  // thisMonth — mês corrente
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  return items.filter((it) => {
    const d = new Date(it.next_occurrence);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

function formatDateBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

function relativeLabel(daysUntil: number): string {
  if (daysUntil === 0) return 'Hoje';
  if (daysUntil === 1) return 'Amanhã';
  if (daysUntil < 0) return `${Math.abs(daysUntil)}d atrás`;
  return `Em ${daysUntil}d`;
}

function iconForKind(kind: TeamDate['kind']) {
  switch (kind) {
    case 'birthday':         return <Cake size={16} strokeWidth={1.5} />;
    case 'work_anniversary': return <Star size={16} strokeWidth={1.5} />;
    case 'important':        return <Calendar size={16} strokeWidth={1.5} />;
  }
}

function kindLabel(item: TeamDate): string {
  switch (item.kind) {
    case 'birthday':         return 'Aniversário';
    case 'work_anniversary': return `${item.years} ano${(item.years ?? 0) > 1 ? 's' : ''} de Hiro`;
    case 'important':        return IMPORTANT_DATE_TYPE_LABEL[item.important_type ?? 'custom'];
  }
}

export default function RHDates() {
  const { isAdmin } = useAuthContext();
  const { items, loading, deleteImportantDate } = useTeamDates();
  const [tab, setTab] = useState<Tab>('next30');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = useMemo(() => filterByTab(items, tab), [items, tab]);

  const counts = useMemo(() => ({
    next30:    filterByTab(items, 'next30').length,
    thisMonth: filterByTab(items, 'thisMonth').length,
    all:       items.length,
  }), [items]);

  const editingItem = editingId
    ? items.find((it) => it.id === editingId && it.kind === 'important')
    : null;

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que quer apagar essa data?')) return;
    try {
      await deleteImportantDate(id);
      enhancedToast.success({ title: 'Data removida' });
    } catch (err) {
      enhancedToast.error({
        title: 'Erro ao remover',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <PageHeader
          title="Datas do time."
          subtitle="Aniversários, marcos da Hiro e datas que merecem lembrança."
          action={
            isAdmin ? (
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDialogOpen(true);
                }}
              >
                <Plus size={14} strokeWidth={1.5} />
                <span>Nova data</span>
              </button>
            ) : undefined
          }
        />

        <PageToolbar>
          <FilterChipRow>
            {(['next30', 'thisMonth', 'all'] as Tab[]).map((t) => (
              <FilterChip
                key={t}
                label={TAB_LABEL[t]}
                count={counts[t]}
                active={tab === t}
                onClick={() => setTab(t)}
              />
            ))}
          </FilterChipRow>
        </PageToolbar>

        {filtered.length === 0 ? (
          <div style={{ marginTop: 16 }}>
            <EmptyState
              icon={Gift}
              title="Nada por aqui"
              description={
                tab === 'next30'
                  ? 'Nenhum aniversário ou data importante nos próximos 30 dias. Confira a aba "Todos" pra ver o ano inteiro.'
                  : 'Nenhuma data registrada nessa janela.'
              }
            />
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: '16px 0 0',
              display: 'grid',
              gap: 8,
            }}
          >
            {filtered.map((it) => (
              <li
                key={it.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  border: '1px solid var(--ds-border)',
                  background: 'var(--ds-surface)',
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: '1px solid var(--ds-border)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--ds-text-muted)',
                  }}
                >
                  {it.user_avatar_url ? (
                    <img
                      src={it.user_avatar_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    iconForKind(it.kind)
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: 'var(--ds-text)' }}>{it.title}</div>
                  <div
                    style={{
                      color: 'var(--ds-text-muted)',
                      fontSize: 12,
                      marginTop: 2,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <span>{kindLabel(it)}</span>
                    <span>·</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatDateBR(it.next_occurrence)}
                    </span>
                    <span>·</span>
                    <span
                      style={{
                        fontVariantNumeric: 'tabular-nums',
                        color:
                          it.days_until === 0
                            ? 'var(--ds-accent, var(--ds-text))'
                            : 'var(--ds-text-muted)',
                        fontWeight: it.days_until === 0 ? 600 : 400,
                      }}
                    >
                      {relativeLabel(it.days_until)}
                    </span>
                  </div>
                  {it.notes ? (
                    <div
                      style={{
                        color: 'var(--ds-text-muted)',
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {it.notes}
                    </div>
                  ) : null}
                </div>

                {isAdmin && it.kind === 'important' ? (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setEditingId(it.id);
                        setDialogOpen(true);
                      }}
                      title="Editar"
                      style={{ padding: '4px 8px' }}
                    >
                      <Pencil size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={() => handleDelete(it.id)}
                      title="Apagar"
                      style={{ padding: '4px 8px' }}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {isAdmin ? (
          <ImportantDateDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editing={editingItem ?? null}
          />
        ) : null}
      </div>
    </div>
  );
}
