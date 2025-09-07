import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone, AlertCircle } from 'lucide-react';

export function EnhancedPushNotifications() {
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    requestPermission,
    sendNotification
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Notificações push não são suportadas neste dispositivo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const testNotification = () => {
    sendNotification({
      title: 'Teste de Notificação',
      body: 'Esta é uma notificação de teste do Hiro Inventory!',
      data: { test: true }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? "Ativo" : "Inativo"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Receba notificações sobre atualizações importantes, lembretes de equipamentos e status de projetos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Status da Permissão</p>
            <p className="text-xs text-muted-foreground">
              {permission === 'granted' && 'Permissão concedida para notificações'}
              {permission === 'denied' && 'Permissão negada - não será possível receber notificações'}
              {permission === 'default' && 'Permissão não solicitada ainda'}
            </p>
          </div>
          <Badge variant={
            permission === 'granted' ? 'default' : 
            permission === 'denied' ? 'destructive' : 'secondary'
          }>
            {permission === 'granted' && '✓ Permitido'}
            {permission === 'denied' && '✗ Negado'}
            {permission === 'default' && '? Pendente'}
          </Badge>
        </div>

        {/* Notification Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Notificações Push</p>
            <p className="text-xs text-muted-foreground">
              Ativar/desativar notificações push
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggleNotifications}
            disabled={permission === 'denied'}
          />
        </div>

        {/* Permission Request */}
        {permission === 'default' && (
          <div className="p-3 border rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm">
                  Para receber notificações, você precisa conceder permissão.
                </p>
                <Button 
                  size="sm" 
                  onClick={requestPermission}
                  className="w-full"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Solicitar Permissão
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Permission Denied Help */}
        {permission === 'denied' && (
          <div className="p-3 border rounded-lg bg-destructive/10">
            <div className="flex items-start gap-3">
              <BellOff className="h-4 w-4 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Permissão negada</p>
                <p className="text-xs text-muted-foreground">
                  Para habilitar notificações, vá nas configurações do seu navegador e permita notificações para este site.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Test Notification */}
        {isSubscribed && (
          <div className="pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testNotification}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Testar Notificação
            </Button>
          </div>
        )}

        {/* Notification Features */}
        {isSubscribed && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Você receberá notificações sobre:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Lembretes de manutenção de equipamentos</li>
              <li>• Atualizações de status de projetos</li>
              <li>• Novos equipamentos adicionados</li>
              <li>• Relatórios prontos para download</li>
              <li>• Atualizações importantes do sistema</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}