import { useOnlineStatus } from '@/hooks/useOnlineStatus';
;
import { WifiOff } from 'lucide-react';
import { useIsPWA } from '@/hooks/useIsPWA';
import { cn } from '@/lib/utils';
import { Z_INDEX } from '@/lib/z-index';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const isPWA = useIsPWA();

  if (isOnline) return null;

  return (
    <div 
      className={cn(
        "fixed left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 animate-in slide-in-from-top-2",
        isPWA 
          ? "top-[calc(4rem+env(safe-area-inset-top,0px)+0.5rem)]"
          : "top-[calc(4rem+0.5rem)]"
      )}
      style={{ zIndex: Z_INDEX.offline_indicator }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '12px 14px',
          border: '1px solid hsl(var(--ds-danger, 0 84% 60%))',
          background: 'hsl(var(--ds-surface))',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <WifiOff size={16} strokeWidth={1.5} color="hsl(var(--ds-danger, 0 84% 60%))" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: 'hsl(var(--ds-text))', lineHeight: 1.5 }}>
          Você está offline. Algumas funcionalidades podem estar limitadas.
        </div>
      </div>
    </div>
  );
}