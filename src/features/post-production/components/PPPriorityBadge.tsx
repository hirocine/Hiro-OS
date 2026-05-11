import { PPPriority, PP_PRIORITY_CONFIG } from '../types';
import { StatusPill } from '@/ds/components/StatusPill';

const TONE_BY_PRIORITY = {
  urgente: 'danger',
  alta: 'warning',
  media: 'warning',
  baixa: 'info',
} as const;

const ICON_BY_PRIORITY: Partial<Record<PPPriority, string>> = {
  urgente: '🔥',
};

interface PPPriorityBadgeProps {
  priority: PPPriority;
}

export function PPPriorityBadge({ priority }: PPPriorityBadgeProps) {
  return (
    <StatusPill
      label={PP_PRIORITY_CONFIG[priority].label}
      tone={TONE_BY_PRIORITY[priority]}
      icon={ICON_BY_PRIORITY[priority]}
      interactive
    />
  );
}
