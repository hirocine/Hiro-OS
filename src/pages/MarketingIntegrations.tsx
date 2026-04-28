import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Instagram, Linkedin, Loader2, Settings, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMarketingIntegrations, type IntegrationStatus, type MarketingIntegration } from '@/hooks/useMarketingIntegrations';
import { MarketingIntegrationDialog } from '@/components/Marketing/MarketingIntegrationDialog';
import { toast } from 'sonner';

const STATUS_META: Record<IntegrationStatus, { label: string; className: string }> = {
  connected:    { label: 'Conectado',    className: 'bg-emerald-500/15 text-emerald-500' },
  disconnected: { label: 'Desconectado', className: 'bg-muted text-muted-foreground' },
  expired:      { label: 'Expirado',     className: 'bg-amber-500/15 text-amber-500' },
  error:        { label: 'Erro',         className: 'bg-red-500/15 text-red-500' },
};

function IntegrationCard({
  platform,
  icon: Icon,
  title,
  integration,
  onConfigure,
  onDisconnect,
}: {
  platform: 'instagram' | 'linkedin';
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

export default function MarketingIntegrations() {
  const { isAdmin, roleLoading } = useAuthContext();
  const { integrations, loading, instagram, linkedin, disconnect } = useMarketingIntegrations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPlatform, setDialogPlatform] = useState<'instagram' | 'linkedin'>('instagram');
  const [confirmPlatform, setConfirmPlatform] = useState<'instagram' | 'linkedin' | null>(null);

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
        subtitle="Conecte Instagram e LinkedIn para sincronizar métricas dos posts publicados."
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IntegrationCard
            platform="instagram"
            icon={Instagram}
            title="Instagram"
            integration={instagram}
            onConfigure={() => openDialog('instagram')}
            onDisconnect={() => setConfirmPlatform('instagram')}
          />
          <IntegrationCard
            platform="linkedin"
            icon={Linkedin}
            title="LinkedIn"
            integration={linkedin}
            onConfigure={() => openDialog('linkedin')}
            onDisconnect={() => setConfirmPlatform('linkedin')}
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
