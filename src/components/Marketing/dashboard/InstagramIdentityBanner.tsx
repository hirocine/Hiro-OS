import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Instagram } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
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

export function InstagramIdentityBanner({ integration, rightAction }: Props) {
  const syncStatus = formatTimeAgo(integration?.last_sync_at);

  return (
    <Card className="shadow-card hover:shadow-elegant transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar com badge do Instagram */}
          <div className="relative shrink-0">
            <Avatar className="h-14 w-14 ring-2 ring-border">
              {integration?.profile_picture_url ? (
                <AvatarImage
                  src={integration.profile_picture_url}
                  alt={integration.account_name ?? 'Instagram'}
                />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-yellow-500/20 animate-pulse">
                <Instagram className="h-6 w-6 text-foreground/70" />
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center ring-2 ring-card">
              <Instagram className="h-3 w-3 text-white" />
            </span>
          </div>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground truncate">
                {integration?.account_name ?? '@hirofilm'}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                  syncStatus.tone === 'ok' && 'bg-success/10 text-success',
                  syncStatus.tone === 'warn' && 'bg-warning/10 text-warning',
                  syncStatus.tone === 'idle' && 'bg-muted text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    syncStatus.tone === 'ok' && 'bg-success',
                    syncStatus.tone === 'warn' && 'bg-warning',
                    syncStatus.tone === 'idle' && 'bg-muted-foreground'
                  )}
                />
                Conectado
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {integration?.last_sync_at
                ? `Última sincronização ${formatRelativeTime(new Date(integration.last_sync_at))}`
                : syncStatus.text}
            </p>
          </div>
          {rightAction && (
            <div className="ml-auto shrink-0">{rightAction}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
