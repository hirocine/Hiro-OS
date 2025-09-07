import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert className="border-destructive/50 bg-destructive/10">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          Você está offline. Algumas funcionalidades podem estar limitadas.
        </AlertDescription>
      </Alert>
    </div>
  );
}