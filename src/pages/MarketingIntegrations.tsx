import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  BarChart3, Instagram, Linkedin, Loader2, RefreshCw, Settings, Unlink,
  ExternalLink, CheckCircle2, Lock, type LucideIcon,
} from 'lucide-react';
import { EmptyState } from '@/ds/components/EmptyState';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMarketingIntegrations, type IntegrationStatus, type MarketingIntegration } from '@/hooks/useMarketingIntegrations';
import { MarketingIntegrationDialog } from '@/components/Marketing/MarketingIntegrationDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const HN_DISPLAY: React.CSSProperties = { fontFamily: '"HN Display", sans-serif' };

const eyebrowLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

type StatusTone = {
  fg: string;
  bg: string;
  border: string;
  label: string;
};

const STATUS_META: Record<IntegrationStatus, StatusTone> = {
  connected: {
    label: 'Conectado',
    fg: 'hsl(var(--ds-success))',
    bg: 'hsl(var(--ds-success) / 0.08)',
    border: 'hsl(var(--ds-success) / 0.3)',
  },
  disconnected: {
    label: 'Desconectado',
    fg: 'hsl(var(--ds-fg-3))',
    bg: 'hsl(var(--ds-line-2) / 0.3)',
    border: 'hsl(var(--ds-line-1))',
  },
  expired: {
    label: 'Expirado',
    fg: 'hsl(var(--ds-warning))',
    bg: 'hsl(var(--ds-warning) / 0.08)',
    border: 'hsl(var(--ds-warning) / 0.3)',
  },
  error: {
    label: 'Erro',
    fg: 'hsl(var(--ds-danger))',
    bg: 'hsl(var(--ds-danger) / 0.08)',
    border: 'hsl(var(--ds-danger) / 0.3)',
  },
};

function StatusPill({ status }: { status: IntegrationStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="pill"
      style={{
        color: meta.fg,
        background: meta.bg,
        borderColor: meta.border,
      }}
    >
      {meta.label}
    </span>
  );
}

function CardShell({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        <span
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: 'hsl(var(--ds-fg-2))',
          }}
        >
          {title}
        </span>
        {hint && (
          <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))' }}>— {hint}</span>
        )}
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

function MetaRow({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'danger' }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
      <span style={{ fontWeight: 500, color: tone === 'danger' ? 'hsl(var(--ds-danger))' : 'hsl(var(--ds-fg-1))' }}>
        {label}
      </span>
      <span
        style={{
          color: tone === 'danger' ? 'hsl(var(--ds-danger))' : 'hsl(var(--ds-fg-3))',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function IntegrationCard({
  icon,
  title,
  integration,
  onConfigure,
  onDisconnect,
}: {
  icon: LucideIcon;
  title: string;
  integration: MarketingIntegration | null;
  onConfigure: () => void;
  onDisconnect: () => void;
}) {
  const status: IntegrationStatus = integration?.status ?? 'disconnected';

  return (
    <CardShell icon={icon} title={title}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <StatusPill status={status} />
        {integration?.account_name && (
          <span
            style={{
              fontSize: 13,
              color: 'hsl(var(--ds-fg-3))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {integration.account_name}
          </span>
        )}
      </div>

      <dl style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: 0 }}>
        {integration?.account_id && (
          <MetaRow label="Conta:" value={integration.account_id} />
        )}
        {integration?.last_sync_at && (
          <MetaRow label="Última sync:" value={new Date(integration.last_sync_at).toLocaleString('pt-BR')} />
        )}
        {integration?.token_expires_at && (
          <MetaRow label="Token expira:" value={new Date(integration.token_expires_at).toLocaleDateString('pt-BR')} />
        )}
        {integration?.status_message && (
          <MetaRow label="Mensagem:" value={integration.status_message} tone="danger" />
        )}
      </dl>

      <div style={{ display: 'flex', gap: 8, paddingTop: 4, flexWrap: 'wrap' }}>
        <button type="button" className="btn primary" onClick={onConfigure}>
          <Settings size={13} strokeWidth={1.5} />
          <span>{integration?.access_token ? 'Editar' : 'Configurar'}</span>
        </button>
        {integration?.access_token && (
          <button type="button" className="btn" onClick={onDisconnect}>
            <Unlink size={13} strokeWidth={1.5} />
            <span>Desconectar</span>
          </button>
        )}
      </div>
    </CardShell>
  );
}

function GA4IntegrationCard({
  integration,
  onRefresh,
  onDisconnect,
}: {
  integration: MarketingIntegration | null;
  onRefresh: () => Promise<void>;
  onDisconnect: () => void;
}) {
  const isConnected = integration?.status === 'connected' && !!integration?.access_token;
  const status: IntegrationStatus = integration?.status ?? 'disconnected';

  const [propertyId, setPropertyId] = useState(integration?.account_id ?? '');
  const [savingId, setSavingId] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setPropertyId(integration?.account_id ?? '');
  }, [integration?.account_id]);

  const handleConnect = () => {
    const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;
    if (!clientId) {
      toast.error('VITE_GOOGLE_OAUTH_CLIENT_ID não configurado no .env');
      return;
    }
    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ga4-oauth-callback`;
    const scope = 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.email';

    supabase.auth.getUser().then(({ data }) => {
      const state = data.user?.id ?? '';
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
      authUrl.searchParams.set('state', state);
      window.location.href = authUrl.toString();
    });
  };

  const savePropertyId = async () => {
    if (!propertyId.trim()) return;
    try {
      setSavingId(true);
      const { error } = await supabase
        .from('marketing_integrations')
        .update({ account_id: propertyId.trim() })
        .eq('platform', 'google_analytics');
      if (error) throw error;
      toast.success('Property ID salvo');
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar Property ID');
    } finally {
      setSavingId(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const { data, error } = await supabase.functions.invoke('sync-ga4-data', { body: {} });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Falha na sincronização');
      toast.success(`Sincronizado: ${data?.days_upserted ?? 0} dias, ${data?.sources ?? 0} fontes`);
      await onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <CardShell icon={BarChart3} title="Google Analytics 4" hint="hiro.film">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <StatusPill status={status} />
        {integration?.account_name && (
          <span
            style={{
              fontSize: 13,
              color: 'hsl(var(--ds-fg-3))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {integration.account_name}
          </span>
        )}
      </div>

      {!isConnected ? (
        <>
          <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', margin: 0 }}>
            Conecte sua conta Google para puxar métricas de tráfego do site.
          </p>
          <div>
            <button type="button" className="btn primary" onClick={handleConnect}>
              <ExternalLink size={13} strokeWidth={1.5} />
              <span>Conectar Google Analytics</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={eyebrowLabel}>Property ID (numérico)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                placeholder="ex: 535009493"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}
              />
              <button
                type="button"
                className="btn"
                onClick={savePropertyId}
                disabled={savingId || !propertyId.trim() || propertyId === integration?.account_id}
              >
                {savingId ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" /> : <span>Salvar</span>}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 6 }}>
              GA4 → Admin → Detalhes da propriedade → ID da propriedade
            </p>
          </div>

          <dl style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: 0 }}>
            {integration?.last_sync_at && (
              <MetaRow label="Última sync:" value={new Date(integration.last_sync_at).toLocaleString('pt-BR')} />
            )}
            {integration?.token_expires_at && (
              <MetaRow label="Token expira:" value={new Date(integration.token_expires_at).toLocaleString('pt-BR')} />
            )}
            {integration?.status_message
              && integration.status_message !== 'Conectado ao Google Analytics'
              && integration.status_message !== 'Sincronizado' && (
                <MetaRow label="Mensagem:" value={integration.status_message} tone="danger" />
              )}
          </dl>

          <div style={{ display: 'flex', gap: 8, paddingTop: 4, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn primary"
              onClick={handleSync}
              disabled={syncing || !integration?.account_id}
            >
              {syncing ? (
                <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <RefreshCw size={13} strokeWidth={1.5} />
              )}
              <span>Sincronizar agora</span>
            </button>
            <button type="button" className="btn" onClick={onDisconnect}>
              <Unlink size={13} strokeWidth={1.5} />
              <span>Desconectar</span>
            </button>
          </div>
        </>
      )}
    </CardShell>
  );
}

export default function MarketingIntegrations() {
  const { isAdmin, roleLoading } = useAuthContext();
  const { integrations, loading, instagram, linkedin, disconnect, fetchIntegrations } = useMarketingIntegrations();
  const [searchParams, setSearchParams] = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPlatform, setDialogPlatform] = useState<'instagram' | 'linkedin'>('instagram');
  const [confirmPlatform, setConfirmPlatform] = useState<'instagram' | 'linkedin' | 'google_analytics' | null>(null);

  const ga4 = integrations.find((i) => i.platform === 'google_analytics') ?? null;

  // OAuth callback feedback
  useEffect(() => {
    const ga4Param = searchParams.get('ga4');
    if (ga4Param === 'connected') {
      toast.success('Google Analytics conectado!', {
        description: 'Agora informe o Property ID e clique em Sincronizar.',
        icon: <CheckCircle2 size={16} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />,
      });
      fetchIntegrations();
      searchParams.delete('ga4');
      setSearchParams(searchParams, { replace: true });
    } else if (ga4Param === 'error') {
      const reason = searchParams.get('reason') ?? 'Erro desconhecido';
      toast.error('Falha ao conectar Google Analytics', { description: reason });
      searchParams.delete('ga4');
      searchParams.delete('reason');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchIntegrations]);

  if (roleLoading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
            <Loader2 className="animate-spin" size={24} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner">
          <div className="ph">
            <div>
              <h1 className="ph-title">Integrações de Marketing.</h1>
              <p className="ph-sub">Apenas administradores.</p>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <EmptyState
              icon={Lock}
              title="Acesso restrito"
              description="Você precisa ser administrador para acessar esta página."
            />
          </div>
        </div>
      </div>
    );
  }

  const openDialog = (platform: 'instagram' | 'linkedin') => {
    setDialogPlatform(platform);
    setDialogOpen(true);
  };

  const handleDisconnect = async () => {
    if (!confirmPlatform) return;
    try {
      await disconnect(confirmPlatform);
      toast.success('Integração desconectada');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao desconectar';
      toast.error(msg);
    } finally {
      setConfirmPlatform(null);
    }
  };

  const existing = dialogPlatform === 'instagram' ? instagram : linkedin;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Integrações de Marketing.</h1>
            <p className="ph-sub">Conecte Instagram, LinkedIn e Google Analytics para sincronizar métricas automaticamente.</p>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
              <Loader2 className="animate-spin" size={24} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 16,
              }}
            >
              <IntegrationCard
                icon={Instagram}
                title="Instagram"
                integration={instagram}
                onConfigure={() => openDialog('instagram')}
                onDisconnect={() => setConfirmPlatform('instagram')}
              />
              <IntegrationCard
                icon={Linkedin}
                title="LinkedIn"
                integration={linkedin}
                onConfigure={() => openDialog('linkedin')}
                onDisconnect={() => setConfirmPlatform('linkedin')}
              />
              <GA4IntegrationCard
                integration={ga4}
                onRefresh={fetchIntegrations}
                onDisconnect={() => setConfirmPlatform('google_analytics')}
              />
            </div>
          )}
        </div>

        {integrations.length === 0 && (
          <p style={{ marginTop: 24, color: 'hsl(var(--ds-fg-4))', fontSize: 12 }}>
            Nenhuma integração configurada ainda.
          </p>
        )}

        <MarketingIntegrationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          platform={dialogPlatform}
          existing={existing}
        />

        <AlertDialog open={!!confirmPlatform} onOpenChange={(o) => !o && setConfirmPlatform(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                <span style={HN_DISPLAY}>Desconectar integração?</span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                O token será removido. Você precisará configurar novamente para voltar a sincronizar métricas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisconnect}>Desconectar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
