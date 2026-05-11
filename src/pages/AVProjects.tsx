import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/ds/components/EmptyState';
import { useAuthContext } from '@/contexts/AuthContext';
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

  const sectionHeader = (eyebrow: string, title: string, count: number, Icon = Film) => (
    <div className="section-head">
      <div className="section-head-l">
        <span className="section-eyebrow">{eyebrow}</span>
        <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon size={14} strokeWidth={1.5} />
          {title}
        </span>
      </div>
      <span className="section-meta">{count} {count === 1 ? 'item' : 'itens'}</span>
    </div>
  );

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Projetos.</h1>
            <p className="ph-sub">Gerencie projetos audiovisuais do início ao fim.</p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={() => setDialogOpen(true)} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Novo Projeto</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <AVProjectStatsCards stats={stats} isLoading={statsLoading} />
        </div>

        <section className="section">
          {sectionHeader('01', 'Projetos Ativos', activeProjects?.length ?? 0)}
          {renderProjectsGrid(activeProjects, activeLoading)}
        </section>

        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <section className="section">
            <CollapsibleTrigger asChild>
              <div style={{ cursor: 'pointer' }} className="section-head">
                <div className="section-head-l">
                  <span className="section-eyebrow">02</span>
                  <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Film size={14} strokeWidth={1.5} />
                    Projetos Finalizados
                  </span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="section-meta">{completedProjects?.length ?? 0} {(completedProjects?.length ?? 0) === 1 ? 'item' : 'itens'}</span>
                  {completedOpen ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {renderProjectsGrid(completedProjects, completedLoading)}
            </CollapsibleContent>
          </section>
        </Collapsible>

        <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
          <section className="section">
            <CollapsibleTrigger asChild>
              <div style={{ cursor: 'pointer' }} className="section-head">
                <div className="section-head-l">
                  <span className="section-eyebrow">03</span>
                  <span className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Film size={14} strokeWidth={1.5} />
                    Projetos Arquivados
                  </span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span className="section-meta">{archivedProjects?.length ?? 0} {(archivedProjects?.length ?? 0) === 1 ? 'item' : 'itens'}</span>
                  {archivedOpen ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {renderProjectsGrid(archivedProjects, archivedLoading)}
            </CollapsibleContent>
          </section>
        </Collapsible>

        <AVProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </div>
  );
}
