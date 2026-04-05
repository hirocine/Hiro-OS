import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Copy, ExternalLink, Trash2, Building2, MoreHorizontal, Eye, EyeOff, Pencil, Clock } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { toast } from 'sonner';
import type { Proposal } from '../types';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'info' | 'warning' | 'success' | 'neutral' }> = {
  draft:       { label: 'Rascunho',    variant: 'neutral' },
  sent:        { label: 'Enviada',     variant: 'info' },
  opened:      { label: 'Aberta',      variant: 'warning' },
  new_version: { label: 'Nova Versão', variant: 'info' },
  approved:    { label: 'Aprovada',    variant: 'success' },
  expired:     { label: 'Arquivada',   variant: 'destructive' },
};

interface Props {
  proposal: Proposal;
  onDelete?: (id: string) => void;
}

export function ProposalCard({ proposal, onDelete }: Props) {
  const navigate = useNavigate();
  const status = statusMap[proposal.status] || statusMap.draft;
  const daysLeft = differenceInDays(new Date(proposal.validity_date + 'T12:00:00'), new Date());
  const publicUrl = `${window.location.origin}/orcamento/${proposal.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => toast.success('Link copiado!'));
  };

  const handleOpenProposal = () => {
    window.open(`/orcamento/${proposal.slug}?v=${Date.now()}`, '_blank');
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Topo: logo + info + menu */}
      <div className="p-4 flex items-start gap-4">
        <Avatar className="h-12 w-12 rounded-lg shrink-0">
          {proposal.client_logo && (
            <AvatarImage src={proposal.client_logo} alt={proposal.client_name} className="rounded-lg" />
          )}
          <AvatarFallback className="bg-muted rounded-lg">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Linha 1: nome + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {proposal.project_number && (
              <span className="text-xs text-muted-foreground/60 font-medium">Nº {proposal.project_number}</span>
            )}
            <h3 className="font-semibold text-base leading-tight truncate">{proposal.project_name}</h3>
            <Badge variant={status.variant} className="text-xs px-2 py-0.5 shrink-0">{status.label}</Badge>
            {proposal.version > 1 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5 shrink-0">v{proposal.version}</Badge>
            )}
            {daysLeft <= 3 && daysLeft > 0 && (
              <Badge variant="warning" className="text-xs px-2 py-0.5 shrink-0">Expira em {daysLeft}d</Badge>
            )}
            {daysLeft <= 0 && proposal.status !== 'approved' && (
              <Badge variant="destructive" className="text-xs px-2 py-0.5 shrink-0">Expirada</Badge>
            )}
          </div>

          {/* Linha 2: cliente · responsável */}
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {proposal.client_name}
            {proposal.client_responsible && ` · ${proposal.client_responsible}`}
          </p>

          {/* Linha 3: datas */}
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {proposal.created_at && `Criada em ${format(new Date(proposal.created_at), 'dd/MM/yyyy')}`}
            {proposal.sent_date && ` · Enviada em ${format(new Date(proposal.sent_date + 'T12:00:00'), 'dd/MM/yyyy')}`}
            {proposal.validity_date && ` · Válida até ${format(new Date(proposal.validity_date + 'T12:00:00'), 'dd/MM/yyyy')}`}
          </p>
        </div>

        {/* Menu kebab */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpenProposal}>
              <Eye className="mr-2 h-4 w-4" /> Ver Proposta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/orcamentos/${proposal.id}`)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" /> Copiar Link
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(proposal.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rodapé: métricas à esquerda, ações à direita */}
      <div className="border-t border-border px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        {/* Métricas */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {proposal.views_count > 0 ? (
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {proposal.views_count} {proposal.views_count === 1 ? 'visualização' : 'visualizações'}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground/50">
              <EyeOff className="h-3.5 w-3.5" /> Não visualizada
            </span>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="h-7 text-xs px-3">
            <Copy className="mr-1.5 h-3 w-3" /> Copiar Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/orcamentos/${proposal.id}`)} className="h-7 text-xs px-3">
            <Pencil className="mr-1.5 h-3 w-3" /> Editar
          </Button>
          <Button size="sm" onClick={() => navigate(`/orcamentos/${proposal.id}/overview`)} className="h-7 text-xs px-3">
            <ExternalLink className="mr-1.5 h-3 w-3" /> Ver Proposta
          </Button>
        </div>
      </div>
    </Card>
  );
}
