import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, FolderOpen, Clock, CheckCircle, Archive, Package, ChevronDown, ChevronUp, ClipboardList, Play } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useEquipmentProjectSync } from '@/hooks/useEquipmentProjectSync';
import { ProjectSummaryCard } from '@/components/Projects/ProjectSummaryCard';
import { ProjectFilters } from '@/components/Projects/ProjectFilters';
import { NewWithdrawalDialog } from '@/components/Projects/NewWithdrawalDialog';
import { EditProjectDialog } from '@/components/Projects/EditProjectDialog';
import { StepUpdateDialog } from '@/components/Projects/StepUpdateDialog';
import { useToast } from '@/hooks/use-toast';
import { Project, ProjectStep } from '@/types/project';
import { getStepLabel } from '@/lib/projectLabels';
import { Equipment } from '@/types/equipment';
import { StatsCardSkeleton, ProjectCardSkeleton, FiltersSkeleton } from '@/components/ui/skeleton-loaders';

export default function Projects() {
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
  
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [stepProject, setStepProject] = useState<Project | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { toast } = useToast();

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

  const handleNewProject = async (projectData: any, selectedEquipment: Equipment[] = []) => {
    try {
      // Create the project with equipment directly
      await addProject(projectData, selectedEquipment);
      
      toast({
        title: "Projeto criado com sucesso",
        description: `O projeto "${projectData.name}" foi criado com ${selectedEquipment.length} equipamentos.`,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Erro ao criar projeto",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setShowNewProjectDialog(false);
    }
  };

  const handleEditProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      await updateProject(projectId, updates);
      toast({
        title: "Projeto atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error updating project:', error);
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
      console.error('Error updating step:', error);
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
      console.error('Error completing project:', error);
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
      console.error('Error archiving project:', error);
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
      <div className="container mx-auto p-6 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie retiradas e devoluções de equipamentos por projeto
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        <FiltersSkeleton />

        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
        </div>

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
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie retiradas e devoluções de equipamentos por projeto
          </p>
        </div>
        
        <Button 
          onClick={() => setShowNewProjectDialog(true)}
          className="shadow-elegant"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Retirada
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium">Projetos Ativos</span>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              projetos em andamento
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
              <span className="text-sm font-medium">Em Uso</span>
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

      {/* Filters */}
      <ProjectFilters filters={filters} onFiltersChange={setFilters} />

      {/* Projects Grid */}
      <div className="space-y-8">
        {/* Upcoming Projects */}
        {upcomingProjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Próximos Projetos</h2>
              <span className="text-sm text-muted-foreground">({upcomingProjects.length})</span>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
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
            
            <div className="grid grid-cols-1 gap-6">
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
                <h2 className="text-xl font-semibold">Finalizados</h2>
                <span className="text-sm text-muted-foreground">({completedProjects.length})</span>
                {showCompleted ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </Button>
            
            {showCompleted && (
              <div className="grid grid-cols-1 gap-6">
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
                <h2 className="text-xl font-semibold">Arquivados</h2>
                <span className="text-sm text-muted-foreground">({archivedProjects.length})</span>
                {showArchived ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </Button>
            
            {showArchived && (
              <div className="grid grid-cols-1 gap-6">
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
              <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro projeto de retirada de equipamentos
              </p>
              <Button onClick={() => setShowNewProjectDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Projeto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <NewWithdrawalDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onSubmit={handleNewProject}
      />

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
  );
}