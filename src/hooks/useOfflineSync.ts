import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingOperations: number;
  lastSync?: Date;
  syncProgress: number;
}

interface OfflineOperation {
  id: string;
  type: 'equipment' | 'project' | 'form';
  data: any;
  endpoint: string;
  timestamp: Date;
}

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingOperations: 0,
    syncProgress: 0
  });
  
  const { toast } = useToast();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      triggerSync();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for service worker messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        setSyncStatus(prev => ({
          ...prev,
          isSyncing: false,
          lastSync: new Date(),
          syncProgress: 100
        }));

        toast({
          title: "Sincronização concluída",
          description: `Dados de ${event.data.data.type} sincronizados com sucesso.`,
        });

        // Reset progress after a delay
        setTimeout(() => {
          setSyncStatus(prev => ({ ...prev, syncProgress: 0 }));
        }, 2000);
      }

      if (event.data?.type === 'OFFLINE_DATA') {
        toast({
          title: "Usando dados offline",
          description: "Alguns dados podem estar desatualizados.",
          variant: "destructive"
        });
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [toast]);

  // Queue offline operation
  const queueOperation = useCallback(async (operation: Omit<OfflineOperation, 'id' | 'timestamp'>) => {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['offline_forms'], 'readwrite');
      const store = transaction.objectStore('offline_forms');
      
      const operationWithMeta: OfflineOperation = {
        ...operation,
        id: crypto.randomUUID(),
        timestamp: new Date()
      };
      
      await store.add(operationWithMeta);
      
      // Update pending operations count
      const allOperationsRequest = store.getAll();
      allOperationsRequest.onsuccess = () => {
        setSyncStatus(prev => ({
          ...prev,
          pendingOperations: allOperationsRequest.result.length
        }));
      };

      toast({
        title: "Operação salva",
        description: "A operação será sincronizada quando a conexão for restaurada.",
      });

    } catch (error) {
      console.error('Failed to queue operation:', error);
      toast({
        title: "Erro ao salvar operação",
        description: "Não foi possível salvar a operação offline.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    if (!syncStatus.isOnline || syncStatus.isSyncing) return;

    setSyncStatus(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncProgress: 10 
    }));

    try {
      // Register background sync for different types
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        
        await (registration as any).sync.register('equipment-sync');
        await (registration as any).sync.register('project-sync');
        await (registration as any).sync.register('offline-forms');

        setSyncStatus(prev => ({ ...prev, syncProgress: 50 }));
      }
    } catch (error) {
      console.error('Sync registration failed:', error);
      setSyncStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        syncProgress: 0 
      }));
      
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os dados.",
        variant: "destructive"
      });
    }
  }, [syncStatus.isOnline, syncStatus.isSyncing, toast]);

  // Get cached data
  const getCachedData = useCallback(async (key: string) => {
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['cached_data'], 'readonly');
      const store = transaction.objectStore('cached_data');
      const request = store.get(key);
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result && result.expiry > Date.now()) {
            resolve(result.data);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }, []);

  // Cache data
  const cacheData = useCallback(async (key: string, data: any, ttl = 3600000) => { // 1 hour default
    try {
      const db = await openIndexedDB();
      const transaction = db.transaction(['cached_data'], 'readwrite');
      const store = transaction.objectStore('cached_data');
      
      await store.put({
        key,
        data,
        expiry: Date.now() + ttl,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }, []);

  return {
    syncStatus,
    queueOperation,
    triggerSync,
    getCachedData,
    cacheData
  };
}

// IndexedDB helper
async function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('HiroInventoryDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('offline_forms')) {
        const store = db.createObjectStore('offline_forms', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('cached_data')) {
        const store = db.createObjectStore('cached_data', { keyPath: 'key' });
        store.createIndex('expiry', 'expiry');
      }
    };
  });
}