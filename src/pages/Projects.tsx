import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, FolderOpen, Clock, CheckCircle, Archive, Package, ChevronDown, ChevronUp, ClipboardList, Play } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useLoans } from '@/hooks/useLoans';
import { useEquipmentProjectSync } from '@/hooks/useEquipmentProjectSync';
import { ProjectSummaryCard } from '@/components/Projects/ProjectSummaryCard';
import { ProjectFilters } from '@/components/Projects/ProjectFilters';
import { NewWithdrawalDialog } from '@/components/Projects/NewWithdrawalDialog';
import { EditProjectDialog } from '@/components/Projects/EditProjectDialog';
import { StepUpdateDialog } from '@/components/Projects/StepUpdateDialog';
import { useToast } from '@/hooks/use-toast';
import { Project, ProjectStep } from '@/types/project';
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
    archiveProject 
  } = useProjects();
  const { addLoan } = useLoans();
  
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
        description: "Ocorreu um erro ao criar o projeto. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEditProject = (project: Project) => {
    console.log('Editing project:', project.id); // Debug log
    setEditingProject(project);
    setShowEditDialog(true);
  };

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    updateProject(projectId, updates);
    toast({
      title: "Projeto atualizado",
      description: "As alterações foram salvas com sucesso.",
    });
  };

  const handleCompleteProject = (projectId: string) => {
    completeProject(projectId);
    toast({
      title: "Projeto finalizado",
      description: "O projeto foi marcado como finalizado.",
    });
  };

  const handleArchiveProject = (projectId: string) => {
    archiveProject(projectId);
    toast({
      title: "Projeto arquivado",
      description: "O projeto foi arquivado com sucesso.",
    });
  };

  const handleStepUpdate = (project: Project) => {
    setStepProject(project);
    setShowStepDialog(true);
  };

  const handleQuickStepUpdate = (projectId: string, newStep: ProjectStep, notes?: string) => {
    updateProjectStep(projectId, newStep, notes);
  };

  const handleUpdateStep = (projectId: string, newStep: ProjectStep, notes?: string) => {
    updateProjectStep(projectId, newStep, notes);
    toast({
      title: "Status atualizado",
      description: `O projeto foi atualizado para "${newStep}".`,
    });
  };

  const statsCards = [
    {
      title: 'Projetos Ativos',
      value: stats.active,
      icon: Clock,
      description: 'Em andamento'
    },
    {
      title: 'Pendente Separação',
      value: stats.byStep.pending_separation,
      icon: ClipboardList,
      description: 'Aguardando separação'
    },
    {
      title: 'Em Uso',
      value: stats.byStep.in_use,
      icon: Play,
      description: 'Equipamentos em campo'
    }
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-4">
          <FiltersSkeleton />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Erro ao carregar projetos</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie os projetos e retiradas de equipamentos
          </p>
        </div>
        
        <Button 
          onClick={() => setShowNewProjectDialog(true)}
          size="lg"
          className="bg-gradient-primary hover:opacity-90 shadow-elegant"
        >
          <Plus className="mr-2 h-5 w-5" />
          Nova Retirada
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-elegant transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">
                  {stat.title}
                </CardDescription>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl font-bold">{stat.value}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <ProjectFilters filters={filters} onFiltersChange={setFilters} />

      {/* Projects Sections */}
      <div className="space-y-6">
        {/* Check if any projects exist */}
        {allFilteredProjects.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <FolderOpen className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium">Nenhum projeto encontrado</h3>
                <p className="text-muted-foreground">
                  {Object.values(filters).some(v => v) 
                    ? 'Tente ajustar os filtros ou criar um novo projeto.'
                    : 'Comece criando seu primeiro projeto de retirada de equipamentos.'
                  }
                </p>
              </div>
              <Button onClick={() => setShowNewProjectDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Projeto
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Próximos Projetos */}
            {upcomingProjects.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Próximos Projetos ({upcomingProjects.length})</h2>
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   {upcomingProjects.map((project) => (
                      <ProjectSummaryCard
                        key={project.id}
                        project={project}
                        onEdit={handleEditProject}
                        onComplete={handleCompleteProject}
                        onArchive={handleArchiveProject}
                      />
                   ))}
                 </div>
              </div>
            )}

            {/* Separator */}
            {upcomingProjects.length > 0 && overdueProjects.length > 0 && (
              <Separator className="my-6" />
            )}

            {/* Pendente Devolução */}
            {overdueProjects.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Archive className="h-5 w-5 text-destructive" />
                  <h2 className="text-xl font-semibold text-destructive">Pendente Devolução ({overdueProjects.length})</h2>
                </div>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {overdueProjects.map((project) => (
                      <ProjectSummaryCard
                        key={project.id}
                        project={project}
                        onEdit={handleEditProject}
                        onComplete={handleCompleteProject}
                        onArchive={handleArchiveProject}
                      />
                    ))}
                 </div>
              </div>
            )}

            {/* Separator */}
            {(upcomingProjects.length > 0 || overdueProjects.length > 0) && (completedProjects.length > 0 || archivedProjects.length > 0) && (
              <Separator className="my-6" />
            )}

            {/* Finalizados */}
            {completedProjects.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h2 className="text-xl font-semibold">Finalizados ({completedProjects.length})</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCompleted(!showCompleted)}
                  >
                    {showCompleted ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Exibir
                      </>
                    )}
                  </Button>
                </div>
                {showCompleted && (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {completedProjects.map((project) => (
                        <ProjectSummaryCard
                          key={project.id}
                          project={project}
                          onEdit={handleEditProject}
                          onComplete={handleCompleteProject}
                          onArchive={handleArchiveProject}
                        />
                      ))}
                   </div>
                )}
              </div>
            )}

            {/* Arquivados */}
            {archivedProjects.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Arquivados ({archivedProjects.length})</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowArchived(!showArchived)}
                  >
                    {showArchived ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Exibir
                      </>
                    )}
                  </Button>
                </div>
                {showArchived && (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     {archivedProjects.map((project) => (
                       <ProjectSummaryCard
                         key={project.id}
                         project={project}
                         onEdit={handleEditProject}
                         onComplete={handleCompleteProject}
                         onArchive={handleArchiveProject}
                       />
                     ))}
                   </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <NewWithdrawalDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onSubmit={handleNewProject}
      />

      <EditProjectDialog
        project={editingProject}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleUpdateProject}
      />

      <StepUpdateDialog
        project={stepProject}
        open={showStepDialog}
        onOpenChange={setShowStepDialog}
        onUpdate={handleUpdateStep}
      />
    </div>
  );
}
