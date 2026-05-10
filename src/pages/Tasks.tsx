import { useState, useMemo, useEffect } from 'react';
import { Plus, User, CheckCircle, Archive, List, Columns3, CalendarDays, Search } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { TaskSummaryBar } from '@/features/tasks/components/TaskSummaryBar';
import { TasksTable } from '@/features/tasks/components/TasksTable';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
import { TaskKanbanView } from '@/features/tasks/components/TaskKanbanView';
import { TaskCalendarView } from '@/features/tasks/components/TaskCalendarView';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useFilteredTaskStats } from '@/features/tasks/hooks/useFilteredTaskStats';
import { useAuthContext } from '@/contexts/AuthContext';
import { useUsers } from '@/hooks/useUsers';
import { useDepartments } from '@/features/tasks/hooks/useDepartments';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/features/tasks/types';

type ViewType = 'lista' | 'kanban' | 'calendario';
type ListaTab = 'active' | 'mine' | 'completed' | 'archived';

export default function Tasks() {
  const { user } = useAuthContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  const [currentView, setCurrentView] = useState<ViewType>('lista');
  const [listaTab, setListaTab] = useState<ListaTab>('active');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  // Reset status filter when switching to lista view (tabs handle status there)
  useEffect(() => {
    if (currentView === 'lista') {
      setFilterStatus('all');
    }
  }, [currentView]);

  // Data
  const { tasks, isLoading } = useTasks();
  const { users } = useUsers();
  const { departments } = useDepartments();

  // Filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterDepartment !== 'all' && task.department !== filterDepartment) return false;
      if (filterAssignee !== 'all' && !task.assignees?.some(a => a.user_id === filterAssignee)) return false;
      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterStatus, filterDepartment, filterAssignee]);

  const stats = useFilteredTaskStats(filteredTasks);

  const activeTasks = useMemo(() =>
    filteredTasks.filter(t => t.status !== 'concluida' && t.status !== 'arquivada'),
    [filteredTasks]
  );
  const myTasks = useMemo(() =>
    activeTasks.filter(t => t.assignees?.some(a => a.user_id === user?.id)),
    [activeTasks, user?.id]
  );
  const completedTasks = useMemo(() =>
    filteredTasks.filter(t => t.status === 'concluida'),
    [filteredTasks]
  );
  const archivedTasks = useMemo(() =>
    filteredTasks.filter(t => t.status === 'arquivada'),
    [filteredTasks]
  );

  const hasActiveFilter = searchQuery || filterPriority !== 'all' || filterStatus !== 'all' ||
    filterDepartment !== 'all' || filterAssignee !== 'all';

  const tasksForActiveTab =
    listaTab === 'active' ? activeTasks :
    listaTab === 'mine' ? myTasks :
    listaTab === 'completed' ? completedTasks : archivedTasks;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        {/* Page header */}
        <div className="ph">
          <div>
            <h1 className="ph-title">Tarefas.</h1>
            <p className="ph-sub">Gerencie suas tarefas e acompanhe o progresso.</p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={() => setDialogOpen(true)} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="summary" style={{ marginTop: 24 }}>
          <div className="stat">
            <span className="stat-lbl">Ativas</span>
            <span className="stat-num">{isLoading ? '—' : stats.active}</span>
          </div>
          <div className={'stat' + (stats.overdue > 0 ? ' danger' : ' muted')}>
            <span className="stat-lbl">Atrasadas</span>
            <span className="stat-num">{isLoading ? '—' : stats.overdue}</span>
          </div>
          <div className={'stat' + (stats.urgent > 0 ? ' warn' : ' muted')}>
            <span className="stat-lbl">Urgentes</span>
            <span className="stat-num">{isLoading ? '—' : stats.urgent}</span>
          </div>
          <div className="stat success">
            <span className="stat-lbl">Concluídas</span>
            <span className="stat-num">{isLoading ? '—' : stats.completed}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 20 }}>
          {/* View toggle (segmented) */}
          <div className="tabs-seg">
            <button className={'s' + (currentView === 'lista' ? ' on' : '')} onClick={() => setCurrentView('lista')} type="button">
              <List />Lista
            </button>
            <button className={'s' + (currentView === 'kanban' ? ' on' : '')} onClick={() => setCurrentView('kanban')} type="button">
              <Columns3 />Kanban
            </button>
            <button className={'s' + (currentView === 'calendario' ? ' on' : '')} onClick={() => setCurrentView('calendario')} type="button">
              <CalendarDays />Calendário
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search
              size={14}
              strokeWidth={1.5}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--ds-fg-4))', pointerEvents: 'none' }}
            />
            <input
              className="field-input"
              placeholder="Buscar tarefas…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: 34 }}
            />
          </div>

          {/* Priority filter */}
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentView !== 'lista' && (
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {departments.map(d => (<SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>))}
            </SelectContent>
          </Select>

          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map(u => (<SelectItem key={u.id} value={u.id}>{u.display_name || u.email}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* Active filters indicator */}
        {hasActiveFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
            <span>Filtros ativos · mostrando <strong style={{ color: 'hsl(var(--ds-fg-1))' }}>{filteredTasks.length}</strong> de {tasks.length} tarefas</span>
            <button
              type="button"
              style={{ fontFamily: '"HN Display"', fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'hsl(var(--ds-fg-3))', cursor: 'pointer' }}
              onClick={() => {
                setSearchQuery('');
                setFilterPriority('all');
                setFilterStatus('all');
                setFilterDepartment('all');
                setFilterAssignee('all');
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ marginTop: 24 }}>
          {currentView === 'lista' && (
            <>
              <div className="tabs-bar">
                <button className={'tab' + (listaTab === 'active' ? ' on' : '')} onClick={() => setListaTab('active')} type="button">
                  Ativas <span className="ct">{activeTasks.length}</span>
                </button>
                <button className={'tab' + (listaTab === 'mine' ? ' on' : '')} onClick={() => setListaTab('mine')} type="button">
                  <User />Minhas <span className="ct">{myTasks.length}</span>
                </button>
                <button className={'tab' + (listaTab === 'completed' ? ' on' : '')} onClick={() => setListaTab('completed')} type="button">
                  <CheckCircle />Concluídas <span className="ct">{completedTasks.length}</span>
                </button>
                <button className={'tab' + (listaTab === 'archived' ? ' on' : '')} onClick={() => setListaTab('archived')} type="button">
                  <Archive />Arquivadas <span className="ct">{archivedTasks.length}</span>
                </button>
              </div>

              {/* Wrap TasksTable outside ds-shell so its own shadcn Table styles apply normally */}
              <div style={{ marginTop: 16 }} className="ds-page-table-host">
                <Tabs value={listaTab}>
                  <TabsContent value="active">
                    <TasksTable tasks={activeTasks} isLoading={isLoading} showCreationRow={true} showAssignee={true} />
                  </TabsContent>
                  <TabsContent value="mine">
                    <TasksTable tasks={myTasks} isLoading={isLoading} showAssignee={true} />
                  </TabsContent>
                  <TabsContent value="completed">
                    <TasksTable tasks={completedTasks} isLoading={isLoading} showAssignee={true} />
                  </TabsContent>
                  <TabsContent value="archived">
                    <TasksTable tasks={archivedTasks} isLoading={isLoading} showAssignee={true} />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}

          {currentView === 'kanban' && (
            <TaskKanbanView tasks={filteredTasks} isLoading={isLoading} />
          )}

          {currentView === 'calendario' && (
            <TaskCalendarView tasks={filteredTasks} isLoading={isLoading} />
          )}
        </div>
      </div>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
