import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Clock, CheckCircle, Archive, Package, ChevronDown, ChevronRight, FileEdit, Camera, type LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useProjects } from '@/features/projects';
import { useEquipmentProjectSync } from '@/hooks/useEquipmentProjectSync';
import { useWithdrawalDraft } from '@/hooks/useWithdrawalDraft';
import { useToast } from '@/hooks/use-toast';
import { Project, ProjectStep } from '@/types/project';
import { getStepLabel } from '@/lib/projectLabels';
import { ProjectSummaryCard } from '@/components/Projects/ProjectSummaryCard';
import { ProjectStatsCards } from '@/components/Projects/ProjectStatsCards';
import { EditProjectDialog } from '@/components/Projects/EditProjectDialog';
import { StepUpdateDialog } from '@/components/Projects/StepUpdateDialog';
import { ProjectCardSkeleton } from '@/components/ui/skeleton-loaders';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

interface SectionProps {
  title: string;
  count: number;
  icon: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function ProjectSection({ title, count, icon: Icon, iconColor, children, collapsible, open, onOpenChange }: SectionProps) {
  const header = (
    <div
      style={{
        padding: '14px 18px',
        borderBottom: '1px solid hsl(var(--ds-line-1))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        cursor: collapsible ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={14} strokeWidth={1.5} style={{ color: iconColor || 'hsl(var(--ds-fg-3))' }} />
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: 'hsl(var(--ds-fg-2))',
          }}
        >
          {title} ({count})
        </span>
      </div>
      {collapsible && (
        open ? (
          <ChevronDown size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        ) : (
          <ChevronRight size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        )
      )}
    </div>
  );

  const body = <div style={{ padding: 18 }}>{children}</div>;

  if (collapsible) {
    return (
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
          <CollapsibleTrigger asChild>{header}</CollapsibleTrigger>
          <CollapsibleContent>{body}</CollapsibleContent>
        </div>
      </Collapsible>
    );
  }

  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
      {header}
      {body}
    </div>
  );
}

export default function Projects() {
  const navigate = useNavigate();
  const {
    projects: allFilteredProjects,
    stats,
    loading,
    error,
    updateProject,
    updateProjectStep,
    completeProject,
    archiveProject,
    fetchProjects,
  } = useProjects();

  // Sincronização automática entre equipamentos e projetos
  useEquipmentProjectSync();

  // Verificar se há rascunho salvo
  const { hasDraft, isLoading: draftLoading } = useWithdrawalDraft();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [stepProject, setStepProject] = useState<Project | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();

  // Verificar sessão e forçar refetch ao montar
  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        logger.warn('No active session on Projects page', {
          module: 'projects',
          action: 'check_session',
        });
        await supabase.auth.refreshSession();
      }

      fetchProjects();
    };

    checkSessionAndFetch();
  }, [fetchProjects]);

  // Organize projects by categories
  const today = new Date().toISOString().split('T')[0];

  // Próximos Projetos - Active projects sorted by start date
  const upcomingProjects = allFilteredProjects
    .filter((project) => project.status === 'active' && project.expectedEndDate >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Pendente Devolução - Active projects past expected end date
  const overdueProjects = allFilteredProjects
    .filter((project) => project.status === 'active' && project.expectedEndDate < today)
    .sort((a, b) => new Date(a.expectedEndDate).getTime() - new Date(b.expectedEndDate).getTime());

  // Finalizados - Completed projects
  const completedProjects = allFilteredProjects
    .filter((project) => project.status === 'completed')
    .sort(
      (a, b) =>
        new Date(b.actualEndDate || b.expectedEndDate).getTime() -
        new Date(a.actualEndDate || a.expectedEndDate).getTime(),
    );

  // Arquivados - Archived projects
  const archivedProjects = allFilteredProjects
    .filter((project) => project.status === 'archived')
    .sort((a, b) => new Date(b.expectedEndDate).getTime() - new Date(a.expectedEndDate).getTime());

  const handleEditProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      await updateProject(projectId, updates);
      toast({
        title: 'Projeto atualizado',
        description: 'As informações foram salvas com sucesso.',
      });
    } catch (error) {
      logger.error('Error updating project', {
        module: 'projects-page',
        action: 'update_project',
        error,
      });
      toast({
        title: 'Erro ao atualizar projeto',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setShowEditDialog(false);
      setEditingProject(null);
    }
  };

  const handleUpdateStep = async (step: ProjectStep, notes?: string) => {
    if (!stepProject) return;

    try {
      await updateProjectStep(stepProject.id, step, notes);
      toast({
        title: 'Etapa atualizada',
        description: `Projeto movido para: ${getStepLabel(step)}`,
      });
    } catch (error) {
      logger.error('Error updating step', {
        module: 'projects-page',
        action: 'update_step',
        error,
      });
      toast({
        title: 'Erro ao atualizar etapa',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setShowStepDialog(false);
      setStepProject(null);
    }
  };

  const handleCompleteProject = async (projectId: string) => {
    try {
      await completeProject(projectId);
      toast({
        title: 'Projeto finalizado',
        description: 'O projeto foi marcado como finalizado.',
      });
    } catch (error) {
      logger.error('Error completing project', {
        module: 'projects-page',
        action: 'complete_project',
        error,
      });
      toast({
        title: 'Erro ao finalizar projeto',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await archiveProject(projectId);
      toast({
        title: 'Projeto arquivado',
        description: 'O projeto foi arquivado.',
      });
    } catch (error) {
      logger.error('Error archiving project', {
        module: 'projects-page',
        action: 'archive_project',
        error,
      });
      toast({
        title: 'Erro ao arquivar projeto',
        description: 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    }
  };

  // Loading state with skeletons
  if (loading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <div className="ph">
            <div>
              <h1 className="ph-title">Retiradas.</h1>
              <p className="ph-sub">Gerencie retiradas e devoluções de equipamentos por projeto.</p>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <ProjectStatsCards stats={undefined} isLoading={true} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
              marginTop: 24,
            }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <div className="ph">
            <div>
              <h1 className="ph-title">Retiradas.</h1>
            </div>
          </div>
          <div
            style={{
              marginTop: 24,
              border: '1px solid hsl(var(--ds-line-1))',
              padding: 24,
              background: 'hsl(var(--ds-surface))',
            }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--ds-danger))', marginBottom: 4 }}>
              Erro ao carregar projetos
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginBottom: 16 }}>{error}</p>
            <button className="btn" onClick={() => fetchProjects()} type="button">
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 16,
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Retiradas.</h1>
            <p className="ph-sub">Gerencie retiradas e devoluções de equipamentos por projeto.</p>
          </div>
          <div className="ph-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {hasDraft && !draftLoading && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'hsl(var(--ds-fg-3))',
                }}
              >
                <FileEdit size={13} strokeWidth={1.5} />
                <span>1 Rascunho Salvo</span>
              </span>
            )}
            <button className="btn primary" onClick={() => navigate('/retiradas/nova')} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Nova Retirada</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <ProjectStatsCards stats={stats} isLoading={false} />
        </div>

        {/* Projects Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
          {/* Upcoming Projects */}
          {upcomingProjects.length > 0 && (
            <ProjectSection title="Próximas Retiradas" count={upcomingProjects.length} icon={Clock} iconColor="hsl(var(--ds-accent))">
              <div style={gridStyle}>
                {upcomingProjects.map((project) => (
                  <ProjectSummaryCard
                    key={project.id}
                    project={project}
                    onEdit={(proj) => {
                      setEditingProject(proj);
                      setShowEditDialog(true);
                    }}
                    onComplete={handleCompleteProject}
                    onArchive={handleArchiveProject}
                  />
                ))}
              </div>
            </ProjectSection>
          )}

          {/* Overdue Projects */}
          {overdueProjects.length > 0 && (
            <ProjectSection
              title="Pendente Devolução"
              count={overdueProjects.length}
              icon={Package}
              iconColor="hsl(var(--ds-danger))"
            >
              <div style={gridStyle}>
                {overdueProjects.map((project) => (
                  <ProjectSummaryCard
                    key={project.id}
                    project={project}
                    onEdit={(proj) => {
                      setEditingProject(proj);
                      setShowEditDialog(true);
                    }}
                    onComplete={handleCompleteProject}
                    onArchive={handleArchiveProject}
                  />
                ))}
              </div>
            </ProjectSection>
          )}

          {/* Completed Projects - Collapsible */}
          {completedProjects.length > 0 && (
            <ProjectSection
              title="Retiradas Finalizadas"
              count={completedProjects.length}
              icon={CheckCircle}
              iconColor="hsl(var(--ds-success))"
              collapsible
              open={showCompleted}
              onOpenChange={setShowCompleted}
            >
              <div style={gridStyle}>
                {completedProjects.map((project) => (
                  <ProjectSummaryCard
                    key={project.id}
                    project={project}
                    onEdit={(proj) => {
                      setEditingProject(proj);
                      setShowEditDialog(true);
                    }}
                    onComplete={handleCompleteProject}
                    onArchive={handleArchiveProject}
                  />
                ))}
              </div>
            </ProjectSection>
          )}

          {/* Archived Projects - Collapsible */}
          {archivedProjects.length > 0 && (
            <ProjectSection
              title="Retiradas Arquivadas"
              count={archivedProjects.length}
              icon={Archive}
              collapsible
              open={showArchived}
              onOpenChange={setShowArchived}
            >
              <div style={gridStyle}>
                {archivedProjects.map((project) => (
                  <ProjectSummaryCard
                    key={project.id}
                    project={project}
                    onEdit={(proj) => {
                      setEditingProject(proj);
                      setShowEditDialog(true);
                    }}
                    onComplete={handleCompleteProject}
                    onArchive={handleArchiveProject}
                  />
                ))}
              </div>
            </ProjectSection>
          )}

          {/* No projects found */}
          {allFilteredProjects.length === 0 && (
            <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))', padding: 18 }}>
              <EmptyState
                icon={Camera}
                title="Nenhuma retirada encontrada"
                description="Comece criando sua primeira retirada de equipamentos"
                action={{ label: 'Criar Retirada', onClick: () => navigate('/retiradas/nova') }}
              />
            </div>
          )}
        </div>

        {/* Dialogs */}
        {editingProject && (
          <EditProjectDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            project={editingProject}
            onSave={handleEditProject}
          />
        )}

        {stepProject && (
          <StepUpdateDialog
            open={showStepDialog}
            onOpenChange={setShowStepDialog}
            project={stepProject}
            onUpdate={handleUpdateStep}
          />
        )}
      </div>
    </div>
  );
}
