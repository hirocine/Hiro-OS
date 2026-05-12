import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { AdminPageHeader, SectionShell } from './_shared';

export default function AdminNotifications() {
  const { isAdmin, roleLoading } = useAuthContext();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    maintenanceAlerts: true,
    equipmentUsageAlerts: false,
  });

  if (roleLoading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0' }}>
          <div
            className="animate-spin"
            style={{
              width: 32,
              height: 32,
              border: '2px solid hsl(var(--ds-accent))',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: 'hsl(var(--ds-fg-3))' }}>Verificando permissões…</p>
        </div>
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  const update = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast({
      title: 'Configuração atualizada',
      description: 'Configuração de notificação atualizada com sucesso.',
    });
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <AdminPageHeader
          title="Notificações do Sistema"
          subtitle="Configure notificações e alertas do sistema"
        />

        <div style={{ marginTop: 24 }} className="space-y-4 animate-fade-in">
          <SectionShell title="Notificações">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                    Alertas de Manutenção
                  </span>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                    Notificações sobre equipamentos que precisam de manutenção preventiva
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceAlerts}
                  onCheckedChange={(checked) => update('maintenanceAlerts', checked)}
                />
              </div>

              <div style={{ height: 1, background: 'hsl(var(--ds-line-1))' }} />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                    Alertas de Equipamentos em Uso
                  </span>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                    Notificar quando equipamentos ficam muito tempo emprestados
                  </p>
                </div>
                <Switch
                  checked={settings.equipmentUsageAlerts}
                  onCheckedChange={(checked) => update('equipmentUsageAlerts', checked)}
                />
              </div>
            </div>
          </SectionShell>
        </div>
      </div>
    </div>
  );
}
