import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
        case 'assignee_name':
          const nameA = a.assignees?.[0]?.display_name || '';
          const nameB = b.assignees?.[0]?.display_name || '';
          if (!nameA && !nameB) comparison = 0;
          else if (!nameA) comparison = 1;
          else if (!nameB) comparison = -1;
          else comparison = nameA.localeCompare(nameB, 'pt-BR');
          break;
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
          <TableHead className={showAssignee ? "w-[25%]" : "w-[30%]"} style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="title" label="Título" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
          </TableHead>
          <TableHead className="w-[12%]" style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="priority" label="Prioridade" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
          </TableHead>
          <TableHead className="w-[12%]" style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="status" label="Status" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
          </TableHead>
          {showAssignee && (
            <TableHead className="w-[18%]" style={{ textAlign: 'left' }}>
              <TaskSortableHeader field="assignee_name" label="Responsáveis" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
            </TableHead>
          )}
          <TableHead className="w-[18%]" style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="due_date" label="Prazo" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
          </TableHead>
          <TableHead className="w-[15%]" style={{ textAlign: 'left' }}>
            <TaskSortableHeader field="department" label="Departamento" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Creation row */}
        {showCreationRow && (
          <TableRow className={`border-dashed ${!isTaskActive() ? 'opacity-70 hover:opacity-100' : ''}`}>
            <TableCell style={{ textAlign: 'left' }}>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="+ Adicionar nova tarefa..."
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                  className="border-0 p-0 h-auto text-sm bg-transparent focus-visible:ring-0 placeholder:italic"
                />
              </div>
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineSelectCell
                value={newTask.priority}
                options={Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({ value, label: config.label }))}
                onSave={(value) => setNewTask(prev => ({ ...prev, priority: value as TaskPriority }))}
                renderValue={(val) => 
                  isTaskActive() ? <PriorityBadge priority={val as TaskPriority} /> : <span className="text-muted-foreground text-sm flex items-center gap-1">Selecionar <ChevronDown className="w-3 h-3" /></span>
                }
                renderOption={(optVal) => <PriorityBadge priority={optVal as TaskPriority} />}
              />
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineSelectCell
                value={newTask.status}
                options={Object.entries(STATUS_CONFIG).map(([value, config]) => ({ value, label: config.label }))}
                onSave={(value) => setNewTask(prev => ({ ...prev, status: value as TaskStatus }))}
                renderValue={(val) => 
                  isTaskActive() ? <StatusBadge status={val as TaskStatus} /> : <span className="text-muted-foreground text-sm flex items-center gap-1">Selecionar <ChevronDown className="w-3 h-3" /></span>
                }
                renderOption={(optVal) => <StatusBadge status={optVal as TaskStatus} />}
              />
            </TableCell>
            {showAssignee && (
              <TableCell style={{ textAlign: 'left' }}>
                <InlineAssigneeCell
                  value={newTask.assignee_ids}
                  users={users}
                  onSave={(value) => setNewTask(prev => ({ ...prev, assignee_ids: value }))}
                  isActive={isTaskActive()}
                />
              </TableCell>
            )}
            <TableCell style={{ textAlign: 'left' }}>
              <InlineDateCell value={newTask.due_date} onSave={(value) => setNewTask(prev => ({ ...prev, due_date: value }))} />
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <div className="flex items-center gap-2">
                <InlineDepartmentCell value={newTask.department} departments={departments} onSave={(value) => setNewTask(prev => ({ ...prev, department: value }))} />
                <Button size="sm" variant="ghost" onClick={handleCreateTask} disabled={!newTask.title.trim()} className="h-6 w-6 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        )}

        {/* Task rows */}
        {sortedTasks.map((task) => (
          <TableRow 
            key={task.id} 
            className="hover:bg-muted/50 cursor-pointer" 
            onClick={() => navigate(`/tarefas/${task.id}`)}
          >
            <TableCell style={{ textAlign: 'left' }}>
              <InlineEditCell
                value={task.title}
                onSave={(value) => updateTask.mutate({ id: task.id, updates: { title: value }, oldTask: task })}
              />
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineSelectCell
                value={task.priority}
                options={Object.entries(PRIORITY_CONFIG).map(([val, config]) => ({ value: val, label: config.label }))}
                onSave={(val) => updateTask.mutate({ id: task.id, updates: { priority: val as TaskPriority }, oldTask: task })}
                renderValue={(val) => <PriorityBadge priority={val as TaskPriority} />}
                renderOption={(optVal) => <PriorityBadge priority={optVal as TaskPriority} />}
              />
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineSelectCell
                value={task.status}
                options={Object.entries(STATUS_CONFIG).map(([val, config]) => ({ value: val, label: config.label }))}
                onSave={(val) => updateTask.mutate({ id: task.id, updates: { status: val as TaskStatus }, oldTask: task })}
                renderValue={(val) => <StatusBadge status={val as TaskStatus} />}
                renderOption={(optVal) => <StatusBadge status={optVal as TaskStatus} />}
              />
            </TableCell>
            {showAssignee && (
              <TableCell style={{ textAlign: 'left' }}>
                <InlineAssigneeCell
                  value={task.assignees?.map(a => a.user_id) || []}
                  users={users}
                  onSave={(newIds) => updateAssignees.mutate({ taskId: task.id, assigneeIds: newIds })}
                />
              </TableCell>
            )}
            <TableCell style={{ textAlign: 'left' }}>
              <InlineDateCell
                value={task.due_date}
                onSave={(val) => updateTask.mutate({ id: task.id, updates: { due_date: val }, oldTask: task })}
              />
            </TableCell>
            <TableCell style={{ textAlign: 'left' }}>
              <InlineDepartmentCell
                value={task.department}
                departments={departments}
                onSave={(value) => updateTask.mutate({ id: task.id, updates: { department: value }, oldTask: task })}
              />
            </TableCell>
          </TableRow>
        ))}

        {/* Empty state */}
        {sortedTasks.length === 0 && !showCreationRow && (
          <TableRow>
            <TableCell colSpan={showAssignee ? 6 : 5} className="text-center py-8 text-muted-foreground">
              Nenhuma tarefa encontrada
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
