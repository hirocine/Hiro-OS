import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function BackgroundSync() {
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Registrar sincronização em background para operações pendentes
        const registerBackgroundSync = (tag: string) => {
          return (registration as any).sync.register(tag);
        };

        // Expor função globalmente para uso em outros componentes
        (window as any).registerBackgroundSync = registerBackgroundSync;
      });

      // Escutar mensagens do service worker sobre sincronização
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          toast({
            title: "Sincronização concluída",
            description: "Seus dados foram sincronizados com sucesso.",
          });
        }
      });
    }
  }, [toast]);

  return null;
}

// Hook para usar background sync
export function useBackgroundSync() {
  const registerSync = (tag: string) => {
    if ((window as any).registerBackgroundSync) {
      return (window as any).registerBackgroundSync(tag);
    }
    return Promise.resolve();
  };

  return { registerSync };
}