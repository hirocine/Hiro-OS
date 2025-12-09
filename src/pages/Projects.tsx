import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { ResponsiveButton } from '@/components/ui/responsive-button';
import { Plus, FolderOpen, Clock, CheckCircle, Archive, Package, ChevronDown, ChevronUp, ClipboardList, Play } from 'lucide-react';
import { useProjects } from '@/features/projects';
import { useEquipmentProjectSync } from '@/hooks/useEquipmentProjectSync';
import { useToast } from '@/hooks/use-toast';
import { Project, ProjectStep } from '@/types/project';
import { getStepLabel } from '@/lib/projectLabels';
import { ProjectSummaryCard } from '@/components/Projects/ProjectSummaryCard';

import { EditProjectDialog } from '@/components/Projects/EditProjectDialog';
import { StepUpdateDialog } from '@/components/Projects/StepUpdateDialog';
import { StatsCardSkeleton, ProjectCardSkeleton, FiltersSkeleton } from '@/components/ui/skeleton-loaders';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

export default function Projects() {
  const navigate = useNavigate();
  const { 
    projects: allFilteredProjects, 
    stats, 
    filters, 
    setFilters, 
    loading,
    error,
    addProject, 
    updateProject, 
    updateProjectStep,
    completeProject, 
    archiveProject,
    fetchProjects
  } = useProjects();
  
  // Sincronização automática entre equipamentos e projetos
  useEquipmentProjectSync();
  
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
          action: 'check_session'
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
    .filter(project => project.status === 'active' && project.expectedEndDate >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  // Pendente Devolução - Active projects past expected end date
  const overdueProjects = allFilteredProjects
    .filter(project => project.status === 'active' && project.expectedEndDate < today)
    .sort((a, b) => new Date(a.expectedEndDate).getTime() - new Date(b.expectedEndDate).getTime());

  // Finalizados - Completed projects
  const completedProjects = allFilteredProjects
    .filter(project => project.status === 'completed')
    .sort((a, b) => new Date(b.actualEndDate || b.expectedEndDate).getTime() - new Date(a.actualEndDate || a.expectedEndDate).getTime());

  // Arquivados - Archived projects
  const archivedProjects = allFilteredProjects
    .filter(project => project.status === 'archived')
    .sort((a, b) => new Date(b.expectedEndDate).getTime() - new Date(a.expectedEndDate).getTime());

  const handleEditProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      await updateProject(projectId, updates);
      toast({
        title: "Projeto atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    } catch (error) {
      logger.error('Error updating project', {
        module: 'projects-page', 
        action: 'update_project',
        error
      });
      toast({
        title: "Erro ao atualizar projeto",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
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
        title: "Etapa atualizada",
        description: `Projeto movido para: ${getStepLabel(step)}`,
      });
    } catch (error) {
      logger.error('Error updating step', {
        module: 'projects-page',
        action: 'update_step', 
        error
      });
      toast({
        title: "Erro ao atualizar etapa",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
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
        title: "Projeto finalizado",
        description: "O projeto foi marcado como finalizado.",
      });
    } catch (error) {
      logger.error('Error completing project', {
        module: 'projects-page',
        action: 'complete_project',
        error
      });
      toast({
        title: "Erro ao finalizar projeto",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await archiveProject(projectId);
      toast({
        title: "Projeto arquivado",
        description: "O projeto foi arquivado.",
      });
    } catch (error) {
      logger.error('Error archiving project', {
        module: 'projects-page',
        action: 'archive_project',
        error  
      });
      toast({
        title: "Erro ao arquivar projeto",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };


  // Loading state with skeletons
  if (loading) {
    return (
    <ResponsiveContainer maxWidth="7xl">
        <PageHeader 
          title="Retiradas" 
          subtitle="Gerencie retiradas e devoluções de equipamentos por projeto"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        <FiltersSkeleton />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </ResponsiveContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader 
          title="Retiradas" 
        />

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar projetos</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchProjects()} variant="outline">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader 
        title="Retiradas" 
        subtitle="Gerencie retiradas e devoluções de equipamentos por projeto"
        actions={
          <ResponsiveButton 
            onClick={() => navigate('/retiradas/nova')}
            icon={Plus}
            className="shadow-elegant"
            mobileText="Nova"
            desktopText="Nova Retirada"
          />
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium">Retiradas Ativas</span>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              retiradas em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium">Pendente Separação</span>
              <Clock className="h-4 w-4 text-warning" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.byStep.pending_separation}</div>
            <p className="text-xs text-muted-foreground">
              aguardando separação
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium">Gravação</span>
              <Play className="h-4 w-4 text-success" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.byStep.in_use}</div>
            <p className="text-xs text-muted-foreground">
              equipamentos em campo
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Projects Grid */}
      <div className="space-y-8">
        {/* Upcoming Projects */}
        {upcomingProjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Próximas Retiradas</h2>
              <span className="text-sm text-muted-foreground">({upcomingProjects.length})</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
          </div>
        )}

        {/* Overdue Projects */}
        {overdueProjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-destructive" />
              <h2 className="text-xl font-semibold">Pendente Devolução</h2>
              <span className="text-sm text-muted-foreground">({overdueProjects.length})</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
          </div>
        )}

        {/* Show/Hide Completed Projects */}
        {completedProjects.length > 0 && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setShowCompleted(!showCompleted)}
              className="p-0 h-auto font-semibold hover:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <h2 className="text-xl font-semibold">Retiradas Finalizadas</h2>
                <span className="text-sm text-muted-foreground">({completedProjects.length})</span>
                {showCompleted ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </Button>
            
            {showCompleted && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
            )}
          </div>
        )}

        {/* Show/Hide Archived Projects */}
        {archivedProjects.length > 0 && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setShowArchived(!showArchived)}
              className="p-0 h-auto font-semibold hover:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Retiradas Arquivadas</h2>
                <span className="text-sm text-muted-foreground">({archivedProjects.length})</span>
                {showArchived ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </Button>
            
            {showArchived && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
            )}
          </div>
        )}
        
        {/* No projects found */}
        {allFilteredProjects.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma retirada encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira retirada de equipamentos
              </p>
              <Button onClick={() => navigate('/retiradas/nova')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Retirada
              </Button>
            </CardContent>
          </Card>
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
    </ResponsiveContainer>
  );
}