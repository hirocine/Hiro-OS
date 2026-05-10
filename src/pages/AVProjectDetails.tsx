import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, Building2, Edit, Archive, Trash2, LayoutList } from 'lucide-react';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
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
  const { canAccessSuppliers } = useAuthContext();
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

  if (!canAccessSuppliers) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0', color: 'hsl(var(--ds-fg-3))' }}>
          <p>Você não tem permissão para acessar esta página.</p>
          <button className="btn" onClick={() => navigate('/')} style={{ marginTop: 16 }} type="button">Voltar ao início</button>
        </div>
      </div>
    );
  }


  const handleArchive = () => {
    if (!project) return;
    updateProject.mutate({
      id: project.id,
      status: project.status === 'archived' ? 'active' : 'archived',
    });
  };

  const handleDelete = () => {
    if (!project) return;
    deleteProject.mutate({ id: project.id, projectData: project }, {
      onSuccess: () => navigate('/projetos-av'),
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton className="h-10 w-64" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0', color: 'hsl(var(--ds-fg-3))' }}>
          <p>Projeto não encontrado.</p>
          <button className="btn" onClick={() => navigate('/projetos-av')} style={{ marginTop: 16 }} type="button">
            Voltar para Projetos
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = AV_STATUS_CONFIG[project.status];
  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status === 'active';

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
      {/* Header com breadcrumb e ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }} className="sm:flex-row sm:items-center sm:justify-between">
        <BreadcrumbNav
          items={[
            { label: 'Projetos', href: '/projetos-av' },
            { label: project.name }
          ]}
          className="mb-0"
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" className="btn" onClick={() => setEditDialogOpen(true)}>
            <Edit size={13} strokeWidth={1.5} />
            <span>Editar</span>
          </button>
          <button type="button" className="btn" onClick={handleArchive}>
            <Archive size={13} strokeWidth={1.5} />
            <span>{project.status === 'archived' ? 'Desarquivar' : 'Arquivar'}</span>
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="btn"
                style={{
                  color: 'hsl(var(--ds-danger))',
                  borderColor: 'hsl(var(--ds-danger) / 0.3)',
                }}
              >
                <Trash2 size={13} strokeWidth={1.5} />
                <span>Excluir</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  <span style={{ fontFamily: '"HN Display", sans-serif' }}>Excluir projeto?</span>
                </AlertDialogTitle>
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

      {/* Project Header */}
      <div
        style={{
          border: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface))',
          padding: 24,
          marginBottom: 32,
        }}
      >
        {/* Avatar + Title + Badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <Avatar className="h-16 w-16 shrink-0" style={{ borderRadius: 0 }}>
            {project.logo_url ? (
              <AvatarImage src={project.logo_url} className="object-cover" />
            ) : null}
            <AvatarFallback style={{ borderRadius: 0, background: 'hsl(var(--ds-accent) / 0.1)', color: 'hsl(var(--ds-accent))', fontSize: 20, fontWeight: 600 }}>
              {getInitials(project.name)}
            </AvatarFallback>
          </Avatar>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'hsl(var(--ds-fg-1))', fontFamily: '"HN Display", sans-serif' }}>
                {project.name}
              </h1>
              <span
                className="pill"
                style={{
                  color: 'hsl(var(--ds-accent))',
                  borderColor: 'hsl(var(--ds-accent) / 0.3)',
                  background: 'hsl(var(--ds-accent) / 0.08)',
                }}
              >
                {statusConfig.label}
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
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 13, color: 'hsl(var(--ds-fg-3))', flexWrap: 'wrap' }}>
              {project.company && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Building2 size={14} strokeWidth={1.5} />
                  <span>{project.company}</span>
                </div>
              )}
              {project.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={14} strokeWidth={1.5} />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    Prazo: {format(new Date(project.deadline), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
              {project.responsible_user_name && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <User size={14} strokeWidth={1.5} />
                  <span>{project.responsible_user_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: 'hsl(var(--ds-line-1))', margin: '20px 0' }} />

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>Progresso Geral</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'hsl(var(--ds-accent))', fontVariantNumeric: 'tabular-nums', fontFamily: '"HN Display", sans-serif' }}>
              {overallProgress}%
            </p>
          </div>
          <div style={{ flex: 1, maxWidth: 384, marginLeft: 32 }}>
            <div style={{ height: 12, background: 'hsl(var(--ds-line-2) / 0.3)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  background: 'hsl(var(--ds-success))',
                  transition: 'all 500ms',
                  width: `${overallProgress}%`,
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {steps?.filter((s) => s.status === 'concluido').length || 0} de {steps?.length || 0} steps concluídos
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ padding: 8, background: 'hsl(var(--ds-line-2) / 0.3)' }}>
          <LayoutList size={20} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', fontFamily: '"HN Display", sans-serif' }}>
          Workflow
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

      <AVProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={project}
      />
      </div>
    </div>
  );
}
