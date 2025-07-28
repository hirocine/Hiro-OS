import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FolderOpen, Clock, CheckCircle, Archive, Package } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCard } from '@/components/Projects/ProjectCard';
import { ProjectFilters } from '@/components/Projects/ProjectFilters';
import { NewProjectDialog } from '@/components/Projects/NewProjectDialog';
import { useToast } from '@/hooks/use-toast';

export default function Projects() {
  const { projects, stats, filters, setFilters, addProject, completeProject, archiveProject } = useProjects();
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const { toast } = useToast();

  const handleNewProject = (projectData: any) => {
    addProject(projectData);
    toast({
      title: "Projeto criado com sucesso",
      description: `O projeto "${projectData.name}" foi criado e está ativo.`,
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

  const statsCards = [
    {
      title: 'Total de Projetos',
      value: stats.total,
      icon: FolderOpen,
      description: 'Todos os projetos'
    },
    {
      title: 'Projetos Ativos',
      value: stats.active,
      icon: Clock,
      description: 'Em andamento'
    },
    {
      title: 'Projetos Finalizados',
      value: stats.completed,
      icon: CheckCircle,
      description: 'Concluídos'
    },
    {
      title: 'Equipamentos em Uso',
      value: stats.totalEquipmentOut,
      icon: Package,
      description: 'Itens atualmente retirados'
    }
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Lista de Projetos ({projects.length})
          </h2>
        </div>

        {projects.length === 0 ? (
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
          <div className="grid grid-cols-1 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onComplete={handleCompleteProject}
                onArchive={handleArchiveProject}
              />
            ))}
          </div>
        )}
      </div>

      <NewProjectDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
        onSubmit={handleNewProject}
      />
    </div>
  );
}
