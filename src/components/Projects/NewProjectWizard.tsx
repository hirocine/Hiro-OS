import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useEquipment } from '@/hooks/useEquipment';
import { Equipment, EquipmentCategory } from '@/types/equipment';

interface NewProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

interface ProjectData {
  name: string;
  producer: string;
  recordingDate: string;
  separationPerson: string;
  separationDate: string;
  conferencePerson: string;
  returnDate: string;
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
    producer: '',
    recordingDate: '',
    separationPerson: '',
    separationDate: '',
    conferencePerson: '',
    returnDate: '',
    selectedEquipment: {
      camera: [],
      audio: [],
      lighting: [],
      accessories: []
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
      case 2: return projectData.producer.trim() !== '';
      case 3: return projectData.recordingDate !== '';
      case 4: return projectData.separationPerson.trim() !== '' && projectData.separationDate !== '';
      case 5: return projectData.conferencePerson.trim() !== '';
      case 6: return projectData.returnDate !== '';
      default: return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 15) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const totalEquipmentCount = Object.values(projectData.selectedEquipment)
      .reduce((sum, items) => sum + items.length, 0);
    
    const finalData = {
      name: projectData.name,
      description: `Produção: ${projectData.producer}`,
      startDate: projectData.separationDate,
      expectedEndDate: projectData.returnDate,
      status: 'active' as const,
      responsibleName: projectData.producer,
      department: 'Produção',
      equipmentCount: totalEquipmentCount,
      loanIds: [],
      notes: `Gravação: ${projectData.recordingDate} | Separação: ${projectData.separationPerson} | Conferência: ${projectData.conferencePerson}`
    };

    onSubmit(finalData);
    onOpenChange(false);
    
    // Reset form
    setCurrentStep(1);
    setProjectData({
      name: '',
      producer: '',
      recordingDate: '',
      separationPerson: '',
      separationDate: '',
      conferencePerson: '',
      returnDate: '',
      selectedEquipment: {
        camera: [],
        audio: [],
        lighting: [],
        accessories: []
      }
    });
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
            <Label htmlFor="producer">Produtor Responsável</Label>
            <Input
              id="producer"
              value={projectData.producer}
              onChange={(e) => updateField('producer', e.target.value)}
              placeholder="Nome do produtor responsável"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Label htmlFor="recordingDate">Data da Gravação</Label>
            <Input
              id="recordingDate"
              type="date"
              value={projectData.recordingDate}
              onChange={(e) => updateField('recordingDate', e.target.value)}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="separationPerson">Quem fará a separação</Label>
              <Input
                id="separationPerson"
                value={projectData.separationPerson}
                onChange={(e) => updateField('separationPerson', e.target.value)}
                placeholder="Nome da pessoa responsável"
              />
            </div>
            <div>
              <Label htmlFor="separationDate">Data da separação</Label>
              <Input
                id="separationDate"
                type="date"
                value={projectData.separationDate}
                onChange={(e) => updateField('separationDate', e.target.value)}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <Label htmlFor="conferencePerson">Quem fará a conferência</Label>
            <Input
              id="conferencePerson"
              value={projectData.conferencePerson}
              onChange={(e) => updateField('conferencePerson', e.target.value)}
              placeholder="Nome da pessoa responsável"
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <Label htmlFor="returnDate">Data de Devolução</Label>
            <Input
              id="returnDate"
              type="date"
              value={projectData.returnDate}
              onChange={(e) => updateField('returnDate', e.target.value)}
            />
          </div>
        );

      case 15:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Confirmação Final</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Projeto:</strong> {projectData.name}</div>
                <div><strong>Produtor:</strong> {projectData.producer}</div>
                <div><strong>Gravação:</strong> {new Date(projectData.recordingDate).toLocaleDateString('pt-BR')}</div>
                <div><strong>Devolução:</strong> {new Date(projectData.returnDate).toLocaleDateString('pt-BR')}</div>
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
                            {item.name} - {item.brand} {item.model}
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
        // Equipment selection steps (7-14)
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
                        <div className="text-xs text-muted-foreground">{equipment.brand} {equipment.model}</div>
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
                        <div className="text-xs text-muted-foreground">{equipment.brand} {equipment.model}</div>
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
          <DialogTitle>Nova Retirada - Passo {currentStep} de 15</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / 15) * 100}%` }}
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
            
            {currentStep === 15 ? (
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