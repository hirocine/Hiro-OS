import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Activity, Users, Lock } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface SecurityDashboardData {
  timestamp: string;
  login_statistics: {
    total_attempts: number;
    successful_logins: number;
    failed_attempts: number;
    unique_ips: number;
    blocked_ips: number;
  };
  security_alerts: {
    total_alerts: number;
    unresolved_alerts: number;
    critical_alerts: number;
    high_alerts: number;
  };
  policy_compliance: {
    rls_enabled_tables: number;
    total_public_tables: number;
  };
  security_score: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'CRITICAL';
}

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

export function SecurityDashboard() {
  const { isAdmin } = useUserRole();
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchSecurityData();
    }
  }, [isAdmin]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      // Buscar dados do dashboard de segurança
      const { data: dashboardResult, error: dashboardError } = await supabase
        .rpc('get_security_dashboard');

      if (dashboardError) throw dashboardError;

      // Buscar alertas recentes
      const { data: alertsData, error: alertsError } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) throw alertsError;

      setDashboardData(dashboardResult as unknown as SecurityDashboardData);
      setAlerts((alertsData || []) as SecurityAlert[]);
    } catch (error) {
      logger.error('Error fetching security dashboard data', {
        module: 'security',
        action: 'fetch_security_data',
        error
      });
      toast.error('Erro ao carregar dashboard de segurança');
    } finally {
      setLoading(false);
    }
  };

  const runSecurityScan = async () => {
    try {
      await supabase.rpc('detect_suspicious_activity');
      toast.success('Scan de segurança executado');
      fetchSecurityData();
    } catch (error) {
      logger.error('Error executing security scan', {
        module: 'security',
        action: 'run_security_scan',
        error
      });
      toast.error('Erro ao executar scan de segurança');
    }
  };

  const resolveAlert = async (alertId: string) => {
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

      toast.success('Alerta resolvido');
      fetchSecurityData();
    } catch (error) {
      logger.error('Error resolving security alert', {
        module: 'security',
        action: 'resolve_alert',
        error,
        data: { alertId }
      });
      toast.error('Erro ao resolver alerta');
    }
  };

  const getSecurityScoreColor = (score: string) => {
    switch (score) {
      case 'LOW_RISK': return 'bg-success';
      case 'MEDIUM_RISK': return 'bg-warning';
      case 'HIGH_RISK': return 'bg-destructive';
      case 'CRITICAL': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'bg-muted';
      case 'MEDIUM': return 'bg-warning';
      case 'HIGH': return 'bg-destructive';
      case 'CRITICAL': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Acesso Restrito</AlertTitle>
        <AlertDescription>
          Apenas administradores podem acessar o dashboard de segurança.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Segurança</h2>
          <p className="text-muted-foreground">
            Monitoramento e análise de segurança da plataforma
          </p>
        </div>
        <Button onClick={runSecurityScan} className="gap-2">
          <Shield className="h-4 w-4" />
          Executar Scan
        </Button>
      </div>

      {dashboardData && (
        <>
          {/* Score de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Score de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge className={getSecurityScoreColor(dashboardData.security_score)}>
                  {dashboardData.security_score.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Última atualização: {new Date(dashboardData.timestamp).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="login">Login Activity</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Alertas Críticos
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {dashboardData.security_alerts.critical_alerts}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Logins Hoje
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {dashboardData.login_statistics.successful_logins}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Tentativas Falhadas
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">
                      {dashboardData.login_statistics.failed_attempts}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      RLS Enabled
                    </CardTitle>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {dashboardData.policy_compliance.rls_enabled_tables}/
                      {dashboardData.policy_compliance.total_public_tables}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="login" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas de Login (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Total de Tentativas</p>
                        <p className="text-2xl font-bold">
                          {dashboardData.login_statistics.total_attempts}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">IPs Únicos</p>
                        <p className="text-2xl font-bold">
                          {dashboardData.login_statistics.unique_ips}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-success h-2 rounded-full" 
                        style={{ 
                          width: `${(dashboardData.login_statistics.successful_logins / dashboardData.login_statistics.total_attempts) * 100}%` 
                        }}
                      ></div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Taxa de sucesso: {
                        Math.round((dashboardData.login_statistics.successful_logins / dashboardData.login_statistics.total_attempts) * 100)
                      }%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground">
                        Nenhum alerta de segurança encontrado.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  alerts.map((alert) => (
                    <Card key={alert.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <CardTitle className="text-base">{alert.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                            {!alert.resolved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveAlert(alert.id)}
                              >
                                Resolver
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {alert.description && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {alert.description}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance de Políticas</CardTitle>
                  <CardDescription>
                    Verificação de configurações de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Row Level Security (RLS)</span>
                      <Badge className="bg-success">
                        {dashboardData.policy_compliance.rls_enabled_tables}/
                        {dashboardData.policy_compliance.total_public_tables} tabelas
                      </Badge>
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Ação Necessária</AlertTitle>
                      <AlertDescription>
                        Habilite a proteção contra senhas vazadas no Supabase Dashboard:
                        <br />
                        <strong>Authentication → Settings → Password Security</strong>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}