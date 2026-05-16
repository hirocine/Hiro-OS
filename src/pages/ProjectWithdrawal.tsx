import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarData } from "@/lib/avatarUtils";
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Camera, Package, Download, Video, ArrowLeft, X, Building2, User, Clock, FileText, Loader2, Edit, AlertCircle, Calendar as CalendarIconLucide, Layers, Cloud, CloudOff } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { differenceInDays } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { useEquipment } from '@/features/equipment';
import { Equipment } from '@/types/equipment';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateProjectPDF } from '@/lib/pdfGenerator';
import { useGroupedCategories } from '@/hooks/useGroupedCategories';
import { useCategories } from '@/hooks/useCategories';
import { SubcategoryAccordion } from '@/components/Projects/SubcategoryAccordion';
import { useWithdrawalDraft, WithdrawalDraftData } from '@/hooks/useWithdrawalDraft';
import { DraftRecoveryDialog } from '@/components/Projects/DraftRecoveryDialog';
import { LeaveWithdrawalDialog } from '@/components/Projects/LeaveWithdrawalDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigationBlocker } from '@/contexts/NavigationBlockerContext';

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
  selectedEquipment: string[]; // Array of equipment IDs
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
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  // 'loading' = waiting for draft query, 'asking' = showing dialog, 'ready' = user decided or no draft
  const [draftState, setDraftState] = useState<'loading' | 'asking' | 'ready'>('loading');
  const [data, setData] = useState<WithdrawalData>({
    projectNumber: '',
    company: '',
    projectName: '',
    responsibleUserId: '',
    withdrawalDate: undefined,
    returnDate: undefined,
    separationDate: undefined,
    recordingType: '',
    selectedEquipment: [],
  });
  
  const [separationDateOpen, setSeparationDateOpen] = useState(false);
  const [withdrawalDateOpen, setWithdrawalDateOpen] = useState(false);
  const [returnDateOpen, setReturnDateOpen] = useState(false);

  // Draft system
  const { draft, isLoading: isDraftLoading, hasDraft, saveDraft, deleteDraft, isSaving, lastSavedAt, saveDraftImmediate } = useWithdrawalDraft();
  
  // Refs for cleanup function (to access latest data)
  const dataRef = useRef(data);
  const currentStepRef = useRef(currentStep);
  const showDraftDialogRef = useRef(showDraftDialog);
  const draftStateRef = useRef(draftState);
  
  
  // Keep refs in sync
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);
  
  useEffect(() => {
    showDraftDialogRef.current = showDraftDialog;
  }, [showDraftDialog]);
  
  useEffect(() => {
    draftStateRef.current = draftState;
  }, [draftState]);
  
  // Navigation blocker context
  const { setBlocker, clearBlocker, pendingPath } = useNavigationBlocker();
  
  // Leave dialog state
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isSavingBeforeLeave, setIsSavingBeforeLeave] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);
  
  // Check if there's meaningful data to save
  const hasData = useMemo(() => {
    return data.projectNumber.trim() !== '' || 
           data.company.trim() !== '' || 
           data.projectName.trim() !== '' || 
           data.selectedEquipment.length > 0;
  }, [data.projectNumber, data.company, data.projectName, data.selectedEquipment]);
  
  // Set up navigation blocker when there's unsaved data
  useEffect(() => {
    const shouldBlock = hasData && !isSubmitting && draftState === 'ready';
    
    if (shouldBlock) {
      setBlocker(true, () => {
        // This callback is called when navigation is attempted
        setShowLeaveDialog(true);
      });
    } else {
      clearBlocker();
    }
    
    return () => {
      clearBlocker();
    };
  }, [hasData, isSubmitting, draftState, setBlocker, clearBlocker]);
  
  // Update pending navigation ref when context path changes
  useEffect(() => {
    if (pendingPath) {
      pendingNavigationRef.current = pendingPath;
    }
  }, [pendingPath]);
  
  // Function to safely navigate with confirmation
  const safeNavigate = useCallback((path: string) => {
    if (hasData && !isSubmitting && draftState === 'ready') {
      pendingNavigationRef.current = path;
      setShowLeaveDialog(true);
    } else {
      navigate(path);
    }
  }, [hasData, isSubmitting, draftState, navigate]);
  
  // Handle save and leave
  const handleSaveAndLeave = async () => {
    setIsSavingBeforeLeave(true);
    try {
      const draftData: WithdrawalDraftData = {
        projectNumber: data.projectNumber,
        company: data.company,
        projectName: data.projectName,
        responsibleUserId: data.responsibleUserId,
        withdrawalDate: data.withdrawalDate?.toISOString() || null,
        returnDate: data.returnDate?.toISOString() || null,
        separationDate: data.separationDate?.toISOString() || null,
        recordingType: data.recordingType,
        selectedEquipment: data.selectedEquipment
      };
      await saveDraft(currentStep, draftData);
      setShowLeaveDialog(false);
      clearBlocker(); // Clear blocker before navigating
      const path = pendingNavigationRef.current;
      pendingNavigationRef.current = null;
      if (path) navigate(path);
    } catch (error) {
      logger.error('Error saving draft before leave', { error });
      enhancedToast.error({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o rascunho."
      });
    } finally {
      setIsSavingBeforeLeave(false);
    }
  };
  
  // Handle leave without saving
  const handleLeaveWithoutSaving = () => {
    setShowLeaveDialog(false);
    clearBlocker(); // Clear blocker before navigating
    const path = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    if (path) navigate(path);
  };
  
  // Handle cancel leave
  const handleCancelLeave = () => {
    setShowLeaveDialog(false);
    pendingNavigationRef.current = null;
  };
  
  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasData && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasData, isSubmitting]);
  
  const { users, loading: usersLoading } = useUsers();
  const { equipmentHierarchy, loading: equipmentLoading, allEquipment } = useEquipment();
  const { categories: categoriesFromDB } = useCategories();

  // Enriquecer equipamentos com informações de acessórios
  const equipmentWithAccessories = useMemo(() => {
    return allEquipment
      .filter(item => item.itemType === 'main' && item.status === 'available')
      .map(item => {
        const accessories = allEquipment.filter(
          acc => acc.itemType === 'accessory' && 
                 acc.parentId === item.id && 
                 acc.status === 'available'
        );
        
        return {
          ...item,
          hasAccessories: accessories.length > 0,
          accessoryCount: accessories.length,
          accessories: accessories
        };
      });
  }, [allEquipment]);

  // Group equipment by parent categories (usando ordens do banco de dados)
  const groupedCategories = useGroupedCategories(equipmentWithAccessories, categoriesFromDB);

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
  const TOTAL_STEPS = 2 + CATEGORY_STEPS.length + 1;

  // Convert form data to draft format
  const convertToDraftData = useCallback((): WithdrawalDraftData => ({
    projectNumber: data.projectNumber,
    company: data.company,
    projectName: data.projectName,
    responsibleUserId: data.responsibleUserId,
    withdrawalDate: data.withdrawalDate?.toISOString() || null,
    returnDate: data.returnDate?.toISOString() || null,
    separationDate: data.separationDate?.toISOString() || null,
    recordingType: data.recordingType,
    selectedEquipment: data.selectedEquipment
  }), [data]);

  // Debounced data for auto-save
  const debouncedData = useDebounce(data, 2000);

  // Check for existing draft on mount - always show dialog when draft exists
  useEffect(() => {
    // Only run once when draft loading completes
    if (isDraftLoading || draftState !== 'loading') return;
    
    if (hasDraft && draft) {
      // Always show dialog when there's a draft
      setShowDraftDialog(true);
      setDraftState('asking');
    } else {
      // No draft, ready to start fresh
      setDraftState('ready');
    }
  }, [isDraftLoading, hasDraft, draft, draftState]);
  
  // Save draft immediately when leaving the page
  useEffect(() => {
    return () => {
      // Only save if user already made a decision (ready state) and has meaningful data
      if (draftStateRef.current !== 'ready') return;
      
      const currentData = dataRef.current;
      const hasData = currentData.projectNumber || currentData.company || 
                      currentData.projectName || currentData.selectedEquipment.length > 0;
      
      if (hasData) {
        const draftData: WithdrawalDraftData = {
          projectNumber: currentData.projectNumber,
          company: currentData.company,
          projectName: currentData.projectName,
          responsibleUserId: currentData.responsibleUserId,
          withdrawalDate: currentData.withdrawalDate?.toISOString() || null,
          returnDate: currentData.returnDate?.toISOString() || null,
          separationDate: currentData.separationDate?.toISOString() || null,
          recordingType: currentData.recordingType,
          selectedEquipment: currentData.selectedEquipment
        };
        saveDraftImmediate(currentStepRef.current, draftData);
      }
    };
  }, [saveDraftImmediate]);

  // Auto-save draft when data changes (debounced)
  useEffect(() => {
    // Only save when user is in 'ready' state (already decided about draft)
    if (draftState !== 'ready') return;
    
    // Only save if there's meaningful data
    const hasData = debouncedData.projectNumber || debouncedData.company || 
                    debouncedData.projectName || debouncedData.selectedEquipment.length > 0;
    
    if (hasData) {
      const draftData: WithdrawalDraftData = {
        projectNumber: debouncedData.projectNumber,
        company: debouncedData.company,
        projectName: debouncedData.projectName,
        responsibleUserId: debouncedData.responsibleUserId,
        withdrawalDate: debouncedData.withdrawalDate?.toISOString() || null,
        returnDate: debouncedData.returnDate?.toISOString() || null,
        separationDate: debouncedData.separationDate?.toISOString() || null,
        recordingType: debouncedData.recordingType,
        selectedEquipment: debouncedData.selectedEquipment
      };
      saveDraft(currentStep, draftData);
    }
  }, [debouncedData, currentStep, draftState, saveDraft]);

  // Handle draft recovery
  const handleContinueDraft = () => {
    if (draft?.data) {
      const draftData = draft.data;
      setData({
        projectNumber: draftData.projectNumber || '',
        company: draftData.company || '',
        projectName: draftData.projectName || '',
        responsibleUserId: draftData.responsibleUserId || '',
        withdrawalDate: draftData.withdrawalDate ? new Date(draftData.withdrawalDate) : undefined,
        returnDate: draftData.returnDate ? new Date(draftData.returnDate) : undefined,
        separationDate: draftData.separationDate ? new Date(draftData.separationDate) : undefined,
        recordingType: draftData.recordingType || '',
        selectedEquipment: draftData.selectedEquipment || []
      });
      setCurrentStep(draft.currentStep);
    }
    setShowDraftDialog(false);
    setDraftState('ready');
  };

  const handleDiscardDraft = async () => {
    await deleteDraft();
    setShowDraftDialog(false);
    setDraftState('ready');
  };

  const updateField = <K extends keyof WithdrawalData>(field: K, value: WithdrawalData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Handle equipment toggle (add/remove from selection)
  const handleEquipmentToggle = (equipmentId: string) => {
    setData(prev => {
      const isSelected = prev.selectedEquipment.includes(equipmentId);
      
      return {
        ...prev,
        selectedEquipment: isSelected
          ? prev.selectedEquipment.filter(id => id !== equipmentId)
          : [...prev.selectedEquipment, equipmentId]
      };
    });
  };

  // Get selected equipment for submission
  const flattenSelectedEquipment = (): Equipment[] => {
    return allEquipment.filter(eq => data.selectedEquipment.includes(eq.id));
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
      
      // Convert selected equipment maintaining hierarchy
      const selectedEquipmentForPDF = {
        cameras: [] as Array<{ camera: Equipment; accessories: Equipment[] }>,
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

      // Get selected main equipment from equipmentWithAccessories
      const selectedMainEquipment = equipmentWithAccessories.filter(eq => 
        data.selectedEquipment.includes(eq.id)
      );

      selectedMainEquipment.forEach(mainEq => {
        // Filter accessories that were also selected
        const selectedAccessories = mainEq.accessories?.filter(acc => 
          data.selectedEquipment.includes(acc.id)
        ) || [];

        if (mainEq.category === 'Câmera' && (mainEq.subcategory === 'Câmera (Corpo e Acessórios)' || mainEq.subcategory === 'Câmera')) {
          selectedEquipmentForPDF.cameras.push({
            camera: mainEq,
            accessories: selectedAccessories
          });
        } else if (mainEq.category === 'Câmera' && mainEq.subcategory === 'Lente') {
          selectedEquipmentForPDF.lenses.push(mainEq);
        } else if (mainEq.category === 'Câmera' || mainEq.category === 'Acessórios de Câmera') {
          selectedEquipmentForPDF.cameraAccessories.push(mainEq);
        } else if (mainEq.category === 'Iluminação' && mainEq.subcategory === 'Luz') {
          selectedEquipmentForPDF.lights.push(mainEq);
        } else if (mainEq.category === 'Iluminação') {
          selectedEquipmentForPDF.lightModifiers.push(mainEq);
        } else if (mainEq.category === 'Armazenamento') {
          selectedEquipmentForPDF.storage.push(mainEq);
        } else {
          selectedEquipmentForPDF.electrical.push(mainEq);
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

      // Refresh da sessão antes de navegar
      const { data: session } = await supabase.auth.refreshSession();
      
      if (!session) {
        logger.warn('Session refresh failed after project creation', {
          module: 'project-withdrawal',
          action: 'session_refresh'
        });
      }

      // Delete draft after successful creation
      await deleteDraft();

      enhancedToast.success({
        title: "Sucesso!",
        description: "Retirada criada com sucesso!"
      });
      
      // Aguardar propagação da sessão
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate(`/retiradas/${newProject.id}`);
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
        return data.responsibleUserId !== '' &&
               data.withdrawalDate !== undefined && 
               data.returnDate !== undefined && 
               data.separationDate !== undefined &&
               data.returnDate >= data.withdrawalDate &&
               data.recordingType !== '';
      default:
        return true; // Equipment selection steps and summary are optional
    }
  };

  const shouldShowSkipButton = (): boolean => {
    // Allow skipping only on equipment steps (3 onwards, except summary)
    if (currentStep < 3 || currentStep === TOTAL_STEPS) return false;
    return true;
  };

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  // Get step title
  const getStepTitle = (): string => {
    if (currentStep <= 2) {
      const titles = ['Informações do Projeto', 'Detalhes da Retirada'];
      return titles[currentStep - 1] || '';
    }
    
    const categoryStepIndex = currentStep - 3;
    if (categoryStepIndex >= 0 && categoryStepIndex < CATEGORY_STEPS.length) {
      return CATEGORY_STEPS[categoryStepIndex].title;
    }
    
    return 'Revisão e Confirmação';
  };

  // Get step description
  const getStepDescription = (): string | null => {
    if (currentStep <= 2) {
      const descriptions = [
        'Preencha as informações básicas do projeto de retirada',
        null
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
    if (currentStep <= 2) {
      const icons = [
        <FileText className="h-5 w-5 text-[hsl(var(--ds-text))]" />,
        <User className="h-5 w-5 text-[hsl(var(--ds-text))]" />
      ];
      return icons[currentStep - 1] || null;
    }
    
    const categoryStepIndex = currentStep - 3;
    if (categoryStepIndex >= 0 && categoryStepIndex < CATEGORY_STEPS.length) {
      const Icon = CATEGORY_STEPS[categoryStepIndex].icon;
      return <Icon className="h-5 w-5 text-[hsl(var(--ds-text))]" />;
    }
    
    return <Check className="h-5 w-5 text-[hsl(var(--ds-text))]" />;
  };

  // Render category with subcategories using accordion
  const renderCategoryWithSubcategories = (categoryStep: typeof CATEGORY_STEPS[0]) => {
    const groupedCategory = groupedCategories.find(gc => gc.key === categoryStep.key);
    
    if (!groupedCategory) {
      return (
        <div className="text-center py-8" style={{ color: 'hsl(var(--ds-fg-3))' }}>
          <p>Nenhum equipamento disponível nesta categoria</p>
        </div>
      );
    }

    return (
      <SubcategoryAccordion
        subcategories={groupedCategory.subcategories as any}
        selectedEquipment={data.selectedEquipment}
        onEquipmentChange={handleEquipmentToggle}
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
              <Package size={14} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" />
              Número do Projeto
              <span className="text-[hsl(0_84%_60%)]">*</span>
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
            <p className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
              <FileText className="h-3 w-3" />
              Apenas números, máximo 4 dígitos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-base font-semibold flex items-center gap-2">
              <Building2 size={14} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" />
              Empresa
              <span className="text-[hsl(0_84%_60%)]">*</span>
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
              <FileText size={14} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" />
              Nome do Projeto
              <span className="text-[hsl(0_84%_60%)]">*</span>
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
              <p className="text-sm text-[hsl(var(--ds-text))] font-medium pl-6">
                {data.projectNumber} - {data.company}: {data.projectName}
              </p>
            </div>
          )}
        </div>
      );
    }

    // Step 2: Detalhes da Retirada (Responsável + Datas + Tipo de Gravação)
    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          {/* SEÇÃO: Responsável */}
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
                          <span className="font-medium">
                            {user.display_name || user.email}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* SEÇÃO: Datas */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Data de Separação *</Label>
                <Popover open={separationDateOpen} onOpenChange={setSeparationDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        color: data.separationDate
                          ? 'hsl(var(--ds-text))'
                          : 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      <CalendarIcon size={14} strokeWidth={1.5} />
                      <span>{data.separationDate ? format(data.separationDate, "dd/MM/yyyy") : "Selecionar"}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={data.separationDate}
                      onSelect={(date) => {
                        updateField('separationDate', date);
                        setSeparationDateOpen(false);
                      }}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Data de Retirada *</Label>
                <Popover open={withdrawalDateOpen} onOpenChange={setWithdrawalDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        color: data.withdrawalDate
                          ? 'hsl(var(--ds-text))'
                          : 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      <CalendarIcon size={14} strokeWidth={1.5} />
                      <span>{data.withdrawalDate ? format(data.withdrawalDate, "dd/MM/yyyy") : "Selecionar"}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={data.withdrawalDate}
                      onSelect={(date) => {
                        updateField('withdrawalDate', date);
                        setWithdrawalDateOpen(false);
                      }}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Data de Devolução *</Label>
                <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        color: data.returnDate
                          ? 'hsl(var(--ds-text))'
                          : 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      <CalendarIcon size={14} strokeWidth={1.5} />
                      <span>{data.returnDate ? format(data.returnDate, "dd/MM/yyyy") : "Selecionar"}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={data.returnDate}
                      onSelect={(date) => {
                        updateField('returnDate', date);
                        setReturnDateOpen(false);
                      }}
                      locale={ptBR}
                      disabled={(date) => data.withdrawalDate ? date < data.withdrawalDate : false}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Tipo de Gravação */}
          <div className="space-y-4">
            <div>
              <Label>Tipo de Gravação *</Label>
              <Select 
                value={data.recordingType} 
                onValueChange={(value) => updateField('recordingType', value)}
              >
                <SelectTrigger className="h-12">
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
          </div>
        </div>
      );
    }

    // Steps 3 onwards: Category equipment selection
    const categoryStepIndex = currentStep - 3;
    if (categoryStepIndex >= 0 && categoryStepIndex < CATEGORY_STEPS.length) {
      return renderCategoryWithSubcategories(CATEGORY_STEPS[categoryStepIndex]);
    }

    // Final step: Summary
    return renderSummary();
  };

  const renderSummary = () => {
    const responsibleName = users.find(u => u.id === data.responsibleUserId)?.display_name || '';
    const totalEquipment = data.selectedEquipment.length;

    // Generate summary categories based on CATEGORY_STEPS
    const summaryCategories = CATEGORY_STEPS.map((cat, index) => {
      const groupedCategory = groupedCategories.find(gc => gc.key === cat.key);
      const categoryEquipment = groupedCategory?.subcategories.flatMap(sub => 
        sub.equipment.filter(eq => data.selectedEquipment.includes(eq.id))
      ) || [];

      return {
        key: cat.key,
        name: cat.title,
        icon: cat.icon,
        stepNumber: 3 + index,
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
          {[
            { icon: Package, value: totalEquipment, label: 'Equipamentos' },
            { icon: Layers, value: summaryCategories.length, label: 'Categorias' },
            { icon: CalendarIconLucide, value: durationDays, label: 'Dias' },
            { icon: FileText, value: `#${data.projectNumber}`, label: 'Projeto' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                style={{
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-surface))',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <Icon size={16} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" />
                <div
                  style={{
                    fontFamily: '"HN Display", sans-serif',
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    color: 'hsl(var(--ds-text))',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Project Information */}
        <div
          style={{
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
          }}
        >
          <div
            style={{
              padding: '16px 18px',
              borderBottom: '1px solid hsl(var(--ds-line-1))',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={18} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" />
                <div>
                  <div
                    style={{
                      fontFamily: '"HN Display", sans-serif',
                      fontSize: 16,
                      fontWeight: 500,
                      letterSpacing: '-0.01em',
                      color: 'hsl(var(--ds-text))',
                    }}
                  >
                    {data.projectNumber} - {data.company}
                  </div>
                  <div style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                    {data.projectName}
                  </div>
                </div>
              </div>
              <button type="button" className="btn" onClick={() => goToStep(1)}>
                <Edit size={13} strokeWidth={1.5} />
                <span>Editar</span>
              </button>
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>Responsável</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {responsibleName}
                </p>
              </div>
              <div className="space-y-1">
                <Label style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>Tipo de Gravação</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  {data.recordingType}
                </p>
              </div>
              <div className="space-y-1">
                <Label style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>Data de Retirada</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <CalendarIconLucide className="h-4 w-4" />
                  {data.withdrawalDate ? format(data.withdrawalDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Equipment by Category */}
        {summaryCategories.length > 0 && (
          <Accordion type="multiple" className="space-y-2">
            {summaryCategories.map((category) => {
              const Icon = category.icon;
              return (
                <AccordionItem key={category.key} value={category.key}>
                  <div
                    style={{
                      border: '1px solid hsl(var(--ds-line-1))',
                      background: 'hsl(var(--ds-surface))',
                    }}
                  >
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Icon size={16} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" />
                          <span
                            style={{
                              fontFamily: '"HN Display", sans-serif',
                              fontSize: 14,
                              fontWeight: 500,
                              color: 'hsl(var(--ds-text))',
                            }}
                          >
                            {category.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              border: '1px solid hsl(var(--ds-line-1))',
                              color: 'hsl(var(--ds-fg-3))',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {category.equipment.length}
                          </span>
                          <button
                            type="button"
                            className="btn icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToStep(category.stepNumber);
                            }}
                            aria-label="Editar categoria"
                          >
                            <Edit size={13} strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 mt-2">
                        {category.equipment.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 text-sm"
                            style={{
                              background: 'hsl(var(--ds-bg))',
                              border: '1px solid hsl(var(--ds-line-1))',
                            }}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {item.image && (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-8 h-8 object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex flex-col min-w-0">
                                <span
                                  className="truncate"
                                  style={{ color: 'hsl(var(--ds-text))', fontWeight: 500 }}
                                >
                                  {item.name}
                                </span>
                                <span
                                  className="truncate"
                                  style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}
                                >
                                  {item.brand} {item.subcategory && `• ${item.subcategory}`}
                                </span>
                              </div>
                            </div>
                            {item.patrimonyNumber && (
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '2px 6px',
                                  border: '1px solid hsl(var(--ds-line-1))',
                                  color: 'hsl(var(--ds-fg-3))',
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                Pat. {item.patrimonyNumber}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </div>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Final Actions */}
        {totalEquipment > 0 && (
          <div
            style={{
              paddingTop: 24,
              borderTop: '1px solid hsl(var(--ds-line-1))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
              }}
            >
              <AlertCircle size={16} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div
                  style={{
                    fontFamily: '"HN Display", sans-serif',
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'hsl(var(--ds-text))',
                    marginBottom: 4,
                  }}
                >
                  Pronto para finalizar?
                </div>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', lineHeight: 1.55 }}>
                  Revise todas as informações antes de criar a retirada.
                  Você poderá fazer alterações posteriormente se necessário.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (equipmentLoading || isDraftLoading) {
    return (
      <div className="ds-shell min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--ds-surface))]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--ds-text))]" />
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
            {isDraftLoading ? 'Verificando rascunhos...' : 'Carregando equipamentos...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ds-shell">
      {/* Draft Recovery Dialog */}
      {draft && (
        <DraftRecoveryDialog
          open={showDraftDialog}
          onOpenChange={setShowDraftDialog}
          draftData={draft.data}
          draftUpdatedAt={draft.updatedAt}
          currentStep={draft.currentStep}
          onContinue={handleContinueDraft}
          onDiscard={handleDiscardDraft}
        />
      )}
      
      {/* Leave Confirmation Dialog */}
      <LeaveWithdrawalDialog
        open={showLeaveDialog}
        onSaveAndLeave={handleSaveAndLeave}
        onLeaveWithoutSaving={handleLeaveWithoutSaving}
        onCancel={handleCancelLeave}
        isSaving={isSavingBeforeLeave}
      />
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(var(--ds-bg))' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface) / 0.95)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="container mx-auto px-4 py-4 md:py-5">
          {/* Breadcrumb */}
          <div
            className="flex items-center gap-2 mb-4"
            style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}
          >
            <span
              className="cursor-pointer flex items-center gap-1.5"
              style={{ transition: 'color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-text))')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-3))')}
              onClick={() => safeNavigate('/retiradas')}
            >
              <Package size={13} strokeWidth={1.5} />
              <span>Retiradas</span>
            </span>
            <ChevronRight size={13} strokeWidth={1.5} />
            <span style={{ color: 'hsl(var(--ds-text))', fontWeight: 500 }}>Nova Retirada</span>
          </div>

          {/* Title row */}
          <div className="flex items-start gap-3 mb-5">
            <button
              type="button"
              className="btn icon"
              onClick={() => safeNavigate('/retiradas')}
              aria-label="Voltar"
              style={{ marginTop: 2 }}
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
            </button>
            <div className="flex-1 min-w-0">
              <h1
                style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 26,
                  fontWeight: 500,
                  letterSpacing: '-0.015em',
                  lineHeight: 1.15,
                  color: 'hsl(var(--ds-text))',
                  marginBottom: 2,
                }}
              >
                Nova Retirada de Equipamentos
              </h1>
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                {getStepTitle()}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div
              className="flex justify-between items-center"
              style={{ fontSize: 12 }}
            >
              <span
                className="flex items-center gap-2"
                style={{ color: 'hsl(var(--ds-fg-3))' }}
              >
                <span className="hidden sm:inline">Progresso:</span>
                <span style={{ color: 'hsl(var(--ds-text))', fontWeight: 500 }}>
                  Etapa {currentStep}/{TOTAL_STEPS}
                </span>
                {/* Draft save indicator */}
                {lastSavedAt && (
                  <span
                    className="flex items-center gap-1 ml-2"
                    style={{ color: 'hsl(var(--ds-success, 142 76% 36%))' }}
                  >
                    {isSaving ? (
                      <>
                        <Cloud size={13} strokeWidth={1.5} className="animate-pulse" />
                        <span className="hidden sm:inline">Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Cloud size={13} strokeWidth={1.5} />
                        <span className="hidden sm:inline">
                          Salvo às {format(lastSavedAt, 'HH:mm')}
                        </span>
                      </>
                    )}
                  </span>
                )}
              </span>
              <span
                style={{
                  color: 'hsl(var(--ds-text))',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: 'hsl(var(--ds-line-1))',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressPercentage}%`,
                  background: 'hsl(var(--ds-text))',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-3xl">
          <div
            key={currentStep}
            className="animate-in fade-in slide-in-from-right-2 duration-200"
            style={{
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
            }}
          >
            <div
              style={{
                padding: '20px 24px 16px',
                borderBottom: '1px solid hsl(var(--ds-line-1))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: 'hsl(var(--ds-text))',
                }}
              >
                {getStepIcon()}
                <span>{getStepTitle()}</span>
              </div>
              {getStepDescription() && (
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    color: 'hsl(var(--ds-fg-3))',
                    lineHeight: 1.5,
                  }}
                >
                  {getStepDescription()}
                </p>
              )}
            </div>
            <div style={{ padding: '20px 24px 24px' }} className="space-y-6">
              {renderStep()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="sticky bottom-0 pb-safe"
        style={{
          borderTop: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface) / 0.95)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <button
              type="button"
              className="btn w-full sm:w-auto"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft size={14} strokeWidth={1.5} />
              <span>Anterior</span>
            </button>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                className="btn w-full sm:w-auto"
                onClick={() => safeNavigate('/retiradas')}
              >
                Cancelar
              </button>

              {currentStep === TOTAL_STEPS ? (
                <>
                  <button
                    type="button"
                    className="btn w-full sm:w-auto"
                    onClick={generatePDF}
                  >
                    <Download size={14} strokeWidth={1.5} />
                    <span>Baixar PDF</span>
                  </button>
                  <button
                    type="button"
                    className="btn primary w-full sm:w-auto"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <Check size={14} strokeWidth={1.5} />
                    <span>{isSubmitting ? 'Criando...' : 'Criar Retirada'}</span>
                  </button>
                </>
              ) : (
                <>
                  {shouldShowSkipButton() && (
                    <button
                      type="button"
                      className="btn w-full sm:w-auto"
                      onClick={nextStep}
                    >
                      <span>Pular categoria</span>
                      <ChevronRight size={14} strokeWidth={1.5} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn primary w-full sm:w-auto"
                    onClick={nextStep}
                    disabled={!isStepValid()}
                  >
                    <span>Próximo</span>
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
