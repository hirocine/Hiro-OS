import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, Clock, Database, Shield, CheckCircle, type LucideIcon } from 'lucide-react';
import { enhancedToast } from '@/components/ui/enhanced-toast';

interface BackupSystemProps {
  onExportData: () => Promise<void>;
  onImportData: (file: File) => Promise<void>;
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

function Section({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-2))',
            }}
          >
            {title}
          </span>
          {badge}
        </div>
        <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginLeft: 24 }}>{description}</p>
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
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
      const interval = setInterval(() => {
        setBackupProgress((prev) => {
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

    event.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Backup Manual */}
      <Section icon={Database} title="Backup Manual" description="Faça backup dos seus dados a qualquer momento">
        {isBackingUp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'hsl(var(--ds-fg-2))' }}>Exportando dados...</span>
              <span style={{ color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>{backupProgress}%</span>
            </div>
            <div style={{ height: 4, background: 'hsl(var(--ds-line-2))', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${backupProgress}%`,
                  height: '100%',
                  background: 'hsl(var(--ds-accent))',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn primary"
            onClick={handleAutoBackup}
            disabled={isBackingUp}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Download size={13} strokeWidth={1.5} />
            <span>{isBackingUp ? 'Fazendo Backup...' : 'Fazer Backup'}</span>
          </button>

          <div style={{ flex: 1 }}>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              style={{ display: 'none' }}
              id="restore-input"
            />
            <label htmlFor="restore-input" style={{ display: 'block', cursor: 'pointer' }}>
              <span
                className="btn"
                style={{ width: '100%', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Upload size={13} strokeWidth={1.5} />
                <span>Restaurar Backup</span>
              </span>
            </label>
          </div>
        </div>

        {lastBackup && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'hsl(var(--ds-fg-3))',
            }}
          >
            <CheckCircle size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
            <span>
              Último backup:{' '}
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-2))' }}>
                {lastBackup.toLocaleString('pt-BR')}
              </span>
            </span>
          </div>
        )}
      </Section>

      {/* Backup Automático */}
      <Section
        icon={Clock}
        title="Backup Automático"
        description="Configure backups automáticos para maior segurança"
        badge={<span className="pill muted">Em breve</span>}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <label htmlFor="auto-backup" style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
              Backup Automático
            </label>
            <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
              Realiza backup automaticamente conforme configurado
            </p>
          </div>
          <Switch id="auto-backup" checked={autoBackup} onCheckedChange={setAutoBackup} disabled />
        </div>

        {autoBackup && (
          <div>
            <label style={eyebrowStyle}>Frequência do Backup</label>
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
      </Section>

      {/* Segurança dos Dados */}
      <Section icon={Shield} title="Segurança dos Dados" description="Informações sobre a proteção dos seus dados">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <div
            style={{
              textAlign: 'center',
              padding: 16,
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
            }}
          >
            <div
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 22,
                fontWeight: 600,
                color: 'hsl(var(--ds-success))',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              256-bit
            </div>
            <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>Criptografia AES</div>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: 16,
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
            }}
          >
            <div
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 22,
                fontWeight: 600,
                color: 'hsl(var(--ds-accent))',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              99.9%
            </div>
            <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>Uptime garantido</div>
          </div>
        </div>

        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'hsl(var(--ds-fg-3))', listStyle: 'none', padding: 0, margin: 0 }}>
          <li>· Todos os dados são criptografados em trânsito e em repouso</li>
          <li>· Backups são armazenados em múltiplas localizações geográficas</li>
          <li>· Acesso aos dados é registrado para auditoria</li>
          <li>· Conformidade com LGPD e regulamentações de privacidade</li>
        </ul>
      </Section>
    </div>
  );
}
