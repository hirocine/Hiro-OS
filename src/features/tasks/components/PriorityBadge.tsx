import { TaskPriority, PRIORITY_CONFIG } from '../types';
import { Badge } from '@/components/ui/badge';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${config.bgColor}`}
    >
      {priority === 'urgente' && <span className="mr-1">🔥</span>}
      {config.label}
    </Badge>
  );
}
