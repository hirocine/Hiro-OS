import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Erro ao verificar inscrição de push:', error);
      }
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Não suportado",
        description: "Este navegador não suporta notificações.",
        variant: "destructive",
      });
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      await subscribeToPush();
      toast({
        title: "Notificações ativadas!",
        description: "Você receberá notificações sobre atualizações importantes.",
      });
    } else {
      toast({
        title: "Permissão negada",
        description: "Para receber notificações, permita nas configurações do navegador.",
        variant: "destructive",
      });
    }
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Chave pública VAPID (você precisará gerar uma real)
      const vapidPublicKey = 'sua-chave-vapid-publica-aqui';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      // Aqui você enviaria a subscription para seu servidor
      console.log('Push subscription:', subscription);
      setIsSubscribed(true);
    } catch (error) {
      console.error('Erro ao inscrever para push notifications:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações push.",
        });
      }
    } catch (error) {
      console.error('Erro ao cancelar inscrição de push:', error);
    }
  };

  if (!('Notification' in window)) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <h3 className="font-medium text-sm">Notificações Push</h3>
              <p className="text-xs text-muted-foreground">
                {isSubscribed 
                  ? "Você receberá notificações importantes" 
                  : "Ativar para receber atualizações"}
              </p>
            </div>
          </div>
          
          {permission === 'granted' && isSubscribed ? (
            <Button variant="outline" size="sm" onClick={unsubscribeFromPush}>
              Desativar
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={requestPermission}
              disabled={permission === 'denied'}
            >
              {permission === 'denied' ? 'Bloqueado' : 'Ativar'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}