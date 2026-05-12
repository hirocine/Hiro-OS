import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Eye, EyeOff, Clock, Monitor, Smartphone, ExternalLink, Pencil, Copy, Building2, GitBranch, Loader2, type LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useProposalDetailsBySlug } from '@/features/proposals/hooks/useProposalDetailsBySlug';
import { formatMoney } from '@/ds/lib/money';
import { useProposalViews } from '@/features/proposals/hooks/useProposalViews';
import { supabase } from '@/integrations/supabase/client';
import { StatusPill } from '@/ds/components/StatusPill';

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

type StatusTone = 'muted' | 'info' | 'warning' | 'success' | 'danger';

const statusMap: Record<string, { label: string; tone: StatusTone; icon?: string }> = {
  draft: { label: 'Rascunho', tone: 'muted' },
  sent: { label: 'Enviada', tone: 'info' },
  opened: { label: 'Aberta', tone: 'warning' },
  new_version: { label: 'Nova Versão', tone: 'info' },
  approved: { label: 'Aprovada', tone: 'success', icon: '✓' },
  expired: { label: 'Arquivada', tone: 'danger' },
};

function SectionShell({
  icon: Icon,
  title,
  actions,
  children,
  bodyPadding = 18,
}: {
  icon?: LucideIcon;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyPadding?: number | string;
}) {
  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--ds-line-1))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />}
          <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>{title}</span>
        </div>
        {actions}
      </div>
      <div style={{ padding: bodyPadding }}>{children}</div>
    </div>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  marginBottom: 4,
};

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins}min ${secs}s` : `${secs}s`;
}

// Falls back to '—' for null/undefined/zero; otherwise BRL via the canonical formatter.
function formatCurrency(value: number | null | undefined): string {
  return value ? formatMoney(value) : '—';
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
  const { data: proposal, isLoading } = useProposalDetailsBySlug(slug);
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

  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!proposal?.id) return;
    setHistoryLoading(true);
    const parentId = proposal.parent_id || proposal.id;
    supabase
      .from('orcamentos')
      .select('id')
      .or(`id.eq.${parentId},parent_id.eq.${parentId}`)
      .then(({ data: versionRows }) => {
        const allIds = (versionRows || []).map((v: any) => v.id);
        if (allIds.length === 0) { setHistoryLoading(false); return; }
        supabase
          .from('audit_logs')
          .select('id, action, user_email, user_id, created_at')
          .eq('table_name', 'orcamentos')
          .in('record_id', allIds)
        .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data: logs }) => {
            const entries = logs || [];
            const userIds = [...new Set(entries.map((e: any) => e.user_id).filter(Boolean))];
            if (userIds.length === 0) {
              setHistory(entries);
              setHistoryLoading(false);
              return;
            }
            supabase
              .from('profiles')
              .select('user_id, display_name, avatar_url')
              .in('user_id', userIds)
              .then(({ data: profiles }) => {
                const profileMap: Record<string, any> = {};
                (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
                setHistory(entries.map((e: any) => ({ ...e, profile: e.user_id ? profileMap[e.user_id] || null : null })));
                setHistoryLoading(false);
              });
          });
      });
  }, [proposal?.id]);

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


  const totalViews = proposal?.views_count || 0;
  const lastView = views && views.length > 0 ? views[0] : null;

  if (isLoading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0', color: 'hsl(var(--ds-fg-3))' }}>
          Proposta não encontrada.
        </div>
      </div>
    );
  }

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <BreadcrumbNav items={[
          { label: 'Orçamentos', href: '/orcamentos' },
          { label: proposal.project_name || 'Proposta' },
        ]} />

        {/* Section 1 — Header */}
        <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
          <div style={{ padding: 20, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <Avatar className="h-16 w-16 shrink-0" style={{ borderRadius: 0 }}>
              {proposal.client_logo && <AvatarImage src={proposal.client_logo} alt={proposal.client_name || ''} style={{ borderRadius: 0 }} />}
              <AvatarFallback style={{ borderRadius: 0, background: 'hsl(var(--ds-line-2) / 0.3)' }}>
                <Building2 size={28} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
              </AvatarFallback>
            </Avatar>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {proposal.project_number && (
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums' }}>
                    Nº {proposal.project_number}
                  </span>
                )}
                <h1 style={{ ...HN_DISPLAY, fontSize: 18, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{proposal.project_name}</h1>
                <StatusPill label={status.label} tone={status.tone} icon={status.icon} />
                {proposal.version > 1 && (
                  <span className="pill muted" style={{ fontVariantNumeric: 'tabular-nums' }}>v{proposal.version}</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                {proposal.client_name || '—'}
                {proposal.client_responsible && ` · ${proposal.client_responsible}`}
              </p>
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', fontVariantNumeric: 'tabular-nums' }}>
                {proposal.created_at && `Criada em ${format(new Date(proposal.created_at), 'dd/MM/yyyy')}`}
                {proposal.sent_date && ` · Enviada em ${format(new Date(proposal.sent_date + 'T12:00:00'), 'dd/MM/yyyy')}`}
                {proposal.validity_date && ` · Válida até ${format(new Date(proposal.validity_date + 'T12:00:00'), 'dd/MM/yyyy')}`}
              </p>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid hsl(var(--ds-line-1))',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
                <Eye size={14} strokeWidth={1.5} /> {totalViews} visualizações
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
                <Clock size={14} strokeWidth={1.5} /> Última: {lastView ? format(new Date(lastView.viewed_at), 'dd/MM HH:mm') : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn" onClick={handleCopyLink} type="button">
                <Copy size={14} strokeWidth={1.5} />
                <span>Copiar Link</span>
              </button>
              <button className="btn" onClick={() => navigate(`/orcamentos/${proposal.slug}`)} type="button">
                <Pencil size={14} strokeWidth={1.5} />
                <span>Editar</span>
              </button>
              <button className="btn primary" onClick={handleOpenProposal} type="button">
                <ExternalLink size={14} strokeWidth={1.5} />
                <span>Ver Proposta</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2 — Dados do Cliente */}
        <SectionShell title="Dados do Cliente" bodyPadding={0}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            background: 'hsl(var(--ds-line-1))',
          }}>
            <div style={{ background: 'hsl(var(--ds-surface))', padding: 14 }}>
              <p style={fieldLabelStyle}>Cliente</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{proposal.client_name || '—'}</p>
            </div>
            <div style={{ background: 'hsl(var(--ds-surface))', padding: 14 }}>
              <p style={fieldLabelStyle}>Projeto</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{proposal.project_name || '—'}</p>
            </div>
            <div style={{ background: 'hsl(var(--ds-surface))', padding: 14 }}>
              <p style={fieldLabelStyle}>Responsável</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{proposal.client_responsible || '—'}</p>
            </div>
            <div style={{ background: 'hsl(var(--ds-surface))', padding: 14 }}>
              <p style={fieldLabelStyle}>WhatsApp</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>{proposal.whatsapp_number || '—'}</p>
            </div>
            {proposal.company_description && (
              <div style={{ background: 'hsl(var(--ds-surface))', padding: 14, gridColumn: 'span 2' }}>
                <p style={fieldLabelStyle}>Descrição da empresa</p>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>{proposal.company_description}</p>
              </div>
            )}
          </div>
        </SectionShell>

        {/* Section 3 — Investimento */}
        <SectionShell title="Investimento" bodyPadding={0}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'hsl(var(--ds-line-1))',
          }}>
            <div style={{ background: 'hsl(var(--ds-surface))', padding: 14 }}>
              <p style={fieldLabelStyle}>Valor de tabela</p>
              <p style={{
                fontSize: 13,
                color: 'hsl(var(--ds-fg-3))',
                textDecoration: proposal.discount_pct ? 'line-through' : 'none',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {formatCurrency(proposal.list_price)}
              </p>
            </div>
            <div style={{ background: 'hsl(var(--ds-surface))', padding: 14 }}>
              <p style={fieldLabelStyle}>Desconto</p>
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-success))', fontVariantNumeric: 'tabular-nums' }}>
                {proposal.discount_pct ? `-${proposal.discount_pct}%` : '—'}
              </p>
            </div>
            <div style={{ background: 'hsl(var(--ds-surface))', padding: 14 }}>
              <p style={fieldLabelStyle}>Valor final</p>
              <p style={{ ...HN_DISPLAY, fontSize: 20, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
                {formatCurrency(proposal.final_value)}
              </p>
            </div>
          </div>
        </SectionShell>

        {/* Section 4 — Histórico de Visualizações */}
        <SectionShell
          title="Histórico de Visualizações"
          actions={views && views.length > 0 ? (
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>{views.length} registros</span>
          ) : undefined}
          bodyPadding={0}
        >
          {viewsLoading ? (
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !views || views.length === 0 ? (
            <div style={{ padding: 18 }}>
              <EmptyState icon={EyeOff} title="Nenhuma visualização registrada" description="As visualizações aparecerão aqui quando o link for acessado." compact />
            </div>
          ) : (
            <div>
              {views.map((view, i) => {
                const isMobile = view.device_type === 'mobile';
                const uaInfo = parseUserAgent(view.user_agent);
                return (
                  <div
                    key={view.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 18px',
                      borderBottom: i < views.length - 1 ? '1px solid hsl(var(--ds-line-1))' : 'none',
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: isMobile ? 'hsl(var(--ds-info) / 0.08)' : 'hsl(var(--ds-success) / 0.08)',
                      border: `1px solid ${isMobile ? 'hsl(var(--ds-info) / 0.3)' : 'hsl(var(--ds-success) / 0.3)'}`,
                    }}>
                      {isMobile
                        ? <Smartphone size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-info))' }} />
                        : <Monitor size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                          {isMobile ? 'Mobile' : 'Desktop'}
                        </span>
                        {uaInfo && <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))', marginLeft: 4 }}>{uaInfo}</span>}
                      </div>
                      <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                        {format(new Date(view.viewed_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      {formatDuration(view.time_on_page_seconds)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionShell>

        {/* Section 5 — Versões */}
        {versions.length > 1 && (
          <SectionShell
            icon={GitBranch}
            title="Versões"
            actions={<span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>{versions.length} versões</span>}
            bodyPadding={0}
          >
            <div>
              {versions.map((v, i) => {
                const isCurrent = v.id === proposal.id;
                const vStatus = statusMap[v.status] || statusMap.draft;
                return (
                  <div
                    key={v.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderBottom: i < versions.length - 1 ? '1px solid hsl(var(--ds-line-1))' : 'none',
                      background: isCurrent ? 'hsl(var(--ds-line-2) / 0.3)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        background: isCurrent ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-line-2) / 0.5)',
                        color: isCurrent ? 'white' : 'hsl(var(--ds-fg-3))',
                        border: '1px solid hsl(var(--ds-line-1))',
                      }}>
                        v{v.version}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                            {isCurrent ? 'Versão atual' : `Versão ${v.version}`}
                          </span>
                          <StatusPill label={vStatus.label} tone={vStatus.tone} icon={vStatus.icon} />
                          {!isCurrent && <StatusPill label="Desabilitada" tone="danger" />}
                        </div>
                        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                          Criada em {format(new Date(v.created_at), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isCurrent ? (
                        <span style={{
                          fontSize: 11,
                          color: 'hsl(var(--ds-fg-3))',
                          background: 'hsl(var(--ds-line-2) / 0.5)',
                          border: '1px solid hsl(var(--ds-line-1))',
                          padding: '4px 10px',
                        }}>
                          Ativa agora
                        </span>
                      ) : (
                        <button className="btn" onClick={() => handleSetLatest(v.id)} type="button" style={{ fontSize: 11 }}>
                          Usar esta versão
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionShell>
        )}

        {/* Section 6 — Histórico de Alterações */}
        <SectionShell icon={Clock} title="Histórico de Alterações" bodyPadding={0}>
          {historyLoading ? (
            <div style={{ padding: 24, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={16} strokeWidth={1.5} className="animate-spin" style={{ color: 'hsl(var(--ds-fg-3))' }} />
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: 18 }}>
              <EmptyState icon={Clock} title="Nenhuma alteração registrada" description="O histórico de alterações aparecerá aqui automaticamente." compact />
            </div>
          ) : (
            <div>
              {history.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    gap: 16,
                    borderBottom: i < history.length - 1 ? '1px solid hsl(var(--ds-line-1))' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                    <Avatar className="h-7 w-7 shrink-0" style={{ marginTop: 2, borderRadius: 0 }}>
                      {entry.profile?.avatar_url && <AvatarImage src={entry.profile.avatar_url} alt={entry.profile.display_name || ''} style={{ borderRadius: 0 }} />}
                      <AvatarFallback style={{ fontSize: 11, borderRadius: 0, background: 'hsl(var(--ds-line-2) / 0.3)', color: 'hsl(var(--ds-fg-2))' }}>
                        {(entry.profile?.display_name || entry.user_email || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>{entry.action}</p>
                      <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                        {entry.profile?.display_name || entry.user_email || 'Sistema'}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', flexShrink: 0, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                    {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionShell>
      </div>
    </div>
  );
}
