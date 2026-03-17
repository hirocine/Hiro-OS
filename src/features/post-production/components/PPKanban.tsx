import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PPStatusBadge } from './PPStatusBadge';
import { PPPriorityBadge } from './PPPriorityBadge';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { PostProductionItem, PPStatus, PP_STATUS_CONFIG, PP_STATUS_COLUMNS } from '../types';
import { cn } from '@/lib/utils';
import { Calendar, User } from 'lucide-react';

interface PPKanbanProps {
  items: PostProductionItem[];
  onItemClick?: (item: PostProductionItem) => void;
}

function KanbanCard({ item, onItemClick }: { item: PostProductionItem; onItemClick?: (item: PostProductionItem) => void }) {
  const isOverdue = item.due_date && item.status !== 'entregue' && new Date(item.due_date + 'T00:00:00') < new Date();

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        isOverdue && "border-destructive/50"
      )}
      onClick={() => onItemClick?.(item)}
    >
      <CardContent className="p-3 space-y-2">
        <p className="text-sm font-medium line-clamp-2">{item.title}</p>
        {(item.project_name || item.client_name) && (
          <p className="text-xs text-muted-foreground truncate">{item.project_name || item.client_name}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <PPPriorityBadge priority={item.priority} />
          {item.due_date && (
            <span className={cn("text-xs flex items-center gap-1", isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
              <Calendar className="h-3 w-3" />
              {new Date(item.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
        {item.editor_name && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">{item.editor_name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PPKanban({ items, onItemClick }: PPKanbanProps) {
  const { updateItem } = usePostProductionMutations();

  const itemsByStatus = useMemo(() => {
    const map: Record<PPStatus, PostProductionItem[]> = {
      fila: [], edicao: [], color_grading: [], finalizacao: [], revisao: [], entregue: [],
    };
    items.forEach(item => {
      if (map[item.status]) map[item.status].push(item);
    });
    return map;
  }, [items]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PP_STATUS_COLUMNS.map(status => {
        const config = PP_STATUS_CONFIG[status];
        const columnItems = itemsByStatus[status];
        return (
          <div key={status} className="flex-1 min-w-[260px]">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={cn("font-semibold text-sm", config.color)}>{config.label}</h3>
                <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                  {columnItems.length}
                </span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {columnItems.length === 0 ? (
                  <div className="h-full min-h-[200px] flex items-center justify-center text-muted-foreground/50 text-sm">
                    Nenhum vídeo
                  </div>
                ) : (
                  columnItems.map(item => (
                    <KanbanCard key={item.id} item={item} onItemClick={onItemClick} />
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
