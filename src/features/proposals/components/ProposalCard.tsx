import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Copy, ExternalLink, Trash2, Calendar, Building2, MoreHorizontal, Eye, DollarSign, User, Pencil } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { format } from 'date-fns';
import { toast } from 'sonner';

import type { Proposal } from '../types';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  sent: { label: 'Enviada', variant: 'default' },
  approved: { label: 'Aprovada', variant: 'default' },
  expired: { label: 'Expirada', variant: 'destructive' },
};

interface Props {
  proposal: Proposal;
  onDelete?: (id: string) => void;
}

export function ProposalCard({ proposal, onDelete }: Props) {
  const navigate = useNavigate();
  const status = statusMap[proposal.status] || statusMap.draft;
  const { differenceInDays } = require('date-fns');
  const daysLeft = differenceInDays(new Date(proposal.validity_date), new Date());
  const publicUrl = `${window.location.origin}/orcamento/${proposal.slug}`;
  const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.final_value);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl).then(() => toast.success('Link copiado!'));
  };

  const handleOpenProposal = () => {
    window.open(`/orcamento/${proposal.slug}`, '_blank');
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 shrink-0">
              {proposal.client_logo ? (
                <AvatarImage src={proposal.client_logo} alt={proposal.client_name} />
              ) : null}
              <AvatarFallback className="bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              {proposal.project_number && (
                <p className="text-xs font-medium text-muted-foreground/70 mb-0.5">
                  Nº {proposal.project_number}
                </p>
              )}
              <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
                {proposal.project_name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{proposal.client_name}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="shrink-0 ml-2 h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleOpenProposal}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Proposta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/orcamentos/${proposal.id}`)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Link
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(proposal.id)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge variant={status.variant} className="text-xs px-2 py-0.5">
            {status.label}
          </Badge>
          {daysLeft > 0 ? (
            <Badge variant="outline" className="text-xs px-2 py-0.5 text-success border-success/30">
              {daysLeft} dias restantes
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs px-2 py-0.5">
              Expirada
            </Badge>
          )}
        </div>

        <div className="space-y-1.5 text-xs mb-3">
          {proposal.client_responsible && (
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              <span className="truncate">{proposal.client_responsible}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            <span className="font-semibold text-foreground">{formattedValue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            <span>
              Validade: {format(new Date(proposal.validity_date), "dd/MM/yyyy")}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/orcamentos/${proposal.id}`)}
          className="w-full h-8 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
        >
          <ExternalLink className="mr-1.5 h-3 w-3" />
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
}
