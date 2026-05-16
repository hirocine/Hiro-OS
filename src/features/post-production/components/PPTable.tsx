import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, Film, ChevronRight, ExternalLink } from 'lucide-react';
import { CollapsibleSection } from '@/ds/components/CollapsibleSection';
import { EmptyState } from '@/ds/components/EmptyState';
import { PPSortableHeader } from './PPSortableHeader';
import { InlineDateCell } from '@/features/tasks/components/InlineDateCell';
import { InlineAssigneeCell } from '@/features/tasks/components/InlineAssigneeCell';
import { InlineSelectCell } from '@/features/tasks/components/InlineSelectCell';
import { PPPriorityBadge } from './PPPriorityBadge';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { usePPLatestVersions } from '../hooks/usePPLatestVersions';
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

const PIPELINE_STEPS: PPStatus[] = ['fila', 'edicao', 'finalizacao', 'revisao', 'entregue'];

// 8 columns: entrega | editor | fase (atual → próxima) | pipeline | prioridade | última versão | prazo | abrir
const PP_COLS = 'minmax(220px, 1.4fr) 140px 180px minmax(120px, 0.8fr) 110px 90px 130px 56px';

// Stable colored dot per project (hashed from id)
function projectColor(id: string | null | undefined): string {
  if (!id) return 'hsl(var(--ds-fg-4))';
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 55% 50%)`;
}

function relTime(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return format(date, 'dd/MM');
}

function PipelineProgress({
  status,
  isOverdue = false,
}: {
  status: PPStatus;
  /** When true, the active segment turns red instead of orange. */
  isOverdue?: boolean;
}) {
  const currentIndex = PIPELINE_STEPS.indexOf(status);
  const isDelivered = status === 'entregue';

  // Color semantics:
  //   delivered          → all green (success) — celebra a entrega
  //   completed          → fg-2 (cinza escuro) — passou pela fase
  //   active (no prazo)  → azul (info) — em andamento, pulse
  //   active (atrasado)  → vermelho (danger) — em andamento mas vencido, pulse
  //   pending            → line-2 (cinza claro) — ainda não chegou
  const activeColor = isOverdue ? 'hsl(var(--ds-danger))' : 'hsl(var(--ds-info))';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
      {PIPELINE_STEPS.map((_, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;
        let bg = 'hsl(var(--ds-line-2))';
        if (isDelivered) {
          bg = 'hsl(var(--ds-success))';
        } else if (isCompleted) {
          bg = 'hsl(var(--ds-fg-2))';
        } else if (isActive) {
          bg = activeColor;
        }
        return (
          <span
            key={i}
            className={isActive && !isDelivered ? 'pp-pipe-active' : undefined}
            style={{
              flex: 1,
              height: 4,
              background: bg,
            }}
          />
        );
      })}
      {/* Local keyframes for the active segment — slow heartbeat */}
      <style>{`
        @keyframes ppPipePulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
        .pp-pipe-active {
          animation: ppPipePulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pp-pipe-active { animation: none; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/** "07 · Color" — fase atual com índice (2 dígitos) e label */
function formatStage(status: PPStatus | null): string {
  if (!status) return '—';
  const idx = PIPELINE_STEPS.indexOf(status);
  if (idx < 0) return PP_STATUS_CONFIG[status]?.label ?? '—';
  return `${String(idx + 1).padStart(2, '0')} · ${PP_STATUS_CONFIG[status].label}`;
}

/** Próxima fase do pipeline (null se já entregue/última). */
function nextStage(status: PPStatus): PPStatus | null {
  const idx = PIPELINE_STEPS.indexOf(status);
  if (idx < 0 || idx >= PIPELINE_STEPS.length - 1) return null;
  return PIPELINE_STEPS[idx + 1];
}

/** Renderiza "atual → próxima" como duas linhas */
function StageNowNext({ status }: { status: PPStatus }) {
  const next = nextStage(status);
  const isDelivered = status === 'entregue';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.2, minWidth: 0 }}>
      <span
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: isDelivered ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-fg-1))',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {formatStage(status)}
      </span>
      {next ? (
        <span
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 11,
            color: 'hsl(var(--ds-fg-4))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          → {formatStage(next)}
        </span>
      ) : (
        <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))' }}>—</span>
      )}
    </div>
  );
}

interface PPTableProps {
  items: PostProductionItem[];
  isLoading?: boolean;
  onItemClick?: (item: PostProductionItem) => void;
  onEditClick?: (item: PostProductionItem) => void;
}

export function PPTable({ items, isLoading }: PPTableProps) {
  const { updateItem } = usePostProductionMutations();
  const { users } = useUsers();
  const { latestByItem } = usePPLatestVersions();
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState<PPSortableField>('due_date');
  const [sortOrder, setSortOrder] = useState<PPSortOrder>('asc');
  const [deliveredOpen, setDeliveredOpen] = useState(false);

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
        case 'project_name': {
          const pA = a.project_name || a.client_name || '';
          const pB = b.project_name || b.client_name || '';
          cmp = pA.localeCompare(pB, 'pt-BR');
          break;
        }
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [items, sortBy, sortOrder]);

  const activeItems = sortedItems.filter((i) => i.status !== 'entregue');
  const deliveredItems = useMemo(
    () =>
      [...sortedItems.filter((i) => i.status === 'entregue')].sort((a, b) => {
        const dateA = a.delivered_date || a.updated_at;
        const dateB = b.delivered_date || b.updated_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }),
    [sortedItems]
  );

  const handleSort = (field: PPSortableField, order: PPSortOrder) => {
    setSortBy(field);
    setSortOrder(order);
  };

  if (isLoading) {
    return (
      <div className="tbl" style={{ gridTemplateColumns: PP_COLS, border: '1px solid hsl(var(--ds-line-1))' }}>
        <div className="tbl-head">
          <div>Entrega</div>
          <div>Editor</div>
          <div>Fase atual → próxima</div>
          <div>Pipeline</div>
          <div>Prioridade</div>
          <div>Última versão</div>
          <div>Prazo</div>
          <div aria-label="Abrir" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={'tbl-row' + (i === 5 ? ' last' : '')}>
            <div><span className="sk line lg" style={{ width: '70%' }} /></div>
            <div><span className="sk line" style={{ width: 100 }} /></div>
            <div><span className="sk line" style={{ width: 150 }} /></div>
            <div><span className="sk line" style={{ width: 120 }} /></div>
            <div><span className="sk line" style={{ width: 80 }} /></div>
            <div><span className="sk line" style={{ width: 40 }} /></div>
            <div><span className="sk line" style={{ width: 100 }} /></div>
            <div />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="tbl" style={{ gridTemplateColumns: PP_COLS, border: '1px solid hsl(var(--ds-line-1))' }}>
        <div className="tbl-head">
          <div>
            <PPSortableHeader field="title" label="Entrega" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </div>
          <div>
            <PPSortableHeader field="editor_name" label="Editor" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </div>
          <div>
            <PPSortableHeader field="status" label="Fase atual → próxima" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </div>
          <div>Pipeline</div>
          <div>
            <PPSortableHeader field="priority" label="Prioridade" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </div>
          <div>Última versão</div>
          <div>
            <PPSortableHeader field="due_date" label="Prazo" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </div>
          <div aria-label="Abrir" />
        </div>

        {activeItems.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={Film}
              title="Nenhum vídeo em produção"
              description="Adicione um novo vídeo à esteira para começar."
              variant="bare"
            />
          </div>
        ) : (
          activeItems.map((item, idx) => {
            const isLast = idx === activeItems.length - 1;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue =
              item.due_date && item.status !== 'entregue' && new Date(item.due_date + 'T00:00:00') < today;
            const daysOverdue = isOverdue
              ? Math.floor((today.getTime() - new Date(item.due_date! + 'T00:00:00').getTime()) / 86400000)
              : 0;

            return (
              <div
                key={item.id}
                className={'tbl-row' + (isLast ? ' last' : '')}
                onClick={() => navigate(`/esteira-de-pos/${item.id}`)}
              >
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Eyebrow: pj-dot + projeto */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: '"HN Display", sans-serif',
                        fontSize: 9,
                        fontWeight: 500,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'hsl(var(--ds-fg-4))',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          background: projectColor(item.project_id),
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 200,
                        }}
                      >
                        {[item.client_name, item.project_name].filter(Boolean).join(' · ') || 'Sem projeto'}
                      </span>
                    </div>
                    <span className="t-title">{item.title}</span>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--ds-fg-4))',
                        fontFamily: '"HN Display", sans-serif',
                      }}
                    >
                      atualizado · {relTime(item.updated_at)}
                    </span>
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <InlineAssigneeCell
                    value={item.editor_id ? [item.editor_id] : []}
                    users={users}
                    avatarShape="square"
                    singleSelect
                    onSave={(values) => {
                      const newId = values[0] || null;
                      const editorUser = users.find((u) => u.id === newId);
                      updateItem.mutate({
                        id: item.id,
                        updates: { editor_id: newId, editor_name: editorUser?.display_name || null },
                      });
                    }}
                  />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <StageNowNext status={item.status} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <PipelineProgress status={item.status} isOverdue={!!isOverdue} />
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <InlineSelectCell
                    value={item.priority}
                    options={Object.entries(PP_PRIORITY_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))}
                    onSave={(v) => updateItem.mutate({ id: item.id, updates: { priority: v as PPPriority } })}
                    renderValue={(v) => <PPPriorityBadge priority={v as PPPriority} />}
                    renderOption={(v) => <PPPriorityBadge priority={v as PPPriority} />}
                  />
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  {(() => {
                    const latest = latestByItem.get(item.id);
                    if (!latest) {
                      return (
                        <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-4))' }}>—</span>
                      );
                    }
                    return (
                      <a
                        href={latest.frame_io_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Abrir V${latest.version_number} no Frame.io`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontFamily: '"HN Display", sans-serif',
                          fontWeight: 500,
                          fontVariantNumeric: 'tabular-nums',
                          color: 'hsl(var(--ds-accent))',
                          border: '1px solid hsl(var(--ds-accent) / 0.4)',
                          background: 'hsl(var(--ds-accent) / 0.06)',
                          textDecoration: 'none',
                          transition: 'background 120ms, border-color 120ms',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'hsl(var(--ds-accent) / 0.14)';
                          e.currentTarget.style.borderColor = 'hsl(var(--ds-accent))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'hsl(var(--ds-accent) / 0.06)';
                          e.currentTarget.style.borderColor = 'hsl(var(--ds-accent) / 0.4)';
                        }}
                      >
                        <span>V{latest.version_number}</span>
                        <ExternalLink size={10} strokeWidth={1.75} style={{ opacity: 0.85, flexShrink: 0 }} />
                      </a>
                    );
                  })()}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  {isOverdue ? (
                    <div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'hsl(var(--ds-danger))',
                          fontSize: 13,
                          fontWeight: 500,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        <AlertTriangle size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                        {format(new Date(item.due_date! + 'T00:00:00'), 'dd/MM/yyyy')}
                      </div>
                      <p style={{ fontSize: 11, color: 'hsl(var(--ds-danger))', marginTop: 2 }}>
                        Atrasada há {daysOverdue} dia{daysOverdue !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ) : (
                    <InlineDateCell
                      value={item.due_date}
                      onSave={(v) => updateItem.mutate({ id: item.id, updates: { due_date: v } })}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/esteira-de-pos/${item.id}`);
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: '1px solid hsl(var(--ds-line-1))',
                      color: 'hsl(var(--ds-fg-2))',
                      cursor: 'pointer',
                      transition: 'color 120ms, background 120ms, border-color 120ms',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'hsl(var(--ds-bg))';
                      e.currentTarget.style.background = 'hsl(var(--ds-fg-1))';
                      e.currentTarget.style.borderColor = 'hsl(var(--ds-fg-1))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'hsl(var(--ds-fg-2))';
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                    }}
                    aria-label="Abrir detalhes"
                    title="Abrir detalhes"
                  >
                    <ChevronRight size={18} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {deliveredItems.length > 0 && (
        <CollapsibleSection
          title="Entregues"
          count={deliveredItems.length}
          collapsible
          open={deliveredOpen}
          onOpenChange={setDeliveredOpen}
          rightSlot="Ordenado por mais recente"
        >
          <div className="tbl" style={{ gridTemplateColumns: '1.6fr 130px minmax(160px, 1fr) 1fr', border: '1px solid hsl(var(--ds-line-1))' }}>
            <div className="tbl-head">
              <div>Título</div>
              <div>Editor</div>
              <div>Pipeline</div>
              <div>Entregue em</div>
            </div>
            {deliveredItems.map((item, idx) => {
              const isLast = idx === deliveredItems.length - 1;
              return (
                <div
                  key={item.id}
                  className={'tbl-row' + (isLast ? ' last' : '')}
                  onClick={() => navigate(`/esteira-de-pos/${item.id}`)}
                  style={{ opacity: 0.75 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.75';
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className="t-title">{item.title}</span>
                      <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                        {[item.client_name, item.project_name].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <InlineAssigneeCell
                      value={item.editor_id ? [item.editor_id] : []}
                      users={users}
                      singleSelect
                      onSave={(values) => {
                        const newId = values[0] || null;
                        const editorUser = users.find((u) => u.id === newId);
                        updateItem.mutate({
                          id: item.id,
                          updates: { editor_id: newId, editor_name: editorUser?.display_name || null },
                        });
                      }}
                    />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <PipelineProgress status={item.status} />
                  </div>
                  <div style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                    {item.delivered_date
                      ? format(new Date(item.delivered_date + 'T00:00:00'), 'dd/MM/yyyy')
                      : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}
    </>
  );
}
