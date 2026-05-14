import { Link } from 'react-router-dom';
import { ListTodo, User, Plus } from 'lucide-react';

const cardWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const cardHeader: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
};

const cardTitle: React.CSSProperties = {
  fontFamily: '"HN Display", sans-serif',
  fontSize: 14,
  fontWeight: 600,
  color: 'hsl(var(--ds-fg-1))',
};

export function QuickActionsCard() {
  const actions = [
    { label: 'Todas as Tarefas', Icon: ListTodo, to: '/tarefas', tone: 'hsl(var(--ds-accent))' },
    { label: 'Minhas Tarefas', Icon: User, to: '/tarefas', tone: 'hsl(var(--ds-warning))' },
  ];

  return (
    <div style={cardWrap}>
      <div style={cardHeader}>
        <span style={cardTitle}>Ações Rápidas</span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.to}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              textDecoration: 'none',
              color: 'hsl(var(--ds-fg-1))',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                display: 'grid',
                placeItems: 'center',
                background: `${action.tone.replace(')', ' / 0.1)')}`,
                color: action.tone,
              }}
            >
              <action.Icon size={14} strokeWidth={1.5} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{action.label}</span>
          </Link>
        ))}

        <Link
          to="/tarefas/nova"
          className="btn primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
        >
          <Plus size={14} strokeWidth={1.5} />
          <span>Nova Tarefa</span>
        </Link>
      </div>
    </div>
  );
}
