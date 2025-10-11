import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, ShieldAlert, ShieldCheck, Play, AlertTriangle, Info } from 'lucide-react';
import { useSecurityScanning } from '@/hooks/useSecurityScanning';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SecurityScanCard() {
  const { 
    isScanning, 
    scanResults, 
    runSecurityScan 
  } = useSecurityScanning();

  const getSecurityScoreColor = (vulnerabilities: number) => {
    if (vulnerabilities === 0) return 'text-success';
    if (vulnerabilities <= 5) return 'text-warning';
    return 'text-destructive';
  };

  const getSecurityIcon = (vulnerabilities: number) => {
    if (vulnerabilities === 0) return <ShieldCheck className="h-5 w-5 text-success" />;
    if (vulnerabilities <= 5) return <Shield className="h-5 w-5 text-warning" />;
    return <ShieldAlert className="h-5 w-5 text-destructive" />;
  };

  const calculateSecurityScore = (total: number, critical: number, high: number) => {
    if (critical > 0) return Math.max(0, 100 - (critical * 30) - (high * 20) - (total * 5));
    if (high > 0) return Math.max(20, 100 - (high * 25) - (total * 5));
    if (total > 0) return Math.max(50, 100 - (total * 10));
    return 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Scan de Segurança
        </CardTitle>
        <CardDescription>
          Execute uma análise completa de segurança do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runSecurityScan}
          disabled={isScanning}
          className="w-full"
        >
          {isScanning ? (
            <>Executando Scan...</>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Executar Scan de Segurança
            </>
          )}
        </Button>

        {scanResults && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getSecurityIcon(scanResults.vulnerabilitiesFound)}
                <span className="font-medium">Última Análise</span>
              </div>
              <Badge variant="outline">
                {format(new Date(scanResults.scanTimestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pontuação de Segurança</span>
                <span className={getSecurityScoreColor(scanResults.vulnerabilitiesFound)}>
                  {calculateSecurityScore(
                    scanResults.vulnerabilitiesFound,
                    scanResults.criticalIssues,
                    scanResults.highIssues
                  )}%
                </span>
              </div>
              <Progress 
                value={calculateSecurityScore(
                  scanResults.vulnerabilitiesFound,
                  scanResults.criticalIssues,
                  scanResults.highIssues
                )} 
                className="h-2"
              />
            </div>

            {scanResults.vulnerabilitiesFound > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Vulnerabilidades Encontradas
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {scanResults.criticalIssues > 0 && (
                    <div className="flex justify-between">
                      <span className="text-destructive">Críticas:</span>
                      <Badge variant="destructive">{scanResults.criticalIssues}</Badge>
                    </div>
                  )}
                  {scanResults.highIssues > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Altas:</span>
                      <Badge variant="secondary">{scanResults.highIssues}</Badge>
                    </div>
                  )}
                  {scanResults.mediumIssues > 0 && (
                    <div className="flex justify-between">
                      <span className="text-warning">Médias:</span>
                      <Badge variant="outline">{scanResults.mediumIssues}</Badge>
                    </div>
                  )}
                  {scanResults.lowIssues > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Baixas:</span>
                      <Badge variant="outline">{scanResults.lowIssues}</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            {scanResults.scanSummary.recommendations && (
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-primary" />
                  <div>
                    <h5 className="font-medium text-sm">Recomendações</h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      {scanResults.scanSummary.recommendations}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}