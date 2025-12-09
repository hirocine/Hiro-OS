import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { TaskCalendarWidget } from '@/features/tasks/components/TaskCalendarWidget';
import { TaskSectionCards } from '@/features/tasks/components/TaskSectionCards';

export default function Tasks() {
  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Tarefas"
        subtitle="Gerencie suas tarefas e acompanhe o progresso do time"
      />

      <div className="space-y-6">
        {/* Calendar Widget */}
        <TaskCalendarWidget />

        {/* Section Navigation Cards */}
        <TaskSectionCards />
      </div>
    </ResponsiveContainer>
  );
}
