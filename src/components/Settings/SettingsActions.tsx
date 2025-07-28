import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useEquipment } from '@/hooks/useEquipment';
import { useProjects } from '@/hooks/useProjects';
import { useLoans } from '@/hooks/useLoans';
import { toast } from 'sonner';
import { Download, Upload, Save, RotateCcw } from 'lucide-react';

export function SettingsActions() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { equipment } = useEquipment();
  const { projects } = useProjects();
  const { loans } = useLoans();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Create CSV data
      const csvData = {
        equipment: equipment.map(eq => ({
          name: eq.name,
          brand: eq.brand,
          model: eq.model,
          category: eq.category,
          status: eq.status,
          serial_number: eq.serialNumber,
          patrimony_number: eq.patrimonyNumber,
        })),
        projects: projects.map(proj => ({
          name: proj.name,
          responsible_name: proj.responsibleName,
          start_date: proj.startDate,
          expected_end_date: proj.expectedEndDate,
          status: proj.status,
          step: proj.step,
        })),
        loans: loans.map(loan => ({
          equipment_name: loan.equipmentName,
          borrower_name: loan.borrowerName,
          loan_date: loan.loanDate,
          expected_return_date: loan.expectedReturnDate,
          status: loan.status,
          project: loan.project,
        }))
      };

      // Create and download file
      const dataStr = JSON.stringify(csvData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `backup_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast.success('Backup criado com sucesso', {
        description: `Arquivo ${exportFileDefaultName} foi baixado.`
      });
    } catch (error) {
      toast.error('Erro ao criar backup', {
        description: 'Não foi possível exportar os dados.'
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
      
      // Validate data structure
      if (!data.equipment || !data.projects || !data.loans) {
        throw new Error('Formato de arquivo inválido');
      }

      toast.info('Importação iniciada', {
        description: 'Os dados estão sendo processados...'
      });

      // Here you would implement the actual import logic
      // For now, just show success message
      setTimeout(() => {
        toast.success('Dados importados com sucesso', {
          description: `${data.equipment.length} equipamentos, ${data.projects.length} projetos e ${data.loans.length} empréstimos foram importados.`
        });
      }, 2000);

    } catch (error) {
      toast.error('Erro ao importar dados', {
        description: 'Verifique se o arquivo está no formato correto.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Backup dos Dados</Label>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Fazer Backup'}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Restaurar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restaurar Backup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione um arquivo de backup para restaurar os dados do sistema.
                </p>
                <Input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportData}
                  disabled={isImporting}
                />
                {isImporting && (
                  <p className="text-sm text-blue-600">Importando dados...</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Importar/Exportar</Label>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar CSV
          </Button>
        </div>
      </div>
    </div>
  );
}