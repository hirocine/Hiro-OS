import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useEquipment } from '@/features/equipment';
import { useCategories } from '@/hooks/useCategories';
import { Equipment } from '@/types/equipment';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { StatusPill } from '@/ds/components/StatusPill';

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

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

export function NewProjectWizard({ open, onOpenChange, onSubmit }: NewProjectWizardProps) {
  const { allEquipment } = useEquipment();
  const { getCategoriesHierarchy, categories, loading: categoriesLoading } = useCategories();

  // Gerar steps de equipamentos dinamicamente baseado nas categorias do banco
  const EQUIPMENT_STEPS = useMemo(() => {
    const categoriesHierarchy = getCategoriesHierarchy();

    const steps: Array<{
      category: string;
      title: string;
      step: number;
      subcategory?: string;
    }> = [];

    let stepNumber = 7; // Começar após os 6 steps de dados do projeto

    categoriesHierarchy.forEach((categoryData) => {
      if (categoryData.subcategories.length === 0) {
        steps.push({
          category: categoryData.categoryName,
          title: categoryData.categoryName,
          step: stepNumber++
        });
      } else {
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
  }, [getCategoriesHierarchy]);

  const TOTAL_STEPS = 6 + EQUIPMENT_STEPS.length + 1;

  const [currentStep, setCurrentStep] = useState(1);
  // All hooks must run before any early return — keep this state above the
  // loading-skeleton guard below.
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

  // Loading state enquanto categorias carregam
  if (categoriesLoading && EQUIPMENT_STEPS.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] mx-auto ds-shell">
          <DialogHeader>
            <DialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>
                Carregando categorias...
              </span>
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <div
              className="animate-spin"
              style={{
                width: 32,
                height: 32,
                border: '2px solid hsl(var(--ds-line-1))',
                borderBottomColor: 'hsl(var(--ds-accent))',
                borderRadius: '50%',
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
      if (eq.status !== 'available') return false;
      if (eq.category !== category) return false;
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
    const allSelectedEquipment = Object.values(projectData.selectedEquipment).flat();
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
      await onSubmit(finalData, allSelectedEquipment);

      onOpenChange(false);

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="projectName" style={fieldLabel}>Nome do Projeto</label>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="description" style={fieldLabel}>Descrição do Projeto</label>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="responsibleName" style={fieldLabel}>Responsável pelo Projeto</label>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="responsibleEmail" style={fieldLabel}>Email do Responsável</label>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="department" style={fieldLabel}>Departamento</label>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="expectedEndDate" style={fieldLabel}>Data de Devolução Prevista</label>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 18,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
              }}
            >
              Confirmação Final
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 16,
                  fontSize: 13,
                }}
              >
                {[
                  ['Projeto', projectData.name],
                  ['Responsável', projectData.responsibleName],
                  ['Email', projectData.responsibleEmail],
                  ['Departamento', projectData.department],
                  ['Início', new Date(projectData.startDate).toLocaleDateString('pt-BR')],
                  ['Devolução', new Date(projectData.expectedEndDate).toLocaleDateString('pt-BR')],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={fieldLabel}>{label}</p>
                    <p
                      style={{
                        color: 'hsl(var(--ds-fg-1))',
                        fontVariantNumeric:
                          label === 'Início' || label === 'Devolução' ? 'tabular-nums' : undefined,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-2))',
                  }}
                >
                  Equipamentos Selecionados
                </h4>
                {EQUIPMENT_STEPS.map(({ category, title }) => {
                  const items = getSelectedEquipment(category);
                  if (items.length === 0) return null;

                  return (
                    <div
                      key={title}
                      style={{
                        border: '1px solid hsl(var(--ds-line-1))',
                        background: 'hsl(var(--ds-surface))',
                        padding: 12,
                      }}
                    >
                      <h5
                        style={{
                          fontWeight: 500,
                          fontSize: 13,
                          marginBottom: 8,
                          color: 'hsl(var(--ds-fg-1))',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {title} ({items.length})
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {items.map(item => (
                          <div key={item.id} style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
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

      default: {
        // Equipment selection steps
        const equipmentStep = EQUIPMENT_STEPS.find(step => step.step === currentStep);
        if (!equipmentStep) return null;

        const availableEquipment = getAvailableEquipment(equipmentStep.category, equipmentStep.subcategory);
        const selectedEquipment = getSelectedEquipment(equipmentStep.category);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 16,
                height: 384,
              }}
            >
              {/* Available Equipment */}
              <div
                style={{
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-surface))',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      color: 'hsl(var(--ds-fg-2))',
                      flex: 1,
                    }}
                  >
                    {equipmentStep.title} — Disponíveis
                  </span>
                  <span className="pill muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {availableEquipment.length}
                  </span>
                </div>
                <div
                  style={{
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    overflowY: 'auto',
                    flex: 1,
                  }}
                >
                  {availableEquipment.map(equipment => {
                    const isSelected = selectedEquipment.some(eq => eq.id === equipment.id);
                    return (
                      <div
                        key={equipment.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 8,
                          border: isSelected
                            ? '1px solid hsl(var(--ds-success) / 0.5)'
                            : '1px solid hsl(var(--ds-line-1))',
                          background: isSelected
                            ? 'hsl(var(--ds-success) / 0.06)'
                            : 'hsl(var(--ds-surface))',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          {isSelected && (
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                background: 'hsl(var(--ds-success) / 0.1)',
                                border: '1px solid hsl(var(--ds-success) / 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Check size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 500,
                                fontSize: 13,
                                color: 'hsl(var(--ds-fg-1))',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {equipment.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'hsl(var(--ds-fg-3))',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {equipment.brand}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={isSelected ? 'btn primary' : 'btn'}
                          disabled={isSelected}
                          onClick={() => !isSelected && addEquipment(equipment, equipmentStep.category)}
                        >
                          {isSelected ? (
                            <>
                              <Check size={12} strokeWidth={1.5} />
                              <span>Selecionado</span>
                            </>
                          ) : (
                            <span>Adicionar</span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Equipment */}
              <div
                style={{
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-surface))',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Check size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
                  <span
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      color: 'hsl(var(--ds-fg-2))',
                      flex: 1,
                    }}
                  >
                    Selecionados
                  </span>
                  <StatusPill label={String(selectedEquipment.length)} tone="success" />
                </div>
                <div
                  style={{
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    overflowY: 'auto',
                    flex: 1,
                  }}
                >
                  {selectedEquipment.map(equipment => (
                    <div
                      key={equipment.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 8,
                        border: '1px solid hsl(var(--ds-success) / 0.5)',
                        background: 'hsl(var(--ds-success) / 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            background: 'hsl(var(--ds-success) / 0.1)',
                            border: '1px solid hsl(var(--ds-success) / 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Check size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 500,
                              fontSize: 13,
                              color: 'hsl(var(--ds-fg-1))',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {equipment.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'hsl(var(--ds-fg-3))',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {equipment.brand}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => removeEquipment(equipment.id, equipmentStep.category)}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] mx-auto overflow-y-auto ds-shell">
        <DialogHeader>
          <DialogTitle>
            <span
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Novo Projeto — Passo {currentStep} de {TOTAL_STEPS}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div style={{ paddingTop: 16, paddingBottom: 16 }}>
          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              background: 'hsl(var(--ds-line-2) / 0.5)',
              height: 4,
              marginBottom: 24,
              border: '1px solid hsl(var(--ds-line-1))',
            }}
          >
            <div
              style={{
                background: 'hsl(var(--ds-accent))',
                height: '100%',
                width: `${(currentStep / TOTAL_STEPS) * 100}%`,
                transition: 'width 0.2s',
              }}
            />
          </div>

          {renderStep()}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px solid hsl(var(--ds-line-1))',
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft size={13} strokeWidth={1.5} />
            <span>Anterior</span>
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>

            {currentStep === TOTAL_STEPS ? (
              <button type="button" className="btn primary" onClick={handleSubmit}>
                <Check size={13} strokeWidth={1.5} />
                <span>Finalizar</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn primary"
                onClick={nextStep}
                disabled={!isStepValid()}
              >
                <span>Próximo</span>
                <ChevronRight size={13} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
