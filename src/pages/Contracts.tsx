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
  Repeat,
  RefreshCcw,
  type LucideIcon,
} from 'lucide-react';
import {
  useContracts,
  STATUS_LABEL,
  STATUS_TONE,
  VIGENCIA_LABEL,
  VIGENCIA_TONE,
  FREQUENCY_LABEL,
  isVisibleInTab,
  isVisibleInRecurringTab,
  recurringVigencia,
  daysUntil,
  countSignedSigners,
} from '@/features/contracts/useContracts';
import type {
  Contract,
  ContractPartyType,
  ContractStatus,
  ContractView,
  ProjectTab,
  RecurringTab,
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

  // Top-level view toggle.
  const [view, setView] = useState<ContractView>('project');

  // Sub-tabs (split state — each view keeps its own selected tab).
  const [projectTab, setProjectTab] = useState<ProjectTab>('in_progress');
  const [recurringTab, setRecurringTab] = useState<RecurringTab>('active');

  // Shared filters
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [partyFilter, setPartyFilter] = useState<ContractPartyType | 'all'>('all');
  const [search, setSearch] = useState('');

  const projectItems = useMemo(() => items.filter((c) => c.contract_class === 'project'), [items]);
  const recurringItems = useMemo(() => items.filter((c) => c.contract_class === 'recurring'), [items]);

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <Header
          view={view}
          projectCount={projectItems.length}
          recurringCount={recurringItems.length}
        />

        {/* Top-level view toggle */}
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <div className="tabs-seg" role="tablist" aria-label="Tipo de contrato">
            <button
              type="button"
              className={'s' + (view === 'project' ? ' on' : '')}
              role="tab"
              aria-selected={view === 'project'}
              onClick={() => setView('project')}
            >
              <FileSignature size={13} strokeWidth={1.5} style={{ marginRight: 6 }} />
              Por projeto
              <span style={{ marginLeft: 6, fontSize: 10, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums' }}>
                {projectItems.length}
              </span>
            </button>
            <button
              type="button"
              className={'s' + (view === 'recurring' ? ' on' : '')}
              role="tab"
              aria-selected={view === 'recurring'}
              onClick={() => setView('recurring')}
            >
              <Repeat size={13} strokeWidth={1.5} style={{ marginRight: 6 }} />
              Recorrentes
              <span style={{ marginLeft: 6, fontSize: 10, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums' }}>
                {recurringItems.length}
              </span>
            </button>
          </div>
        </div>

        {view === 'project' ? (
          <ProjectView
            items={projectItems}
            tab={projectTab}
            setTab={setProjectTab}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            partyFilter={partyFilter}
            setPartyFilter={setPartyFilter}
            search={search}
            setSearch={setSearch}
            onOpen={(id) => navigate(`/juridico/contratos/${id}`)}
          />
        ) : (
          <RecurringView
            items={recurringItems}
            tab={recurringTab}
            setTab={setRecurringTab}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            partyFilter={partyFilter}
            setPartyFilter={setPartyFilter}
            search={search}
            setSearch={setSearch}
            onOpen={(id) => navigate(`/juridico/contratos/${id}`)}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────

function Header({
  view,
  projectCount,
  recurringCount,
}: {
  view: ContractView;
  projectCount: number;
  recurringCount: number;
}) {
  return (
    <div className="ph">
      <div>
        <h1 className="ph-title">Contratos.</h1>
        <p className="ph-sub">
          Sincronizado com o ZapSign. {projectCount + recurringCount} contrato
          {projectCount + recurringCount !== 1 ? 's' : ''}
          {view === 'project'
            ? ` · ${projectCount} por projeto`
            : ` · ${recurringCount} recorrente${recurringCount !== 1 ? 's' : ''}`}
          .
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PROJECT VIEW
// ─────────────────────────────────────────────────────────────────

function ProjectView({
  items,
  tab,
  setTab,
  statusFilter,
  setStatusFilter,
  partyFilter,
  setPartyFilter,
  search,
  setSearch,
  onOpen,
}: {
  items: Contract[];
  tab: ProjectTab;
  setTab: (t: ProjectTab) => void;
  statusFilter: ContractStatus | 'all';
  setStatusFilter: (s: ContractStatus | 'all') => void;
  partyFilter: ContractPartyType | 'all';
  setPartyFilter: (p: ContractPartyType | 'all') => void;
  search: string;
  setSearch: (s: string) => void;
  onOpen: (id: string) => void;
}) {
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
    <>
      {unlinkedCount > 0 && tab !== 'unlinked' && (
        <UnlinkedBanner count={unlinkedCount} onShow={() => setTab('unlinked')} />
      )}

      {/* Sub-tabs */}
      <div
        style={{
          marginTop: unlinkedCount > 0 && tab !== 'unlinked' ? 16 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div className="tabs-seg" role="tablist" aria-label="Filtrar contratos por projeto">
          {(['in_progress', 'unlinked', 'signed', 'archived', 'all'] as ProjectTab[]).map((t) => {
            const labels: Record<ProjectTab, string> = {
              unlinked:    'Aguardando vinculação',
              in_progress: 'Em andamento',
              signed:      'Assinados',
              archived:    'Arquivados',
              all:         'Todos',
            };
            const counts: Record<ProjectTab, number> = {
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

      <Filters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        partyFilter={partyFilter}
        setPartyFilter={setPartyFilter}
      />

      <div style={{ marginTop: 16 }}>
        {visible.length === 0 ? (
          <EmptyProjectState tab={tab} />
        ) : (
          <div
            style={{
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
            }}
          >
            {visible.map((c, idx) => (
              <ProjectRow
                key={c.id}
                contract={c}
                isFirst={idx === 0}
                onClick={() => onOpen(c.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// RECURRING VIEW — focused on vigência
// ─────────────────────────────────────────────────────────────────

function RecurringView({
  items,
  tab,
  setTab,
  statusFilter,
  setStatusFilter,
  partyFilter,
  setPartyFilter,
  search,
  setSearch,
  onOpen,
}: {
  items: Contract[];
  tab: RecurringTab;
  setTab: (t: RecurringTab) => void;
  statusFilter: ContractStatus | 'all';
  setStatusFilter: (s: ContractStatus | 'all') => void;
  partyFilter: ContractPartyType | 'all';
  setPartyFilter: (p: ContractPartyType | 'all') => void;
  search: string;
  setSearch: (s: string) => void;
  onOpen: (id: string) => void;
}) {
  const activeCount = items.filter((c) => isVisibleInRecurringTab(c, 'active')).length;
  const expiringCount = items.filter((c) => isVisibleInRecurringTab(c, 'expiring')).length;
  const expiredCount = items.filter((c) => isVisibleInRecurringTab(c, 'expired')).length;
  const terminatedCount = items.filter((c) => isVisibleInRecurringTab(c, 'terminated')).length;
  const pendingCount = items.filter((c) => isVisibleInRecurringTab(c, 'pending')).length;

  // Atenção: contratos vencendo em ≤ 30d ou já vencidos
  const criticalCount = items.filter((c) => {
    const v = recurringVigencia(c);
    return v === 'expiring_critical' || v === 'expired';
  }).length;

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return items
      .filter((c) => isVisibleInRecurringTab(c, tab))
      .filter((c) => statusFilter === 'all' || c.status === statusFilter)
      .filter((c) => partyFilter === 'all' || c.party_type === partyFilter)
      .filter((c) => {
        if (!q) return true;
        return (
          c.title.toLowerCase().includes(q) ||
          (c.linked_client_name ?? '').toLowerCase().includes(q) ||
          (c.linked_project_name ?? '').toLowerCase().includes(q) ||
          c.signers.some((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        // Ordena por proximidade de vencimento (próximas a vencer primeiro);
        // pending vai pro final.
        const av = recurringVigencia(a);
        const bv = recurringVigencia(b);
        if (av === 'pending' && bv !== 'pending') return 1;
        if (bv === 'pending' && av !== 'pending') return -1;
        const ae = a.recurrence?.end_date ?? '';
        const be = b.recurrence?.end_date ?? '';
        return new Date(ae).getTime() - new Date(be).getTime();
      });
  }, [items, tab, statusFilter, partyFilter, search]);

  return (
    <>
      {criticalCount > 0 && tab !== 'expiring' && tab !== 'expired' && (
        <CriticalBanner count={criticalCount} onShow={() => setTab('expiring')} />
      )}

      {/* Sub-tabs — vigência focused */}
      <div
        style={{
          marginTop: criticalCount > 0 && tab !== 'expiring' && tab !== 'expired' ? 16 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div className="tabs-seg" role="tablist" aria-label="Filtrar contratos recorrentes">
          {(['active', 'expiring', 'expired', 'pending', 'terminated', 'all'] as RecurringTab[]).map((t) => {
            const labels: Record<RecurringTab, string> = {
              active:     'Vigentes',
              expiring:   'Vencendo ≤ 90d',
              expired:    'Vencidos',
              pending:    'Em assinatura',
              terminated: 'Encerrados',
              all:        'Todos',
            };
            const counts: Record<RecurringTab, number> = {
              active:     activeCount,
              expiring:   expiringCount,
              expired:    expiredCount,
              pending:    pendingCount,
              terminated: terminatedCount,
              all:        items.length,
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

      <Filters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        partyFilter={partyFilter}
        setPartyFilter={setPartyFilter}
      />

      <div style={{ marginTop: 16 }}>
        {visible.length === 0 ? (
          <EmptyRecurringState tab={tab} />
        ) : (
          <div
            style={{
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
            }}
          >
            {visible.map((c, idx) => (
              <RecurringRow
                key={c.id}
                contract={c}
                isFirst={idx === 0}
                onClick={() => onOpen(c.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Shared filters
// ─────────────────────────────────────────────────────────────────

function Filters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  partyFilter,
  setPartyFilter,
}: {
  search: string;
  setSearch: (s: string) => void;
  statusFilter: ContractStatus | 'all';
  setStatusFilter: (s: ContractStatus | 'all') => void;
  partyFilter: ContractPartyType | 'all';
  setPartyFilter: (p: ContractPartyType | 'all') => void;
}) {
  return (
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
  );
}

// ─────────────────────────────────────────────────────────────────
// Banners
// ─────────────────────────────────────────────────────────────────

function UnlinkedBanner({ count, onShow }: { count: number; onShow: () => void }) {
  return (
    <div
      style={{
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

function CriticalBanner({ count, onShow }: { count: number; onShow: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        border: '1px solid hsl(var(--ds-danger) / 0.4)',
        background: 'hsl(var(--ds-danger) / 0.06)',
      }}
    >
      <AlertCircle size={16} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-danger))', flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>
        <strong style={{ fontWeight: 600 }}>
          {count} contrato{count !== 1 ? 's' : ''} recorrente{count !== 1 ? 's' : ''}
        </strong>{' '}
        {count === 1 ? 'precisa' : 'precisam'} de atenção: vencendo em ≤ 30d ou já vencido sem renovação.
      </div>
      <button type="button" className="btn danger sm" onClick={onShow}>
        <RefreshCcw size={13} strokeWidth={1.5} />
        <span>Ver agora</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Project row
// ─────────────────────────────────────────────────────────────────

function ProjectRow({
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

          <span>·</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatDistanceToNow(new Date(contract.created_at), { addSuffix: true, locale: ptBR })}
          </span>

          {contract.value_brl != null && (
            <>
              <span>·</span>
              <Money value={contract.value_brl} style={{ fontSize: 12 }} />
            </>
          )}
        </div>
      </div>

      <SignersProgress signed={signed} total={total} />

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

// ─────────────────────────────────────────────────────────────────
// Recurring row — focused on vigência
// ─────────────────────────────────────────────────────────────────

function RecurringRow({
  contract,
  isFirst,
  onClick,
}: {
  contract: Contract;
  isFirst: boolean;
  onClick: () => void;
}) {
  const r = contract.recurrence;
  if (!r) return null;
  const vig = recurringVigencia(contract);
  if (!vig) return null;
  const daysToEnd = daysUntil(r.end_date);
  const critical = vig === 'expiring_critical' || vig === 'expired';

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
        background: critical ? 'hsl(var(--ds-danger) / 0.04)' : 'transparent',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')}
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = critical ? 'hsl(var(--ds-danger) / 0.04)' : 'transparent')
      }
    >
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
        <Repeat size={15} strokeWidth={1.5} />
      </div>

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
          <StatusPill label={VIGENCIA_LABEL[vig]} tone={VIGENCIA_TONE[vig]} />
          <span className="pill muted" style={{ fontSize: 10 }}>
            {FREQUENCY_LABEL[r.frequency]}
          </span>
          {r.auto_renew && (
            <StatusPill label="Auto-renova" tone="info" icon={<RefreshCcw size={11} strokeWidth={1.5} />} />
          )}
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
          {contract.linked_client_name && (
            <>
              <span title="Cliente">
                <span style={{ color: 'hsl(var(--ds-fg-4))' }}>cliente</span> {contract.linked_client_name}
              </span>
              <span>·</span>
            </>
          )}
          <span title="Vigência">
            <span style={{ color: 'hsl(var(--ds-fg-4))' }}>vigência</span>{' '}
            {format(new Date(r.start_date), 'dd/MM/yy', { locale: ptBR })}{' '}
            <span style={{ color: 'hsl(var(--ds-fg-4))' }}>→</span>{' '}
            {format(new Date(r.end_date), 'dd/MM/yy', { locale: ptBR })}
          </span>
          {daysToEnd !== null && (
            <>
              <span>·</span>
              <span
                style={{
                  color:
                    vig === 'expiring_critical' || vig === 'expired'
                      ? 'hsl(var(--ds-danger))'
                      : vig === 'expiring_soon'
                        ? 'hsl(var(--ds-warning))'
                        : undefined,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {daysToEnd >= 0 ? `vence em ${daysToEnd}d` : `venceu há ${Math.abs(daysToEnd)}d`}
              </span>
            </>
          )}
          {!r.auto_renew && (
            <>
              <span>·</span>
              <span style={{ color: 'hsl(var(--ds-fg-4))' }}>
                aviso prévio {r.notice_period_days}d
              </span>
            </>
          )}
        </div>
      </div>

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

// ─────────────────────────────────────────────────────────────────
// Empty states
// ─────────────────────────────────────────────────────────────────

function EmptyProjectState({ tab }: { tab: ProjectTab }) {
  const copy: Record<ProjectTab, { title: string; sub: string; Icon: LucideIcon }> = {
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
      title: 'Sem contratos por projeto ainda.',
      sub: 'Quando o ZapSign disparar o primeiro webhook, eles aparecem aqui.',
      Icon: FileSignature,
    },
  };
  return <EmptyShell {...copy[tab]} />;
}

function EmptyRecurringState({ tab }: { tab: RecurringTab }) {
  const copy: Record<RecurringTab, { title: string; sub: string; Icon: LucideIcon }> = {
    active: {
      title: 'Nenhum contrato vigente.',
      sub: 'Quando um contrato recorrente for assinado, ele aparece aqui.',
      Icon: Repeat,
    },
    expiring: {
      title: 'Nenhum contrato vencendo logo.',
      sub: 'Bem-vindo ao paraíso. Vence em até 90 dias = aparece aqui.',
      Icon: Check,
    },
    expired: {
      title: 'Sem contratos vencidos.',
      sub: 'Tudo em ordem — nenhum recorrente passou da validade sem renovar.',
      Icon: Check,
    },
    pending: {
      title: 'Sem recorrentes em assinatura.',
      sub: 'Novos contratos recorrentes em fluxo de assinatura aparecem aqui.',
      Icon: Clock,
    },
    terminated: {
      title: 'Sem contratos encerrados.',
      sub: 'Recorrentes cancelados ou recusados aparecem aqui.',
      Icon: X,
    },
    all: {
      title: 'Sem contratos recorrentes.',
      sub: 'Quando um contrato continuado for criado no ZapSign, aparece aqui.',
      Icon: Repeat,
    },
  };
  return <EmptyShell {...copy[tab]} />;
}

function EmptyShell({ title, sub, Icon }: { title: string; sub: string; Icon: LucideIcon }) {
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
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <h3 style={{ ...HN_DISPLAY, fontSize: 16, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 6 }}>{sub}</p>
    </div>
  );
}
