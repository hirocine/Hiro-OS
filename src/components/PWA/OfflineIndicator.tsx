import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import { useIsPWA } from '@/hooks/useIsPWA';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const isPWA = useIsPWA();

  if (isOnline) return null;

  return (
    <div className={cn(
      "fixed left-1/2 transform -translate-x-1/2 z-[58] w-full max-w-md px-4",
      isPWA 
        ? "top-[calc(4rem+env(safe-area-inset-top,0px)+0.5rem)]" // PWA: abaixo do header
        : "top-16" // Web: comportamento normal
    )}>
      <Alert className="border-destructive/50 bg-destructive/10">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Você está offline. Algumas funcionalidades podem estar limitadas.
        </AlertDescription>
      </Alert>
    </div>
  );
}