import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AVProject, AV_STATUS_CONFIG } from '../types';
import { StatusPill } from '@/ds/components/StatusPill';

interface AVProjectCardProps {
  project: AVProject;
}

const TONE_BY_STATUS = {
  active: 'info',
  completed: 'success',
  archived: 'muted',
} as const;

const ICON_BY_STATUS: Record<string, string | undefined> = {
  completed: '✓',
};

const getInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

export function AVProjectCard({ project }: AVProjectCardProps) {
  const navigate = useNavigate();
  const statusConfig = AV_STATUS_CONFIG[project.status];
  const isOverdue =
    project.deadline && new Date(project.deadline) < new Date() && project.status === 'active';

  return (
    <div
      className="ds-hover-lift"
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            background: 'hsl(var(--ds-line-2))',
            color: 'hsl(var(--ds-fg-2))',
            fontFamily: '"HN Display", sans-serif',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.02em',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {project.logo_url ? (
            <img
              src={project.logo_url}
              alt={project.name}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            getInitials(project.name)
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <h3
            className="t-title"
            title={project.name}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-1))',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {project.name}
          </h3>
          {project.company && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: 'hsl(var(--ds-fg-3))',
                marginTop: 3,
                minWidth: 0,
              }}
            >
              <Building2 size={11} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.company}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <StatusPill
          label={statusConfig.label}
          tone={TONE_BY_STATUS[project.status]}
          icon={ICON_BY_STATUS[project.status]}
        />
        {isOverdue && <StatusPill label="Atrasado" tone="danger" icon="⏰" />}
      </div>

      {project.deadline && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
          <Calendar size={12} strokeWidth={1.5} />
          <span>
            Prazo: {format(new Date(project.deadline), "dd 'de' MMM, yyyy", { locale: ptBR })}
          </span>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <button
        type="button"
        className="btn"
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => navigate(`/projetos-av/${project.id}`)}
      >
        Ver Projeto
      </button>
    </div>
  );
}
