import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Inbox, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/ds/components/EmptyState';
import { Input } from '@/components/ui/input';
import { TaskSortableHeader } from './TaskSortableHeader';
import { InlineEditCell } from './InlineEditCell';
import { InlineSelectCell } from './InlineSelectCell';
import { InlineDateCell } from './InlineDateCell';
import { InlineDepartmentCell } from './InlineDepartmentCell';
import { InlineAssigneeCell } from './InlineAssigneeCell';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { useDepartments } from '../hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Task,
  TaskPriority,
  TaskStatus,
  TaskSortableField,
  TaskSortOrder,
  PRIORITY_ORDER,
  STATUS_ORDER,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
} from '../types';

interface TasksTableProps {
  tasks: Task[];
  isLoading?: boolean;
  showCreationRow?: boolean;
  showAssignee?: boolean;
}

const defaultTaskState = {
  title: '',
  priority: 'standby' as TaskPriority,
  status: 'pendente' as TaskStatus,
  assignee_ids: [] as string[],
  due_date: null as string | null,
  department: null as string | null,
};

const COLS_WITH_ASSIGNEE = '1.5fr 130px 120px 1fr 140px 1fr 64px';
const COLS_WITHOUT_ASSIGNEE = '2fr 130px 120px 140px 1fr 64px';

export function TasksTable({
  tasks,
  isLoading,
  showCreationRow = false,
  showAssignee = true,
}: TasksTableProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { updateTask, updateAssignees, createTask } = useTaskMutations();
  const { departments } = useDepartments();
  const { users } = useUsers();

  const [sortBy, setSortBy] = useState<TaskSortableField>('due_date');
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>('asc');
  const [newTask, setNewTask] = useState(defaultTaskState);

  const parseLocalDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const sortedTasks = useMemo(() => {
    if (!tasks.length) return tasks;

    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '', 'pt-BR');
          break;
        case 'priority':
          comparison = (PRIORITY_ORDER[a.priority as TaskPriority] ?? -1) - (PRIORITY_ORDER[b.priority as TaskPriority] ?? -1);
          break;
        case 'status':
          comparison = (STATUS_ORDER[a.status as TaskStatus] ?? -1) - (STATUS_ORDER[b.status as TaskStatus] ?? -1);
          break;
        case 'assignee_name': {
          const nameA = a.assignees?.[0]?.display_name || '';
          const nameB = b.assignees?.[0]?.display_name || '';
          if (!nameA && !nameB) comparison = 0;
          else if (!nameA) comparison = 1;
          else if (!nameB) comparison = -1;
          else comparison = nameA.localeCompare(nameB, 'pt-BR');
          break;
        }
        case 'due_date':
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = parseLocalDate(a.due_date).getTime() - parseLocalDate(b.due_date).getTime();
          break;
        case 'department':
          if (!a.department && !b.department) comparison = 0;
          else if (!a.department) comparison = 1;
          else if (!b.department) comparison = -1;
          else comparison = a.department.localeCompare(b.department, 'pt-BR');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortBy, sortOrder]);

  const handleSort = (field: TaskSortableField, order: TaskSortOrder) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const isTaskActive = () => {
    return (
      newTask.title !== defaultTaskState.title ||
      newTask.priority !== defaultTaskState.priority ||
      newTask.status !== defaultTaskState.status ||
      newTask.assignee_ids.length > 0 ||
      newTask.due_date !== defaultTaskState.due_date ||
      newTask.department !== defaultTaskState.department
    );
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !user) return;

    try {
      await createTask.mutateAsync({
        title: newTask.title,
        priority: newTask.priority,
        status: newTask.status,
        due_date: newTask.due_date,
        department: newTask.department,
        assignee_ids: newTask.assignee_ids,
      });
      setNewTask(defaultTaskState);
      toast.success('Tarefa criada com sucesso');
    } catch (error) {
      toast.error('Erro ao criar tarefa');
    }
  };

  const cols = showAssignee ? COLS_WITH_ASSIGNEE : COLS_WITHOUT_ASSIGNEE;

  if (isLoading) {
    return (
      <div className="tbl" style={{ gridTemplateColumns: cols, border: '1px solid hsl(var(--ds-line-1))' }}>
        <div className="tbl-head">
          <div>Título</div>
          <div>Prioridade</div>
          <div>Status</div>
          {showAssignee && <div>Responsáveis</div>}
          <div>Prazo</div>
          <div>Departamento</div>
          <div aria-label="Abrir" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={'tbl-row' + (i === 4 ? ' last' : '')}>
            <div><span className="sk line lg" style={{ width: '70%' }} /></div>
            <div><span className="sk line" style={{ width: 80 }} /></div>
            <div><span className="sk line" style={{ width: 80 }} /></div>
            {showAssignee && <div><span className="sk line" style={{ width: 100 }} /></div>}
            <div><span className="sk line" style={{ width: 100 }} /></div>
            <div><span className="sk line" style={{ width: 90 }} /></div>
            <div />
          </div>
        ))}
      </div>
    );
  }

  const totalRows = sortedTasks.length + (showCreationRow ? 1 : 0);

  return (
    <div className="tbl" style={{ gridTemplateColumns: cols, border: '1px solid hsl(var(--ds-line-1))' }}>
      <div className="tbl-head">
        <div>
          <TaskSortableHeader field="title" label="Título" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
        </div>
        <div>
          <TaskSortableHeader field="priority" label="Prioridade" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
        </div>
        <div>
          <TaskSortableHeader field="status" label="Status" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
        </div>
        {showAssignee && (
          <div>
            <TaskSortableHeader field="assignee_name" label="Responsáveis" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
          </div>
        )}
        <div>
          <TaskSortableHeader field="due_date" label="Prazo" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
        </div>
        <div>
          <TaskSortableHeader field="department" label="Departamento" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
        </div>
        <div aria-label="Abrir" />
      </div>

      {showCreationRow && (
        <div
          className="tbl-row"
          style={{
            opacity: isTaskActive() ? 1 : 0.7,
            background: isTaskActive() ? 'hsl(var(--ds-line-2) / 0.3)' : 'transparent',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))' }} />
              <Input
                placeholder="+ Adicionar nova tarefa…"
                value={newTask.title}
                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                style={{
                  border: 0,
                  padding: 0,
                  height: 'auto',
                  background: 'transparent',
                  fontSize: 13,
                  fontStyle: 'italic',
                }}
              />
            </div>
          </div>
          <div>
            <InlineSelectCell
              value={newTask.priority}
              options={Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({ value, label: config.label }))}
              onSave={(value) => setNewTask((prev) => ({ ...prev, priority: value as TaskPriority }))}
              renderValue={(val) =>
                isTaskActive() ? (
                  <PriorityBadge priority={val as TaskPriority} />
                ) : (
                  <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-4))', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    Selecionar <ChevronDown size={11} strokeWidth={1.5} />
                  </span>
                )
              }
              renderOption={(optVal) => <PriorityBadge priority={optVal as TaskPriority} />}
            />
          </div>
          <div>
            <InlineSelectCell
              value={newTask.status}
              options={Object.entries(STATUS_CONFIG).map(([value, config]) => ({ value, label: config.label }))}
              onSave={(value) => setNewTask((prev) => ({ ...prev, status: value as TaskStatus }))}
              renderValue={(val) =>
                isTaskActive() ? (
                  <StatusBadge status={val as TaskStatus} />
                ) : (
                  <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-4))', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    Selecionar <ChevronDown size={11} strokeWidth={1.5} />
                  </span>
                )
              }
              renderOption={(optVal) => <StatusBadge status={optVal as TaskStatus} />}
            />
          </div>
          {showAssignee && (
            <div>
              <InlineAssigneeCell
                value={newTask.assignee_ids}
                users={users}
                onSave={(value) => setNewTask((prev) => ({ ...prev, assignee_ids: value }))}
                isActive={isTaskActive()}
              />
            </div>
          )}
          <div>
            <InlineDateCell value={newTask.due_date} onSave={(value) => setNewTask((prev) => ({ ...prev, due_date: value }))} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <InlineDepartmentCell
                value={newTask.department}
                departments={departments}
                onSave={(value) => setNewTask((prev) => ({ ...prev, department: value }))}
              />
            </div>
            <button
              type="button"
              onClick={handleCreateTask}
              disabled={!newTask.title.trim()}
              style={{
                width: 24,
                height: 24,
                display: 'grid',
                placeItems: 'center',
                background: 'transparent',
                border: 0,
                color: 'hsl(var(--ds-fg-3))',
                cursor: 'pointer',
                opacity: newTask.title.trim() ? 1 : 0.4,
              }}
              aria-label="Criar tarefa"
            >
              <Plus size={14} strokeWidth={1.5} />
            </button>
          </div>
          <div />
        </div>
      )}

      {sortedTasks.map((task, idx) => {
        const isLast = idx === sortedTasks.length - 1;
        return (
          <div
            key={task.id}
            className={'tbl-row' + (isLast ? ' last' : '')}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <InlineEditCell
                value={task.title}
                onSave={(value) => updateTask.mutate({ id: task.id, updates: { title: value }, oldTask: task })}
              />
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <InlineSelectCell
                value={task.priority}
                options={Object.entries(PRIORITY_CONFIG).map(([val, config]) => ({ value: val, label: config.label }))}
                onSave={(val) => updateTask.mutate({ id: task.id, updates: { priority: val as TaskPriority }, oldTask: task })}
                renderValue={(val) => <PriorityBadge priority={val as TaskPriority} />}
                renderOption={(optVal) => <PriorityBadge priority={optVal as TaskPriority} />}
              />
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <InlineSelectCell
                value={task.status}
                options={Object.entries(STATUS_CONFIG).map(([val, config]) => ({ value: val, label: config.label }))}
                onSave={(val) => updateTask.mutate({ id: task.id, updates: { status: val as TaskStatus }, oldTask: task })}
                renderValue={(val) => <StatusBadge status={val as TaskStatus} />}
                renderOption={(optVal) => <StatusBadge status={optVal as TaskStatus} />}
              />
            </div>
            {showAssignee && (
              <div onClick={(e) => e.stopPropagation()}>
                <InlineAssigneeCell
                  value={task.assignees?.map((a) => a.user_id) || []}
                  users={users}
                  onSave={(newIds) => updateAssignees.mutate({ taskId: task.id, assigneeIds: newIds })}
                />
              </div>
            )}
            <div onClick={(e) => e.stopPropagation()}>
              <InlineDateCell
                value={task.due_date}
                onSave={(val) => updateTask.mutate({ id: task.id, updates: { due_date: val }, oldTask: task })}
              />
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <InlineDepartmentCell
                value={task.department}
                departments={departments}
                onSave={(value) => updateTask.mutate({ id: task.id, updates: { department: value }, oldTask: task })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => navigate(`/tarefas/${task.id}`)}
                style={{
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: '1px solid hsl(var(--ds-line-1))',
                  color: 'hsl(var(--ds-fg-2))',
                  cursor: 'pointer',
                  transition: 'color 120ms, background 120ms, border-color 120ms',
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
                aria-label="Abrir detalhes da tarefa"
                title="Abrir detalhes"
              >
                <ChevronRight size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        );
      })}

      {totalRows === 0 && (
        <div style={{ gridColumn: '1 / -1' }}>
          <EmptyState
            icon={Inbox}
            title="Nenhuma tarefa encontrada"
            description="Crie sua primeira tarefa para começar."
            variant="bare"
          />
        </div>
      )}
    </div>
  );
}
