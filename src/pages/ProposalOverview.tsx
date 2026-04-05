import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Eye, EyeOff, Clock, Monitor, Smartphone, ExternalLink, Pencil, Copy, Building2, User, Phone, FileText } from 'lucide-react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProposalDetailsById } from '@/features/proposals/hooks/useProposalDetailsById';
import { useProposalViews } from '@/features/proposals/hooks/useProposalViews';

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

export default function ProposalOverview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: proposal, isLoading } = useProposalDetailsById(id);
  const { data: views, isLoading: viewsLoading } = useProposalViews(id);

  const publicUrl = proposal ? `${window.location.origin}/orcamento/${proposal.slug}` : '';
  const status = proposal ? (statusMap[proposal.status] || statusMap.draft) : statusMap.draft;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => toast.success('Link copiado!'));
  };

  const handleOpenProposal = () => {
    if (proposal) window.open(`/orcamento/${proposal.slug}?v=${Date.now()}`, '_blank');
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
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="mr-1.5 h-4 w-4" /> Copiar Link
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/orcamentos/${id}`)}>
              <Pencil className="mr-1.5 h-4 w-4" /> Editar
            </Button>
            <Button size="sm" onClick={handleOpenProposal}>
              <ExternalLink className="mr-1.5 h-4 w-4" /> Ver Proposta
            </Button>
          </div>
        </div>
      </Card>

      {/* Section 2 — Client Data */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Dados do Cliente</CardTitle>
          <Button variant="link" size="sm" className="text-xs" onClick={() => navigate(`/orcamentos/${id}`)}>
            Editar →
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Cliente</p><p>{proposal.client_name || '—'}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Projeto</p><p>{proposal.project_name || '—'}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">Responsável</p><p>{proposal.client_responsible || '—'}</p></div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div><p className="text-xs text-muted-foreground">WhatsApp</p><p>{proposal.whatsapp_number || '—'}</p></div>
            </div>
            {proposal.company_description && (
              <div className="col-span-full flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div><p className="text-xs text-muted-foreground">Descrição da empresa</p><p className="text-muted-foreground">{proposal.company_description}</p></div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 3 — Views History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico de Visualizações</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {viewsLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : !views || views.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <EyeOff className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhuma visualização registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Tempo na página</TableHead>
                    <TableHead>Referrer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {views.map((view, i) => (
                    <TableRow key={view.id} className={i % 2 === 0 ? '' : 'bg-muted/30'}>
                      <TableCell className="text-sm">
                        {format(new Date(view.viewed_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {view.device_type === 'mobile' ? (
                          <span className="flex items-center gap-1.5 text-sm"><Smartphone className="h-4 w-4" /> Mobile</span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-sm"><Monitor className="h-4 w-4" /> Desktop</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDuration(view.time_on_page_seconds)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {view.referrer || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4 — Placeholder */}
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Histórico de alterações — em breve</p>
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}
