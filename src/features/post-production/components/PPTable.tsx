import { useState, useMemo } from 'react';
import { Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PPSortableHeader } from './PPSortableHeader';
import { InlineSelectCell } from '@/features/tasks/components/InlineSelectCell';
import { InlineDateCell } from '@/features/tasks/components/InlineDateCell';
import { InlineAssigneeCell } from '@/features/tasks/components/InlineAssigneeCell';
import { PPStatusBadge } from './PPStatusBadge';
import { PPPriorityBadge } from './PPPriorityBadge';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { useUsers } from '@/hooks/useUsers';
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
  onEditClick?: (item: PostProductionItem) => void;
}

export function PPTable({ items, isLoading, onItemClick, onEditClick }: PPTableProps) {
  const { updateItem } = usePostProductionMutations();
  const { users } = useUsers();

  const [sortBy, setSortBy] = useState<PPSortableField>('due_date');
  const [sortOrder, setSortOrder] = useState<PPSortOrder>('asc');

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
          <TableHead className="w-[24%]" style={{ textAlign: 'left' }}>
            <PPSortableHeader field="title" label="Título" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[17%]" style={{ textAlign: 'left' }}>
            <PPSortableHeader field="project_name" label="Projeto/Cliente" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[14%]" style={{ textAlign: 'left' }}>
            <PPSortableHeader field="editor_name" label="Editor" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[12%]" style={{ textAlign: 'left' }}>
            <PPSortableHeader field="status" label="Etapa" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[12%]" style={{ textAlign: 'left' }}>
            <PPSortableHeader field="priority" label="Prioridade" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[15%]" style={{ textAlign: 'left' }}>
            <PPSortableHeader field="due_date" label="Prazo" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </TableHead>
          <TableHead className="w-[6%]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedItems.map(item => (
          <TableRow key={item.id} className="hover:bg-muted/50">
            <TableCell style={{ textAlign: 'left' }}>
              <span className="text-sm font-medium truncate block">{item.title}</span>
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <span className="text-sm text-muted-foreground truncate block">
                {item.project_name || item.client_name || '—'}
              </span>
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineAssigneeCell
                value={item.editor_id ? [item.editor_id] : []}
                users={users}
                onSave={values => {
                  const newId = values[0] || null;
                  const editorUser = users.find(u => u.id === newId);
                  updateItem.mutate({ id: item.id, updates: { editor_id: newId, editor_name: editorUser?.display_name || null } });
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
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={e => { e.stopPropagation(); onEditClick?.(item); }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}

        {sortedItems.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              Nenhum vídeo na esteira
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
