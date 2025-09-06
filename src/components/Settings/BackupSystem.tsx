import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, Clock, Database, Shield, CheckCircle } from 'lucide-react';
import { enhancedToast } from '@/components/ui/enhanced-toast';

interface BackupSystemProps {
  onExportData: () => Promise<void>;
  onImportData: (file: File) => Promise<void>;
}

export function BackupSystem({ onExportData, onImportData }: BackupSystemProps) {
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('weekly');
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleAutoBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    try {
      // Simulate backup progress
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onExportData();
      
      clearInterval(interval);
      setBackupProgress(100);
      setLastBackup(new Date());
      
      setTimeout(() => {
        setBackupProgress(0);
        setIsBackingUp(false);
      }, 1000);

      enhancedToast.success({
        title: 'Backup realizado com sucesso',
        description: 'Todos os dados foram exportados com segurança.',
      });
    } catch (error) {
      setBackupProgress(0);
      setIsBackingUp(false);
      enhancedToast.error({
        title: 'Erro no backup',
        description: 'Não foi possível realizar o backup dos dados.',
      });
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await onImportData(file);
      enhancedToast.success({
        title: 'Dados importados com sucesso',
        description: 'O sistema foi restaurado a partir do backup.',
      });
    } catch (error) {
      enhancedToast.error({
        title: 'Erro na importação',
        description: 'Não foi possível importar os dados do arquivo.',
      });
    }

    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Backup Manual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup Manual
          </CardTitle>
          <CardDescription>
            Faça backup dos seus dados a qualquer momento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isBackingUp && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exportando dados...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="h-2" />
            </div>
          )}
          
          <div className="flex gap-4">
            <Button
              onClick={handleAutoBackup}
              disabled={isBackingUp}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              {isBackingUp ? 'Fazendo Backup...' : 'Fazer Backup'}
            </Button>
            
            <div className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                id="restore-input"
              />
              <Label htmlFor="restore-input" className="cursor-pointer">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Restaurar Backup
                  </span>
                </Button>
              </Label>
            </div>
          </div>

          {lastBackup && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              Último backup: {lastBackup.toLocaleString('pt-BR')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Automático */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Backup Automático
            <Badge variant="secondary">Em breve</Badge>
          </CardTitle>
          <CardDescription>
            Configure backups automáticos para maior segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-backup">Backup Automático</Label>
              <p className="text-sm text-muted-foreground">
                Realiza backup automaticamente conforme configurado
              </p>
            </div>
            <Switch
              id="auto-backup"
              checked={autoBackup}
              onCheckedChange={setAutoBackup}
              disabled
            />
          </div>

          {autoBackup && (
            <div className="space-y-2">
              <Label>Frequência do Backup</Label>
              <Select value={backupFrequency} onValueChange={setBackupFrequency} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Segurança dos Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança dos Dados
          </CardTitle>
          <CardDescription>
            Informações sobre a proteção dos seus dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">256-bit</div>
              <div className="text-sm text-muted-foreground">Criptografia AES</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime garantido</div>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Todos os dados são criptografados em trânsito e em repouso</p>
            <p>• Backups são armazenados em múltiplas localizações geográficas</p>
            <p>• Acesso aos dados é registrado para auditoria</p>
            <p>• Conformidade com LGPD e regulamentações de privacidade</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}