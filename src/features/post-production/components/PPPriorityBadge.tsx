import { PPPriority, PP_PRIORITY_CONFIG } from '../types';
import { Badge } from '@/components/ui/badge';

interface PPPriorityBadgeProps {
  priority: PPPriority;
}

export function PPPriorityBadge({ priority }: PPPriorityBadgeProps) {
  const config = PP_PRIORITY_CONFIG[priority];
  return (
    <Badge variant="outline" className={`${config.color} ${config.bgColor} transition-colors hover:brightness-95 dark:hover:brightness-110 cursor-pointer whitespace-nowrap`}>
      {priority === 'urgente' && <span className="mr-1 flex-shrink-0">🔥</span>}
      {config.label}
    </Badge>
  );
}
