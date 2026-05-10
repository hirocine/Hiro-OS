import { useEffect, useState } from 'react';
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

        const checkForUpdate = () => {
          if (reg.waiting) {
            setShowUpdate(true);
          }
        };

        checkForUpdate();

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
    <div style={{ position: 'fixed', top: 80, right: 16, zIndex: 50, maxWidth: 360 }}>
      <div
        style={{
          border: '1px solid hsl(var(--ds-accent) / 0.3)',
          background: 'hsl(var(--ds-surface))',
          padding: 14,
          boxShadow: '0 12px 32px hsl(0 0% 0% / 0.18)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 36,
                height: 36,
                background: 'hsl(var(--ds-accent) / 0.1)',
                border: '1px solid hsl(var(--ds-accent) / 0.25)',
                color: 'hsl(var(--ds-accent))',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={16} strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'hsl(var(--ds-fg-1))',
                }}
              >
                Nova versão disponível
              </h3>
              <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                Uma atualização do app está pronta para instalar
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn"
            onClick={handleDismiss}
            style={{ width: 24, height: 24, padding: 0, justifyContent: 'center' }}
            aria-label="Fechar"
          >
            <X size={12} strokeWidth={1.5} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn primary"
            onClick={handleUpdate}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Atualizar
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleDismiss}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Depois
          </button>
        </div>
      </div>
    </div>
  );
}
