import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, ChevronDown, Film } from 'lucide-react';
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

const PIPELINE_STEPS: PPStatus[] = ['fila', 'edicao', 'finalizacao', 'revisao', 'entregue'];

const PP_COLS = '1.6fr 130px minmax(160px, 1fr) 120px 140px';

function PipelineProgress({ status }: { status: PPStatus }) {
  const currentIndex = PIPELINE_STEPS.indexOf(status);
  const config = PP_STATUS_CONFIG[status];
  const total = PIPELINE_STEPS.length;
  const segW = 14;
  const gap = 3;
  const totalW = total * segW + (total - 1) * gap;
  const isDelivered = status === 'entregue';

  const labelColor =
    status === 'entregue' ? 'hsl(var(--ds-success))'
    : status === 'edicao' ? 'hsl(var(--ds-info))'
    : status === 'color_grading' ? 'hsl(280 70% 60%)'
    : status === 'finalizacao' ? 'hsl(var(--ds-warning))'
    : status === 'revisao' ? 'hsl(var(--ds-warning))'
    : status === 'validacao_cliente' ? 'hsl(var(--ds-info))'
    : 'hsl(var(--ds-fg-3))';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          lineHeight: 1,
          color: labelColor,
        }}
      >
        {config.label}
      </span>
      <svg width={totalW} height={4} style={{ display: 'block' }}>
        {PIPELINE_STEPS.map((_, i) => {
          const x = i * (segW + gap);
          const isCompleted = i < currentIndex;
          const isActive = i === currentIndex;
          const fill = isDelivered
            ? 'hsl(var(--ds-success))'
            : isCompleted
              ? 'hsl(var(--ds-accent))'
              : isActive
                ? 'hsl(var(--ds-accent))'
                : 'hsl(var(--ds-line-2))';
          return (
            <rect
              key={i}
              x={x}
              y={0}
              width={segW}
              height={4}
              fill={fill}
              opacity={isActive && !isDelivered ? 0.5 : 1}
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

export function PPTable({ items, isLoading }: PPTableProps) {
  const { updateItem } = usePostProductionMutations();
  const { users } = useUsers();
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
          <div>Título</div>
          <div>Editor</div>
          <div>Pipeline</div>
          <div>Prioridade</div>
          <div>Prazo</div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={'tbl-row' + (i === 5 ? ' last' : '')}>
            <div><span className="sk line lg" style={{ width: '70%' }} /></div>
            <div><span className="sk line" style={{ width: 100 }} /></div>
            <div><span className="sk line" style={{ width: 120 }} /></div>
            <div><span className="sk line" style={{ width: 80 }} /></div>
            <div><span className="sk line" style={{ width: 100 }} /></div>
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
            <PPSortableHeader field="title" label="Título" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </div>
          <div>
            <PPSortableHeader field="editor_name" label="Editor" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </div>
          <div>
            <PPSortableHeader field="status" label="Pipeline" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </div>
          <div>
            <PPSortableHeader field="priority" label="Prioridade" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </div>
          <div>
            <PPSortableHeader field="due_date" label="Prazo" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort as any} />
          </div>
        </div>

        {activeItems.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: 0 }}>
            <div className="empties" style={{ borderTop: 0, borderLeft: 0, borderRight: 0 }}>
              <div className="empty" style={{ borderRight: 0 }}>
                <div className="glyph"><Film strokeWidth={1.25} /></div>
                <h5>Nenhum vídeo em produção</h5>
                <p>Adicione um novo vídeo à esteira para começar.</p>
              </div>
            </div>
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
              </div>
            );
          })
        )}
      </div>

      {deliveredItems.length > 0 && (
        <div
          style={{
            marginTop: 12,
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
            overflow: 'hidden',
          }}
        >
          <button
            type="button"
            onClick={() => setDeliveredOpen((o) => !o)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'hsl(var(--ds-line-2) / 0.4)',
              border: 0,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                style={{
                  color: 'hsl(var(--ds-fg-3))',
                  transition: 'transform 0.2s',
                  transform: deliveredOpen ? 'rotate(180deg)' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  color: 'hsl(var(--ds-fg-3))',
                }}
              >
                Entregues
              </span>
              <span
                className="pill"
                style={{
                  color: 'hsl(var(--ds-success))',
                  borderColor: 'hsl(var(--ds-success) / 0.3)',
                  fontSize: 10,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {deliveredItems.length}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))' }}>Ordenado por mais recente</span>
          </button>

          {deliveredOpen && (
            <div className="tbl" style={{ gridTemplateColumns: '1.6fr 130px minmax(160px, 1fr) 1fr', borderTop: '1px solid hsl(var(--ds-line-1))' }}>
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
          )}
        </div>
      )}
    </>
  );
}
