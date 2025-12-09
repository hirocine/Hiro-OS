import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { TaskDialog } from '@/features/tasks/components/TaskDialog';
import { RecentActivityWidget } from '@/features/tasks/components/RecentActivityWidget';
import { TaskCalendarWidget } from '@/features/tasks/components/TaskCalendarWidget';
import { TaskSectionCards } from '@/features/tasks/components/TaskSectionCards';

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
        {/* Calendar Widget */}
        <TaskCalendarWidget />

        {/* Section Navigation Cards */}
        <TaskSectionCards />

        {/* Recent Activity */}
        <RecentActivityWidget />
      </div>

      <TaskDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </ResponsiveContainer>
  );
}
