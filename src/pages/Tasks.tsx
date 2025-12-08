import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TaskStatsCards } from '@/features/tasks/components/TaskStatsCards';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
import { UrgentTasksWidget } from '@/features/tasks/components/UrgentTasksWidget';
import { UpcomingDeadlinesWidget } from '@/features/tasks/components/UpcomingDeadlinesWidget';
import { RecentActivityWidget } from '@/features/tasks/components/RecentActivityWidget';
import { QuickActionsCard } from '@/features/tasks/components/QuickActionsCard';
import { TaskCalendarWidget } from '@/features/tasks/components/TaskCalendarWidget';

export default function Tasks() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Tarefas"
        subtitle="Gerencie suas tarefas e acompanhe o progresso do time"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Stats Cards */}
        <TaskStatsCards />

        {/* Calendar Widget - Full Width */}
        <TaskCalendarWidget />

        {/* Main Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UrgentTasksWidget />
          <UpcomingDeadlinesWidget />
        </div>

        {/* Secondary Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <QuickActionsCard />
          <div className="lg:col-span-2">
            <RecentActivityWidget />
          </div>
        </div>
      </div>

      <TaskDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </ResponsiveContainer>
  );
}
