import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, Film } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PPSortableHeader } from './PPSortableHeader';
import { InlineDateCell } from '@/features/tasks/components/InlineDateCell';
import { InlineAssigneeCell } from '@/features/tasks/components/InlineAssigneeCell';
import { InlineSelectCell } from '@/features/tasks/components/InlineSelectCell';
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

const PIPELINE_STEPS: PPStatus[] = ['fila', 'edicao', 'color_grading', 'finalizacao', 'revisao', 'entregue'];

function PipelineProgress({ status }: { status: PPStatus }) {
  const currentIndex = PIPELINE_STEPS.indexOf(status);
  const config = PP_STATUS_CONFIG[status];
  const total = PIPELINE_STEPS.length;
  const segW = 14;
  const gap = 3;
  const totalW = total * segW + (total - 1) * gap;

  return (
    <div className="flex flex-col gap-1.5">
      <span className={`text-xs font-medium leading-none ${config.color}`}>
        {config.label}
      </span>
      <svg width={totalW} height={4} style={{ display: 'block', overflow: 'visible' }}>
        {PIPELINE_STEPS.map((_, i) => {
          const x = i * (segW + gap);
          const isCompleted = i < currentIndex;
          const isActive = i === currentIndex;
          return (
            <rect
              key={i}
              x={x}
              y={isActive ? 0 : 0.5}
              width={segW}
              height={isActive ? 4 : isCompleted ? 3 : 2}
              rx={2}
              className={
                isCompleted
                  ? 'fill-primary'
                  : isActive
                  ? 'fill-primary/60'
                  : 'fill-muted-foreground/20'
              }
            />
          );
        })}
      </svg>
    </div>
  );
}

interface PPTableProps {
  items: PostProductionItem[];
  isLoading?: boolean;
  onItemClick?: (item: PostProductionItem) => void;
  onEditClick?: (item: PostProductionItem) => void;
}

export function PPTable({ items, isLoading, onItemClick, onEditClick }: PPTableProps) {
  const { updateItem } = usePostProductionMutations();
  const { users } = useUsers();
  const navigate = useNavigate();

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
    <div className="rounded-xl overflow-hidden border border-border/40">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="bg-muted border-b border-border">
            <TableHead className="w-[35%] py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <PPSortableHeader field="title" label="Título" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
            </TableHead>
            <TableHead className="w-[15%] py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <PPSortableHeader field="editor_name" label="Editor" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
            </TableHead>
            <TableHead className="w-[22%] min-w-[160px] py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <PPSortableHeader field="status" label="Pipeline" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
            </TableHead>
            <TableHead className="w-[13%] py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <PPSortableHeader field="priority" label="Prioridade" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
            </TableHead>
            <TableHead className="w-[15%] py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <PPSortableHeader field="due_date" label="Prazo" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map(item => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue = item.due_date && item.status !== 'entregue' && new Date(item.due_date + 'T00:00:00') < today;
            const daysOverdue = isOverdue
              ? Math.floor((today.getTime() - new Date(item.due_date! + 'T00:00:00').getTime()) / 86400000)
              : 0;

            return (
              <TableRow
                key={item.id}
                className="border-b border-border/50 last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={() => navigate(`/esteira-de-pos/${item.id}`)}
              >
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground leading-snug">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {[item.client_name, item.project_name].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </div>
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
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
                <TableCell className="overflow-hidden">
                  <PipelineProgress status={item.status} />
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <InlineSelectCell
                    value={item.priority}
                    options={Object.entries(PP_PRIORITY_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                    onSave={v => updateItem.mutate({ id: item.id, updates: { priority: v as PPPriority } })}
                    renderValue={v => <PPPriorityBadge priority={v as PPPriority} />}
                    renderOption={v => <PPPriorityBadge priority={v as PPPriority} />}
                  />
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  {isOverdue ? (
                    <div>
                      <div className="flex items-center gap-1 text-destructive text-sm font-medium">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {format(new Date(item.due_date! + 'T00:00:00'), 'dd/MM/yyyy')}
                      </div>
                      <p className="text-xs text-destructive mt-0.5">
                        Atrasada há {daysOverdue} dia{daysOverdue !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ) : (
                    <InlineDateCell
                      value={item.due_date}
                      onSave={v => updateItem.mutate({ id: item.id, updates: { due_date: v } })}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}

          {sortedItems.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <EmptyState icon={Film} title="" description="Nenhum vídeo na esteira ainda." compact />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
