import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description?: string;
  metadata?: any;
  resolved: boolean;
  created_at: string;
}

interface SecurityMetrics {
  totalAlerts: number;
  unresolvedAlerts: number;
  criticalAlerts: number;
  recentLoginAttempts: number;
  failedLogins: number;
  securityScore: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL';
}

export function useSecurityMonitoring() {
  const { isAdmin } = useUserRole();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSecurityData = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);

      // Buscar alertas não resolvidos
      const { data: alertsData, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (alertsError) throw alertsError;

      // Buscar métricas do dashboard
      const { data: dashboardData, error: dashboardError } = await supabase
        .rpc('get_security_dashboard');

      if (dashboardError) throw dashboardError;

      setAlerts((alertsData || []) as SecurityAlert[]);

      if (dashboardData) {
        const data = dashboardData as any;
        setMetrics({
          totalAlerts: data.security_alerts?.total_alerts || 0,
          unresolvedAlerts: data.security_alerts?.unresolved_alerts || 0,
          criticalAlerts: data.security_alerts?.critical_alerts || 0,
          recentLoginAttempts: data.login_statistics?.total_attempts || 0,
          failedLogins: data.login_statistics?.failed_attempts || 0,
          securityScore: data.security_score || 'LOW_RISK'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados de segurança:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const createSecurityAlert = useCallback(async (
    alertType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    title: string,
    description?: string,
    metadata?: any
  ) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase.rpc('create_security_alert', {
        _alert_type: alertType,
        _severity: severity,
        _title: title,
        _description: description,
        _metadata: metadata
      });

      if (error) throw error;

      // Atualizar dados após criar alerta
      await fetchSecurityData();

      return true;
    } catch (error) {
      console.error('Erro ao criar alerta de segurança:', error);
      return false;
    }
  }, [isAdmin, fetchSecurityData]);

  const resolveAlert = useCallback(async (alertId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertId);

      if (error) throw error;

      // Atualizar dados após resolver alerta
      await fetchSecurityData();

      return true;
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      return false;
    }
  }, [isAdmin, fetchSecurityData]);

  const runSecurityScan = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase.rpc('detect_suspicious_activity');

      if (error) throw error;

      // Atualizar dados após scan
      await fetchSecurityData();

      return true;
    } catch (error) {
      console.error('Erro ao executar scan de segurança:', error);
      return false;
    }
  }, [isAdmin, fetchSecurityData]);

  // Verificar se há alertas críticos para mostrar notificação
  const hasCriticalAlerts = metrics?.criticalAlerts > 0;

  // Monitoramento em tempo real de novos alertas
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('security_monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts'
        },
        () => {
          fetchSecurityData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, fetchSecurityData]);

  // Buscar dados iniciais
  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  return {
    alerts,
    metrics,
    loading,
    hasCriticalAlerts,
    fetchSecurityData,
    createSecurityAlert,
    resolveAlert,
    runSecurityScan
  };
}