import { TaskPriority, PRIORITY_CONFIG } from '../types';
import { StatusPill } from '@/ds/components/StatusPill';

const TONE_BY_PRIORITY = {
  urgente: 'danger',
  alta: 'warning',
  media: 'warning',
  baixa: 'info',
  standby: 'muted',
} as const;

const ICON_BY_PRIORITY: Partial<Record<TaskPriority, string>> = {
  urgente: '🔥',
};

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <StatusPill
      label={PRIORITY_CONFIG[priority].label}
      tone={TONE_BY_PRIORITY[priority]}
      icon={ICON_BY_PRIORITY[priority]}
      interactive
    />
  );
}
