import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
      <Alert className="border-destructive/50 bg-destructive/10 shadow-lg">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Você está offline. Algumas funcionalidades podem estar limitadas.
        </AlertDescription>
      </Alert>
    </div>
  );
}