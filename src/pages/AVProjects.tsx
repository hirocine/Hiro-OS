import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/empty-state';
import { Film, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useAVProjects,
  useAVProjectStats,
  AVProjectCard,
  AVProjectDialog,
  AVProjectStatsCards,
} from '@/features/audiovisual-projects';

export default function AVProjects() {
  const { canAccessSuppliers } = useAuthContext();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useAVProjectStats();
  const { data: activeProjects, isLoading: activeLoading } = useAVProjects('active');
  const { data: completedProjects, isLoading: completedLoading } = useAVProjects('completed');
  const { data: archivedProjects, isLoading: archivedLoading } = useAVProjects('archived');

  if (!canAccessSuppliers) {
    return (
      <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          <button className="mt-4 text-primary underline" onClick={() => navigate('/')}>Voltar ao início</button>
        </div>
      </ResponsiveContainer>
    );
  }

  const renderProjectsGrid = (projects: typeof activeProjects, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!projects?.length) {
      return (
        <EmptyState icon={Film} title="Nenhum projeto encontrado" description="Projetos audiovisuais aparecerão aqui" />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {projects.map((project) => (
          <AVProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer maxWidth="7xl" className="animate-fade-in">
      <div className="space-y-6">
        <PageHeader
          title="Projetos"
          subtitle="Gerencie projetos audiovisuais do início ao fim"
          actions={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          }
        />

        {/* Stats Cards */}
        <AVProjectStatsCards stats={stats} isLoading={statsLoading} />

        {/* Active Projects */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Film className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-lg">
                Projetos Ativos {activeProjects?.length ? `(${activeProjects.length})` : ''}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {renderProjectsGrid(activeProjects, activeLoading)}
          </CardContent>
        </Card>

        {/* Completed Projects */}
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="py-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Film className="h-4 w-4 text-success" />
                    </div>
                    <CardTitle className="text-lg">
                      Projetos Finalizados {completedProjects?.length ? `(${completedProjects.length})` : ''}
                    </CardTitle>
                  </div>
                  {completedOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {renderProjectsGrid(completedProjects, completedLoading)}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Archived Projects */}
        <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="py-4 cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted">
                      <Film className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">
                      Projetos Arquivados {archivedProjects?.length ? `(${archivedProjects.length})` : ''}
                    </CardTitle>
                  </div>
                  {archivedOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {renderProjectsGrid(archivedProjects, archivedLoading)}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      <AVProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </ResponsiveContainer>
  );
}
