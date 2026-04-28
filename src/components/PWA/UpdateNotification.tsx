import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    const isPreviewHost =
      window.location.hostname.includes('id-preview--') ||
      window.location.hostname.includes('lovableproject.com');

    if (isInIframe || isPreviewHost) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Listen for waiting service worker
        const checkForUpdate = () => {
          if (reg.waiting) {
            setShowUpdate(true);
          }
        };

        // Check immediately
        checkForUpdate();

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Listen for controller changes (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm">
      <Card className="border-primary/20 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Nova versão disponível</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Uma atualização do app está pronta para instalar
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleUpdate}
              className="flex-1"
            >
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="flex-1"
            >
              Depois
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}