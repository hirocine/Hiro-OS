import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Copy, CopyPlus, Trash2, Building2, MoreHorizontal, Eye, EyeOff, Pencil } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { toast } from 'sonner';
import type { Proposal } from '../types';
import { StatusPill } from '@/ds/components/StatusPill';

type ProposalTone = 'muted' | 'info' | 'warning' | 'success' | 'danger';

const statusMap: Record<string, { label: string; tone: ProposalTone; icon?: string }> = {
  draft:       { label: 'Rascunho',    tone: 'muted' },
  sent:        { label: 'Enviada',     tone: 'info' },
  opened:      { label: 'Aberta',      tone: 'warning' },
  new_version: { label: 'Nova Versão', tone: 'info' },
  approved:    { label: 'Aprovada',    tone: 'success', icon: '✓' },
  expired:     { label: 'Arquivada',   tone: 'danger' },
};

interface Props {
  proposal: Proposal;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

export function ProposalCard({ proposal, onDelete, onDuplicate }: Props) {
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
    <div
      className="ds-hover-lift"
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            background: 'hsl(var(--ds-line-2))',
            color: 'hsl(var(--ds-fg-3))',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {proposal.client_logo ? (
            <img
              src={proposal.client_logo}
              alt={proposal.client_name}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Building2 size={18} strokeWidth={1.5} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {proposal.project_number && (
              <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                Nº {proposal.project_number}
              </span>
            )}
            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {proposal.project_name}
            </h3>
            <StatusPill label={status.label} tone={status.tone} icon={status.icon} />
            {proposal.version > 1 && (
              <span className="pill muted">v{proposal.version}</span>
            )}
            {daysLeft <= 3 && daysLeft > 0 && (
              <StatusPill label={`Expira em ${daysLeft}d`} tone="warning" icon="⏰" />
            )}
            {daysLeft <= 0 && proposal.status !== 'approved' && (
              <StatusPill label="Expirada" tone="danger" icon="⏰" />
            )}
          </div>

          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {proposal.client_name}
            {proposal.client_responsible && ` · ${proposal.client_responsible}`}
          </p>

          <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {proposal.created_at && `Criada em ${format(new Date(proposal.created_at), 'dd/MM/yyyy')}`}
            {proposal.sent_date && ` · Enviada em ${format(new Date(proposal.sent_date + 'T12:00:00'), 'dd/MM/yyyy')}`}
            {proposal.validity_date && ` · Válida até ${format(new Date(proposal.validity_date + 'T12:00:00'), 'dd/MM/yyyy')}`}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              style={{
                width: 28,
                height: 28,
                display: 'grid',
                placeItems: 'center',
                color: 'hsl(var(--ds-fg-3))',
                cursor: 'pointer',
                flexShrink: 0,
                background: 'transparent',
                border: 0,
              }}
              aria-label="Ações"
            >
              <MoreHorizontal size={16} strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpenProposal}>
              <Eye className="mr-2 h-4 w-4" /> Ver Proposta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/orcamentos/${proposal.slug}/overview`)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" /> Copiar Link
            </DropdownMenuItem>
            {onDuplicate && (
              <DropdownMenuItem onClick={() => onDuplicate(proposal.id)}>
                <CopyPlus className="mr-2 h-4 w-4" /> Duplicar
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(proposal.id)}
                  className="text-[hsl(0_84%_60%)] focus:text-[hsl(0_84%_60%)]"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        style={{
          borderTop: '1px solid hsl(var(--ds-line-1))',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
          {proposal.views_count > 0 ? (
            <>
              <Eye size={13} strokeWidth={1.5} />
              <span>
                {proposal.views_count} {proposal.views_count === 1 ? 'visualização' : 'visualizações'}
              </span>
            </>
          ) : (
            <>
              <EyeOff size={13} strokeWidth={1.5} style={{ opacity: 0.6 }} />
              <span style={{ opacity: 0.7 }}>Não visualizada</span>
            </>
          )}
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn"
            style={{ height: 28, padding: '0 10px', fontSize: 11, gap: 4 }}
            onClick={handleCopyLink}
          >
            <Copy size={12} strokeWidth={1.5} />
            <span>Copiar Link</span>
          </button>
          <button
            type="button"
            className="btn"
            style={{ height: 28, padding: '0 10px', fontSize: 11, gap: 4 }}
            onClick={() => navigate(`/orcamentos/${proposal.slug}/overview`)}
          >
            <Pencil size={12} strokeWidth={1.5} />
            <span>Editar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
