import { useState, useMemo } from 'react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { usePostProduction } from '@/features/post-production/hooks/usePostProduction';
import { PPTable, PPKanban, PPCalendar, PPStatsCards, PPDialog } from '@/features/post-production/components';
import { PostProductionItem, PPPriority, PP_PRIORITY_CONFIG } from '@/features/post-production/types';

export default function PostProduction() {
  const { items, isLoading } = usePostProduction();
  const [search, setSearch] = useState('');
  const [filterEditor, setFilterEditor] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<PPPriority | null>(null);
  const [selectedItem, setSelectedItem] = useState<PostProductionItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <PageHeader
        title="Esteira de Pós"
        subtitle="Controle da fila de pós-produção"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" /> Novo Vídeo
          </Button>
        }
      />

      <PPStatsCards items={items} />

      <div className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar vídeo, projeto, editor..."
              className="pl-9"
            />
          </div>
        </div>

        <Tabs defaultValue="tabela">
          <TabsList>
            <TabsTrigger value="tabela">Tabela</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
          </TabsList>

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

      <PPDialog item={selectedItem} open={dialogOpen} onOpenChange={setDialogOpen} />
    </ResponsiveContainer>
  );
}
