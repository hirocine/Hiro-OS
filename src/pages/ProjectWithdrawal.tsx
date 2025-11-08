import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarData } from "@/lib/avatarUtils";
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Camera, Package, Download, Video, ArrowLeft, X, Building2, User, Clock, FileText, Loader2, Edit, AlertCircle, Calendar as CalendarIconLucide, Layers } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { useEquipment } from '@/hooks/useEquipment';
import { Equipment } from '@/types/equipment';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateProjectPDF } from '@/lib/pdfGenerator';
import { useGroupedCategories } from '@/hooks/useGroupedCategories';
import { PARENT_CATEGORIES } from '@/lib/categoryMapping';
import { SubcategoryAccordion } from '@/components/Projects/SubcategoryAccordion';

interface WithdrawalData {
  projectNumber: string;
  company: string;
  projectName: string;
  responsibleUserId: string;
  withdrawalUserId?: string;
  withdrawalDate: Date | undefined;
  returnDate: Date | undefined;
  separationDate: Date | undefined;
  withdrawalTime?: string;
  recordingType: string;
  selectedEquipment: Record<string, number>; // equipmentId -> quantity
}

const RECORDING_TYPES = [
  'Criativos/VSLs 🎬',
  'Entrevistas/Depoimentos 🎙️',
  'Documentários 🎥',
  'Aulas 📚',
  'Workshop/PGM 🧑‍🏫',
  'Institucionais 🏛️',
  'Eventos 🎤',
  'Fotografia 📸',
  'Live 🔴',
  'Publicidade 📺',
  'Appetite Appeal 🍫',
  'Making Of 🎞️'
];

export default function ProjectWithdrawal() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const isMobile = useIsMobile();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<WithdrawalData>({
    projectNumber: '',
    company: '',
    projectName: '',
    responsibleUserId: '',
    withdrawalDate: undefined,
    returnDate: undefined,
    separationDate: undefined,
    recordingType: '',
    selectedEquipment: {},
  });

  const { users, loading: usersLoading } = useUsers();
  const { equipmentHierarchy, loading: equipmentLoading, allEquipment } = useEquipment();

  // Group equipment by parent categories
  const groupedCategories = useGroupedCategories(allEquipment);

  // Create category steps from grouped categories
  const CATEGORY_STEPS = useMemo(() => {
    return groupedCategories.map((cat, index) => ({
      key: cat.key,
      title: cat.title,
      icon: cat.icon,
      order: index + 1,
      subcategories: cat.subcategories
    }));
  }, [groupedCategories]);

  // Calculate total steps: 5 initial fixed steps + category steps + 1 summary
  const TOTAL_STEPS = 5 + CATEGORY_STEPS.length + 1;

  const updateField = <K extends keyof WithdrawalData>(field: K, value: WithdrawalData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Handle equipment quantity change
  const handleEquipmentChange = (equipmentId: string, quantity: number) => {
    setData(prev => ({
      ...prev,
      selectedEquipment: {
        ...prev.selectedEquipment,
        [equipmentId]: quantity
      }
    }));
  };

  // Get total equipment count
  const getTotalEquipmentCount = () => {
    return Object.values(data.selectedEquipment).reduce((sum, qty) => sum + qty, 0);
  };

  // Flatten selected equipment for submission
  const flattenSelectedEquipment = (): Equipment[] => {
    const equipment: Equipment[] = [];
    
    Object.entries(data.selectedEquipment).forEach(([equipmentId, quantity]) => {
      if (quantity > 0) {
        const foundEquipment = allEquipment.find(eq => eq.id === equipmentId);
        if (foundEquipment) {
          // Add equipment 'quantity' times
          for (let i = 0; i < quantity; i++) {
            equipment.push(foundEquipment);
          }
        }
      }
    });
    
    return equipment;
  };

  const generatePDF = async () => {
    try {
      if (!data.projectNumber || !data.projectName) {
        enhancedToast.error({
          title: "Erro",
          description: "Dados do projeto incompletos para gerar PDF."
        });
        return;
      }

      const responsibleUser = users.find(user => user.id === data.responsibleUserId);
      
      // Convert selected equipment to the old format for PDF generation
      const selectedEquipmentForPDF = {
        cameras: [] as any[],
        lenses: [] as Equipment[],
        cameraAccessories: [] as Equipment[],
        tripods: [] as Equipment[],
        lights: [] as Equipment[],
        lightModifiers: [] as Equipment[],
        machinery: [] as Equipment[],
        electrical: [] as Equipment[],
        storage: [] as Equipment[],
        computers: [] as Equipment[],
      };

      flattenSelectedEquipment().forEach(eq => {
        if (eq.category === 'camera' && eq.subcategory === 'Câmera') {
          selectedEquipmentForPDF.cameras.push({ camera: eq, accessories: [] });
        } else if (eq.category === 'camera' && eq.subcategory === 'Lente') {
          selectedEquipmentForPDF.lenses.push(eq);
        } else if (eq.category === 'camera') {
          selectedEquipmentForPDF.cameraAccessories.push(eq);
        } else if (eq.category === 'lighting' && eq.subcategory === 'Luz') {
          selectedEquipmentForPDF.lights.push(eq);
        } else if (eq.category === 'lighting') {
          selectedEquipmentForPDF.lightModifiers.push(eq);
        } else if (eq.category === 'storage') {
          selectedEquipmentForPDF.storage.push(eq);
        } else {
          selectedEquipmentForPDF.electrical.push(eq);
        }
      });
      
      await generateProjectPDF({
        projectNumber: data.projectNumber,
        company: data.company,
        projectName: data.projectName,
        responsibleName: responsibleUser?.display_name || responsibleUser?.email || 'N/A',
        responsibleDepartment: responsibleUser?.department,
        withdrawalDate: data.withdrawalDate,
        returnDate: data.returnDate,
        separationDate: data.separationDate,
        recordingType: data.recordingType,
        selectedEquipment: selectedEquipmentForPDF
      });
      
      enhancedToast.success({
        title: "PDF Gerado",
        description: "Resumo do projeto baixado com sucesso!"
      });
      
    } catch (error) {
      logger.error('Error generating PDF', {
        module: 'project-withdrawal',
        action: 'pdf_generation_error',
        error
      });
      enhancedToast.error({
        title: "Erro",
        description: "Falha ao gerar o PDF. Tente novamente."
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const selectedUser = users.find(u => u.id === data.responsibleUserId);
      const selectedEquipment = flattenSelectedEquipment();
      
      const projectData = {
        name: `${data.projectNumber} - ${data.company}: ${data.projectName}`,
        project_number: data.projectNumber,
        company: data.company,
        project_name: data.projectName,
        responsible_user_id: data.responsibleUserId,
        responsible_name: selectedUser?.display_name || selectedUser?.email || '',
        responsible_email: selectedUser?.email || '',
        department: selectedUser?.department || '',
        start_date: data.withdrawalDate?.toISOString().split('T')[0] || '',
        expected_end_date: data.returnDate?.toISOString().split('T')[0] || '',
        withdrawal_date: data.withdrawalDate?.toISOString().split('T')[0] || '',
        separation_date: data.separationDate?.toISOString().split('T')[0] || '',
        recording_type: data.recordingType,
        status: 'active' as const,
        step: 'pending_separation' as const,
        step_history: [{
          step: 'pending_separation',
          timestamp: new Date().toISOString(),
          notes: 'Projeto criado via sistema de retirada'
        }],
        equipment_count: selectedEquipment.length,
        loan_ids: []
      };

      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (projectError) throw projectError;

      const loansToCreate = selectedEquipment.map(equipment => ({
        equipment_id: equipment.id,
        equipment_name: equipment.name,
        borrower_name: projectData.responsible_name,
        project: newProject.id,
        loan_date: data.withdrawalDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        expected_return_date: data.returnDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        status: 'active'
      }));

      const { error: loansError } = await supabase
        .from('loans')
        .insert(loansToCreate);

      if (loansError) throw loansError;

      enhancedToast.success({
        title: "Sucesso!",
        description: "Retirada criada com sucesso!"
      });
      navigate(`/projects/${newProject.id}`);
    } catch (error) {
      logger.error('Error creating withdrawal', {
        module: 'withdrawal-page',
        action: 'create_withdrawal_error',
        error
      });
      enhancedToast.error({
        title: "Erro",
        description: "Erro ao criar nova retirada. Tente novamente."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (isStepValid() && currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return data.projectNumber.trim() !== '' && 
               data.company.trim() !== '' && 
               data.projectName.trim() !== '' &&
               /^\d{1,4}$/.test(data.projectNumber.trim());
      case 2:
        return data.responsibleUserId !== '';
      case 3:
        return data.withdrawalDate !== undefined && 
               data.returnDate !== undefined && 
               data.separationDate !== undefined &&
               data.returnDate >= data.withdrawalDate;
      case 4:
        return data.recordingType !== '';
      default:
        return true; // Equipment selection steps and summary are optional
    }
  };

  const shouldShowSkipButton = (): boolean => {
    // Allow skipping only on equipment steps (6 onwards, except summary)
    if (currentStep < 5 || currentStep === TOTAL_STEPS) return false;
    return true;
  };

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  // Get step title
  const getStepTitle = (): string => {
    if (currentStep <= 4) {
      const titles = ['Informações do Projeto', 'Responsável', 'Datas', 'Tipo de Gravação'];
      return titles[currentStep - 1] || '';
    }
    
    const categoryStepIndex = currentStep - 5;
    if (categoryStepIndex >= 0 && categoryStepIndex < CATEGORY_STEPS.length) {
      return CATEGORY_STEPS[categoryStepIndex].title;
    }
    
    return 'Revisão e Confirmação';
  };

  // Get step description
  const getStepDescription = (): string | null => {
    if (currentStep <= 4) {
      const descriptions = [
        'Preencha as informações básicas do projeto de retirada',
        'Selecione o responsável pela retirada dos equipamentos',
        'Defina as datas de separação, retirada e devolução',
        'Informe o tipo de gravação que será realizada'
      ];
      return descriptions[currentStep - 1] || null;
    }
    
    if (currentStep === TOTAL_STEPS) {
      return 'Revise todos os dados antes de criar a retirada';
    }
    
    return 'Selecione os equipamentos desta categoria (opcional)';
  };

  // Get step icon
  const getStepIcon = () => {
    if (currentStep <= 4) {
      const icons = [
        <FileText className="h-5 w-5 text-primary" />,
        <User className="h-5 w-5 text-primary" />,
        <Clock className="h-5 w-5 text-primary" />,
        <Video className="h-5 w-5 text-primary" />
      ];
      return icons[currentStep - 1] || null;
    }
    
    const categoryStepIndex = currentStep - 5;
    if (categoryStepIndex >= 0 && categoryStepIndex < CATEGORY_STEPS.length) {
      const Icon = CATEGORY_STEPS[categoryStepIndex].icon;
      return <Icon className="h-5 w-5 text-primary" />;
    }
    
    return <Check className="h-5 w-5 text-primary" />;
  };

  // Render category with subcategories using accordion
  const renderCategoryWithSubcategories = (categoryStep: typeof CATEGORY_STEPS[0]) => {
    const groupedCategory = groupedCategories.find(gc => gc.key === categoryStep.key);
    
    if (!groupedCategory) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum equipamento disponível nesta categoria</p>
        </div>
      );
    }

    return (
      <SubcategoryAccordion
        subcategories={groupedCategory.subcategories as any}
        selectedEquipment={data.selectedEquipment}
        onEquipmentChange={handleEquipmentChange}
      />
    );
  };

  const renderStep = () => {
    // Step 1: Project Information
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="projectNumber" className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Número do Projeto
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="projectNumber"
              value={data.projectNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                updateField('projectNumber', value);
              }}
              placeholder="Ex: 398"
              maxLength={4}
              className={cn(
                "h-12 text-base font-mono transition-all",
                data.projectNumber && /^\d{1,4}$/.test(data.projectNumber) 
                  ? "border-success focus:ring-success" 
                  : ""
              )}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              Apenas números, máximo 4 dígitos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Empresa
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company"
              value={data.company}
              onChange={(e) => updateField('company', e.target.value)}
              placeholder="Ex: Hiro Films"
              className={cn(
                "h-12 text-base transition-all",
                data.company.trim() ? "border-success focus:ring-success" : ""
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectName" className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Nome do Projeto
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="projectName"
              value={data.projectName}
              onChange={(e) => updateField('projectName', e.target.value)}
              placeholder="Ex: Institucional"
              className={cn(
                "h-12 text-base transition-all",
                data.projectName.trim() ? "border-success focus:ring-success" : ""
              )}
            />
          </div>

          {data.projectNumber && data.company && data.projectName && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm font-semibold flex items-center gap-2 text-success-foreground">
                <Check className="h-4 w-4 text-success" />
                Nome final do projeto:
              </p>
              <p className="text-sm text-foreground font-medium pl-6">
                {data.projectNumber} - {data.company}: {data.projectName}
              </p>
            </div>
          )}
        </div>
      );
    }

    // Step 2: Responsible Person
    if (currentStep === 2) {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="responsible" className="text-base font-semibold mb-2 block">
              Responsável pela Retirada *
            </Label>
            <Select 
              value={data.responsibleUserId} 
              onValueChange={(value) => updateField('responsibleUserId', value)}
            >
              <SelectTrigger id="responsible" className="h-12">
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => {
                  const displayName = user.display_name || user.email;
                  const avatarUrl = user.avatar_url;
                  const initials = displayName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  
                  return (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            {user.display_name || user.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.department && user.position 
                              ? `${user.position} - ${user.department}`
                              : user.department || user.position || user.email
                            }
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {data.responsibleUserId && (() => {
            const selectedUser = users.find(u => u.id === data.responsibleUserId);
            return selectedUser ? (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p className="text-sm font-medium">Dados do responsável:</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Nome:</strong> {selectedUser.display_name || selectedUser.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                {selectedUser.department && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Departamento:</strong> {selectedUser.department}
                  </p>
                )}
              </div>
            ) : null;
          })()}
        </div>
      );
    }

    // Step 3: Dates
    if (currentStep === 3) {
      return (
        <div className="space-y-4">
          <div>
            <Label>Data de Separação *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.separationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.separationDate ? format(data.separationDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data.separationDate}
                  onSelect={(date) => updateField('separationDate', date)}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Data de Retirada *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.withdrawalDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.withdrawalDate ? format(data.withdrawalDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data.withdrawalDate}
                  onSelect={(date) => updateField('withdrawalDate', date)}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Data de Devolução *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.returnDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.returnDate ? format(data.returnDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data.returnDate}
                  onSelect={(date) => updateField('returnDate', date)}
                  locale={ptBR}
                  disabled={(date) => data.withdrawalDate ? date < data.withdrawalDate : false}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      );
    }

    // Step 4: Recording Type
    if (currentStep === 4) {
      return (
        <div className="space-y-4">
          <Label>Tipo de Gravação *</Label>
          <Select 
            value={data.recordingType} 
            onValueChange={(value) => updateField('recordingType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de gravação" />
            </SelectTrigger>
            <SelectContent>
              {RECORDING_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Steps 5 onwards: Category equipment selection
    const categoryStepIndex = currentStep - 5;
    if (categoryStepIndex >= 0 && categoryStepIndex < CATEGORY_STEPS.length) {
      return renderCategoryWithSubcategories(CATEGORY_STEPS[categoryStepIndex]);
    }

    // Final step: Summary
    return renderSummary();
  };

  const renderSummary = () => {
    const responsibleName = users.find(u => u.id === data.responsibleUserId)?.display_name || '';
    const totalEquipment = flattenSelectedEquipment().length;

    // Generate summary categories based on CATEGORY_STEPS
    const summaryCategories = CATEGORY_STEPS.map((cat, index) => {
      const groupedCategory = groupedCategories.find(gc => gc.key === cat.key);
      const categoryEquipment = groupedCategory?.subcategories.flatMap(sub => 
        sub.equipment.filter(eq => (data.selectedEquipment[eq.id] || 0) > 0)
      ) || [];

      return {
        key: cat.key,
        name: cat.title,
        icon: cat.icon,
        stepNumber: 5 + index,
        equipment: categoryEquipment
      };
    }).filter(cat => cat.equipment.length > 0);

    const durationDays = data.withdrawalDate && data.returnDate
      ? Math.abs(differenceInDays(new Date(data.returnDate), new Date(data.withdrawalDate)))
      : 0;

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <p className="text-xl md:text-2xl font-bold">{totalEquipment}</p>
                <p className="text-xs text-muted-foreground">Equipamentos</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Layers className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <p className="text-xl md:text-2xl font-bold">{summaryCategories.length}</p>
                <p className="text-xs text-muted-foreground">Categorias</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <CalendarIconLucide className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <p className="text-xl md:text-2xl font-bold">{durationDays}</p>
                <p className="text-xs text-muted-foreground">Dias</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <p className="text-xl md:text-2xl font-bold">#{data.projectNumber}</p>
                <p className="text-xs text-muted-foreground">Projeto</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Information */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg md:text-xl">
                    {data.projectNumber} - {data.company}
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    {data.projectName}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => goToStep(1)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Responsável</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {responsibleName}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tipo de Gravação</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  {data.recordingType}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data de Retirada</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <CalendarIconLucide className="h-4 w-4" />
                  {data.withdrawalDate ? format(data.withdrawalDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment by Category */}
        {summaryCategories.length > 0 && (
          <Accordion type="multiple" className="space-y-2">
            {summaryCategories.map((category) => {
              const Icon = category.icon;
              return (
                <AccordionItem key={category.key} value={category.key}>
                  <Card>
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{category.equipment.length}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToStep(category.stepNumber);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 mt-2">
                        {category.equipment.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium truncate">{item.name}</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {item.brand} {item.subcategory && `• ${item.subcategory}`}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Qtd: {data.selectedEquipment[item.id]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Final Actions */}
        {totalEquipment > 0 && (
          <div className="flex flex-col gap-3 pt-6 border-t">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Pronto para finalizar?</AlertTitle>
              <AlertDescription>
                Revise todas as informações antes de criar a retirada.
                Você poderá fazer alterações posteriormente se necessário.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (equipmentLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando equipamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span 
              className="hover:text-foreground cursor-pointer transition-colors flex items-center gap-1.5"
              onClick={() => navigate('/projects')}
            >
              <Package className="h-3.5 w-3.5" />
              Projetos
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">Nova Retirada</span>
          </div>
          
          <div className="flex items-start gap-3 mb-5">
            <Button 
              variant="ghost" 
              size="icon"
              className="mt-1"
              onClick={() => navigate('/projects')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                Nova Retirada de Equipamentos
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {getStepTitle()}
              </p>
            </div>
          </div>
          
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs md:text-sm font-medium">
              <span className="text-muted-foreground flex items-center gap-2">
                <span className="hidden sm:inline">Progresso:</span>
                <span className="font-semibold text-foreground">Etapa {currentStep}/{TOTAL_STEPS}</span>
              </span>
              <span className="text-primary font-bold">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2.5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
          <div 
            key={currentStep}
            className="animate-in fade-in slide-in-from-right-2 duration-200"
          >
            <Card className="border-border shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl md:text-2xl flex items-center gap-2.5">
                  {getStepIcon()}
                  {getStepTitle()}
                </CardTitle>
                {getStepDescription() && (
                  <CardDescription className="text-sm md:text-base mt-2">
                    {getStepDescription()}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {renderStep()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 sticky bottom-0 shadow-elegant pb-safe">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="w-full sm:w-auto h-11 sm:h-10"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => navigate('/projects')}
                className="w-full sm:w-auto h-11 sm:h-10"
              >
                Cancelar
              </Button>

              {currentStep === TOTAL_STEPS ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={generatePDF}
                    className="w-full sm:w-auto h-11 sm:h-10 border-primary/50 hover:bg-primary/5"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto h-12 sm:h-10 bg-primary hover:bg-primary/90 shadow-lg font-semibold"
                    size="lg"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    {isSubmitting ? 'Criando...' : 'Criar Retirada'}
                  </Button>
                </>
              ) : (
                <>
                  {shouldShowSkipButton() && (
                    <Button
                      variant="ghost"
                      onClick={nextStep}
                      className="w-full sm:w-auto h-11 sm:h-10 text-muted-foreground"
                    >
                      Pular categoria
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}

                  <Button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                    className="w-full sm:w-auto h-12 sm:h-10 bg-primary hover:bg-primary/90 font-semibold"
                    size="lg"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
