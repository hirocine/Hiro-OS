import type { ReactNode } from 'react';
import { Instagram } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/marketing-dashboard-utils';

interface Integration {
  profile_picture_url?: string | null;
  account_name?: string | null;
  last_sync_at?: string | null;
}

interface Props {
  integration: Integration | null | undefined;
  rightAction?: ReactNode;
}

const toneColor = {
  ok: 'hsl(var(--ds-success))',
  warn: 'hsl(var(--ds-warning))',
  idle: 'hsl(var(--ds-fg-3))',
} as const;

export function InstagramIdentityBanner({ integration, rightAction }: Props) {
  const syncStatus = formatTimeAgo(integration?.last_sync_at);
  const tone = toneColor[syncStatus.tone];

  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: 52,
            height: 52,
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, hsl(330 80% 60% / 0.15), hsl(280 70% 60% / 0.15), hsl(45 90% 60% / 0.15))',
            color: 'hsl(var(--ds-fg-2))',
            border: '1px solid hsl(var(--ds-line-1))',
            overflow: 'hidden',
          }}
        >
          {integration?.profile_picture_url ? (
            <img
              src={integration.profile_picture_url}
              alt={integration.account_name ?? 'Instagram'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Instagram size={20} strokeWidth={1.5} />
          )}
        </div>
        <span
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: 18,
            height: 18,
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(45deg, #fcb045, #fd1d1d, #833ab4)',
            border: '2px solid hsl(var(--ds-surface))',
            borderRadius: '50%',
            color: '#fff',
          }}
        >
          <Instagram size={10} strokeWidth={2} />
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: 'hsl(var(--ds-fg-1))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {integration?.account_name ?? '@hirofilm'}
          </span>
          <span
            className="pill"
            style={{ color: tone, borderColor: `${tone.replace(')', ' / 0.3)')}`, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span className="dot" style={{ background: 'currentColor' }} />
            Conectado
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
          {integration?.last_sync_at
            ? `Última sincronização ${formatRelativeTime(new Date(integration.last_sync_at))}`
            : syncStatus.text}
        </p>
      </div>

      {rightAction && <div style={{ marginLeft: 'auto', flexShrink: 0 }}>{rightAction}</div>}
    </div>
  );
}
