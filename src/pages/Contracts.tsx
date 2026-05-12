import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ExternalLink,
  Download,
  FileSignature,
  Link2,
  AlertCircle,
  Check,
  Clock,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  useContracts,
  STATUS_LABEL,
  STATUS_TONE,
  isVisibleInTab,
  countSignedSigners,
} from '@/features/contracts/useContracts';
import type {
  Contract,
  ContractPartyType,
  ContractStatus,
  ContractTab,
} from '@/features/contracts/types';
import { StatusPill } from '@/ds/components/StatusPill';
import { Money } from '@/ds/components/Money';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

const PARTY_LABEL: Record<ContractPartyType, string> = {
  client:    'Cliente',
  freelancer:'Freelancer',
  company:   'Empresa',
  talent:    'Talent',
  nda:       'NDA',
  other:     'Outro',
};

export default function Contracts() {
  const navigate = useNavigate();
  const { items } = useContracts();

  const [tab, setTab] = useState<ContractTab>('in_progress');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [partyFilter, setPartyFilter] = useState<ContractPartyType | 'all'>('all');
  const [search, setSearch] = useState('');

  const unlinkedCount = items.filter((c) => !c.linked_at).length;
  const inProgressCount = items.filter((c) => isVisibleInTab(c, 'in_progress')).length;
  const signedCount = items.filter((c) => isVisibleInTab(c, 'signed')).length;
  const archivedCount = items.filter((c) => isVisibleInTab(c, 'archived')).length;

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter((c) => isVisibleInTab(c, tab))
      .filter((c) => statusFilter === 'all' || c.status === statusFilter)
      .filter((c) => partyFilter === 'all' || c.party_type === partyFilter)
      .filter((c) => {
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          (c.linked_client_name ?? '').toLowerCase().includes(q) ||
          (c.linked_project_name ?? '').toLowerCase().includes(q) ||
          (c.linked_supplier_name ?? '').toLowerCase().includes(q) ||
          c.signers.some((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [items, tab, statusFilter, partyFilter, search]);

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Contratos.</h1>
            <p className="ph-sub">
              Sincronizado com o ZapSign. {items.length} contrato{items.length !== 1 ? 's' : ''} no total
              {inProgressCount > 0 && ` · ${inProgressCount} em andamento`}
              {unlinkedCount > 0 && ` · ${unlinkedCount} aguardando vinculação`}.
            </p>
          </div>
        </div>

        {/* Aguardando vinculação callout */}
        {unlinkedCount > 0 && (
          <UnlinkedBanner
            count={unlinkedCount}
            onShow={() => setTab('unlinked')}
            isActive={tab === 'unlinked'}
          />
        )}

        {/* Tabs */}
        <div
          style={{
            marginTop: unlinkedCount > 0 ? 16 : 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div className="tabs-seg" role="tablist" aria-label="Filtrar contratos">
            {(['in_progress', 'unlinked', 'signed', 'archived', 'all'] as ContractTab[]).map((t) => {
              const labels: Record<ContractTab, string> = {
                unlinked:    'Aguardando vinculação',
                in_progress: 'Em andamento',
                signed:      'Assinados',
                archived:    'Arquivados',
                all:         'Todos',
              };
              const counts: Record<ContractTab, number> = {
                unlinked:    unlinkedCount,
                in_progress: inProgressCount,
                signed:      signedCount,
                archived:    archivedCount,
                all:         items.length,
              };
              const active = tab === t;
              return (
                <button
                  key={t}
                  type="button"
                  className={'s' + (active ? ' on' : '')}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t)}
                >
                  {labels[t]}
                  {counts[t] > 0 && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        color: active ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-4))',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {counts[t]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
            <Input
              placeholder="Buscar por título, cliente, projeto, signatário…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ContractStatus | 'all')}>
            <SelectTrigger className="w-44" aria-label="Filtrar por status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {(Object.keys(STATUS_LABEL) as ContractStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={partyFilter} onValueChange={(v) => setPartyFilter(v as ContractPartyType | 'all')}>
            <SelectTrigger className="w-40" aria-label="Filtrar por tipo">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {(Object.keys(PARTY_LABEL) as ContractPartyType[]).map((p) => (
                <SelectItem key={p} value={p}>{PARTY_LABEL[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <div style={{ marginTop: 16 }}>
          {visible.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <div
              style={{
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
              }}
            >
              {visible.map((c, idx) => (
                <Row
                  key={c.id}
                  contract={c}
                  isFirst={idx === 0}
                  onClick={() => navigate(`/juridico/contratos/${c.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function UnlinkedBanner({
  count,
  onShow,
  isActive,
}: {
  count: number;
  onShow: () => void;
  isActive: boolean;
}) {
  if (isActive) return null;
  return (
    <div
      style={{
        marginTop: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        border: '1px solid hsl(var(--ds-warning) / 0.4)',
        background: 'hsl(var(--ds-warning) / 0.06)',
      }}
    >
      <AlertCircle size={16} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-warning))', flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>
        <strong style={{ fontWeight: 600 }}>
          {count} contrato{count !== 1 ? 's' : ''}
        </strong>{' '}
        {count === 1 ? 'precisa' : 'precisam'} ser vinculado{count !== 1 ? 's' : ''} a um cliente ou projeto.
      </div>
      <button type="button" className="btn sm" onClick={onShow}>
        <Link2 size={13} strokeWidth={1.5} />
        <span>Vincular agora</span>
      </button>
    </div>
  );
}

function Row({
  contract,
  isFirst,
  onClick,
}: {
  contract: Contract;
  isFirst: boolean;
  onClick: () => void;
}) {
  const { signed, total } = countSignedSigners(contract);
  const needsLink = !contract.linked_at;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 18px',
        borderTop: isFirst ? undefined : '1px solid hsl(var(--ds-line-1))',
        cursor: 'pointer',
        background: needsLink ? 'hsl(var(--ds-warning) / 0.04)' : 'transparent',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = needsLink ? 'hsl(var(--ds-warning) / 0.04)' : 'transparent')
      }
    >
      {/* Icon box */}
      <div
        style={{
          width: 38,
          height: 38,
          display: 'grid',
          placeItems: 'center',
          border: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface))',
          color: 'hsl(var(--ds-fg-3))',
          flexShrink: 0,
        }}
      >
        <FileSignature size={15} strokeWidth={1.5} />
      </div>

      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              ...HN_DISPLAY,
              fontSize: 14,
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-1))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '60ch',
            }}
            title={contract.title}
          >
            {contract.title}
          </span>
          <StatusPill label={STATUS_LABEL[contract.status]} tone={STATUS_TONE[contract.status]} />
          <span className="pill muted" style={{ fontSize: 10 }}>
            {PARTY_LABEL[contract.party_type]}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12,
            color: 'hsl(var(--ds-fg-3))',
            flexWrap: 'wrap',
          }}
        >
          {/* Linked entities */}
          {contract.linked_client_name && (
            <span title="Cliente">
              <span style={{ color: 'hsl(var(--ds-fg-4))' }}>cliente</span> {contract.linked_client_name}
            </span>
          )}
          {contract.linked_project_name && (
            <>
              {contract.linked_client_name && <span>·</span>}
              <span title="Projeto">
                <span style={{ color: 'hsl(var(--ds-fg-4))' }}>projeto</span> {contract.linked_project_name}
              </span>
            </>
          )}
          {contract.linked_supplier_name && (
            <>
              {(contract.linked_client_name || contract.linked_project_name) && <span>·</span>}
              <span title="Fornecedor">
                <span style={{ color: 'hsl(var(--ds-fg-4))' }}>fornecedor</span> {contract.linked_supplier_name}
              </span>
            </>
          )}
          {needsLink && (
            <span style={{ color: 'hsl(var(--ds-warning))', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Link2 size={11} strokeWidth={1.5} />
              Sem vinculação
            </span>
          )}

          {/* Date */}
          <span>·</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatDistanceToNow(new Date(contract.created_at), { addSuffix: true, locale: ptBR })}
          </span>

          {/* Value */}
          {contract.value_brl != null && (
            <>
              <span>·</span>
              <Money value={contract.value_brl} style={{ fontSize: 12 }} />
            </>
          )}
        </div>
      </div>

      {/* Signers progress */}
      <SignersProgress signed={signed} total={total} />

      {/* Quick actions */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={contract.zapsign_doc_url}
          target="_blank"
          rel="noreferrer"
          className="btn ghost icon sm"
          title="Abrir no ZapSign"
        >
          <ExternalLink size={13} strokeWidth={1.5} />
        </a>
        {contract.signed_pdf_url && (
          <a
            href={contract.signed_pdf_url}
            target="_blank"
            rel="noreferrer"
            className="btn ghost icon sm"
            title="Baixar PDF assinado"
          >
            <Download size={13} strokeWidth={1.5} />
          </a>
        )}
      </div>
    </div>
  );
}

function SignersProgress({ signed, total }: { signed: number; total: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
        minWidth: 80,
        justifyContent: 'flex-end',
      }}
      title={`${signed} de ${total} assinaram`}
    >
      <span
        style={{
          fontSize: 12,
          color: 'hsl(var(--ds-fg-3))',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
        }}
      >
        {signed}/{total}
      </span>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: i < signed ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-line-1))',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: ContractTab }) {
  const copy: Record<ContractTab, { title: string; sub: string; Icon: LucideIcon }> = {
    in_progress: {
      title: 'Nenhum contrato em andamento.',
      sub: 'Crie um documento no ZapSign — ele aparece aqui automaticamente.',
      Icon: Clock,
    },
    unlinked: {
      title: 'Tudo vinculado.',
      sub: 'Bom trabalho — nenhum contrato esperando vinculação.',
      Icon: Check,
    },
    signed: {
      title: 'Nenhum contrato assinado ainda.',
      sub: 'Quando assinaturas forem concluídas, eles aparecem aqui.',
      Icon: Check,
    },
    archived: {
      title: 'Sem contratos arquivados.',
      sub: 'Recusados, expirados e cancelados aparecem aqui.',
      Icon: X,
    },
    all: {
      title: 'Sem contratos ainda.',
      sub: 'Quando o ZapSign disparar o primeiro webhook, os contratos aparecem aqui.',
      Icon: FileSignature,
    },
  };

  const c = copy[tab];
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          margin: '0 auto 16px',
          display: 'grid',
          placeItems: 'center',
          border: '1px solid hsl(var(--ds-line-1))',
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        <c.Icon size={20} strokeWidth={1.5} />
      </div>
      <h3 style={{ ...HN_DISPLAY, fontSize: 16, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
        {c.title}
      </h3>
      <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 6 }}>{c.sub}</p>
    </div>
  );
}
