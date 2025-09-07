import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

interface PushSubscriptionState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
}

export function usePushNotifications() {
  const [subscriptionState, setSubscriptionState] = useState<PushSubscriptionState>({
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
    permission: 'default',
    isSubscribed: false,
    subscription: null
  });

  const { toast } = useToast();

  // VAPID public key - In production, get this from environment
  const VAPID_PUBLIC_KEY = 'BP1RkGjl8F8YdE8KV8r8VmL9XG2MZ3N4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4';

  useEffect(() => {
    checkNotificationSupport();
    checkExistingSubscription();
  }, []);

  const checkNotificationSupport = () => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    
    setSubscriptionState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'denied'
    }));
  };

  const checkExistingSubscription = async () => {
    if (!subscriptionState.isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setSubscriptionState(prev => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription
      }));
    } catch (error) {
      console.error('Error checking push subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!subscriptionState.isSupported) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive"
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      setSubscriptionState(prev => ({
        ...prev,
        permission
      }));

      if (permission === 'granted') {
        toast({
          title: "Permissão concedida",
          description: "Você receberá notificações importantes do sistema.",
        });
        return true;
      } else {
        toast({
          title: "Permissão negada",
          description: "Você não receberá notificações push.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (subscriptionState.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to backend
      await sendSubscriptionToBackend(subscription);

      setSubscriptionState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription
      }));

      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações sobre atualizações importantes.",
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: "Erro ao ativar notificações",
        description: "Não foi possível ativar as notificações push.",
        variant: "destructive"
      });
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscriptionState.subscription) return false;

    try {
      await subscriptionState.subscription.unsubscribe();
      
      // Remove subscription from backend
      await removeSubscriptionFromBackend(subscriptionState.subscription);

      setSubscriptionState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null
      }));

      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais notificações push.",
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: "Erro ao desativar notificações",
        description: "Não foi possível desativar as notificações push.",
        variant: "destructive"
      });
      return false;
    }
  };

  const sendNotification = (config: NotificationConfig) => {
    if (subscriptionState.permission !== 'granted') return;

    const notification = new Notification(config.title, {
      body: config.body,
      icon: config.icon || '/pwa-192x192.png',
      badge: config.badge || '/favicon-32x32.png',
      data: config.data
    });

    // Auto-close notification after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  };

  return {
    ...subscriptionState,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendSubscriptionToBackend(subscription: PushSubscription) {
  try {
    // In a real app, send this to your Supabase Edge Function
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to backend');
    }
  } catch (error) {
    console.error('Error sending subscription to backend:', error);
    // In development, we can ignore this error
  }
}

async function removeSubscriptionFromBackend(subscription: PushSubscription) {
  try {
    // In a real app, send this to your Supabase Edge Function
    const response = await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error('Failed to remove subscription from backend');
    }
  } catch (error) {
    console.error('Error removing subscription from backend:', error);
    // In development, we can ignore this error
  }
}