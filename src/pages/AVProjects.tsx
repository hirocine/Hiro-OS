import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Plus } from 'lucide-react';
import { EmptyState } from '@/ds/components/EmptyState';
import { CollapsibleSection } from '@/ds/components/CollapsibleSection';
import { PageHeader } from '@/ds/components/toolbar';
import { useAuthContext } from '@/contexts/AuthContext';
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

  const { data: stats, isLoading: statsLoading } = useAVProjectStats();
  const { data: activeProjects, isLoading: activeLoading } = useAVProjects('active');
  const { data: completedProjects, isLoading: completedLoading } = useAVProjects('completed');
  const { data: archivedProjects, isLoading: archivedLoading } = useAVProjects('archived');

  if (!canAccessSuppliers) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'hsl(var(--ds-fg-3))' }}>
            <p>Você não tem permissão para acessar esta página.</p>
            <button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/')} type="button">
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderProjectsGrid = (projects: typeof activeProjects, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ border: '1px solid hsl(var(--ds-line-1))', padding: 16, minHeight: 140 }}>
              <span className="sk line lg" style={{ width: '70%' }} />
            </div>
          ))}
        </div>
      );
    }

    if (!projects?.length) {
      return (
        <EmptyState
          icon={Film}
          title="Nenhum projeto encontrado"
          description="Projetos audiovisuais aparecerão aqui."
          variant="bare"
        />
      );
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {projects.map((project) => (
          <AVProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <PageHeader
          title="Projetos."
          subtitle="Gerencie projetos audiovisuais do início ao fim."
          action={
            <button className="btn primary" onClick={() => setDialogOpen(true)} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Novo Projeto</span>
            </button>
          }
        />

        <div style={{ marginTop: 24 }}>
          <AVProjectStatsCards stats={stats} isLoading={statsLoading} />
        </div>

        <CollapsibleSection number="01" title="Projetos Ativos" icon={Film} count={activeProjects?.length ?? 0}>
          {renderProjectsGrid(activeProjects, activeLoading)}
        </CollapsibleSection>

        <CollapsibleSection
          number="02"
          title="Projetos Finalizados"
          icon={Film}
          count={completedProjects?.length ?? 0}
          collapsible
        >
          {renderProjectsGrid(completedProjects, completedLoading)}
        </CollapsibleSection>

        <CollapsibleSection
          number="03"
          title="Projetos Arquivados"
          icon={Film}
          count={archivedProjects?.length ?? 0}
          collapsible
        >
          {renderProjectsGrid(archivedProjects, archivedLoading)}
        </CollapsibleSection>

        <AVProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </div>
  );
}
