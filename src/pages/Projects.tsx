import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { ResponsiveButton } from '@/components/ui/responsive-button';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Clock, CheckCircle, Archive, Package, ChevronDown, ChevronRight, ClipboardList, FileEdit } from 'lucide-react';
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

        <ProjectStatsCards stats={undefined} isLoading={true} />

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
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <PageHeader 
        title="Retiradas" 
        subtitle="Gerencie retiradas e devoluções de equipamentos por projeto"
        actions={
          <div className="flex items-center gap-3">
            {hasDraft && !draftLoading && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <FileEdit className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">1 Rascunho Salvo</span>
                <span className="sm:hidden">1 Rascunho</span>
              </span>
            )}
            <ResponsiveButton 
              onClick={() => navigate('/retiradas/nova')}
              icon={Plus}
              className="shadow-elegant"
              mobileText="Nova"
              desktopText="Nova Retirada"
            />
          </div>
        }
      />

      {/* Statistics Cards */}
      <ProjectStatsCards stats={stats} isLoading={false} />

      {/* Projects Grid */}
      <div className="space-y-6">
        {/* Upcoming Projects */}
        {upcomingProjects.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-lg">
                  Próximas Retiradas ({upcomingProjects.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {/* Overdue Projects */}
        {overdueProjects.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Package className="h-4 w-4 text-destructive" />
                </div>
                <CardTitle className="text-lg">
                  Pendente Devolução ({overdueProjects.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}

        {/* Completed Projects - Collapsible */}
        {completedProjects.length > 0 && (
          <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-success/10">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                      <CardTitle className="text-lg">
                        Retiradas Finalizadas ({completedProjects.length})
                      </CardTitle>
                    </div>
                    {showCompleted ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
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
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Archived Projects - Collapsible */}
        {archivedProjects.length > 0 && (
          <Collapsible open={showArchived} onOpenChange={setShowArchived}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-4 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-muted">
                        <Archive className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-lg">
                        Retiradas Arquivadas ({archivedProjects.length})
                      </CardTitle>
                    </div>
                    {showArchived ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
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
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
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