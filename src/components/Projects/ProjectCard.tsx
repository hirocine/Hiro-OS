import React from 'react';
import { Project } from '@/types/project';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Package, User, Building2, FileText, MoreHorizontal, Archive } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// Status labels moved inline
const statusLabels = {
  active: 'Ativo',
  completed: 'Finalizado',
  archived: 'Arquivado'
};
import { stepLabels, stepIcons, canTransitionTo, stepOrder } from '@/lib/projectSteps';
import { useToast } from '@/hooks/use-toast';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onComplete?: (projectId: string) => void;
  onArchive?: (projectId: string) => void;
  onStepUpdate?: (projectId: string, step: import('@/types/project').ProjectStep, notes?: string) => void;
}

const statusToneStyle: Record<string, React.CSSProperties> = {
  active:    { color: 'hsl(var(--ds-info))',    borderColor: 'hsl(var(--ds-info) / 0.3)',    background: 'hsl(var(--ds-info) / 0.08)' },
  completed: { color: 'hsl(var(--ds-success))', borderColor: 'hsl(var(--ds-success) / 0.3)', background: 'hsl(var(--ds-success) / 0.08)' },
  archived:  { color: 'hsl(var(--ds-fg-3))',    borderColor: 'hsl(var(--ds-line-1))',        background: 'hsl(var(--ds-line-2) / 0.3)' },
};

export function ProjectCard({ project, onEdit, onComplete, onArchive, onStepUpdate }: ProjectCardProps) {
  const { toast } = useToast();

  const isOverdue = project.status === 'active' && new Date(project.expectedEndDate) < new Date();
  const StepIcon = stepIcons[project.step];

  const getAvailableSteps = () => {
    if (project.status === 'active') {
      return stepOrder.filter(step =>
        step !== project.step && canTransitionTo(project.step, step)
      );
    } else {
      return stepOrder.filter(step => step !== project.step);
    }
  };

  const handleStepChange = (newStep: string) => {
    if (newStep === project.step) return;

    const step = newStep as import('@/types/project').ProjectStep;
    onStepUpdate?.(project.id, step);
    toast({
      title: "Status atualizado",
      description: `Projeto alterado para: ${stepLabels[step]}`,
    });
  };

  const availableSteps = getAvailableSteps();
  const showStepSelector = availableSteps.length > 0;
  const statusTone = statusToneStyle[project.status] || statusToneStyle.active;

  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        display: 'flex',
        flexDirection: 'column',
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
      <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid hsl(var(--ds-line-2))' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 16,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
                lineHeight: 1.2,
                marginBottom: 8,
              }}
            >
              {project.name}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              <span
                className="pill"
                style={{ ...statusTone, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <span className="dot" style={{ background: 'currentColor' }} />
                {statusLabels[project.status]}
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
              <span
                className="pill muted"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <StepIcon size={11} strokeWidth={1.5} />
                {stepLabels[project.step]}
              </span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="btn"
                style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                aria-label="Mais opções"
              >
                <MoreHorizontal size={14} strokeWidth={1.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(project)}>
                <FileText className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {project.status === 'active' && (
                <DropdownMenuItem onClick={() => onComplete?.(project.id)}>
                  <Package className="mr-2 h-4 w-4" />
                  Finalizar
                </DropdownMenuItem>
              )}
              {project.status !== 'archived' && (
                <DropdownMenuItem onClick={() => onArchive?.(project.id)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 16px', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontWeight: 500, color: 'hsl(var(--ds-fg-3))',
              }}>
                Retirada
              </p>
              <p style={{ color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {new Date(project.startDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontWeight: 500, color: 'hsl(var(--ds-fg-3))',
              }}>
                Responsável
              </p>
              <p style={{ color: 'hsl(var(--ds-fg-2))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.responsibleName}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontWeight: 500, color: 'hsl(var(--ds-fg-3))',
              }}>
                Devolução
              </p>
              <p style={{ color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.actualEndDate
                  ? new Date(project.actualEndDate).toLocaleDateString('pt-BR')
                  : new Date(project.expectedEndDate).toLocaleDateString('pt-BR')
                }
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontWeight: 500, color: 'hsl(var(--ds-fg-3))',
              }}>
                Equipamentos
              </p>
              <p style={{ color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.equipmentCount} itens
              </p>
            </div>
          </div>
        </div>

        {project.department && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <Building2 size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
            <span style={{ color: 'hsl(var(--ds-fg-3))' }}>{project.department}</span>
          </div>
        )}

        {project.notes && (
          <div style={{ fontSize: 12 }}>
            <p style={{
              fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
              fontWeight: 500, color: 'hsl(var(--ds-fg-3))', marginBottom: 4,
            }}>
              Observações
            </p>
            <p style={{ color: 'hsl(var(--ds-fg-3))', fontSize: 11, lineHeight: 1.5 }}>{project.notes}</p>
          </div>
        )}

        {showStepSelector && (
          <div style={{ paddingTop: 10, borderTop: '1px solid hsl(var(--ds-line-2))' }}>
            <label style={{
              fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
              fontWeight: 500, color: 'hsl(var(--ds-fg-3))',
              display: 'block', marginBottom: 6,
            }}>
              Alterar Status
            </label>
            <Select onValueChange={handleStepChange} value={project.step}>
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Selecionar novo status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={project.step} disabled>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {React.createElement(stepIcons[project.step], { className: "w-4 h-4" })}
                    <span>{stepLabels[project.step]} (atual)</span>
                  </div>
                </SelectItem>
                {availableSteps.map((step) => (
                  <SelectItem key={step} value={step}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {React.createElement(stepIcons[step], { className: "w-4 h-4" })}
                      <span>{stepLabels[step]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
