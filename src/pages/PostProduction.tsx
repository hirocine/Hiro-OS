import { useState, useMemo } from 'react';
import { Plus, Table, Columns3, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { usePostProduction } from '@/features/post-production/hooks/usePostProduction';
import { PPTable, PPKanban, PPCalendar, PPDialog } from '@/features/post-production/components';
import { PostProductionItem, PPPriority, PP_PRIORITY_CONFIG } from '@/features/post-production/types';
import {
  PageToolbar,
  SearchField,
  FilterDropdown,
  ViewToggle,
  FilterChip,
  FilterChipRow,
  FilterIndicator,
  type ViewToggleItem,
} from '@/ds/components/toolbar';

type Tab = 'tabela' | 'kanban' | 'calendario';

const PP_VIEWS: ViewToggleItem<Tab>[] = [
  { value: 'tabela', label: 'Tabela', icon: Table },
  { value: 'kanban', label: 'Kanban', icon: Columns3 },
  { value: 'calendario', label: 'Calendário', icon: CalendarDays },
];

const PRIORITY_TONE: Record<PPPriority, 'danger' | 'warning' | 'info' | 'muted'> = {
  urgente: 'danger',
  alta: 'warning',
  media: 'info',
  baixa: 'muted',
};

export default function PostProduction() {
  const { items, isLoading } = usePostProduction();
  const [search, setSearch] = useState('');
  const [filterEditor, setFilterEditor] = useState('all');
  const [filterPriority, setFilterPriority] = useState<PPPriority | null>(null);
  const [selectedItem, setSelectedItem] = useState<PostProductionItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('tabela');

  const editors = useMemo(
    () => [...new Set(items.map((i) => i.editor_name).filter(Boolean))] as string[],
    [items],
  );

  const filteredItems = items.filter((item) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.project_name?.toLowerCase().includes(q) ||
        item.client_name?.toLowerCase().includes(q) ||
        item.editor_name?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (filterEditor !== 'all' && item.editor_name !== filterEditor) return false;
    if (filterPriority && item.priority !== filterPriority) return false;
    return true;
  });

  const hasActiveFilter = !!search || filterEditor !== 'all' || filterPriority !== null;

  const clearAllFilters = () => {
    setSearch('');
    setFilterEditor('all');
    setFilterPriority(null);
  };

  const handleItemClick = (item: PostProductionItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  // Stats inline
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeCount = items.filter((i) => i.status !== 'entregue').length;
  const overdueCount = items.filter(
    (i) =>
      i.status !== 'entregue' &&
      i.due_date &&
      new Date(i.due_date + 'T00:00:00').getTime() < today.getTime(),
  ).length;
  const awaitingClientCount = items.filter((i) => i.status === 'validacao_cliente').length;

  // Lead time médio (das entregas recentes com start_date + delivered_date)
  const leadTimeAvg = (() => {
    const deliveredWithSpan = items.filter(
      (i) => i.status === 'entregue' && i.start_date && i.delivered_date,
    );
    if (deliveredWithSpan.length === 0) return null;
    const totalDays = deliveredWithSpan.reduce((acc, i) => {
      const start = new Date(i.start_date! + 'T00:00:00').getTime();
      const end = new Date(i.delivered_date! + 'T00:00:00').getTime();
      const days = Math.max(0, Math.round((end - start) / 86400000));
      return acc + days;
    }, 0);
    return Math.round(totalDays / deliveredWithSpan.length);
  })();

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        {/* ─── Header com stats inline ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'end',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'hsl(var(--ds-fg-3))',
                marginBottom: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ width: 6, height: 6, background: 'hsl(var(--ds-accent))' }} />
              Operações · Pós-produção
            </div>
            <h1
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontWeight: 500,
                fontSize: 'var(--ds-display)',
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color: 'hsl(var(--ds-fg-1))',
                margin: 0,
              }}
            >
              Esteira de Pós.
            </h1>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginTop: 12,
                fontSize: 12,
                color: 'hsl(var(--ds-fg-3))',
                flexWrap: 'wrap',
              }}
            >
              <StatPill dotColor="accent" value={activeCount} label="entregas ativas" />
              <span style={{ color: 'hsl(var(--ds-line-2))' }}>·</span>
              <StatPill dotColor="danger" value={overdueCount} label="atrasadas" />
              <span style={{ color: 'hsl(var(--ds-line-2))' }}>·</span>
              <StatPill dotColor="warning" value={awaitingClientCount} label="aguardando cliente" />
              {leadTimeAvg != null ? (
                <>
                  <span style={{ color: 'hsl(var(--ds-line-2))' }}>·</span>
                  <span>
                    lead time{' '}
                    <strong
                      style={{
                        fontFamily: '"HN Display", sans-serif',
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-1))',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {leadTimeAvg}d
                    </strong>
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div>
            <button className="btn primary" onClick={handleCreate} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Novo Vídeo</span>
            </button>
          </div>
        </div>

        {/* 03 — Toolbar */}
        <PageToolbar
          search={
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Buscar vídeo, projeto, editor…"
            />
          }
          filters={[
            <FilterDropdown
              key="editor"
              label="Responsável"
              value={filterEditor}
              onChange={setFilterEditor}
              options={editors.map((e) => ({ value: e, label: e }))}
              width="md"
            />,
          ]}
          viewToggle={
            <ViewToggle
              items={PP_VIEWS}
              value={tab}
              onChange={(v) => setTab(v as Tab)}
            />
          }
        />

        {/* 04 — Priority chips */}
        <div style={{ marginTop: 12 }}>
          <FilterChipRow>
            {(['urgente', 'alta', 'media', 'baixa'] as PPPriority[]).map((p) => (
              <FilterChip
                key={p}
                label={PP_PRIORITY_CONFIG[p].label}
                dot={PRIORITY_TONE[p]}
                active={filterPriority === p}
                onClick={() => setFilterPriority(filterPriority === p ? null : p)}
              />
            ))}
          </FilterChipRow>
        </div>

        {/* 05 — Filter indicator (auto) */}
        <FilterIndicator
          active={hasActiveFilter}
          count={filteredItems.length}
          total={items.length}
          noun="vídeos"
          onClear={clearAllFilters}
        />

        {/* 07 — Content */}
        <div style={{ marginTop: 24 }}>
          <Tabs value={tab}>
            <TabsContent value="tabela">
              <PPTable
                items={filteredItems}
                isLoading={isLoading}
                onItemClick={handleItemClick}
                onEditClick={handleItemClick}
              />
            </TabsContent>
            <TabsContent value="kanban">
              <PPKanban items={filteredItems} onItemClick={handleItemClick} />
            </TabsContent>
            <TabsContent value="calendario">
              <PPCalendar items={filteredItems} onItemClick={handleItemClick} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <PPDialog item={selectedItem} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

interface StatPillProps {
  dotColor: 'accent' | 'danger' | 'warning' | 'info' | 'muted';
  value: number;
  label: string;
}

function StatPill({ dotColor, value, label }: StatPillProps) {
  const colorMap: Record<StatPillProps['dotColor'], string> = {
    accent: 'hsl(var(--ds-accent))',
    danger: 'hsl(var(--ds-danger))',
    warning: 'hsl(var(--ds-warning))',
    info: 'hsl(var(--ds-info))',
    muted: 'hsl(var(--ds-fg-4))',
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 6, height: 6, background: colorMap[dotColor], flexShrink: 0 }} />
      <strong
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontWeight: 500,
          color: 'hsl(var(--ds-fg-1))',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </strong>
      <span>{label}</span>
    </span>
  );
}
