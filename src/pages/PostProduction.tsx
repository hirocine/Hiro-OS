import { useState, useMemo } from 'react';
import { Plus, Table, Columns3, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { usePostProduction } from '@/features/post-production/hooks/usePostProduction';
import { PPTable, PPKanban, PPCalendar, PPStatsCards, PPDialog } from '@/features/post-production/components';
import { PostProductionItem, PPPriority, PP_PRIORITY_CONFIG } from '@/features/post-production/types';
import {
  PageHeader,
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

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        {/* 01 — Header */}
        <PageHeader
          title="Esteira de Pós."
          subtitle="Controle da fila de pós-produção."
          action={
            <button className="btn primary" onClick={handleCreate} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Novo Vídeo</span>
            </button>
          }
        />

        {/* 02 — Stats */}
        <div style={{ marginTop: 24 }}>
          <PPStatsCards items={items} />
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
