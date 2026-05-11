import { TaskStatus, STATUS_CONFIG } from '../types';
import { StatusPill } from '@/ds/components/StatusPill';

const TONE_BY_STATUS = {
  concluida: 'success',
  em_progresso: 'info',
  pendente: 'muted',
} as const;

const ICON_BY_STATUS: Partial<Record<TaskStatus, string>> = {
  concluida: '✓',
};

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <StatusPill
      label={STATUS_CONFIG[status].label}
      tone={TONE_BY_STATUS[status]}
      icon={ICON_BY_STATUS[status]}
      interactive
    />
  );
}
