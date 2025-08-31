import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useEquipment } from '@/hooks/useEquipment';
import { Equipment, EquipmentCategory } from '@/types/equipment';
import { toast } from 'sonner';

interface NewProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any, selectedEquipment: Equipment[]) => void;
}

interface ProjectData {
  name: string;
  description: string;
  responsibleName: string;
  responsibleEmail: string;
  department: string;
  startDate: string;
  expectedEndDate: string;
  selectedEquipment: Record<EquipmentCategory, Equipment[]>;
}

const EQUIPMENT_STEPS = [
  { category: 'camera' as EquipmentCategory, title: 'Câmeras', step: 7 },
  { category: 'camera' as EquipmentCategory, title: 'Lentes', step: 8, subcategory: 'lenses' },
  { category: 'accessories' as EquipmentCategory, title: 'Tripés e Movimento', step: 9, subcategory: 'tripods' },
  { category: 'accessories' as EquipmentCategory, title: 'Acessórios de Câmera', step: 10, subcategory: 'camera-accessories' },
  { category: 'audio' as EquipmentCategory, title: 'Áudio', step: 11 },
  { category: 'audio' as EquipmentCategory, title: 'Acessórios de Áudio', step: 12, subcategory: 'audio-accessories' },
  { category: 'lighting' as EquipmentCategory, title: 'Iluminação', step: 13 },
  { category: 'lighting' as EquipmentCategory, title: 'Acessórios de Iluminação', step: 14, subcategory: 'lighting-accessories' },
];

export function NewProjectWizard({ open, onOpenChange, onSubmit }: NewProjectWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    responsibleName: '',
    responsibleEmail: '',
    department: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    selectedEquipment: {
      camera: [],
      audio: [],
      lighting: [],
      accessories: [],
      storage: []
    }
  });

  const { allEquipment } = useEquipment();

  const updateField = (field: keyof ProjectData, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const addEquipment = (equipment: Equipment, category: EquipmentCategory) => {
    setProjectData(prev => ({
      ...prev,
      selectedEquipment: {
        ...prev.selectedEquipment,
        [category]: [...prev.selectedEquipment[category], equipment]
      }
    }));
  };

  const removeEquipment = (equipmentId: string, category: EquipmentCategory) => {
    setProjectData(prev => ({
      ...prev,
      selectedEquipment: {
        ...prev.selectedEquipment,
        [category]: prev.selectedEquipment[category].filter(eq => eq.id !== equipmentId)
      }
    }));
  };

  const getAvailableEquipment = (category: EquipmentCategory, subcategory?: string) => {
    return allEquipment.filter(eq => {
      // Use simplified status - only show equipment that is actually available
      if (eq.status !== 'available') return false;
      if (eq.category !== category) return false;
      
      // Simple subcategory filtering based on equipment name
      if (subcategory) {
        const name = eq.name.toLowerCase();
        switch (subcategory) {
          case 'lenses':
            return name.includes('lente') || name.includes('lens');
          case 'tripods':
            return name.includes('tripé') || name.includes('tripod') || name.includes('steadicam') || name.includes('gimbal');
          case 'camera-accessories':
            return !name.includes('lente') && !name.includes('lens') && !name.includes('tripé') && !name.includes('tripod');
          case 'audio-accessories':
            return !name.includes('microfone') && !name.includes('gravador');
          case 'lighting-accessories':
            return !name.includes('led') && !name.includes('painel');
          default:
            return true;
        }
      }
      
      return true;
    });
  };

  const getSelectedEquipment = (category: EquipmentCategory) => {
    return projectData.selectedEquipment[category] || [];
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return projectData.name.trim() !== '';
      case 2: return projectData.description.trim() !== '';
      case 3: return projectData.responsibleName.trim() !== '';
      case 4: return projectData.responsibleEmail.trim() !== '';
      case 5: return projectData.department.trim() !== '';
      case 6: return projectData.expectedEndDate !== '';
      default: return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 14) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const allSelectedEquipment = Object.values(projectData.selectedEquipment)
      .flat();
    const totalEquipmentCount = allSelectedEquipment.length;
    
    const finalData = {
      name: projectData.name,
      description: projectData.description,
      startDate: projectData.startDate,
      expectedEndDate: projectData.expectedEndDate,
      status: 'active' as const,
      responsibleName: projectData.responsibleName,
      responsibleEmail: projectData.responsibleEmail,
      department: projectData.department,
      equipmentCount: totalEquipmentCount,
      loanIds: []
    };

    try {
      // Pass project data and selected equipment to parent
      await onSubmit(finalData, allSelectedEquipment);
      
      onOpenChange(false);
      
      // Reset form
      setCurrentStep(1);
      setProjectData({
        name: '',
        description: '',
        responsibleName: '',
        responsibleEmail: '',
        department: '',
        startDate: new Date().toISOString().split('T')[0],
        expectedEndDate: '',
        selectedEquipment: {
          camera: [],
          audio: [],
          lighting: [],
          accessories: [],
          storage: []
        }
      });
      
      toast.success('Projeto criado com sucesso!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Erro ao criar projeto');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="projectName">Nome do Projeto</Label>
            <Input
              id="projectName"
              value={projectData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Digite o nome do projeto"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Label htmlFor="description">Descrição do Projeto</Label>
            <Textarea
              id="description"
              value={projectData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Descreva brevemente o projeto..."
              rows={3}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label htmlFor="responsibleName">Responsável pelo Projeto</Label>
            <Input
              id="responsibleName"
              value={projectData.responsibleName}
              onChange={(e) => updateField('responsibleName', e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Label htmlFor="responsibleEmail">Email do Responsável</Label>
            <Input
              id="responsibleEmail"
              type="email"
              value={projectData.responsibleEmail}
              onChange={(e) => updateField('responsibleEmail', e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              value={projectData.department}
              onChange={(e) => updateField('department', e.target.value)}
              placeholder="Ex: Produção, Marketing, etc."
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Label htmlFor="expectedEndDate">Data de Devolução Prevista</Label>
            <Input
              id="expectedEndDate"
              type="date"
              value={projectData.expectedEndDate}
              onChange={(e) => updateField('expectedEndDate', e.target.value)}
              min={projectData.startDate}
            />
          </div>
        );

      case 14:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Confirmação Final</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Projeto:</strong> {projectData.name}</div>
                <div><strong>Responsável:</strong> {projectData.responsibleName}</div>
                <div><strong>Email:</strong> {projectData.responsibleEmail}</div>
                <div><strong>Departamento:</strong> {projectData.department}</div>
                <div><strong>Início:</strong> {new Date(projectData.startDate).toLocaleDateString('pt-BR')}</div>
                <div><strong>Devolução:</strong> {new Date(projectData.expectedEndDate).toLocaleDateString('pt-BR')}</div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Equipamentos Selecionados:</h4>
                {EQUIPMENT_STEPS.map(({ category, title }) => {
                  const items = getSelectedEquipment(category);
                  if (items.length === 0) return null;
                  
                  return (
                    <div key={title} className="border rounded-lg p-3">
                      <h5 className="font-medium text-sm mb-2">{title} ({items.length})</h5>
                      <div className="space-y-1">
                        {items.map(item => (
                          <div key={item.id} className="text-sm text-muted-foreground">
                            {item.name} - {item.brand}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        // Equipment selection steps (7-13)
        const equipmentStep = EQUIPMENT_STEPS.find(step => step.step === currentStep);
        if (!equipmentStep) return null;

        const availableEquipment = getAvailableEquipment(equipmentStep.category, equipmentStep.subcategory);
        const selectedEquipment = getSelectedEquipment(equipmentStep.category);
        
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{equipmentStep.title}</h3>
            
            <div className="grid grid-cols-2 gap-4 h-96">
              {/* Available Equipment */}
              <div className="border rounded-lg">
                <div className="p-3 border-b bg-muted/50">
                  <h4 className="font-medium">Disponíveis ({availableEquipment.length})</h4>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto h-80">
                  {availableEquipment.map(equipment => (
                    <div key={equipment.id} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{equipment.name}</div>
                        <div className="text-xs text-muted-foreground">{equipment.brand}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addEquipment(equipment, equipmentStep.category)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Equipment */}
              <div className="border rounded-lg">
                <div className="p-3 border-b bg-muted/50">
                  <h4 className="font-medium">Selecionados ({selectedEquipment.length})</h4>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto h-80">
                  {selectedEquipment.map(equipment => (
                    <div key={equipment.id} className="flex items-center justify-between p-2 border rounded bg-primary/5">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{equipment.name}</div>
                        <div className="text-xs text-muted-foreground">{equipment.brand}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeEquipment(equipment.id, equipmentStep.category)}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Projeto - Passo {currentStep} de 14</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / 14) * 100}%` }}
            />
          </div>

          {renderStep()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            
            {currentStep === 14 ? (
              <Button onClick={handleSubmit}>
                <Check className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!isStepValid()}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}