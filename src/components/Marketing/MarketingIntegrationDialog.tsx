import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMarketingIntegrations, type MarketingIntegration } from '@/hooks/useMarketingIntegrations';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  platform: 'instagram' | 'linkedin';
  existing: MarketingIntegration | null;
}

const PLATFORM_META = {
  instagram: {
    title: 'Configurar Instagram',
    accountIdLabel: 'Instagram Business Account ID',
    accountIdPlaceholder: '17841405822304914',
    docsHref: 'https://developers.facebook.com/docs/instagram-platform/insights',
    docsLabel: 'Meta Graph API – Insights do Instagram',
    helper:
      'Você precisa de um token de longa duração da Meta Graph API com permissão instagram_basic + instagram_manage_insights, e o ID da conta Business associada.',
  },
  linkedin: {
    title: 'Configurar LinkedIn',
    accountIdLabel: 'Organization URN ou ID',
    accountIdPlaceholder: 'urn:li:organization:1234567 (ou apenas 1234567)',
    docsHref: 'https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/share-statistics',
    docsLabel: 'LinkedIn – Community Management API',
    helper:
      'Você precisa estar aprovado no Marketing Developer Platform da LinkedIn e gerar um token com escopo r_organization_social.',
  },
} as const;

export function MarketingIntegrationDialog({ open, onOpenChange, platform, existing }: Props) {
  const meta = PLATFORM_META[platform];
  const { upsertIntegration } = useMarketingIntegrations();

  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [tokenExpires, setTokenExpires] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAccountId(existing?.account_id ?? '');
      setAccountName(existing?.account_name ?? '');
      setAccessToken('');
      setTokenExpires(existing?.token_expires_at?.slice(0, 10) ?? '');
    }
  }, [open, existing]);

  const handleSave = async () => {
    if (!accountId.trim()) {
      toast.error('Informe o ID da conta');
      return;
    }
    if (!existing?.access_token && !accessToken.trim()) {
      toast.error('Informe o access token');
      return;
    }
    try {
      setSaving(true);
      await upsertIntegration({
        platform,
        account_id: accountId.trim(),
        account_name: accountName.trim() || null,
        access_token: accessToken.trim() || existing?.access_token || null,
        token_expires_at: tokenExpires ? new Date(tokenExpires + 'T23:59:59').toISOString() : null,
        status: 'connected',
        status_message: null,
      });
      toast.success('Integração configurada');
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar integração';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{meta.title}</DialogTitle>
          <DialogDescription>{meta.helper}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="account-id">{meta.accountIdLabel}</Label>
            <Input
              id="account-id"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder={meta.accountIdPlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-name">Nome da conta (opcional)</Label>
            <Input
              id="account-name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="@hirofilm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="access-token">
              Access token {existing?.access_token && <span className="text-xs text-muted-foreground">(preenchido — deixe em branco para manter)</span>}
            </Label>
            <Input
              id="access-token"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={existing?.access_token ? '•••••••••• (clique para substituir)' : 'EAAB...'}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="token-expires">Validade do token (opcional)</Label>
            <Input
              id="token-expires"
              type="date"
              value={tokenExpires}
              onChange={(e) => setTokenExpires(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Documentação:{' '}
            <a href={meta.docsHref} target="_blank" rel="noreferrer" className="underline">
              {meta.docsLabel}
            </a>
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
