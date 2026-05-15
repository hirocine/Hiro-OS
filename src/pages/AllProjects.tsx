import { useMemo, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import {
  PageHeader,
  PageToolbar,
  SearchField,
  FilterDropdown,
  FilterIndicator,
} from '@/ds/components/toolbar';
import { Money } from '@/ds/components/Money';
import {
  useProjectRegistry,
  type ProjectRegistryRow,
} from '@/features/all-projects/useProjectRegistry';
import { ProjectRegistryDialog } from '@/features/all-projects/ProjectRegistryDialog';

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

// ─────────────────────────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────────────────────────

type DateBucket = 'all' | 'last_30' | 'last_90' | 'this_year' | 'last_year';
type ValueBucket = 'all' | 'lt_10k' | '10k_50k' | '50k_100k' | 'gt_100k';

const DATE_OPTIONS: { value: DateBucket; label: string }[] = [
  { value: 'last_30', label: 'Últimos 30 dias' },
  { value: 'last_90', label: 'Últimos 90 dias' },
  { value: 'this_year', label: 'Este ano' },
  { value: 'last_year', label: 'Ano passado' },
];

const VALUE_OPTIONS: { value: ValueBucket; label: string }[] = [
  { value: 'lt_10k', label: 'Até R$ 10k' },
  { value: '10k_50k', label: 'R$ 10k – 50k' },
  { value: '50k_100k', label: 'R$ 50k – 100k' },
  { value: 'gt_100k', label: 'Acima de R$ 100k' },
];

function bucketDateMatches(dateStr: string | null, bucket: DateBucket): boolean {
  if (bucket === 'all') return true;
  if (!dateStr) return false;
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.valueOf())) return false;
  const now = new Date();
  const days = (now.getTime() - d.getTime()) / 86_400_000;
  if (bucket === 'last_30') return days <= 30 && days >= 0;
  if (bucket === 'last_90') return days <= 90 && days >= 0;
  if (bucket === 'this_year') return d.getFullYear() === now.getFullYear();
  if (bucket === 'last_year') return d.getFullYear() === now.getFullYear() - 1;
  return true;
}

function bucketValueMatches(value: number | null, bucket: ValueBucket): boolean {
  if (bucket === 'all') return true;
  if (value == null) return false;
  if (bucket === 'lt_10k') return value < 10_000;
  if (bucket === '10k_50k') return value >= 10_000 && value < 50_000;
  if (bucket === '50k_100k') return value >= 50_000 && value < 100_000;
  if (bucket === 'gt_100k') return value >= 100_000;
  return true;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.valueOf())) return '—';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

export default function AllProjects() {
  const { data: items = [], isLoading } = useProjectRegistry();

  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateBucket>('all');
  const [valueFilter, setValueFilter] = useState<ValueBucket>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectRegistryRow | null>(null);

  const clientOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((p) => {
      if (p.client_name) set.add(p.client_name);
    });
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((c) => ({ value: c, label: c }));
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (clientFilter !== 'all' && p.client_name !== clientFilter) return false;
      if (!bucketDateMatches(p.project_date, dateFilter)) return false;
      if (!bucketValueMatches(p.value_brl, valueFilter)) return false;
      if (q) {
        const hay = [p.project_name, p.client_name, p.project_number]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, clientFilter, dateFilter, valueFilter]);

  const hasActiveFilter =
    !!search || clientFilter !== 'all' || dateFilter !== 'all' || valueFilter !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setClientFilter('all');
    setDateFilter('all');
    setValueFilter('all');
  };

  const totalValue = useMemo(
    () => filtered.reduce((acc, p) => acc + (p.value_brl ?? 0), 0),
    [filtered],
  );

  const handleAdd = () => {
    setEditingMember(null);
    setDialogOpen(true);
  };

  const handleEdit = (row: ProjectRegistryRow) => {
    setEditingMember(row);
    setDialogOpen(true);
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <PageHeader
          title="Todos os projetos."
          subtitle="Histórico completo da casa — preenchido manualmente."
          action={
            <button type="button" className="btn primary" onClick={handleAdd}>
              <Plus size={14} strokeWidth={1.5} />
              <span>Adicionar projeto</span>
            </button>
          }
        />

        <div style={{ marginTop: 24 }}>
          <PageToolbar
            search={
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Buscar por nome, empresa ou Nº…"
              />
            }
            filters={[
              <FilterDropdown
                key="client"
                label="Empresa"
                value={clientFilter}
                onChange={setClientFilter}
                options={clientOptions}
                width="lg"
              />,
              <FilterDropdown
                key="date"
                label="Data"
                value={dateFilter}
                onChange={(v) => setDateFilter(v as DateBucket)}
                options={DATE_OPTIONS}
                width="md"
              />,
              <FilterDropdown
                key="value"
                label="Valor"
                value={valueFilter}
                onChange={(v) => setValueFilter(v as ValueBucket)}
                options={VALUE_OPTIONS}
                width="md"
              />,
            ]}
          />
        </div>

        <FilterIndicator
          active={hasActiveFilter}
          count={filtered.length}
          total={items.length}
          noun="projetos"
          onClear={clearAllFilters}
        />

        {/* Stats inline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 12,
            fontSize: 12,
            color: 'hsl(var(--ds-fg-3))',
            flexWrap: 'wrap',
          }}
        >
          <span>
            <strong
              style={{
                ...HN_DISPLAY,
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-1))',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {filtered.length}
            </strong>{' '}
            {filtered.length === 1 ? 'projeto' : 'projetos'}
          </span>
          {totalValue > 0 && (
            <>
              <span style={{ color: 'hsl(var(--ds-line-2))' }}>·</span>
              <span>
                soma{' '}
                <Money
                  value={totalValue}
                  style={{ fontSize: 12, color: 'hsl(var(--ds-fg-1))', fontWeight: 500 }}
                />
              </span>
            </>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px 0',
                color: 'hsl(var(--ds-fg-3))',
              }}
            >
              <Loader2 size={20} strokeWidth={1.5} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasActiveFilter={hasActiveFilter} onAdd={handleAdd} />
          ) : (
            <ProjectsTable rows={filtered} onRowClick={handleEdit} />
          )}
        </div>
      </div>

      <ProjectRegistryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        member={editingMember}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────────

const COLS = '80px minmax(220px, 1.6fr) minmax(160px, 1fr) 110px 140px';

function ProjectsTable({
  rows,
  onRowClick,
}: {
  rows: ProjectRegistryRow[];
  onRowClick: (row: ProjectRegistryRow) => void;
}) {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
      }}
    >
      {/* Head */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          gap: 0,
          padding: '10px 16px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-line-2) / 0.25)',
        }}
      >
        <HeadCell>Nº</HeadCell>
        <HeadCell>Projeto</HeadCell>
        <HeadCell>Empresa</HeadCell>
        <HeadCell>Data</HeadCell>
        <HeadCell align="right">Valor</HeadCell>
      </div>

      {/* Body */}
      {rows.map((p, idx) => (
        <div
          key={p.id}
          role="button"
          tabIndex={0}
          onClick={() => onRowClick(p)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onRowClick(p);
            }
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: COLS,
            gap: 0,
            padding: '14px 16px',
            alignItems: 'center',
            borderTop: idx === 0 ? undefined : '1px solid hsl(var(--ds-line-1))',
            cursor: 'pointer',
            transition: 'background 120ms',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span
            style={{
              ...HN_DISPLAY,
              fontSize: 13,
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-1))',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {p.project_number}
          </span>
          <span
            style={{
              ...HN_DISPLAY,
              fontSize: 14,
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-1))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingRight: 12,
            }}
            title={p.project_name}
          >
            {p.project_name}
          </span>
          <span
            style={{
              fontSize: 13,
              color: 'hsl(var(--ds-fg-2))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              paddingRight: 12,
            }}
            title={p.client_name}
          >
            {p.client_name || '—'}
          </span>
          <span
            style={{
              fontSize: 12,
              color: 'hsl(var(--ds-fg-3))',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatDate(p.project_date)}
          </span>
          <span style={{ textAlign: 'right', paddingRight: 12 }}>
            {p.value_brl != null ? (
              <Money value={p.value_brl} style={{ fontSize: 13 }} />
            ) : (
              <span style={{ color: 'hsl(var(--ds-fg-4))', fontSize: 13 }}>—</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function HeadCell({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <span
      style={{
        ...HN_DISPLAY,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'hsl(var(--ds-fg-4))',
        textAlign: align,
        paddingRight: align === 'right' ? 12 : 0,
      }}
    >
      {children}
    </span>
  );
}

function EmptyState({
  hasActiveFilter,
  onAdd,
}: {
  hasActiveFilter: boolean;
  onAdd: () => void;
}) {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <h3
        style={{
          ...HN_DISPLAY,
          fontSize: 16,
          fontWeight: 500,
          color: 'hsl(var(--ds-fg-1))',
          marginBottom: 6,
        }}
      >
        {hasActiveFilter ? 'Nenhum projeto encontrado.' : 'Sem projetos no registro.'}
      </h3>
      <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginBottom: hasActiveFilter ? 0 : 18 }}>
        {hasActiveFilter
          ? 'Tente afrouxar os filtros para ver mais resultados.'
          : 'Adicione o primeiro projeto manualmente para começar a montar o histórico.'}
      </p>
      {!hasActiveFilter && (
        <button type="button" className="btn primary" onClick={onAdd}>
          <Plus size={14} strokeWidth={1.5} />
          <span>Adicionar projeto</span>
        </button>
      )}
    </div>
  );
}
