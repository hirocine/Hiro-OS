import { Calendar, Construction } from 'lucide-react';

export function RecordingCalendar() {
  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Calendar size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: 'hsl(var(--ds-fg-2))',
          }}
        >
          Calendário de Gravações
        </span>
      </div>
      <div
        style={{
          padding: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 56,
            height: 56,
            background: 'hsl(var(--ds-line-2) / 0.4)',
            border: '1px solid hsl(var(--ds-line-1))',
            color: 'hsl(var(--ds-fg-3))',
            marginBottom: 14,
          }}
        >
          <Construction size={28} strokeWidth={1.5} />
        </div>
        <h3
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: 'hsl(var(--ds-fg-1))',
            marginBottom: 6,
          }}
        >
          Em Desenvolvimento
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'hsl(var(--ds-fg-3))',
            maxWidth: 380,
            lineHeight: 1.5,
          }}
        >
          O calendário de gravações e esteira de projetos está sendo desenvolvido. Em breve você poderá visualizar
          todos os projetos de gravação aqui.
        </p>
      </div>
    </div>
  );
}
