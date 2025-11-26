import { TaskStatus, STATUS_CONFIG } from '../types';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${config.bgColor}`}
    >
      {config.label}
    </Badge>
  );
}
