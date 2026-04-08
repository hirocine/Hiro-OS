import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter, useDroppable, useDraggable } from '@dnd-kit/core';
import { usePipelineStages } from '../../hooks/usePipelineStages';
import { useDeals, useDealMutations } from '../../hooks/useDeals';
import { useTeamProfiles } from '../../hooks/useTeamProfiles';
import { DealCard } from './DealCard';
import { DealForm } from './DealForm';
import { LostReasonDialog } from './LostReasonDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, AlertTriangle, Handshake, DollarSign, Search } from 'lucide-react';
import { formatBRL, type DealWithRelations, type PipelineStage } from '../../types/crm.types';
import { useDebounce } from '@/hooks/useDebounce';

function DraggableDealCard({ deal }: { deal: DealWithRelations }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <DealCard deal={deal} isDragging={isDragging} />
    </div>
  );
}

function DroppableArea({ stageId, children }: { stageId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  return (
    <div ref={setNodeRef} className={`flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] transition-colors duration-200 ${isOver ? 'bg-primary/5' : ''}`}>
      {children}
    </div>
  );
}

export function PipelineBoard() {
  const { data: stages, isLoading: stagesLoading } = usePipelineStages();
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { moveToStage } = useDealMutations();
  const { data: profiles } = useTeamProfiles();
  const [dealFormOpen, setDealFormOpen] = useState(false);
  const [activeDeal, setActiveDeal] = useState<DealWithRelations | null>(null);
  const [pendingLost, setPendingLost] = useState<{ dealId: string; stageId: string } | null>(null);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filteredDeals = useMemo(() => {
    let result = deals ?? [];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(d =>
        d.title.toLowerCase().includes(q) || (d.contact_name ?? '').toLowerCase().includes(q)
      );
    }
    if (assigneeFilter) {
      result = result.filter(d => d.assigned_to === assigneeFilter);
    }
    return result;
  }, [deals, debouncedSearch, assigneeFilter]);

  const dealsByStage = useMemo(() => {
    const map = new Map<string, DealWithRelations[]>();
    stages?.forEach(s => map.set(s.id, []));
    filteredDeals.forEach(d => {
      const arr = map.get(d.stage_id);
      if (arr) arr.push(d);
    });
    return map;
  }, [filteredDeals, stages]);

  const activeDeals = useMemo(() => filteredDeals.filter(d => !d.stage_is_won && !d.stage_is_lost), [filteredDeals]);
  const pipelineValue = useMemo(() => activeDeals.reduce((sum, d) => sum + (d.estimated_value ?? 0), 0), [activeDeals]);
  const staleCount = useMemo(() => activeDeals.filter(d => {
    const days = Math.floor((Date.now() - new Date(d.updated_at ?? d.created_at!).getTime()) / 86400000);
    return days > 7;
  }).length, [activeDeals]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDeal(deals?.find(d => d.id === event.active.id) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over || !stages) return;

    const dealId = active.id as string;
    const targetStageId = over.id as string;
    const deal = deals?.find(d => d.id === dealId);
    if (!deal || deal.stage_id === targetStageId) return;

    const targetStage = stages.find(s => s.id === targetStageId);
    if (!targetStage) return;

    if (targetStage.is_lost) {
      setPendingLost({ dealId, stageId: targetStageId });
      return;
    }

    moveToStage.mutate({ dealId, stageId: targetStageId, isWon: targetStage.is_won ?? false, isLost: false });
  };

  const handleLostConfirm = (reason: string) => {
    if (!pendingLost) return;
    moveToStage.mutate({ dealId: pendingLost.dealId, stageId: pendingLost.stageId, isLost: true, lostReason: reason });
    setPendingLost(null);
  };

  if (stagesLoading || dealsLoading) {
    return <div className="flex gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[400px] w-[280px] rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar deals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-8 w-[200px]"
          />
        </div>
        <Select value={assigneeFilter || 'all'} onValueChange={v => setAssigneeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {profiles?.map(p => (
              <SelectItem key={p.user_id} value={p.user_id}>{p.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Handshake className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{activeDeals.length}</span>
          <span className="text-muted-foreground">deals ativos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{formatBRL(pipelineValue)}</span>
        </div>
        {staleCount > 0 && (
          <div className="flex items-center gap-1.5 text-orange-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">{staleCount}</span>
            <span>parados há +7 dias</span>
          </div>
        )}
        <Button size="sm" className="ml-auto" onClick={() => setDealFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Novo Deal
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages?.map(stage => {
            const stageDeals = dealsByStage.get(stage.id) ?? [];
            return (
              <div key={stage.id} className="flex flex-col min-w-[280px] max-w-[320px] bg-muted/30 rounded-lg border">
                <div className="p-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stage.color ?? '#6366f1' }} />
                    <h3 className="text-sm font-medium truncate">{stage.name}</h3>
                    <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{stageDeals.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatBRL(stageDeals.reduce((s, d) => s + (d.estimated_value ?? 0), 0))}
                  </p>
                </div>
                <DroppableArea stageId={stage.id}>
                  {stageDeals.map(deal => <DraggableDealCard key={deal.id} deal={deal} />)}
                </DroppableArea>
              </div>
            );
          })}
        </div>
        <DragOverlay>{activeDeal && <DealCard deal={activeDeal} isDragging />}</DragOverlay>
      </DndContext>

      <DealForm open={dealFormOpen} onOpenChange={setDealFormOpen} />
      <LostReasonDialog open={!!pendingLost} onConfirm={handleLostConfirm} onCancel={() => setPendingLost(null)} />
    </div>
  );
}
