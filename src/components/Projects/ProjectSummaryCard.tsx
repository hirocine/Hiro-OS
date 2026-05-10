import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, User, Package, Eye, MoreHorizontal, Edit, CheckCircle, Archive } from 'lucide-react';
import { Project } from '@/types/project';
import { stepLabels } from '@/lib/projectSteps';
import { getStatusLabel } from '@/lib/projectLabels';

interface ProjectSummaryCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onComplete?: (projectId: string) => void;
  onArchive?: (projectId: string) => void;
}

const statusToneStyle: Record<string, React.CSSProperties> = {
  active:    { color: 'hsl(var(--ds-info))',    borderColor: 'hsl(var(--ds-info) / 0.3)',    background: 'hsl(var(--ds-info) / 0.08)' },
  completed: { color: 'hsl(var(--ds-success))', borderColor: 'hsl(var(--ds-success) / 0.3)', background: 'hsl(var(--ds-success) / 0.08)' },
  archived:  { color: 'hsl(var(--ds-fg-3))',    borderColor: 'hsl(var(--ds-line-1))',        background: 'hsl(var(--ds-line-2) / 0.3)' },
};

export function ProjectSummaryCard({ project, onEdit, onComplete, onArchive }: ProjectSummaryCardProps) {
  const navigate = useNavigate();

  const isOverdue = project.status === 'active' &&
    new Date(project.expectedEndDate) < new Date() &&
    !project.actualEndDate;

  const handleViewDetails = () => {
    navigate(`/retiradas/${project.id}`);
  };

  const statusTone = statusToneStyle[project.status] || statusToneStyle.active;

  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
        e.currentTarget.style.boxShadow = '0 4px 12px hsl(0 0% 0% / 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header with project info and menu */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }} onClick={handleViewDetails}>
            {project.projectNumber && (
              <p style={{
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontWeight: 500, color: 'hsl(var(--ds-fg-3))',
                fontVariantNumeric: 'tabular-nums', marginBottom: 4,
              }}>
                Nº {project.projectNumber}
              </p>
            )}

            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.name}
            </h3>
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="btn"
                style={{ width: 28, height: 28, padding: 0, justifyContent: 'center', flexShrink: 0 }}
                aria-label="Mais opções"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={13} strokeWidth={1.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewDetails}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {project.status === 'active' && (
                <>
                  <DropdownMenuSeparator />
                  {onComplete && (
                    <DropdownMenuItem onClick={() => onComplete(project.id)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finalizar
                    </DropdownMenuItem>
                  )}
                  {onArchive && (
                    <DropdownMenuItem onClick={() => onArchive(project.id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      Arquivar
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div onClick={handleViewDetails} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Status + Step Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <span
              className="pill"
              style={{ ...statusTone, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <span className="dot" style={{ background: 'currentColor' }} />
              {getStatusLabel(project.status)}
            </span>
            {isOverdue && (
              <span
                className="pill"
                style={{
                  color: 'hsl(var(--ds-danger))',
                  borderColor: 'hsl(var(--ds-danger) / 0.3)',
                  background: 'hsl(var(--ds-danger) / 0.08)',
                }}
              >
                Atrasado
              </span>
            )}
            <span className="pill muted">
              {stepLabels[project.step]}
            </span>
          </div>

          {/* Project Info - Compact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-2))' }}>
              <User size={12} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.responsibleName}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-2))' }}>
              <Package size={12} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{project.equipmentCount} equipamentos</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums' }}>
              <Calendar size={12} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
              <span>
                {new Date(project.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                {' → '}
                <span style={isOverdue ? { color: 'hsl(var(--ds-danger))', fontWeight: 500 } : undefined}>
                  {project.actualEndDate
                    ? new Date(project.actualEndDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    : new Date(project.expectedEndDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  }
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          className="btn"
          onClick={handleViewDetails}
          style={{ width: '100%', justifyContent: 'center', height: 30, fontSize: 12 }}
        >
          <Eye size={12} strokeWidth={1.5} />
          <span>Ver Retirada</span>
        </button>
      </div>
    </div>
  );
}
