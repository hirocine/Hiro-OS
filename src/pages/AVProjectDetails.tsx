import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, Building2, Edit, Archive, Trash2 } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useAVProject,
  useAVProjectSections,
  useAVProjectSteps,
  useUpdateAVProject,
  useDeleteAVProject,
  AVProjectSectionRow,
  AVProjectDialog,
  AV_STATUS_CONFIG,
} from '@/features/audiovisual-projects';
import { useState } from 'react';

export default function AVProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: project, isLoading: projectLoading } = useAVProject(id!);
  const { data: sections, isLoading: sectionsLoading } = useAVProjectSections();
  const { data: steps, isLoading: stepsLoading } = useAVProjectSteps(id!);
  const updateProject = useUpdateAVProject();
  const deleteProject = useDeleteAVProject();

  const isLoading = projectLoading || sectionsLoading || stepsLoading;

  // Group steps by section
  const stepsBySection = useMemo(() => {
    if (!steps || !sections) return new Map();
    
    const map = new Map<string, typeof steps>();
    sections.forEach((section) => {
      const sectionSteps = steps.filter((s) => s.section_id === section.id);
      map.set(section.id, sectionSteps);
    });
    return map;
  }, [steps, sections]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (!steps?.length) return 0;
    const completed = steps.filter((s) => s.status === 'concluido').length;
    return Math.round((completed / steps.length) * 100);
  }, [steps]);

  const handleArchive = () => {
    if (!project) return;
    updateProject.mutate({
      id: project.id,
      status: project.status === 'archived' ? 'active' : 'archived',
    });
  };

  const handleDelete = () => {
    if (!project) return;
    deleteProject.mutate(project.id, {
      onSuccess: () => navigate('/projetos-av'),
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </ResponsiveContainer>
    );
  }

  if (!project) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Projeto não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/projetos-av')}>
            Voltar para Projetos
          </Button>
        </div>
      </ResponsiveContainer>
    );
  }

  const statusConfig = AV_STATUS_CONFIG[project.status];
  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status === 'active';

  return (
    <ResponsiveContainer maxWidth="7xl">
      {/* Header com breadcrumb e ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <BreadcrumbNav 
          items={[
            { label: 'Projetos', href: '/projetos-av' },
            { label: project.name }
          ]}
          className="mb-0"
        />
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline" size="sm" onClick={handleArchive}>
            <Archive className="h-4 w-4 mr-2" />
            {project.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os steps e dados do projeto serão removidos permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="space-y-6">
        {/* Project Info */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-lg shrink-0">
            {project.logo_url ? (
              <AvatarImage src={project.logo_url} className="object-cover" />
            ) : null}
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xl font-semibold">
              {getInitials(project.name)}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                {statusConfig.label}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">Atrasado</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              {project.company && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{project.company}</span>
                </div>
              )}
              {project.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Prazo: {format(new Date(project.deadline), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                </div>
              )}
              {project.responsible_user_name && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{project.responsible_user_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Progresso Geral</p>
                <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
              </div>
              <div className="flex-1 max-w-md ml-8">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {steps?.filter((s) => s.status === 'concluido').length || 0} de {steps?.length || 0} steps concluídos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <div className="space-y-4">
          {sections?.map((section) => {
            const sectionSteps = stepsBySection.get(section.id) || [];
            return (
              <AVProjectSectionRow
                key={section.id}
                section={section}
                steps={sectionSteps}
                projectId={project.id}
              />
            );
          })}
        </div>
      </div>

      <AVProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={project}
      />
    </ResponsiveContainer>
  );
}
