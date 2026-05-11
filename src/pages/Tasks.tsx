import { useState, useMemo, useEffect } from 'react';
import { Plus, List, Columns3, CalendarDays } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { TasksTable } from '@/features/tasks/components/TasksTable';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
import { TaskKanbanView } from '@/features/tasks/components/TaskKanbanView';
import { TaskCalendarView } from '@/features/tasks/components/TaskCalendarView';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { useFilteredTaskStats } from '@/features/tasks/hooks/useFilteredTaskStats';
import { useUsers } from '@/hooks/useUsers';
import { useDepartments } from '@/features/tasks/hooks/useDepartments';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/features/tasks/types';
import {
  PageHeader,
  PageToolbar,
  SearchField,
  FilterDropdown,
  ViewToggle,
  FilterIndicator,
  type ViewToggleItem,
} from '@/ds/components/toolbar';
import { CollapsibleSection } from '@/ds/components/CollapsibleSection';
import { CountUp } from '@/ds/components/CountUp';

type ViewType = 'lista' | 'kanban' | 'calendario';

const TASKS_VIEWS: ViewToggleItem<ViewType>[] = [
  { value: 'lista', label: 'Lista', icon: List },
  { value: 'kanban', label: 'Kanban', icon: Columns3 },
  { value: 'calendario', label: 'Calendário', icon: CalendarDays },
];

export default function Tasks() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('lista');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  // Reset status filter when switching to lista view (sections handle status there)
  useEffect(() => {
    if (currentView === 'lista') {
      setFilterStatus('all');
    }
  }, [currentView]);

  const { tasks, isLoading } = useTasks();
  const { users } = useUsers();
  const { departments } = useDepartments();

  // Filter pipeline
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterDepartment !== 'all' && task.department !== filterDepartment) return false;
      if (filterAssignee !== 'all' && !task.assignees?.some((a) => a.user_id === filterAssignee)) return false;
      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterStatus, filterDepartment, filterAssignee]);

  const stats = useFilteredTaskStats(filteredTasks);

  const activeTasks = useMemo(
    () => filteredTasks.filter((t) => t.status !== 'concluida' && t.status !== 'arquivada'),
    [filteredTasks],
  );
  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'concluida'),
    [filteredTasks],
  );
  const archivedTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'arquivada'),
    [filteredTasks],
  );

  const hasActiveFilter =
    !!searchQuery ||
    filterPriority !== 'all' ||
    filterStatus !== 'all' ||
    filterDepartment !== 'all' ||
    filterAssignee !== 'all';

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterPriority('all');
    setFilterStatus('all');
    setFilterDepartment('all');
    setFilterAssignee('all');
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        {/* 01 — Header */}
        <PageHeader
          title="Tarefas."
          subtitle="Gerencie suas tarefas e acompanhe o progresso."
          action={
            <button className="btn primary" onClick={() => setDialogOpen(true)} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Nova Tarefa</span>
            </button>
          }
        />

        {/* 02 — Stats */}
        <div className="summary" style={{ marginTop: 24 }}>
          <div className="stat">
            <span className="stat-lbl">Ativas</span>
            <span className="stat-num">{isLoading ? '—' : <CountUp value={stats.active} />}</span>
          </div>
          <div className={'stat' + (stats.overdue > 0 ? ' danger' : ' muted')}>
            <span className="stat-lbl">Atrasadas</span>
            <span className="stat-num">{isLoading ? '—' : <CountUp value={stats.overdue} />}</span>
          </div>
          <div className={'stat' + (stats.urgent > 0 ? ' warn' : ' muted')}>
            <span className="stat-lbl">Urgentes</span>
            <span className="stat-num">{isLoading ? '—' : <CountUp value={stats.urgent} />}</span>
          </div>
          <div className="stat success">
            <span className="stat-lbl">Concluídas</span>
            <span className="stat-num">{isLoading ? '—' : <CountUp value={stats.completed} />}</span>
          </div>
        </div>

        {/* 03 — Toolbar */}
        <PageToolbar
          search={
            <SearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar tarefas…"
            />
          }
          filters={[
            <FilterDropdown
              key="priority"
              label="Prioridade"
              value={filterPriority}
              onChange={setFilterPriority}
              options={Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
              allOptionLabel="Todas"
              width="md"
            />,
            currentView !== 'lista' ? (
              <FilterDropdown
                key="status"
                label="Status"
                value={filterStatus}
                onChange={setFilterStatus}
                options={Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
                width="md"
              />
            ) : null,
            <FilterDropdown
              key="dept"
              label="Departamento"
              value={filterDepartment}
              onChange={setFilterDepartment}
              options={departments.map((d) => ({ value: d.name, label: d.name }))}
              width="md"
            />,
            <FilterDropdown
              key="assignee"
              label="Responsável"
              value={filterAssignee}
              onChange={setFilterAssignee}
              options={users.map((u) => ({ value: u.id, label: u.display_name || u.email || u.id }))}
              width="md"
            />,
          ].filter(Boolean) as React.ReactNode[]}
          viewToggle={
            <ViewToggle
              items={TASKS_VIEWS}
              value={currentView}
              onChange={(v) => setCurrentView(v as ViewType)}
            />
          }
        />

        {/* 05 — Filter indicator (auto-rendered when any filter is active) */}
        <FilterIndicator
          active={hasActiveFilter}
          count={filteredTasks.length}
          total={tasks.length}
          noun="tarefas"
          onClear={clearAllFilters}
        />

        {/* 07 — Content */}
        {currentView === 'lista' && (
          <>
            <CollapsibleSection number="01" title="Ativas" count={activeTasks.length}>
              <div className="ds-page-table-host">
                <Tabs value="active">
                  <TabsContent value="active">
                    <TasksTable tasks={activeTasks} isLoading={isLoading} showCreationRow={true} showAssignee={true} />
                  </TabsContent>
                </Tabs>
              </div>
            </CollapsibleSection>

            <CollapsibleSection number="02" title="Concluídas" count={completedTasks.length} collapsible>
              <div className="ds-page-table-host">
                <Tabs value="completed">
                  <TabsContent value="completed">
                    <TasksTable tasks={completedTasks} isLoading={isLoading} showAssignee={true} />
                  </TabsContent>
                </Tabs>
              </div>
            </CollapsibleSection>

            <CollapsibleSection number="03" title="Arquivadas" count={archivedTasks.length} collapsible>
              <div className="ds-page-table-host">
                <Tabs value="archived">
                  <TabsContent value="archived">
                    <TasksTable tasks={archivedTasks} isLoading={isLoading} showAssignee={true} />
                  </TabsContent>
                </Tabs>
              </div>
            </CollapsibleSection>
          </>
        )}

        {currentView === 'kanban' && (
          <div style={{ marginTop: 24 }}>
            <TaskKanbanView tasks={filteredTasks} isLoading={isLoading} />
          </div>
        )}

        {currentView === 'calendario' && (
          <div style={{ marginTop: 24 }}>
            <TaskCalendarView tasks={filteredTasks} isLoading={isLoading} />
          </div>
        )}
      </div>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
