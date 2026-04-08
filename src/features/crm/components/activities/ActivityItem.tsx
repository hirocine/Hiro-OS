import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Mail, Calendar, StickyNote, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Activity } from '../../types/crm.types';
import { useActivityMutations } from '../../hooks/useActivities';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ligacao: Phone, email: Mail, reuniao: Calendar, nota: StickyNote, tarefa: CheckSquare,
};

const typeLabels: Record<string, string> = {
  ligacao: 'Ligação', email: 'E-mail', reuniao: 'Reunião', nota: 'Nota', tarefa: 'Tarefa',
};

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = iconMap[activity.activity_type] ?? StickyNote;
  const { toggleComplete } = useActivityMutations();

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <Checkbox
        checked={activity.is_completed ?? false}
        onCheckedChange={checked => toggleComplete.mutate({ id: activity.id, isCompleted: !!checked })}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">{typeLabels[activity.activity_type] ?? activity.activity_type}</span>
          {activity.scheduled_at && (
            <span className="text-xs text-muted-foreground ml-auto">
              {new Date(activity.scheduled_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        <p className={cn('text-sm mt-0.5', activity.is_completed && 'line-through text-muted-foreground')}>{activity.title}</p>
        {activity.description && <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>}
      </div>
    </div>
  );
}
