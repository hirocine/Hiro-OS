import { Pencil, Trash2 } from 'lucide-react';
import { AdminOnly } from '@/components/RoleGuard';
import { TeamMember } from '@/hooks/useTeamMembers';

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onDelete: (member: TeamMember) => void;
}

export function TeamMemberCard({ member, onEdit, onDelete }: TeamMemberCardProps) {
  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="group"
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        overflow: 'hidden',
        transition: 'border-color 0.15s ease',
      }}
    >
      {/* Photo Section */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '3 / 2',
          background: 'hsl(var(--ds-line-2) / 0.3)',
          overflow: 'hidden',
        }}
      >
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
            className="group-hover:scale-105"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'hsl(var(--ds-surface-2))',
            }}
          >
            <span
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 36,
                fontWeight: 700,
                color: 'hsl(var(--ds-fg-4))',
                letterSpacing: '0.04em',
              }}
            >
              {initials}
            </span>
          </div>
        )}

        {/* Admin Actions Overlay */}
        <AdminOnly>
          <div
            className="opacity-0 group-hover:opacity-100"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.2s ease',
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(member);
              }}
              style={{ width: 36, height: 36, padding: 0, justifyContent: 'center' }}
              aria-label="Editar membro"
            >
              <Pencil size={14} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className="btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(member);
              }}
              style={{
                width: 36,
                height: 36,
                padding: 0,
                justifyContent: 'center',
                color: 'hsl(var(--ds-danger))',
              }}
              aria-label="Remover membro"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </div>
        </AdminOnly>
      </div>

      {/* Info Section */}
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <h3
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 15,
              fontWeight: 600,
              color: 'hsl(var(--ds-fg-1))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {member.name}
          </h3>
          {member.position && (
            <p
              style={{
                fontSize: 12,
                color: 'hsl(var(--ds-fg-3))',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {member.position}
            </p>
          )}
        </div>

        {/* Tags */}
        {member.tags && member.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {member.tags.map((tag, index) => (
              <span
                key={index}
                className="pill"
                style={{
                  fontSize: 10,
                  color: 'hsl(var(--ds-success))',
                  borderColor: 'hsl(var(--ds-success) / 0.3)',
                  background: 'hsl(var(--ds-success) / 0.08)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
