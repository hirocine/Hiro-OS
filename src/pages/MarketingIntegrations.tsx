import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BarChart3, Instagram, Linkedin, Loader2, RefreshCw, Settings, Unlink, ExternalLink, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMarketingIntegrations, type IntegrationStatus, type MarketingIntegration } from '@/hooks/useMarketingIntegrations';
import { MarketingIntegrationDialog } from '@/components/Marketing/MarketingIntegrationDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATUS_META: Record<IntegrationStatus, { label: string; className: string }> = {
  connected:    { label: 'Conectado',    className: 'bg-emerald-500/15 text-emerald-500' },
  disconnected: { label: 'Desconectado', className: 'bg-muted text-muted-foreground' },
  expired:      { label: 'Expirado',     className: 'bg-amber-500/15 text-amber-500' },
  error:        { label: 'Erro',         className: 'bg-red-500/15 text-red-500' },
};

function IntegrationCard({
  icon: Icon,
  title,
  integration,
  onConfigure,
  onDisconnect,
}: {
  icon: typeof Instagram;
  title: string;
  integration: MarketingIntegration | null;
  onConfigure: () => void;
  onDisconnect: () => void;
}) {
  const status: IntegrationStatus = integration?.status ?? 'disconnected';
  const meta = STATUS_META[status];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn('text-xs', meta.className)}>
            {meta.label}
          </Badge>
          {integration?.account_name && (
            <span className="text-sm text-muted-foreground truncate">{integration.account_name}</span>
          )}
        </div>

        <dl className="text-xs text-muted-foreground space-y-1">
          {integration?.account_id && (
            <div className="flex gap-2">
              <dt className="font-medium text-foreground">Conta:</dt>
              <dd className="truncate">{integration.account_id}</dd>
            </div>
          )}
          {integration?.last_sync_at && (
            <div className="flex gap-2">
              <dt className="font-medium text-foreground">Última sync:</dt>
              <dd>{new Date(integration.last_sync_at).toLocaleString('pt-BR')}</dd>
            </div>
          )}
          {integration?.token_expires_at && (
            <div className="flex gap-2">
              <dt className="font-medium text-foreground">Token expira:</dt>
              <dd>{new Date(integration.token_expires_at).toLocaleDateString('pt-BR')}</dd>
            </div>
          )}
          {integration?.status_message && (
            <div className="flex gap-2 text-red-500">
              <dt className="font-medium">Mensagem:</dt>
              <dd>{integration.status_message}</dd>
            </div>
          )}
        </dl>

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={onConfigure} className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            {integration?.access_token ? 'Editar' : 'Configurar'}
          </Button>
          {integration?.access_token && (
            <Button size="sm" variant="outline" onClick={onDisconnect} className="gap-1.5">
              <Unlink className="h-3.5 w-3.5" /> Desconectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
  const meta = STATUS_META[(integration?.status ?? 'disconnected') as IntegrationStatus];

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5" />
          Google Analytics 4
          <span className="text-xs font-normal text-muted-foreground ml-1">(hiro.film)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={cn('text-xs', meta.className)}>
            {meta.label}
          </Badge>
          {integration?.account_name && (
            <span className="text-sm text-muted-foreground truncate">{integration.account_name}</span>
          )}
        </div>

        {!isConnected ? (
          <>
            <p className="text-xs text-muted-foreground">
              Conecte sua conta Google para puxar métricas de tráfego do site.
            </p>
            <Button size="sm" onClick={handleConnect} className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Conectar Google Analytics
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Property ID (numérico)</Label>
              <div className="flex gap-2">
                <Input
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="ex: 535009493"
                  className="h-9 font-mono text-xs font-numeric"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={savePropertyId}
                  disabled={savingId || !propertyId.trim() || propertyId === integration?.account_id}
                >
                  {savingId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                GA4 → Admin → Detalhes da propriedade → ID da propriedade
              </p>
            </div>

            <dl className="text-xs text-muted-foreground space-y-1">
              {integration?.last_sync_at && (
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground">Última sync:</dt>
                  <dd>{new Date(integration.last_sync_at).toLocaleString('pt-BR')}</dd>
                </div>
              )}
              {integration?.token_expires_at && (
                <div className="flex gap-2">
                  <dt className="font-medium text-foreground">Token expira:</dt>
                  <dd>{new Date(integration.token_expires_at).toLocaleString('pt-BR')}</dd>
                </div>
              )}
              {integration?.status_message && integration.status_message !== 'Conectado ao Google Analytics' && integration.status_message !== 'Sincronizado' && (
                <div className="flex gap-2 text-red-500">
                  <dt className="font-medium">Mensagem:</dt>
                  <dd>{integration.status_message}</dd>
                </div>
              )}
            </dl>

            <div className="flex gap-2 pt-2 flex-wrap">
              <Button size="sm" onClick={handleSync} disabled={syncing || !integration?.account_id} className="gap-1.5">
                {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Sincronizar agora
              </Button>
              <Button size="sm" variant="outline" onClick={onDisconnect} className="gap-1.5">
                <Unlink className="h-3.5 w-3.5" /> Desconectar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
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
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
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
      <ResponsiveContainer maxWidth="7xl">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </ResponsiveContainer>
    );
  }

  if (!isAdmin) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <PageHeader title="Integrações de Marketing" subtitle="Apenas administradores." />
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Você precisa ser administrador para acessar esta página.
          </CardContent>
        </Card>
      </ResponsiveContainer>
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
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Integrações de Marketing"
        subtitle="Conecte Instagram, LinkedIn e Google Analytics para sincronizar métricas automaticamente."
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      <p className="text-xs text-muted-foreground mt-6">
        {integrations.length === 0 && 'Nenhuma integração configurada ainda.'}
      </p>

      <MarketingIntegrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        platform={dialogPlatform}
        existing={existing}
      />

      <AlertDialog open={!!confirmPlatform} onOpenChange={(o) => !o && setConfirmPlatform(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar integração?</AlertDialogTitle>
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
    </ResponsiveContainer>
  );
}
