import { PPPriority, PP_PRIORITY_CONFIG } from '../types';

const toneFor = (priority: PPPriority): React.CSSProperties => {
  switch (priority) {
    case 'urgente': return { color: 'hsl(var(--ds-danger))',  borderColor: 'hsl(var(--ds-danger) / 0.3)' };
    case 'alta':    return { color: 'hsl(var(--ds-warning))', borderColor: 'hsl(var(--ds-warning) / 0.3)' };
    case 'media':   return { color: 'hsl(var(--ds-warning))', borderColor: 'hsl(var(--ds-warning) / 0.3)' };
    case 'baixa':   return { color: 'hsl(var(--ds-info))',    borderColor: 'hsl(var(--ds-info) / 0.3)' };
    default:        return { color: 'hsl(var(--ds-fg-3))' };
  }
};

interface PPPriorityBadgeProps {
  priority: PPPriority;
}

export function PPPriorityBadge({ priority }: PPPriorityBadgeProps) {
  const config = PP_PRIORITY_CONFIG[priority];
  return (
    <span
      className="pill"
      style={{
        ...toneFor(priority),
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {priority === 'urgente' && <span style={{ fontSize: 10 }}>🔥</span>}
      {config.label}
    </span>
  );
}
