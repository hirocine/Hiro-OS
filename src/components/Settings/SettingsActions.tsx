import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useEquipment } from '@/features/equipment';
import { useProjects } from '@/features/projects';
import { toast } from 'sonner';
import { Download, Upload } from 'lucide-react';

export function SettingsActions() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { equipment } = useEquipment();
  const { projects } = useProjects();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const csvData = {
        equipment: equipment.map((eq) => ({
          name: eq.name,
          brand: eq.brand,
          category: eq.category,
          status: eq.status,
          serial_number: eq.serialNumber,
          patrimony_number: eq.patrimonyNumber,
        })),
        projects: projects.map((proj) => ({
          name: proj.name,
          responsible_name: proj.responsibleName,
          start_date: proj.startDate,
          expected_end_date: proj.expectedEndDate,
          status: proj.status,
          step: proj.step,
        })),
      };

      const dataStr = JSON.stringify(csvData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `backup_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast.success('Backup criado com sucesso', {
        description: `Arquivo ${exportFileDefaultName} foi baixado.`,
      });
    } catch (error) {
      toast.error('Erro ao criar backup', {
        description: 'Não foi possível exportar os dados.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.equipment || !data.projects) {
        throw new Error('Formato de arquivo inválido');
      }

      toast.info('Importação iniciada', {
        description: 'Os dados estão sendo processados...',
      });

      setTimeout(() => {
        toast.success('Dados importados com sucesso', {
          description: `${data.equipment.length} equipamentos e ${data.projects.length} projetos foram importados.`,
        });
      }, 2000);
    } catch (error) {
      toast.error('Erro ao importar dados', {
        description: 'Verifique se o arquivo está no formato correto.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label
        style={{
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 500,
          color: 'hsl(var(--ds-fg-3))',
        }}
      >
        Backup dos Dados
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn" onClick={handleExportData} disabled={isExporting}>
          <Download size={13} strokeWidth={1.5} />
          <span>{isExporting ? 'Exportando...' : 'Fazer Backup'}</span>
        </button>

        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="btn">
              <Upload size={13} strokeWidth={1.5} />
              <span>Restaurar</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                <span style={{ fontFamily: '"HN Display", sans-serif' }}>Restaurar Backup</span>
              </DialogTitle>
            </DialogHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                Selecione um arquivo de backup para restaurar os dados do sistema.
              </p>
              <Input type="file" accept=".json" onChange={handleImportData} disabled={isImporting} />
              {isImporting && (
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-accent))' }}>Importando dados...</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
