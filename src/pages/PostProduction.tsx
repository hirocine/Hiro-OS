import { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { usePostProduction } from '@/features/post-production/hooks/usePostProduction';
import { PPTable, PPKanban, PPCalendar, PPStatsCards, PPDialog } from '@/features/post-production/components';
import { PostProductionItem, PPPriority, PP_PRIORITY_CONFIG } from '@/features/post-production/types';

type Tab = 'tabela' | 'kanban' | 'calendario';

export default function PostProduction() {
  const { items, isLoading } = usePostProduction();
  const [search, setSearch] = useState('');
  const [filterEditor, setFilterEditor] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<PPPriority | null>(null);
  const [selectedItem, setSelectedItem] = useState<PostProductionItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('tabela');

  const editors = useMemo(() =>
    [...new Set(items.map(i => i.editor_name).filter(Boolean))] as string[],
    [items]
  );

  const filteredItems = items.filter(item => {
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.project_name?.toLowerCase().includes(q) ||
        item.client_name?.toLowerCase().includes(q) ||
        item.editor_name?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (filterEditor && item.editor_name !== filterEditor) return false;
    if (filterPriority && item.priority !== filterPriority) return false;
    return true;
  });

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
        <div className="ph">
          <div>
            <h1 className="ph-title">Esteira de Pós.</h1>
            <p className="ph-sub">Controle da fila de pós-produção.</p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={handleCreate} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Novo Vídeo</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <PPStatsCards items={items} />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 360 }}>
            <Search
              size={14}
              strokeWidth={1.5}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--ds-fg-4))', pointerEvents: 'none' }}
            />
            <input
              className="field-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar vídeo, projeto, editor…"
              style={{ width: '100%', paddingLeft: 34 }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 12 }}>
          {(['urgente', 'alta', 'media', 'baixa'] as PPPriority[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPriority(filterPriority === p ? null : p)}
              className={'pill' + (filterPriority === p ? ' acc' : '')}
              style={{ cursor: 'pointer' }}
            >
              <span className="dot" />
              {PP_PRIORITY_CONFIG[p].label}
            </button>
          ))}

          {editors.length > 0 && <span style={{ color: 'hsl(var(--ds-line-2))', margin: '0 4px' }}>·</span>}

          {editors.map(editor => (
            <button
              key={editor}
              type="button"
              onClick={() => setFilterEditor(filterEditor === editor ? null : editor)}
              className={'pill' + (filterEditor === editor ? ' acc' : '')}
              style={{ cursor: 'pointer' }}
            >
              {editor.split(' ')[0]}
            </button>
          ))}

          {(filterEditor || filterPriority) && (
            <button
              type="button"
              onClick={() => { setFilterEditor(null); setFilterPriority(null); }}
              style={{
                fontFamily: '"HN Display", sans-serif', fontSize: 10, fontWeight: 500,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'hsl(var(--ds-fg-3))', cursor: 'pointer',
              }}
            >
              Limpar ×
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ marginTop: 20 }}>
          <div className="tabs-bar">
            <button className={'tab' + (tab === 'tabela' ? ' on' : '')} onClick={() => setTab('tabela')} type="button">Tabela</button>
            <button className={'tab' + (tab === 'kanban' ? ' on' : '')} onClick={() => setTab('kanban')} type="button">Kanban</button>
            <button className={'tab' + (tab === 'calendario' ? ' on' : '')} onClick={() => setTab('calendario')} type="button">Calendário</button>
          </div>

          <div style={{ marginTop: 16 }}>
            <Tabs value={tab}>
              <TabsContent value="tabela">
                <PPTable items={filteredItems} isLoading={isLoading} onItemClick={handleItemClick} onEditClick={handleItemClick} />
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
      </div>

      <PPDialog item={selectedItem} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
