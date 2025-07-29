import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SettingsActions } from '@/components/Settings/SettingsActions';
import { BackupSystem } from '@/components/Settings/BackupSystem';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Settings() {
  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          As configurações foram reorganizadas para uma melhor experiência
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        <Card className="shadow-card">
          <CardContent className="p-6 text-center space-y-4">
            <SettingsIcon className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Configurações Reorganizadas</h3>
              <p className="text-muted-foreground">
                As configurações foram movidas para locais mais apropriados:
              </p>
            </div>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Dados Pessoais e Segurança</p>
                  <p className="text-sm text-muted-foreground">Acesse através do perfil no menu superior</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Administração</p>
                  <p className="text-sm text-muted-foreground">Notificações e configurações do sistema na aba Admin</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}