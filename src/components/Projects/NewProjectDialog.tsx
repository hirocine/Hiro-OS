import { useState } from 'react';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle, 
  ResponsiveDialogFooter 
} from '@/components/ui/responsive-dialog';
import { 
  MobileFriendlyForm, 
  MobileFriendlyFormSection, 
  MobileFriendlyFormGrid, 
  MobileFriendlyFormField,
  MobileFriendlyFormActions
} from '@/components/ui/mobile-friendly-form';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Project, 'id' | 'step' | 'stepHistory'>) => void;
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
    
    const projectData = {
      name: formData.name,
      description: formData.description,
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: formData.expectedEndDate,
      status: 'active' as const,
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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="max-w-3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nova Retirada de Equipamentos</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        
        <MobileFriendlyForm onSubmit={handleSubmit}>
          <MobileFriendlyFormSection title="Informações do Projeto">
            <MobileFriendlyFormGrid>
              <MobileFriendlyFormField span={2}>
                <Label htmlFor="name">Nome do Projeto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                  placeholder="Ex: Documentário Natureza"
                  className="h-12"
                />
              </MobileFriendlyFormField>
              
              <MobileFriendlyFormField span={2}>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={2}
                  placeholder="Breve descrição do projeto..."
                  className="resize-none"
                />
              </MobileFriendlyFormField>
            </MobileFriendlyFormGrid>
          </MobileFriendlyFormSection>

          <MobileFriendlyFormSection title="Responsável">
            <MobileFriendlyFormGrid>
              <MobileFriendlyFormField>
                <Label htmlFor="responsibleName">Nome Completo *</Label>
                <Input
                  id="responsibleName"
                  value={formData.responsibleName}
                  onChange={(e) => updateField('responsibleName', e.target.value)}
                  required
                  placeholder="Nome completo"
                  className="h-12"
                />
              </MobileFriendlyFormField>
              
              <MobileFriendlyFormField>
                <Label htmlFor="responsibleEmail">Email</Label>
                <Input
                  id="responsibleEmail"
                  type="email"
                  value={formData.responsibleEmail}
                  onChange={(e) => updateField('responsibleEmail', e.target.value)}
                  placeholder="email@exemplo.com"
                  className="h-12"
                />
              </MobileFriendlyFormField>
              
              <MobileFriendlyFormField>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => updateField('department', e.target.value)}
                  placeholder="Ex: Produção, Direção"
                  className="h-12"
                />
              </MobileFriendlyFormField>
              
              <MobileFriendlyFormField>
                <Label htmlFor="expectedEndDate">Data Prevista de Devolução *</Label>
                <Input
                  id="expectedEndDate"
                  type="date"
                  value={formData.expectedEndDate}
                  onChange={(e) => updateField('expectedEndDate', e.target.value)}
                  required
                  className="h-12"
                />
              </MobileFriendlyFormField>
            </MobileFriendlyFormGrid>
          </MobileFriendlyFormSection>
          
          <MobileFriendlyFormSection title="Observações">
            <MobileFriendlyFormGrid>
              <MobileFriendlyFormField span={2}>
                <Label htmlFor="notes">Informações Adicionais</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={3}
                  placeholder="Informações adicionais sobre o projeto..."
                  className="resize-none"
                />
              </MobileFriendlyFormField>
            </MobileFriendlyFormGrid>
          </MobileFriendlyFormSection>
          
          <MobileFriendlyFormActions>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Projeto
            </Button>
          </MobileFriendlyFormActions>
        </MobileFriendlyForm>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}