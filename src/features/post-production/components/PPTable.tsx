import { useState, useMemo } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PPSortableHeader } from './PPSortableHeader';
import { InlineEditCell } from '@/features/tasks/components/InlineEditCell';
import { InlineSelectCell } from '@/features/tasks/components/InlineSelectCell';
import { InlineDateCell } from '@/features/tasks/components/InlineDateCell';
import { InlineAssigneeCell } from '@/features/tasks/components/InlineAssigneeCell';
import { PPStatusBadge } from './PPStatusBadge';
import { PPPriorityBadge } from './PPPriorityBadge';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { useUsers } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  PostProductionItem,
  PPStatus,
  PPPriority,
  PPSortableField,
  PPSortOrder,
  PP_PRIORITY_ORDER,
  PP_STATUS_ORDER,
  PP_PRIORITY_CONFIG,
  PP_STATUS_CONFIG,
} from '../types';

interface PPTableProps {
  items: PostProductionItem[];
  isLoading?: boolean;
  onItemClick?: (item: PostProductionItem) => void;
}

const defaultNewItem = {
  title: '',
  priority: 'media' as PPPriority,
  status: 'fila' as PPStatus,
  editor_id: null as string | null,
  due_date: null as string | null,
  project_name: null as string | null,
};

export function PPTable({ items, isLoading, onItemClick }: PPTableProps) {
  const { user } = useAuthContext();
  const { createItem, updateItem } = usePostProductionMutations();
  const { users } = useUsers();

  const [sortBy, setSortBy] = useState<PPSortableField>('due_date');
  const [sortOrder, setSortOrder] = useState<PPSortOrder>('asc');
  const [newItem, setNewItem] = useState(defaultNewItem);

  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const sortedItems = useMemo(() => {
    if (!items.length) return items;
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'title':
          cmp = (a.title || '').localeCompare(b.title || '', 'pt-BR');
          break;
        case 'priority':
          cmp = (PP_PRIORITY_ORDER[a.priority] ?? 0) - (PP_PRIORITY_ORDER[b.priority] ?? 0);
          break;
        case 'status':
          cmp = (PP_STATUS_ORDER[a.status] ?? 0) - (PP_STATUS_ORDER[b.status] ?? 0);
          break;
        case 'editor_name':
          if (!a.editor_name && !b.editor_name) cmp = 0;
          else if (!a.editor_name) cmp = 1;
          else if (!b.editor_name) cmp = -1;
          else cmp = a.editor_name.localeCompare(b.editor_name, 'pt-BR');
          break;
        case 'due_date':
          if (!a.due_date && !b.due_date) cmp = 0;
          else if (!a.due_date) cmp = 1;
          else if (!b.due_date) cmp = -1;
          else cmp = parseLocalDate(a.due_date).getTime() - parseLocalDate(b.due_date).getTime();
          break;
        case 'project_name':
          const pA = a.project_name || a.client_name || '';
          const pB = b.project_name || b.client_name || '';
          cmp = pA.localeCompare(pB, 'pt-BR');
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [items, sortBy, sortOrder]);

  const handleSort = (field: PPSortableField, order: PPSortOrder) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const isActive = () => newItem.title !== '';

  const handleCreate = async () => {
    if (!newItem.title.trim() || !user) return;
    const editorUser = users.find(u => u.id === newItem.editor_id);
    try {
      await createItem.mutateAsync({
        title: newItem.title,
        priority: newItem.priority,
        status: newItem.status,
        editor_id: newItem.editor_id,
        editor_name: editorUser?.display_name || null,
        due_date: newItem.due_date,
        project_name: newItem.project_name,
      });
      setNewItem(defaultNewItem);
    } catch {
      toast.error('Erro ao criar vídeo');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12" />)}
      </div>
    );
  }

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[25%]" style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="title" label="Título" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[18%]" style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="project_name" label="Projeto/Cliente" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[15%]" style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="editor_name" label="Editor" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[12%]" style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="status" label="Etapa" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[12%]" style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="priority" label="Prioridade" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[18%]" style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="due_date" label="Prazo" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Creation row */}
        <TableRow className={`border-dashed ${!isActive() ? 'opacity-70 hover:opacity-100' : ''}`}>
          <TableCell style={{ textAlign: 'left' }}>
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="+ Adicionar novo vídeo..."
                value={newItem.title}
                onChange={e => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="border-0 p-0 h-auto text-sm bg-transparent focus-visible:ring-0 placeholder:italic"
              />
            </div>
          </TableCell>
          <TableCell style={{ textAlign: 'left' }}>
            <InlineEditCell
              value={newItem.project_name || ''}
              onSave={value => setNewItem(prev => ({ ...prev, project_name: value || null }))}
              placeholder="Projeto/Cliente"
            />
          </TableCell>
          <TableCell style={{ textAlign: 'left' }}>
            <InlineAssigneeCell
              value={newItem.editor_id}
              users={users}
              onSave={value => setNewItem(prev => ({ ...prev, editor_id: value }))}
              isActive={isActive()}
            />
          </TableCell>
          <TableCell style={{ textAlign: 'left' }}>
            <InlineSelectCell
              value={newItem.status}
              options={Object.entries(PP_STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
              onSave={v => setNewItem(prev => ({ ...prev, status: v as PPStatus }))}
              renderValue={v => isActive() ? <PPStatusBadge status={v as PPStatus} /> : <span className="text-muted-foreground text-sm flex items-center gap-1">Selecionar <ChevronDown className="w-3 h-3" /></span>}
              renderOption={v => <PPStatusBadge status={v as PPStatus} />}
            />
          </TableCell>
          <TableCell style={{ textAlign: 'left' }}>
            <InlineSelectCell
              value={newItem.priority}
              options={Object.entries(PP_PRIORITY_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
              onSave={v => setNewItem(prev => ({ ...prev, priority: v as PPPriority }))}
              renderValue={v => isActive() ? <PPPriorityBadge priority={v as PPPriority} /> : <span className="text-muted-foreground text-sm flex items-center gap-1">Selecionar <ChevronDown className="w-3 h-3" /></span>}
              renderOption={v => <PPPriorityBadge priority={v as PPPriority} />}
            />
          </TableCell>
          <TableCell style={{ textAlign: 'left' }}>
            <div className="flex items-center gap-2">
              <InlineDateCell
                value={newItem.due_date}
                onSave={v => setNewItem(prev => ({ ...prev, due_date: v }))}
              />
              <Button size="sm" variant="ghost" onClick={handleCreate} disabled={!newItem.title.trim()} className="h-6 w-6 p-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>

        {/* Data rows */}
        {sortedItems.map(item => (
          <TableRow key={item.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onItemClick?.(item)}>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineEditCell
                value={item.title}
                onSave={value => updateItem.mutate({ id: item.id, updates: { title: value } })}
              />
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineEditCell
                value={item.project_name || item.client_name || ''}
                onSave={value => updateItem.mutate({ id: item.id, updates: { project_name: value || null } })}
                placeholder="—"
              />
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineAssigneeCell
                value={item.editor_id}
                users={users}
                onSave={value => {
                  const editorUser = users.find(u => u.id === value);
                  updateItem.mutate({ id: item.id, updates: { editor_id: value, editor_name: editorUser?.display_name || null } });
                }}
              />
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineSelectCell
                value={item.status}
                options={Object.entries(PP_STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                onSave={v => {
                  const updates: Partial<PostProductionItem> = { status: v as PPStatus };
                  if (v === 'entregue') updates.delivered_date = new Date().toISOString().split('T')[0];
                  if (v === 'edicao' && !item.start_date) updates.start_date = new Date().toISOString().split('T')[0];
                  updateItem.mutate({ id: item.id, updates });
                }}
                renderValue={v => <PPStatusBadge status={v as PPStatus} />}
                renderOption={v => <PPStatusBadge status={v as PPStatus} />}
              />
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineSelectCell
                value={item.priority}
                options={Object.entries(PP_PRIORITY_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                onSave={v => updateItem.mutate({ id: item.id, updates: { priority: v as PPPriority } })}
                renderValue={v => <PPPriorityBadge priority={v as PPPriority} />}
                renderOption={v => <PPPriorityBadge priority={v as PPPriority} />}
              />
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineDateCell
                value={item.due_date}
                onSave={v => updateItem.mutate({ id: item.id, updates: { due_date: v } })}
              />
            </TableCell>
          </TableRow>
        ))}

        {sortedItems.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              Nenhum vídeo na esteira
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
