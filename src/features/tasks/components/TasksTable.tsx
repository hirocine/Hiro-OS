/**
 * ════════════════════════════════════════════════════════════════
 * TasksTable — redesign enxuto, opcionalmente agrupado por prioridade
 * ════════════════════════════════════════════════════════════════
 *
 * Colunas:
 *   [checkbox] | Tarefa | Projeto | Responsáveis | Prazo | Status
 *
 * Quando `groupByPriority` é true, as tasks são quebradas em sub-grupos
 * (Urgente / Alta / Média / Baixa / Stand-by) com header próprio
 * (barra colorida + label + contador). Quando false, vira tabela simples.
 *
 * Layout: linhas finas, status borderless (dot + label), prazo com
 * chip relativo abaixo da data ("HOJE", "1 DIA", "ATRASADA…"). Click
 * no título navega pra detalhes; click no checkbox toggle status.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Check, Folder } from 'lucide-react';
import { EmptyState } from '@/ds/components/EmptyState';
import { InlineSelectCell } from './InlineSelectCell';
import { InlineDateCell } from './InlineDateCell';
import { InlineDepartmentCell } from './InlineDepartmentCell';
import { InlineAssigneeCell } from './InlineAssigneeCell';
import { StatusBadge } from './StatusBadge';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { useDepartments } from '../hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import {
  Task,
  TaskPriority,
  TaskStatus,
  PRIORITY_ORDER,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TasksTableProps {
  tasks: Task[];
  isLoading?: boolean;
  /** Sub-section header colored bar by priority. Default false. */
  groupByPriority?: boolean;
  /** Show Responsáveis column. Default true. */
  showAssignee?: boolean;
}

// 6 columns: checkbox + title + project + assignee + due + status
const COLS_FULL = '28px minmax(220px, 1.6fr) 180px 140px 120px 110px';
const COLS_NO_ASSIGNEE = '28px minmax(220px, 1.8fr) 180px 120px 110px';

// Priority bar color
const PRIORITY_BAR_COLOR: Record<TaskPriority, string> = {
  urgente: 'hsl(var(--ds-danger))',
  alta:    'hsl(var(--ds-warning))',
  media:   'hsl(var(--ds-info))',
  baixa:   'hsl(var(--ds-fg-3))',
  standby: 'hsl(var(--ds-fg-4))',
};

// Render order (urgente first)
const PRIORITIES_ORDERED: TaskPriority[] = ['urgente', 'alta', 'media', 'baixa', 'standby'];

// Status dot color
const STATUS_DOT_COLOR: Record<TaskStatus, string> = {
  pendente:     'hsl(var(--ds-fg-3))',
  em_progresso: 'hsl(var(--ds-info))',
  concluida:    'hsl(var(--ds-success))',
  arquivada:    'hsl(var(--ds-fg-4))',
};

// Hash function for project color (stable per project id)
function projectColor(id: string | null): string {
  if (!id) return 'hsl(var(--ds-fg-4))';
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 55% 50%)`;
}

const MS_DAY = 24 * 60 * 60 * 1000;
function relDate(due: string | null): { label: string; tone: 'late' | 'today' | 'near' | 'normal' } | null {
  if (!due) return null;
  const dueMs = new Date(due + 'T00:00:00').getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((dueMs - today.getTime()) / MS_DAY);
  if (diff < 0) return { label: `${Math.abs(diff)}d atrás`, tone: 'late' };
  if (diff === 0) return { label: 'Hoje', tone: 'today' };
  if (diff === 1) return { label: 'Amanhã', tone: 'near' };
  if (diff <= 7) return { label: `Em ${diff}d`, tone: 'near' };
  return { label: `Em ${diff}d`, tone: 'normal' };
}

function formatDateBR(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function TasksTable({
  tasks,
  isLoading,
  groupByPriority = false,
  showAssignee = true,
}: TasksTableProps) {
  const navigate = useNavigate();
  const { updateTask, updateAssignees } = useTaskMutations();
  const { users } = useUsers();
  const { departments } = useDepartments();

  const cols = showAssignee ? COLS_FULL : COLS_NO_ASSIGNEE;

  // Build groups when grouping is on
  const groups = useMemo(() => {
    if (!groupByPriority) return [{ priority: null as TaskPriority | null, items: tasks }];
    return PRIORITIES_ORDERED.map((p) => ({
      priority: p,
      items: tasks.filter((t) => t.priority === p),
    })).filter((g) => g.items.length > 0);
  }, [tasks, groupByPriority]);

  if (isLoading) {
    return (
      <div className="tbl" style={{ gridTemplateColumns: cols, border: '1px solid hsl(var(--ds-line-1))' }}>
        <div className="tbl-head">
          <div />
          <div>Tarefa</div>
          <div>Projeto</div>
          {showAssignee && <div>Responsáveis</div>}
          <div>Prazo</div>
          <div>Status</div>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={'tbl-row' + (i === 3 ? ' last' : '')}>
            <div />
            <div><span className="sk line lg" style={{ width: '70%' }} /></div>
            <div><span className="sk line" style={{ width: 100 }} /></div>
            {showAssignee && <div><span className="sk line" style={{ width: 80 }} /></div>}
            <div><span className="sk line" style={{ width: 60 }} /></div>
            <div><span className="sk line" style={{ width: 80 }} /></div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Nenhuma tarefa encontrada"
        description="Crie sua primeira tarefa para começar."
        variant="bare"
      />
    );
  }

  const handleToggleDone = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'concluida' ? 'pendente' : 'concluida';
    updateTask.mutate({
      id: task.id,
      updates: { status: newStatus },
      oldTask: task,
    });
  };

  const renderRow = (task: Task, isLast: boolean) => {
    const isDone = task.status === 'concluida';
    const rel = relDate(task.due_date);
    return (
      <div
        key={task.id}
        className={'tbl-row' + (isLast ? ' last' : '')}
        style={{ cursor: 'default' }}
      >
        {/* Checkbox */}
        <div onClick={(e) => e.stopPropagation()} style={{ paddingRight: 0 }}>
          <button
            type="button"
            onClick={() => handleToggleDone(task)}
            aria-label={isDone ? 'Marcar como pendente' : 'Concluir tarefa'}
            style={{
              width: 16,
              height: 16,
              border: '1.5px solid ' + (isDone ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-line-3, var(--ds-line-1)))'),
              background: isDone ? 'hsl(var(--ds-success))' : 'transparent',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              transition: 'border-color 120ms, background 120ms',
            }}
          >
            {isDone ? <Check size={10} strokeWidth={3} color="#fff" /> : null}
          </button>
        </div>

        {/* Title — clickable to open details */}
        <div onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/tarefas/${task.id}`)}
            style={{
              background: 'none',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              fontFamily: '"HN Display", sans-serif',
              fontWeight: 500,
              fontSize: 13.5,
              color: isDone ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
              textAlign: 'left',
              textDecoration: isDone ? 'line-through' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = isDone ? 'line-through' : 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = isDone ? 'line-through' : 'none')}
          >
            {task.title}
          </button>
          {rel?.tone === 'late' && !isDone ? (
            <span
              style={{
                marginLeft: 8,
                fontSize: 9,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-danger))',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={{ width: 4, height: 4, background: 'hsl(var(--ds-danger))' }} />
              Atrasada
            </span>
          ) : null}
        </div>

        {/* Projeto */}
        <div onClick={(e) => e.stopPropagation()}>
          {task.project_id && task.project_name ? (
            <button
              type="button"
              onClick={() => navigate(`/projetos-av/${task.project_id}`)}
              style={{
                background: 'none',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'hsl(var(--ds-fg-2))',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-1))')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-2))')}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: projectColor(task.project_id),
                  flexShrink: 0,
                }}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.project_name}</span>
            </button>
          ) : (
            <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-4))' }}>—</span>
          )}
        </div>

        {/* Responsáveis */}
        {showAssignee && (
          <div onClick={(e) => e.stopPropagation()}>
            <InlineAssigneeCell
              value={task.assignees?.map((a) => a.user_id) || []}
              users={users}
              onSave={(newIds) => updateAssignees.mutate({ taskId: task.id, assigneeIds: newIds })}
            />
          </div>
        )}

        {/* Prazo */}
        <div onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, lineHeight: 1.2 }}>
            <InlineDateCell
              value={task.due_date}
              onSave={(val) => updateTask.mutate({ id: task.id, updates: { due_date: val }, oldTask: task })}
            />
            {rel ? (
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color:
                    rel.tone === 'late'
                      ? 'hsl(var(--ds-danger))'
                      : rel.tone === 'today'
                        ? 'hsl(var(--ds-accent))'
                        : 'hsl(var(--ds-fg-4))',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {rel.label}
              </span>
            ) : null}
          </div>
        </div>

        {/* Status — borderless dot + label, clickable via InlineSelectCell */}
        <div onClick={(e) => e.stopPropagation()}>
          <InlineSelectCell
            value={task.status}
            options={Object.entries(STATUS_CONFIG).map(([val, cfg]) => ({ value: val, label: cfg.label }))}
            onSave={(val) =>
              updateTask.mutate({ id: task.id, updates: { status: val as TaskStatus }, oldTask: task })
            }
            renderValue={(val) => (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color:
                    (val as TaskStatus) === 'concluida'
                      ? 'hsl(var(--ds-fg-4))'
                      : 'hsl(var(--ds-fg-2))',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    background: STATUS_DOT_COLOR[val as TaskStatus],
                    flexShrink: 0,
                  }}
                />
                {STATUS_CONFIG[val as TaskStatus]?.label ?? val}
              </span>
            )}
            renderOption={(val) => <StatusBadge status={val as TaskStatus} />}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      {groups.map((group, gIdx) => (
        <div key={group.priority ?? 'all'} style={{ marginTop: gIdx === 0 ? 0 : 32 }}>
          {group.priority && groupByPriority && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0 12px',
                borderBottom: '1px solid hsl(var(--ds-line-1))',
                marginBottom: 0,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--ds-fg-1))',
                }}
              >
                <span style={{ width: 24, height: 3, background: PRIORITY_BAR_COLOR[group.priority] }} />
                {PRIORITY_CONFIG[group.priority].label}
              </span>
              <span
                style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'hsl(var(--ds-fg-4))',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {String(group.items.length).padStart(2, '0')}
              </span>
            </div>
          )}

          <div
            className="tbl"
            style={{
              gridTemplateColumns: cols,
              border: group.priority && groupByPriority ? 'none' : '1px solid hsl(var(--ds-line-1))',
              borderTop: group.priority && groupByPriority ? 'none' : '1px solid hsl(var(--ds-line-1))',
            }}
          >
            <div className="tbl-head">
              <div />
              <div>Tarefa</div>
              <div>Projeto</div>
              {showAssignee && <div>Responsáveis</div>}
              <div>Prazo</div>
              <div>Status</div>
            </div>
            {group.items.map((task, idx) => renderRow(task, idx === group.items.length - 1))}
          </div>
        </div>
      ))}
    </div>
  );
}
