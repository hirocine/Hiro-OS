import { useState } from 'react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { usePostProduction } from '@/features/post-production/hooks/usePostProduction';
import { PPTable, PPKanban, PPCalendar, PPStatsCards, PPDialog } from '@/features/post-production/components';
import { PostProductionItem } from '@/features/post-production/types';

export default function PostProduction() {
  const { items, isLoading } = usePostProduction();
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<PostProductionItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredItems = items.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.project_name?.toLowerCase().includes(q) ||
      item.client_name?.toLowerCase().includes(q) ||
      item.editor_name?.toLowerCase().includes(q)
    );
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
