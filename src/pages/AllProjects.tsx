import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  PageHeader,
  PageToolbar,
  SearchField,
  FilterDropdown,
  FilterIndicator,
} from '@/ds/components/toolbar';
import { Money } from '@/ds/components/Money';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useProjectRegistry,
  useProjectRegistryMutations,
  type ProjectRegistryRow,
} from '@/features/all-projects/useProjectRegistry';

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

// ─────────────────────────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────────────────────────

type DateBucket = 'all' | 'last_30' | 'last_90' | 'this_year' | 'last_year';
type ValueBucket = 'all' | 'lt_10k' | '10k_50k' | '50k_100k' | 'gt_100k';

const DATE_OPTIONS: { value: DateBucket; label: string }[] = [
  { value: 'last_30',   label: 'Últimos 30 dias' },
  { value: 'last_90',   label: 'Últimos 90 dias' },
  { value: 'this_year', label: 'Este ano' },
  { value: 'last_year', label: 'Ano passado' },
];

const VALUE_OPTIONS: { value: ValueBucket; label: string }[] = [
  { value: 'lt_10k',   label: 'Até R$ 10k' },
  { value: '10k_50k',  label: 'R$ 10k – 50k' },
  { value: '50k_100k', label: 'R$ 50k – 100k' },
  { value: 'gt_100k',  label: 'Acima de R$ 100k' },
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
  if (bucket === 'lt_10k')   return value < 10_000;
  if (bucket === '10k_50k')  return value >= 10_000 && value < 50_000;
  if (bucket === '50k_100k') return value >= 50_000 && value < 100_000;
  if (bucket === 'gt_100k')  return value >= 100_000;
  return true;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(d.valueOf())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

export default function AllProjects() {
  const { data: items = [], isLoading } = useProjectRegistry();
  const { create, update, remove } = useProjectRegistryMutations();

  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateBucket>('all');
  const [valueFilter, setValueFilter] = useState<ValueBucket>('all');

  const [confirmDelete, setConfirmDelete] = useState<ProjectRegistryRow | null>(null);
  /** id of the row that just got inserted — drives autofocus on the Nº cell */
  const [focusRowId, setFocusRowId] = useState<string | null>(null);

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
        const hay = [
          p.project_name ?? '',
          p.client_name ?? '',
          p.project_number ?? '',
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, clientFilter, dateFilter, valueFilter]);

  const hasActiveFilter =
    !!search ||
    clientFilter !== 'all' ||
    dateFilter !== 'all' ||
    valueFilter !== 'all';

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
    create.mutate(
      {},
      {
        onSuccess: (row) => setFocusRowId(row.id),
      },
    );
  };

  const handlePatch = (id: string, patch: Parameters<typeof update.mutate>[0]) => {
    update.mutate({ ...patch, id });
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <PageHeader
          title="Todos os projetos."
          subtitle="Histórico completo da casa — preenchido manualmente, célula a célula."
          action={
            <button
              type="button"
              className="btn primary"
              onClick={handleAdd}
              disabled={create.isPending}
            >
              {create.isPending ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Plus size={14} strokeWidth={1.5} />
              )}
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
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState hasActiveFilter={hasActiveFilter} onAdd={handleAdd} />
          ) : (
            <ProjectsTable
              rows={filtered}
              onPatch={handlePatch}
              onRequestDelete={(row) => setConfirmDelete(row)}
              focusRowId={focusRowId}
              clearFocusRow={() => setFocusRowId(null)}
            />
          )}
        </div>
      </div>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.project_number || confirmDelete?.project_name ? (
                <>
                  Você está prestes a remover{' '}
                  <strong>
                    {confirmDelete?.project_number ? `Nº ${confirmDelete.project_number}` : 'esta linha'}
                    {confirmDelete?.project_name ? ` · ${confirmDelete.project_name}` : ''}
                  </strong>
                  . Essa ação não pode ser desfeita.
                </>
              ) : (
                <>Você está prestes a remover esta linha em branco. Essa ação não pode ser desfeita.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  remove.mutate(confirmDelete.id, {
                    onSuccess: () => setConfirmDelete(null),
                  });
                }
              }}
              style={{
                background: 'hsl(var(--ds-danger))',
                color: 'hsl(var(--ds-bg))',
                border: '1px solid hsl(var(--ds-danger))',
              }}
            >
              {remove.isPending ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────────

// Column order: Nº · Empresa · Projeto · Data · Valor · Notas · (delete)
const COLS = '90px minmax(180px, 1fr) minmax(220px, 1.6fr) 130px 140px minmax(180px, 1fr) 36px';

function ProjectsTable({
  rows,
  onPatch,
  onRequestDelete,
  focusRowId,
  clearFocusRow,
}: {
  rows: ProjectRegistryRow[];
  onPatch: (id: string, patch: Parameters<typeof useProjectRegistryMutations>[number]) => void;
  onRequestDelete: (row: ProjectRegistryRow) => void;
  focusRowId: string | null;
  clearFocusRow: () => void;
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
        <HeadCell>Empresa</HeadCell>
        <HeadCell>Projeto</HeadCell>
        <HeadCell>Data</HeadCell>
        <HeadCell align="right">Valor</HeadCell>
        <HeadCell>Notas</HeadCell>
        <HeadCell aria-label="Ações" />
      </div>

      {/* Body */}
      {rows.map((p, idx) => (
        <TableRow
          key={p.id}
          row={p}
          isFirst={idx === 0}
          onPatch={onPatch}
          onRequestDelete={onRequestDelete}
          autoFocusNumber={focusRowId === p.id}
          onAutoFocusConsumed={clearFocusRow}
        />
      ))}
    </div>
  );
}

function TableRow({
  row,
  isFirst,
  onPatch,
  onRequestDelete,
  autoFocusNumber,
  onAutoFocusConsumed,
}: {
  row: ProjectRegistryRow;
  isFirst: boolean;
  onPatch: (id: string, patch: Parameters<typeof useProjectRegistryMutations>[number]) => void;
  onRequestDelete: (row: ProjectRegistryRow) => void;
  autoFocusNumber: boolean;
  onAutoFocusConsumed: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: COLS,
        gap: 0,
        padding: '0 16px',
        alignItems: 'stretch',
        borderTop: isFirst ? undefined : '1px solid hsl(var(--ds-line-1))',
        transition: 'background 120ms',
        background: hover ? 'hsl(var(--ds-line-2) / 0.3)' : 'transparent',
        minHeight: 44,
      }}
    >
      <InlineCell
        value={row.project_number}
        onCommit={(v) => onPatch(row.id, { project_number: v })}
        placeholder="—"
        kind="number-id"
        autoFocus={autoFocusNumber}
        onAutoFocusConsumed={onAutoFocusConsumed}
      />
      <InlineCell
        value={row.client_name}
        onCommit={(v) => onPatch(row.id, { client_name: v })}
        placeholder="Empresa"
        kind="text"
      />
      <InlineCell
        value={row.project_name}
        onCommit={(v) => onPatch(row.id, { project_name: v })}
        placeholder="Nome do projeto"
        kind="text"
        muted
      />
      <InlineCell
        value={row.project_date}
        onCommit={(v) => onPatch(row.id, { project_date: v })}
        placeholder="—"
        kind="date"
      />
      <InlineCell
        value={row.value_brl == null ? null : String(row.value_brl)}
        onCommit={(v) =>
          onPatch(row.id, {
            value_brl: v == null ? null : Number(v.replace(',', '.')),
          })
        }
        placeholder="—"
        kind="money"
        align="right"
      />
      <InlineCell
        value={row.notes}
        onCommit={(v) => onPatch(row.id, { notes: v })}
        placeholder="Adicionar nota…"
        kind="text"
        muted
      />
      {/* Hover delete */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestDelete(row);
          }}
          title="Remover linha"
          style={{
            width: 26,
            height: 26,
            display: 'grid',
            placeItems: 'center',
            background: 'transparent',
            border: 'none',
            color: 'hsl(var(--ds-fg-4))',
            cursor: 'pointer',
            opacity: hover ? 1 : 0,
            transition: 'opacity 120ms, color 120ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-danger))')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-4))')}
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// InlineCell — click to edit, blur or Enter commits, Esc cancels
// ─────────────────────────────────────────────────────────────────

type CellKind = 'text' | 'number-id' | 'date' | 'money';

function InlineCell({
  value,
  onCommit,
  placeholder,
  kind = 'text',
  align = 'left',
  muted = false,
  autoFocus = false,
  onAutoFocusConsumed,
}: {
  value: string | null;
  onCommit: (next: string | null) => void;
  placeholder?: string;
  kind?: CellKind;
  align?: 'left' | 'right';
  muted?: boolean;
  autoFocus?: boolean;
  onAutoFocusConsumed?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Keep draft in sync when the underlying row changes (but not while editing).
  useEffect(() => {
    if (!editing) setDraft(value ?? '');
  }, [value, editing]);

  // Auto-enter edit mode when requested (e.g. just-inserted row).
  useEffect(() => {
    if (autoFocus) {
      setEditing(true);
      onAutoFocusConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  // Focus the input as soon as we enter edit mode.
  useEffect(() => {
    if (editing) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    const next = trimmed === '' ? null : trimmed;
    if (next === (value ?? null)) return;
    onCommit(next);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value ?? '');
  };

  // Read-mode display
  const display = formatDisplay(value, kind);

  const baseTextStyle: React.CSSProperties = {
    fontSize: kind === 'number-id' ? 13 : kind === 'text' ? 13 : 12,
    fontWeight: kind === 'number-id' || (kind === 'text' && !muted) ? 500 : 400,
    fontFamily: kind === 'number-id' ? '"HN Display", sans-serif' : undefined,
    fontVariantNumeric: kind === 'number-id' || kind === 'date' ? 'tabular-nums' : undefined,
    color: value
      ? muted
        ? 'hsl(var(--ds-fg-2))'
        : 'hsl(var(--ds-fg-1))'
      : 'hsl(var(--ds-fg-4))',
    textAlign: align,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', paddingRight: align === 'right' ? 0 : 12 }}>
        <input
          ref={inputRef}
          type={inputTypeFor(kind)}
          inputMode={inputModeFor(kind)}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              cancel();
            }
          }}
          placeholder={placeholder}
          style={{
            ...baseTextStyle,
            color: 'hsl(var(--ds-fg-1))',
            width: '100%',
            background: 'hsl(var(--ds-bg))',
            border: '1px solid hsl(var(--ds-accent) / 0.5)',
            outline: 'none',
            padding: '6px 8px',
            margin: '4px 0',
          }}
        />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setEditing(true);
        }
      }}
      title={display || placeholder}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        cursor: 'text',
        paddingRight: align === 'right' ? 12 : 12,
        outline: 'none',
        minWidth: 0,
      }}
    >
      <span style={baseTextStyle}>{display || placeholder || ''}</span>
    </div>
  );
}

function inputTypeFor(kind: CellKind): string {
  if (kind === 'date') return 'date';
  return 'text';
}

function inputModeFor(kind: CellKind): React.HTMLAttributes<HTMLInputElement>['inputMode'] {
  if (kind === 'number-id') return 'numeric';
  if (kind === 'money') return 'decimal';
  return undefined;
}

function formatDisplay(value: string | null, kind: CellKind): string {
  if (value == null || value === '') return '';
  if (kind === 'date') return formatDate(value);
  if (kind === 'money') {
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return value;
}

// ─────────────────────────────────────────────────────────────────
// States
// ─────────────────────────────────────────────────────────────────

function HeadCell({
  children,
  align = 'left',
  ...rest
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  'aria-label'?: string;
}) {
  return (
    <span
      {...rest}
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

function LoadingState() {
  return (
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
      <p
        style={{
          fontSize: 13,
          color: 'hsl(var(--ds-fg-3))',
          marginBottom: hasActiveFilter ? 0 : 18,
        }}
      >
        {hasActiveFilter
          ? 'Tente afrouxar os filtros para ver mais resultados.'
          : 'Adicione o primeiro projeto pra começar a montar o histórico — você preenche célula a célula.'}
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
