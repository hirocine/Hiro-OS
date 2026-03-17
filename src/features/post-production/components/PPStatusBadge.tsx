import { PPStatus, PP_STATUS_CONFIG } from '../types';
import { Badge } from '@/components/ui/badge';

interface PPStatusBadgeProps {
  status: PPStatus;
}

export function PPStatusBadge({ status }: PPStatusBadgeProps) {
  const config = PP_STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`${config.color} ${config.bgColor} transition-colors hover:brightness-95 dark:hover:brightness-110 cursor-pointer whitespace-nowrap`}>
      {config.label}
    </Badge>
  );
}
