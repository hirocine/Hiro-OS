import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
          setIsVisible(true);
        }
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setIsVisible(false);
  };

  if (isInstalled || !isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50, maxWidth: 360 }}>
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
              <Download size={16} strokeWidth={1.5} />
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
                Instalar Hiro® Inventario
              </h3>
              <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                Acesse rapidamente sem abrir o navegador
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
          <button type="button" className="btn primary" onClick={handleInstall} style={{ flex: 1, justifyContent: 'center' }}>
            Instalar
          </button>
          <button type="button" className="btn" onClick={handleDismiss} style={{ flex: 1, justifyContent: 'center' }}>
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
