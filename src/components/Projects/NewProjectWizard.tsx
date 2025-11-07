import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useEquipment } from '@/hooks/useEquipment';
import { useCategories } from '@/hooks/useCategories';
import { Equipment } from '@/types/equipment';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

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
  selectedEquipment: Record<string, Equipment[]>;
}

export function NewProjectWizard({ open, onOpenChange, onSubmit }: NewProjectWizardProps) {
  const { allEquipment } = useEquipment();
  const { getCategoriesHierarchy, categories, loading: categoriesLoading } = useCategories();

  // Gerar steps de equipamentos dinamicamente baseado nas categorias do banco
  const EQUIPMENT_STEPS = useMemo(() => {
    const categoriesHierarchy = getCategoriesHierarchy(); // Chamar dentro do useMemo
    
    const steps: Array<{
      category: string;
      title: string;
      step: number;
      subcategory?: string;
    }> = [];
    
    let stepNumber = 7; // Começar após os 6 steps de dados do projeto
    
    categoriesHierarchy.forEach((categoryData) => {
      if (categoryData.subcategories.length === 0) {
        // Categoria sem subcategorias: criar 1 step
        steps.push({
          category: categoryData.categoryName,
          title: categoryData.categoryName,
          step: stepNumber++
        });
      } else {
        // Categoria com subcategorias: criar 1 step por subcategoria
        categoryData.subcategories.forEach((subcategory) => {
          steps.push({
            category: categoryData.categoryName,
            title: `${categoryData.categoryName} - ${subcategory.name}`,
            step: stepNumber++,
            subcategory: subcategory.name
          });
        });
      }
    });
    
    return steps;
  }, [categories, getCategoriesHierarchy]);

  const TOTAL_STEPS = 6 + EQUIPMENT_STEPS.length + 1; // 6 dados + equipamentos + 1 confirmação

  const [currentStep, setCurrentStep] = useState(1);

  // Loading state enquanto categorias carregam
  if (categoriesLoading && EQUIPMENT_STEPS.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] mx-auto">
          <DialogHeader>
            <DialogTitle>Carregando categorias...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    description: '',
    responsibleName: '',
    responsibleEmail: '',
    department: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    selectedEquipment: {}
  });

  const updateField = (field: keyof ProjectData, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const addEquipment = (equipment: Equipment, category: string) => {
    setProjectData(prev => ({
      ...prev,
      selectedEquipment: {
        ...prev.selectedEquipment,
        [category]: [...(prev.selectedEquipment[category] || []), equipment]
      }
    }));
  };

  const removeEquipment = (equipmentId: string, category: string) => {
    setProjectData(prev => ({
      ...prev,
      selectedEquipment: {
        ...prev.selectedEquipment,
        [category]: (prev.selectedEquipment[category] || []).filter(eq => eq.id !== equipmentId)
      }
    }));
  };

  const getAvailableEquipment = (category: string, subcategory?: string) => {
    return allEquipment.filter(eq => {
      // Apenas equipamentos disponíveis
      if (eq.status !== 'available') return false;
      
      // Filtrar por categoria
      if (eq.category !== category) return false;
      
      // Filtrar por subcategoria (se especificada)
      if (subcategory && eq.subcategory !== subcategory) {
        return false;
      }
      
      return true;
    });
  };

  const getSelectedEquipment = (category: string) => {
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
    if (currentStep < TOTAL_STEPS) {
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
        selectedEquipment: {}
      });
      
      toast.success('Projeto criado com sucesso!');
    } catch (error) {
      logger.error('Error creating project in wizard', {
        module: 'project',
        action: 'create_project_wizard',
        error,
        data: { projectName: finalData.name, equipmentCount: allSelectedEquipment.length }
      });
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

      case TOTAL_STEPS:
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
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 h-96">
              {/* Available Equipment */}
              <div className="border rounded-lg">
                <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
                  <h4 className="font-medium">{equipmentStep.title} - Disponíveis</h4>
                  <Badge variant="secondary">{availableEquipment.length}</Badge>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto h-80">
                  {availableEquipment.map(equipment => {
                    const isSelected = selectedEquipment.some(eq => eq.id === equipment.id);
                    return (
                      <div
                        key={equipment.id}
                        className={cn(
                          "flex items-center justify-between p-2 border rounded transition-all duration-200",
                          isSelected 
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-sm" 
                            : "hover:bg-accent hover:border-primary/30"
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isSelected && (
                            <div className="w-6 h-6 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center flex-shrink-0">
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm">{equipment.name}</div>
                            <div className="text-xs text-muted-foreground">{equipment.brand}</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          disabled={isSelected}
                          onClick={() => !isSelected && addEquipment(equipment, equipmentStep.category)}
                          className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Selecionado
                            </>
                          ) : (
                            "Adicionar"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Equipment */}
              <div className="border rounded-lg">
                <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium">Selecionados</h4>
                  <Badge variant="default">{selectedEquipment.length}</Badge>
                </div>
                <div className="p-3 space-y-2 overflow-y-auto h-80">
                  {selectedEquipment.map(equipment => (
                    <div 
                      key={equipment.id} 
                      className={cn(
                        "flex items-center justify-between p-2 border rounded transition-all duration-200",
                        "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-sm"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-6 h-6 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center flex-shrink-0">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{equipment.name}</div>
                          <div className="text-xs text-muted-foreground">{equipment.brand}</div>
                        </div>
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
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] mx-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Projeto - Passo {currentStep} de {TOTAL_STEPS}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
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
            
            {currentStep === TOTAL_STEPS ? (
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