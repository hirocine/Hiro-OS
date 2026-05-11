import { useNavigate } from 'react-router-dom';
import type { CompanyPolicy } from '../types';

interface PolicyCardProps {
  policy: CompanyPolicy;
}

export function PolicyCard({ policy }: PolicyCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/politicas/${policy.id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div
      onClick={handleClick}
      className="animate-fade-in ds-hover-lift"
      style={{
        position: 'relative',
        cursor: 'pointer',
        padding: 22,
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--ds-accent) / 0.4)';
        e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
        e.currentTarget.style.background = 'hsl(var(--ds-surface))';
      }}
    >
      {policy.category && (
        <div style={{ marginBottom: 14 }}>
          <span className="pill muted">{policy.category}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            background: 'hsl(var(--ds-accent) / 0.1)',
            border: '1px solid hsl(var(--ds-accent) / 0.2)',
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          <span>{policy.icon_url || '📋'}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 16,
              fontWeight: 600,
              color: 'hsl(var(--ds-fg-1))',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {policy.title}
          </h3>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {policy.updated_at && (
        <p
          style={{
            fontSize: 11,
            color: 'hsl(var(--ds-fg-3))',
            marginTop: 14,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          Atualizado em {formatDate(policy.updated_at)}
        </p>
      )}
    </div>
  );
}
