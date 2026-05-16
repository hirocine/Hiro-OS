import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={fieldLabel}>
      {label}
      {hint && <span style={{ marginLeft: 6, fontSize: 10, color: 'hsl(var(--ds-fg-4))', textTransform: 'none', letterSpacing: 0 }}>{hint}</span>}
    </label>
    {children}
  </div>
);

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
      <DialogContent className="sm:max-w-lg ds-shell">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>{meta.title}</DialogTitle>
          <DialogDescription style={{ fontSize: 12, lineHeight: 1.5 }}>{meta.helper}</DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8, paddingBottom: 8 }}>
          <Field label={meta.accountIdLabel}>
            <Input
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder={meta.accountIdPlaceholder}
            />
          </Field>

          <Field label="Nome da conta" hint="(opcional)">
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="@hirofilm"
            />
          </Field>

          <Field
            label="Access token"
            hint={existing?.access_token ? '(preenchido — deixe em branco para manter)' : undefined}
          >
            <Input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={existing?.access_token ? '•••••••••• (clique para substituir)' : 'EAAB…'}
              autoComplete="off"
            />
          </Field>

          <Field label="Validade do token" hint="(opcional)">
            <Input
              type="date"
              value={tokenExpires}
              onChange={(e) => setTokenExpires(e.target.value)}
            />
          </Field>

          <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
            Documentação:{' '}
            <a
              href={meta.docsHref}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'hsl(var(--ds-accent))', textDecoration: 'underline' }}
            >
              {meta.docsLabel}
            </a>
          </p>
        </div>

        <DialogFooter>
          <button type="button" className="btn" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
            <span>Salvar</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
