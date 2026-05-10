import { TaskStatus, STATUS_CONFIG } from '../types';

const toneFor = (status: TaskStatus): React.CSSProperties => {
  switch (status) {
    case 'concluida':
      return { color: 'hsl(var(--ds-success))', borderColor: 'hsl(var(--ds-success) / 0.3)' };
    case 'em_progresso':
      return { color: 'hsl(var(--ds-info))', borderColor: 'hsl(var(--ds-info) / 0.3)' };
    case 'pendente':
    default:
      return { color: 'hsl(var(--ds-fg-3))' };
  }
};

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="pill"
      style={{
        ...toneFor(status),
        cursor: 'pointer',
      }}
    >
      {config.label}
    </span>
  );
}
