import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Eye, EyeOff, Clock, Monitor, Smartphone, ExternalLink, Pencil, Copy, Building2, GitBranch, Send } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useProposalDetailsBySlug } from '@/features/proposals/hooks/useProposalDetailsBySlug';
import { useProposalViews } from '@/features/proposals/hooks/useProposalViews';
import { supabase } from '@/integrations/supabase/client';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'info' | 'warning' | 'success' | 'neutral' }> = {
  draft: { label: 'Rascunho', variant: 'neutral' },
  sent: { label: 'Enviada', variant: 'info' },
  opened: { label: 'Aberta', variant: 'warning' },
  new_version: { label: 'Nova Versão', variant: 'info' },
  approved: { label: 'Aprovada', variant: 'success' },
  expired: { label: 'Arquivada', variant: 'destructive' },
};

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}min ${secs}s` : `${secs}s`;
}

function formatCurrency(value: number | null | undefined): string {
  if (!value) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return '';
  const browser = ua.match(/Edg/i) ? 'Edge'
    : ua.match(/Chrome/i) ? 'Chrome'
    : ua.match(/Firefox/i) ? 'Firefox'
    : ua.match(/Safari/i) ? 'Safari'
    : 'Browser';
  const os = ua.match(/Windows/i) ? 'Windows'
    : ua.match(/Macintosh|Mac OS/i) ? 'macOS'
    : ua.match(/iPhone|iPad/i) ? 'iOS'
    : ua.match(/Android/i) ? 'Android'
    : 'OS';
  return `${browser} · ${os}`;
}

export default function ProposalOverview() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: proposal, isLoading, refetch } = useProposalDetailsBySlug(slug);
  const { data: views, isLoading: viewsLoading } = useProposalViews(proposal?.id);
  const [versions, setVersions] = useState<any[]>([]);

  const publicUrl = proposal ? `${window.location.origin}/orcamento/${proposal.slug}` : '';
  const status = proposal ? (statusMap[proposal.status] || statusMap.draft) : statusMap.draft;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => toast.success('Link copiado!'));
  };

  const handleOpenProposal = () => {
    if (proposal) window.open(`/orcamento/${proposal.slug}?v=${Date.now()}`, '_blank');
  };
  // Fetch versions
  useEffect(() => {
    if (!proposal) return;
    const parentId = proposal.parent_id || proposal.id;
    supabase
      .from('orcamentos')
      .select('id, version, status, created_at, slug')
      .or(`id.eq.${parentId},parent_id.eq.${parentId}`)
      .order('version' as any, { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 1) setVersions(data);
      });
  }, [proposal]);

  const handleSetLatest = async (versionId: string) => {
    if (!proposal) return;
    const parentId = proposal.parent_id || proposal.id;
    await supabase.from('orcamentos').update({ is_latest_version: false } as any)
      .or(`id.eq.${parentId},parent_id.eq.${parentId}`);
    await supabase.from('orcamentos').update({ is_latest_version: true } as any)
      .eq('id', versionId);
    toast.success('Versão atualizada!');
    const target = versions.find(v => v.id === versionId);
    navigate(`/orcamentos/${target?.slug}/overview`);
  };

  const handleSendToClient = async () => {
    if (!proposal) return;
    const today = new Date().toLocaleDateString('en-CA');
    const { error } = await supabase
      .from('orcamentos')
      .update({ status: 'sent', sent_date: today } as any)
      .eq('id', proposal.id);
    if (error) {
      toast.error('Erro ao enviar proposta');
    } else {
      toast.success('Proposta enviada ao cliente!');
      refetch();
    }
  };

  const totalViews = proposal?.views_count || 0;
  const lastView = views && views.length > 0 ? views[0] : null;

  if (isLoading) {
    return (
      <ResponsiveContainer maxWidth="7xl" className="py-6 animate-fade-in">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-40 w-full mb-6" />
      </ResponsiveContainer>
    );
  }

  if (!proposal) {
    return (
      <ResponsiveContainer maxWidth="7xl" className="py-6">
        <p className="text-muted-foreground">Proposta não encontrada.</p>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer maxWidth="7xl" className="py-6 animate-fade-in space-y-6">
      <BreadcrumbNav items={[
        { label: 'Orçamentos', href: '/orcamentos' },
        { label: proposal.project_name || 'Proposta' },
      ]} />

      {/* Section 1 — Header */}
      <Card className="overflow-hidden">
        <div className="p-5 flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-lg shrink-0">
            {proposal.client_logo && <AvatarImage src={proposal.client_logo} alt={proposal.client_name || ''} className="rounded-lg" />}
            <AvatarFallback className="bg-muted rounded-lg"><Building2 className="h-7 w-7 text-muted-foreground" /></AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {proposal.project_number && (
                <span className="text-xs font-medium text-muted-foreground/70">Nº {proposal.project_number}</span>
              )}
              <h1 className="text-lg font-medium">{proposal.project_name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
              {proposal.version > 1 && (
                <Badge variant="outline">v{proposal.version}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {proposal.client_name || '—'}
              {proposal.client_responsible && ` · ${proposal.client_responsible}`}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {proposal.created_at && `Criada em ${format(new Date(proposal.created_at), 'dd/MM/yyyy')}`}
              {proposal.sent_date && ` · Enviada em ${format(new Date(proposal.sent_date + 'T12:00:00'), 'dd/MM/yyyy')}`}
              {proposal.validity_date && ` · Válida até ${format(new Date(proposal.validity_date + 'T12:00:00'), 'dd/MM/yyyy')}`}
            </p>
          </div>
        </div>
        <div className="border-t border-border p-3 px-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> {totalViews} visualizações
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Última: {lastView ? format(new Date(lastView.viewed_at), 'dd/MM HH:mm') : '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {proposal.status === 'draft' && (
              <Button size="sm" onClick={handleSendToClient}>
                <Send className="mr-1.5 h-4 w-4" /> Enviar ao Cliente
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="mr-1.5 h-4 w-4" /> Copiar Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/orcamentos/${proposal.slug}`)}>
              <Pencil className="mr-1.5 h-4 w-4" /> Editar
            </Button>
            <Button size="sm" onClick={handleOpenProposal}>
              <ExternalLink className="mr-1.5 h-4 w-4" /> Ver Proposta
            </Button>
          </div>
        </div>
      </Card>

      {/* Section 2 — Dados do Cliente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-px bg-border rounded-lg overflow-hidden border">
            <div className="bg-background p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Cliente</p>
              <p className="text-sm font-medium">{proposal.client_name || '—'}</p>
            </div>
            <div className="bg-background p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Projeto</p>
              <p className="text-sm font-medium">{proposal.project_name || '—'}</p>
            </div>
            <div className="bg-background p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Responsável</p>
              <p className="text-sm font-medium">{proposal.client_responsible || '—'}</p>
            </div>
            <div className="bg-background p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">WhatsApp</p>
              <p className="text-sm font-medium">{proposal.whatsapp_number || '—'}</p>
            </div>
            {proposal.company_description && (
              <div className="bg-background p-3 col-span-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Descrição da empresa</p>
                <p className="text-sm text-muted-foreground">{proposal.company_description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Investimento */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Investimento</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border">
            <div className="bg-background p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Valor de tabela</p>
              <p className={`text-sm text-muted-foreground ${proposal.discount_pct ? 'line-through' : ''}`}>{formatCurrency(proposal.list_price)}</p>
            </div>
            <div className="bg-background p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Desconto</p>
              <p className="text-sm text-green-500">
                {proposal.discount_pct ? `-${proposal.discount_pct}%` : '—'}
              </p>
            </div>
            <div className="bg-background p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-0.5">Valor final</p>
              <p className="text-xl font-bold">{formatCurrency(proposal.final_value)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4 — Histórico de Visualizações */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Histórico de Visualizações</CardTitle>
          {views && views.length > 0 && (
            <span className="text-xs text-muted-foreground">{views.length} registros</span>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {viewsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !views || views.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <EyeOff className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhuma visualização registrada</p>
            </div>
          ) : (
            <div>
              {views.map((view, i) => {
                const isMobile = view.device_type === 'mobile';
                const uaInfo = parseUserAgent(view.user_agent);
                return (
                  <div
                    key={view.id}
                    className={`flex items-center gap-3 py-3 ${i < views.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${isMobile ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                      {isMobile
                        ? <Smartphone className="h-4 w-4 text-blue-500" />
                        : <Monitor className="h-4 w-4 text-green-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{isMobile ? 'Mobile' : 'Desktop'}</span>
                        {uaInfo && <span className="text-xs text-muted-foreground/60 ml-1">{uaInfo}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(view.viewed_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDuration(view.time_on_page_seconds)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5 — Versões */}
      {versions.length > 1 && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" /> Versões
            </h3>
            <span className="text-xs text-muted-foreground">{versions.length} versões</span>
          </div>
          <div className="divide-y divide-border">
            {versions.map((v) => {
              const isCurrent = v.id === proposal.id;
              const vStatus = statusMap[v.status] || statusMap.draft;
              return (
                <div
                  key={v.id}
                  className={`flex items-center justify-between px-6 py-4 ${isCurrent ? 'bg-muted/30' : 'hover:bg-muted/20 transition-colors'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      v{v.version}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{isCurrent ? 'Versão atual' : `Versão ${v.version}`}</span>
                        <Badge variant={vStatus.variant} className="text-xs px-2 py-0">{vStatus.label}</Badge>
                        {!isCurrent && <Badge variant="destructive" className="text-xs px-2 py-0">Desabilitada</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Criada em {format(new Date(v.created_at), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrent ? (
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">Ativa agora</span>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => handleSetLatest(v.id)}>
                          Usar esta versão
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Section 6 — Placeholder */}
    </ResponsiveContainer>
  );
}
