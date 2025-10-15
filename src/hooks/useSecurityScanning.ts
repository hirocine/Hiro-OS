import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface SecurityScanResult {
  scanId: string;
  scanTimestamp: string;
  vulnerabilitiesFound: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  scanSummary: {
    scan_id: string;
    timestamp: string;
    total_vulnerabilities: number;
    breakdown: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    recommendations: string;
  };
}

interface SecurityDashboard {
  timestamp: string;
  loginStatistics: {
    total_attempts: number;
    successful_logins: number;
    failed_attempts: number;
    unique_ips: number;
    blocked_ips: number;
  };
  securityAlerts: {
    total_alerts: number;
    unresolved_alerts: number;
    critical_alerts: number;
    high_alerts: number;
  };
  policyCompliance: {
    rls_enabled_tables: number;
    total_public_tables: number;
  };
  securityScore: 'CRITICAL' | 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK';
}

export function useSecurityScanning() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<SecurityScanResult | null>(null);
  const [dashboardData, setDashboardData] = useState<SecurityDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  const runSecurityScan = async (): Promise<SecurityScanResult | null> => {
    setIsScanning(true);
    
    try {
      const { data, error } = await supabase.rpc('run_complete_security_scan');
      
      if (error) {
        logger.error('Security scan failed', {
          module: 'security',
          action: 'run_security_scan',
          error
        });
        toast.error('Erro ao executar scan de segurança: ' + error.message);
        return null;
      }

      if (data && data.length > 0) {
        const result = data[0];
        const scanResult: SecurityScanResult = {
          scanId: result.scan_id,
          scanTimestamp: result.scan_timestamp,
          vulnerabilitiesFound: result.vulnerabilities_found,
          criticalIssues: result.critical_issues,
          highIssues: result.high_issues,
          mediumIssues: result.medium_issues,
          lowIssues: result.low_issues,
          scanSummary: typeof result.scan_summary === 'object' ? result.scan_summary as {
            scan_id: string;
            timestamp: string;
            total_vulnerabilities: number;
            breakdown: {
              critical: number;
              high: number;
              medium: number;
              low: number;
            };
            recommendations: string;
          } : {
            scan_id: result.scan_id,
            timestamp: result.scan_timestamp,
            total_vulnerabilities: result.vulnerabilities_found,
            breakdown: {
              critical: result.critical_issues,
              high: result.high_issues,
              medium: result.medium_issues,
              low: result.low_issues
            },
            recommendations: 'Scan concluído'
          }
        };
        
        setScanResults(scanResult);
        toast.success('Scan de segurança concluído com sucesso');
        return scanResult;
      }

      return null;
    } catch (error) {
      logger.error('Unexpected security scan error', {
        module: 'security',
        action: 'run_security_scan',
        error
      });
      toast.error('Erro inesperado durante o scan de segurança');
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  const getSecurityDashboard = async (): Promise<SecurityDashboard | null> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('get_security_dashboard');
      
      if (error) {
        logger.error('Failed to load security dashboard', {
          module: 'security',
          action: 'get_security_dashboard',
          error
        });
        toast.error('Erro ao carregar dashboard de segurança: ' + error.message);
        return null;
      }

      if (data && typeof data === 'object') {
        const dashboard: SecurityDashboard = {
          timestamp: (data as any).timestamp || new Date().toISOString(),
          loginStatistics: (data as any).login_statistics || {
            total_attempts: 0,
            successful_logins: 0,
            failed_attempts: 0,
            unique_ips: 0,
            blocked_ips: 0
          },
          securityAlerts: (data as any).security_alerts || {
            total_alerts: 0,
            unresolved_alerts: 0,
            critical_alerts: 0,
            high_alerts: 0
          },
          policyCompliance: (data as any).policy_compliance || {
            rls_enabled_tables: 0,
            total_public_tables: 0
          },
          securityScore: (data as any).security_score || 'LOW_RISK'
        };
        
        setDashboardData(dashboard);
        return dashboard;
      }

      return null;
    } catch (error) {
      logger.error('Unexpected dashboard error', {
        module: 'security',
        action: 'get_security_dashboard',
        error
      });
      toast.error('Erro inesperado ao carregar dashboard de segurança');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resolveSecurityAlert = async (alertId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          resolved: true, 
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('id', alertId);

      if (error) {
        logger.error('Failed to resolve security alert', {
          module: 'security',
          action: 'resolve_alert',
          data: { alertId },
          error
        });
        toast.error('Erro ao resolver alerta de segurança');
        return false;
      }

      toast.success('Alerta de segurança resolvido');
      return true;
    } catch (error) {
      logger.error('Unexpected resolve alert error', {
        module: 'security',
        action: 'resolve_alert',
        data: { alertId },
        error
      });
      toast.error('Erro inesperado ao resolver alerta');
      return false;
    }
  };

  return {
    isScanning,
    loading,
    scanResults,
    dashboardData,
    runSecurityScan,
    getSecurityDashboard,
    resolveSecurityAlert
  };
}