import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SettingsActions } from '@/components/Settings/SettingsActions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    maintenanceAlerts: true,
    emailReports: true,
    equipmentUsageAlerts: false,
    twoFactorAuth: false,
  });

  const handleSaveProfile = () => {
    toast.success('Perfil atualizado com sucesso');
  };

  const handleResetPassword = () => {
    toast.info('Email de redefinição de senha enviado');
  };

  const handleEndAllSessions = () => {
    toast.success('Todas as sessões foram encerradas');
  };

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success('Configuração atualizada');
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema e preferências
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input 
                id="username" 
                defaultValue={user?.user_metadata?.full_name || "admin"} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                defaultValue={user?.email || "admin@produtora.com"} 
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" defaultValue="Produtora Audiovisual Ltda" />
            </div>
            <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertas de Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre manutenções preventivas
                </p>
              </div>
              <Switch 
                checked={settings.maintenanceAlerts}
                onCheckedChange={(checked) => handleSettingChange('maintenanceAlerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email de Relatórios</Label>
                <p className="text-sm text-muted-foreground">
                  Relatórios semanais por email
                </p>
              </div>
              <Switch 
                checked={settings.emailReports}
                onCheckedChange={(checked) => handleSettingChange('emailReports', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Equipamentos em Uso</Label>
                <p className="text-sm text-muted-foreground">
                  Notificar quando equipamentos ficam muito tempo em uso
                </p>
              </div>
              <Switch 
                checked={settings.equipmentUsageAlerts}
                onCheckedChange={(checked) => handleSettingChange('equipmentUsageAlerts', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Alterar Senha</Label>
              <Button variant="outline" className="w-full" onClick={handleResetPassword}>
                Redefinir Senha
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Autenticação de Dois Fatores</Label>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de segurança
                </p>
              </div>
              <Switch 
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Sessões Ativas</Label>
              <Button variant="destructive" size="sm" onClick={handleEndAllSessions}>
                Encerrar Todas as Sessões
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingsActions />
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Versão do Sistema</p>
              <p className="text-sm text-muted-foreground">v1.0.0 - Build 2024.01</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}