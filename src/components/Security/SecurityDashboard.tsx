import { useUserRole } from '@/hooks/useUserRole';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { useSecurityScanning } from '@/hooks/useSecurityScanning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Users, Database, Activity, TrendingUp } from 'lucide-react';
import { SecurityScanCard } from './SecurityScanCard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect } from 'react';

export function SecurityDashboard() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { 
    alerts, 
    metrics, 
    loading, 
    hasCriticalAlerts,
    runSecurityScan,
    resolveAlert 
  } = useSecurityMonitoring();

  const { 
    dashboardData, 
    getSecurityDashboard 
  } = useSecurityScanning();

  // Load dashboard data on component mount
  useEffect(() => {
    if (isAdmin) {
      getSecurityDashboard();
    }
  }, [isAdmin, getSecurityDashboard]);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Acesso negado. Apenas administradores podem visualizar o dashboard de segurança.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="animate-pulse">
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Segurança</h1>
          <p className="text-muted-foreground">
            Monitore a segurança e integridade do sistema
          </p>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {hasCriticalAlerts && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Existem alertas críticos de segurança que requerem atenção imediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Score Banner */}
      {dashboardData && (
        <Alert variant={
          dashboardData.securityScore === 'CRITICAL' ? 'destructive' :
          dashboardData.securityScore === 'HIGH_RISK' ? 'default' :
          'default'
        }>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Nível de Segurança:</strong> {
              dashboardData.securityScore === 'CRITICAL' ? 'CRÍTICO - Ação imediata necessária' :
              dashboardData.securityScore === 'HIGH_RISK' ? 'ALTO RISCO - Atenção requerida' :
              dashboardData.securityScore === 'MEDIUM_RISK' ? 'RISCO MÉDIO - Monitorar situação' :
              'BAIXO RISCO - Sistema seguro'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Password Security Warning */}
      <Alert variant="default">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Configuração Requerida:</strong> Habilite a proteção contra senhas vazadas no Supabase Dashboard:
          <br />
          <strong>Authentication → Settings → Password Security</strong>
        </AlertDescription>
      </Alert>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Security Scan Card */}
        <div className="lg:col-span-1">
          <SecurityScanCard />
        </div>

        {/* Metrics Cards */}
        <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.securityAlerts?.total_alerts || metrics?.totalAlerts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.securityAlerts?.unresolved_alerts || metrics?.unresolvedAlerts || 0} não resolvidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
              <Shield className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {dashboardData?.securityAlerts?.critical_alerts || metrics?.criticalAlerts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requerem atenção imediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Login (24h)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.loginStatistics?.total_attempts || metrics?.totalAlerts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.loginStatistics?.failed_attempts || metrics?.unresolvedAlerts || 0} falharam
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conformidade RLS</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {dashboardData?.policyCompliance ? 
                  Math.round((dashboardData.policyCompliance.rls_enabled_tables / dashboardData.policyCompliance.total_public_tables) * 100) + '%'
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardData?.policyCompliance?.rls_enabled_tables || 0} de {dashboardData?.policyCompliance?.total_public_tables || 0} tabelas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Recentes
          </CardTitle>
          <CardDescription>
            Últimos alertas de segurança detectados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts && alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          alert.severity === 'CRITICAL' ? 'destructive' :
                          alert.severity === 'HIGH' ? 'secondary' :
                          'outline'
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    {alert.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  {!alert.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Resolver
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
              <p className="text-muted-foreground">
                O sistema está funcionando normalmente
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}