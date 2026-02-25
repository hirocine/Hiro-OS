import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Trash2, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const status = statusMap[proposal.status] || statusMap.draft;
  const daysLeft = differenceInDays(new Date(proposal.validity_date), new Date());
  const publicUrl = `${window.location.origin}/orcamento/${proposal.slug}`;
  const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.final_value);

  return (
    <Card className="group hover:shadow-elegant transition-shadow">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{proposal.project_name}</h3>
            <p className="text-sm text-muted-foreground truncate">{proposal.client_name}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(proposal.validity_date), "dd/MM/yyyy")}
          </span>
          {daysLeft > 0 ? (
            <span className="text-success">{daysLeft} dias restantes</span>
          ) : (
            <span className="text-destructive">Expirada</span>
          )}
        </div>

        <p className="text-lg font-bold text-foreground">{formattedValue}</p>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigator.clipboard.writeText(publicUrl).then(() => toast.success('Link copiado!'))}
          >
            <Copy className="h-3.5 w-3.5 mr-1" /> Copiar Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/orcamento/${proposal.slug}`, '_blank')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(proposal.id)} className="text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
