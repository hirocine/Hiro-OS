import { useState } from 'react';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Project, 'id'>) => void;
}

export function NewProjectDialog({ open, onOpenChange, onSubmit }: NewProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expectedEndDate: '',
    responsibleName: '',
    responsibleEmail: '',
    department: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData: Omit<Project, 'id'> = {
      name: formData.name,
      description: formData.description,
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: formData.expectedEndDate,
      status: 'active',
      responsibleName: formData.responsibleName,
      responsibleEmail: formData.responsibleEmail,
      department: formData.department,
      equipmentCount: 0,
      loanIds: [],
      notes: formData.notes
    };
    
    onSubmit(projectData);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      expectedEndDate: '',
      responsibleName: '',
      responsibleEmail: '',
      department: '',
      notes: ''
    });
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Retirada de Equipamentos</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
                placeholder="Ex: Documentário Natureza"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={2}
                placeholder="Breve descrição do projeto..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsibleName">Responsável *</Label>
              <Input
                id="responsibleName"
                value={formData.responsibleName}
                onChange={(e) => updateField('responsibleName', e.target.value)}
                required
                placeholder="Nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsibleEmail">Email do Responsável</Label>
              <Input
                id="responsibleEmail"
                type="email"
                value={formData.responsibleEmail}
                onChange={(e) => updateField('responsibleEmail', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => updateField('department', e.target.value)}
                placeholder="Ex: Produção, Direção"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expectedEndDate">Data Prevista de Devolução *</Label>
              <Input
                id="expectedEndDate"
                type="date"
                value={formData.expectedEndDate}
                onChange={(e) => updateField('expectedEndDate', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              placeholder="Informações adicionais sobre o projeto..."
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Projeto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}