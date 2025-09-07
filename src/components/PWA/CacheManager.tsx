import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function CacheManager() {
  const { toast } = useToast();

  useEffect(() => {
    // Gerenciar cache de dados críticos
    const manageCriticalCache = async () => {
      if ('caches' in window) {
        try {
          const cache = await caches.open('hiro-critical-v1');
          
          // Cache de rotas principais
          const criticalRoutes = [
            '/',
            '/dashboard',
            '/equipment',
            '/projects'
          ];
          
          // Cache de assets críticos
          const criticalAssets = [
            '/lovable-uploads/86c2b32c-219b-4fa7-9fa1-7026403ac09b.png',
            '/offline-enhanced.html'
          ];
          
          await cache.addAll([...criticalRoutes, ...criticalAssets]);
        } catch (error) {
          console.error('Erro ao gerenciar cache crítico:', error);
        }
      }
    };

    // Limpar caches antigos
    const cleanOldCaches = async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('hiro-') && !name.includes('critical-v1')
        );
        
        await Promise.all(
          oldCaches.map(cacheName => caches.delete(cacheName))
        );
      }
    };

    // Configurar estratégias de cache inteligente
    const setupIntelligentCaching = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          // Enviar configurações de cache para o service worker
          registration.active?.postMessage({
            type: 'CACHE_CONFIG',
            config: {
              networkFirst: ['/api/equipment', '/api/projects'],
              cacheFirst: ['/assets/', '/images/'],
              staleWhileRevalidate: ['/api/dashboard', '/api/stats']
            }
          });
        });
      }
    };

    manageCriticalCache();
    cleanOldCaches();
    setupIntelligentCaching();

    // Monitorar espaço de armazenamento
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const usagePercent = (used / quota) * 100;

        if (usagePercent > 80) {
          toast({
            title: "Armazenamento quase cheio",
            description: "Considere limpar dados offline antigos.",
            variant: "destructive",
          });
        }
      });
    }
  }, [toast]);

  return null;
}

// Hook para usar cache inteligente
export function useIntelligentCache() {
  const cacheData = async (key: string, data: any, ttl = 3600000) => { // 1 hora por padrão
    if ('caches' in window) {
      try {
        const cache = await caches.open('hiro-data-v1');
        const response = new Response(JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl
        }));
        await cache.put(key, response);
      } catch (error) {
        console.error('Erro ao cachear dados:', error);
      }
    }
  };

  const getCachedData = async (key: string) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('hiro-data-v1');
        const response = await cache.match(key);
        
        if (response) {
          const cachedItem = await response.json();
          const now = Date.now();
          
          // Verificar se o cache ainda é válido
          if (now - cachedItem.timestamp < cachedItem.ttl) {
            return cachedItem.data;
          } else {
            // Cache expirado, remover
            await cache.delete(key);
          }
        }
      } catch (error) {
        console.error('Erro ao recuperar dados do cache:', error);
      }
    }
    return null;
  };

  return { cacheData, getCachedData };
}