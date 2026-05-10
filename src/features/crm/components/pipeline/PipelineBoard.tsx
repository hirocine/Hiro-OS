import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter, useDroppable, useDraggable } from '@dnd-kit/core';
import { usePipelineStages } from '../../hooks/usePipelineStages';
import { useDeals, useDealMutations } from '../../hooks/useDeals';
import { useTeamProfiles } from '../../hooks/useTeamProfiles';
import { DealCard } from './DealCard';
import { DealForm } from './DealForm';
import { LostReasonDialog } from './LostReasonDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertTriangle, Handshake, DollarSign, Search } from 'lucide-react';
import { formatBRL, type DealWithRelations } from '../../types/crm.types';
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
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 320px)',
        background: isOver ? 'hsl(var(--ds-accent) / 0.05)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
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
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 400,
              width: 280,
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, fontSize: 13 }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            strokeWidth={1.5}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--ds-fg-4))',
              pointerEvents: 'none',
            }}
          />
          <Input
            placeholder="Buscar deals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34, width: 220 }}
          />
        </div>
        <Select value={assigneeFilter || 'all'} onValueChange={(v) => setAssigneeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger style={{ width: 180 }}>
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {profiles?.map((p) => (
              <SelectItem key={p.user_id} value={p.user_id}>{p.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(var(--ds-fg-3))' }}>
          <Handshake size={14} strokeWidth={1.5} />
          <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
            {activeDeals.length}
          </span>
          <span>deals ativos</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(var(--ds-fg-3))' }}>
          <DollarSign size={14} strokeWidth={1.5} />
          <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
            {formatBRL(pipelineValue)}
          </span>
        </div>
        {staleCount > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(var(--ds-warning))' }}>
            <AlertTriangle size={14} strokeWidth={1.5} />
            <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{staleCount}</span>
            <span>parados há +7 dias</span>
          </div>
        )}
        <button
          type="button"
          className="btn primary"
          style={{ marginLeft: 'auto' }}
          onClick={() => setDealFormOpen(true)}
        >
          <Plus size={14} strokeWidth={1.5} />
          <span>Novo Deal</span>
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
          {stages?.map((stage) => {
            const stageDeals = dealsByStage.get(stage.id) ?? [];
            const stageValue = stageDeals.reduce((s, d) => s + (d.estimated_value ?? 0), 0);
            return (
              <div
                key={stage.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 280,
                  maxWidth: 320,
                  background: 'hsl(var(--ds-surface))',
                  border: '1px solid hsl(var(--ds-line-1))',
                }}
              >
                <div style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--ds-line-1))' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: stage.color ?? 'hsl(var(--ds-accent))',
                        flexShrink: 0,
                      }}
                    />
                    <h3
                      style={{
                        fontFamily: '"HN Display", sans-serif',
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'hsl(var(--ds-fg-1))',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {stage.name}
                    </h3>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: 11,
                        color: 'hsl(var(--ds-fg-3))',
                        background: 'hsl(var(--ds-line-2))',
                        padding: '1px 8px',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {stageDeals.length}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'hsl(var(--ds-fg-3))',
                      marginTop: 4,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {formatBRL(stageValue)}
                  </p>
                </div>
                <DroppableArea stageId={stage.id}>
                  {stageDeals.map((deal) => <DraggableDealCard key={deal.id} deal={deal} />)}
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
