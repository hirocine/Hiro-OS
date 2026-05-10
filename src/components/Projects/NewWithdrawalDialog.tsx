import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarData } from "@/lib/avatarUtils";
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Camera, Package, Lightbulb, Settings, Cog, Zap, HardDrive, Monitor, Wrench, Download, Video, Plug, Box } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { useEquipment } from '@/features/equipment';
import { Equipment } from '@/types/equipment';
import { logger } from '@/lib/logger';
import { EquipmentSelectionStep } from './EquipmentSelectionStep';
import { type LucideIcon } from 'lucide-react';

interface NewWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any, selectedEquipment: Equipment[]) => void;
}

interface SelectedCamera {
  camera: Equipment;
  accessories: Equipment[];
}

interface WithdrawalData {
  projectNumber: string;
  company: string;
  projectName: string;
  responsibleUserId: string;
  withdrawalDate: Date | undefined;
  returnDate: Date | undefined;
  separationDate: Date | undefined;
  recordingType: string;
  selectedEquipment: {
    cameras: SelectedCamera[];
    lenses: Equipment[];
    cameraAccessories: Equipment[];
    tripods: Equipment[];
    lights: Equipment[];
    lightModifiers: Equipment[];
    machinery: Equipment[];
    electrical: Equipment[];
    storage: Equipment[];
    computers: Equipment[];
  };
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

const eyebrowLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

export function NewWithdrawalDialog({ open, onOpenChange, onSubmit }: NewWithdrawalDialogProps) {
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
    selectedEquipment: {
      cameras: [],
      lenses: [],
      cameraAccessories: [],
      tripods: [],
      lights: [],
      lightModifiers: [],
      machinery: [],
      electrical: [],
      storage: [],
      computers: [],
    },
  });

  // Search filters state for each equipment category
  const [searchFilters, setSearchFilters] = useState({
    lenses: '',
    cameraAccessories: '',
    tripods: '',
    lights: '',
    lightModifiers: '',
    machinery: '',
    electrical: '',
    storage: '',
    computers: ''
  });

  const { users, loading: usersLoading } = useUsers();
  const { toast } = useToast();
  const { equipmentHierarchy, loading: equipmentLoading } = useEquipment();

  const updateField = <K extends keyof WithdrawalData>(field: K, value: WithdrawalData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Get available cameras (main items, camera category, available status)
  const getAvailableCameras = () => {
    return equipmentHierarchy
      .filter(item =>
        item.item.category === 'Câmera' &&
        item.item.subcategory === 'Câmera (Corpo e Acessórios)' &&
        item.item.itemType === 'main' &&
        item.item.status === 'available'
      );
  };

  // Get available lenses
  const getAvailableLenses = () => {
    return equipmentHierarchy
      .filter(item =>
        item.item.category === 'Câmera' &&
        item.item.subcategory === 'Lente' &&
        item.item.status === 'available'
      )
      .map(item => item.item);
  };

  // Get available camera accessories
  const getAvailableCameraAccessories = () => {
    const cameraAccessorySubcategories = ['Acessórios (Câmera)', 'Bateria (Câmera)', 'Carregador (Bateria de Câmera)', 'Filtro', 'Mattebox', 'Adaptador de Lente'];
    return equipmentHierarchy
      .filter(item =>
        (item.item.category === 'Câmera' || item.item.category === 'Acessórios de Câmera') &&
        cameraAccessorySubcategories.includes(item.item.subcategory || '') &&
        item.item.status === 'available'
      )
      .map(item => item.item);
  };

  // Get available tripods and movement equipment
  const getAvailableTripods = () => {
    return equipmentHierarchy
      .filter(item =>
        ((item.item.category === 'Tripé de Câmera') ||
         (item.item.category === 'Movimento' && item.item.subcategory === 'Estabilizador')) &&
        item.item.status === 'available'
      )
      .map(item => item.item);
  };

  // Get available lights
  const getAvailableLights = () => {
    return equipmentHierarchy
      .filter(item =>
        item.item.category === 'Iluminação' &&
        item.item.subcategory === 'Luz' &&
        item.item.status === 'available'
      )
      .map(item => item.item);
  };

  // Get available light modifiers
  const getAvailableLightModifiers = () => {
    const lightModifierSubcategories = ['Acessórios (Luz)', 'Modificador'];
    return equipmentHierarchy
      .filter(item =>
        item.item.category === 'Iluminação' &&
        lightModifierSubcategories.includes(item.item.subcategory || '') &&
        item.item.status === 'available'
      )
      .map(item => item.item);
  };

  // Get available machinery
  const getAvailableMachinery = () => {
    return equipmentHierarchy
      .filter(item =>
        item.item.category === 'Produção' &&
        item.item.subcategory === 'Diversos' &&
        item.item.status === 'available'
      )
      .map(item => item.item);
  };

  // Get available electrical equipment
  const getAvailableElectrical = () => {
    return equipmentHierarchy
      .filter(item =>
        (item.item.category === 'Armazenamento' && item.item.subcategory?.includes('Cabo')) ||
        (item.item.category === 'Monitoração e Transmissão' && item.item.subcategory?.includes('Cabos')) ||
        (item.item.category === 'Áudio' && item.item.subcategory?.includes('Cabos')) &&
        item.item.status === 'available'
      )
      .map(item => item.item);
  };

  // Get available storage equipment
  const getAvailableStorage = () => {
    const storageSubcategories = ['Cartão de Memória', 'Leitor de Cartão', 'SSD/HD (Externo)', 'SSD/HD (Interno)'];
    return equipmentHierarchy
      .filter(item =>
        item.item.category === 'Armazenamento' &&
        storageSubcategories.includes(item.item.subcategory || '') &&
        item.item.status === 'available'
      )
      .map(item => item.item);
  };

  // Get available computers
  const getAvailableComputers = () => {
    return equipmentHierarchy
      .filter(item =>
        item.item.category === 'Tecnologia' &&
        item.item.subcategory === 'Computador' &&
        item.item.status === 'available'
      )
      .map(item => item.item);
  };

  const handleCameraSelect = (cameraHierarchy: { item: Equipment; accessories: Equipment[] }) => {
    const newSelectedCamera: SelectedCamera = {
      camera: cameraHierarchy.item,
      accessories: cameraHierarchy.accessories,
    };

    updateField('selectedEquipment', {
      ...data.selectedEquipment,
      cameras: [...data.selectedEquipment.cameras, newSelectedCamera],
    });
  };

  const handleCameraDeselect = (cameraId: string) => {
    const updatedCameras = data.selectedEquipment.cameras.filter(
      selected => selected.camera.id !== cameraId
    );

    updateField('selectedEquipment', {
      ...data.selectedEquipment,
      cameras: updatedCameras,
    });
  };

  // Generic equipment selection handlers
  const handleEquipmentSelect = (equipment: Equipment, type: keyof WithdrawalData['selectedEquipment']) => {
    if (type === 'cameras') return; // Cameras have special handling

    const currentEquipment = data.selectedEquipment[type] as Equipment[];
    updateField('selectedEquipment', {
      ...data.selectedEquipment,
      [type]: [...currentEquipment, equipment],
    });
  };

  const handleEquipmentDeselect = (equipmentId: string, type: keyof WithdrawalData['selectedEquipment']) => {
    if (type === 'cameras') return; // Cameras have special handling

    const currentEquipment = data.selectedEquipment[type] as Equipment[];
    const updatedEquipment = currentEquipment.filter(item => item.id !== equipmentId);

    updateField('selectedEquipment', {
      ...data.selectedEquipment,
      [type]: updatedEquipment,
    });
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.projectNumber.trim() !== '' &&
               data.company.trim() !== '' &&
               data.projectName.trim() !== '' &&
               /^\d{1,4}$/.test(data.projectNumber.trim());
      case 2:
        return data.responsibleUserId !== '';
      case 3:
        return data.withdrawalDate &&
               data.returnDate &&
               data.separationDate &&
               data.returnDate >= data.withdrawalDate;
      case 4:
        return data.recordingType !== '';
      case 5:
        return data.selectedEquipment.cameras.length > 0;
      // Steps 6-14 are optional - any selection is valid
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 14:
      case 15:
        return true;
      default:
        return true;
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

  const generatePDF = () => {
    try {
      logger.info('Initiating PDF generation', {
        module: 'withdrawal-dialog',
        action: 'generate_pdf',
        data: {
          projectNumber: data.projectNumber,
          projectName: data.projectName,
          company: data.company
        }
      });

      // Verificar se há dados válidos
      if (!data.projectNumber || !data.projectName) {
        toast({
          title: "Erro",
          description: "Dados do projeto incompletos para gerar PDF.",
          variant: "destructive"
        });
        return;
      }

      const doc = new jsPDF();

      // Configurações iniciais
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = margin;

      // Cabeçalho
      doc.setFontSize(20);
      doc.text('Lista de Equipamentos - Retirada', margin, yPosition);
      yPosition += 15;

      // Informações do projeto
      doc.setFontSize(12);
      doc.text(`Projeto: ${data.projectNumber} - ${data.projectName}`, margin, yPosition);
      yPosition += 8;
      doc.text(`Empresa: ${data.company}`, margin, yPosition);
      yPosition += 8;

      const responsibleUser = users.find(user => user.id === data.responsibleUserId);
      doc.text(`Responsável: ${responsibleUser?.display_name || 'N/A'}`, margin, yPosition);
      yPosition += 8;

      if (data.withdrawalDate) {
        doc.text(`Data de Retirada: ${format(data.withdrawalDate, 'dd/MM/yyyy', { locale: ptBR })}`, margin, yPosition);
        yPosition += 8;
      }

      if (data.returnDate) {
        doc.text(`Data de Devolução: ${format(data.returnDate, 'dd/MM/yyyy', { locale: ptBR })}`, margin, yPosition);
        yPosition += 8;
      }

      doc.text(`Tipo de Gravação: ${data.recordingType}`, margin, yPosition);
      yPosition += 15;

      // Preparar dados para a tabela
      const tableData: string[][] = [];

      // Processar câmeras e seus acessórios
      data.selectedEquipment.cameras.forEach(selectedCamera => {
        tableData.push([
          'Câmeras',
          selectedCamera.camera.name || 'N/A',
          selectedCamera.camera.brand || 'N/A',
          'Principal',
          ''
        ]);

        selectedCamera.accessories.forEach(accessory => {
          tableData.push([
            'Câmeras',
            accessory.name || 'N/A',
            accessory.brand || 'N/A',
            'Acessório',
            selectedCamera.camera.name || 'N/A'
          ]);
        });
      });

      // Processar outras categorias
      const categories = [
        { items: data.selectedEquipment.lenses, category: 'Lentes' },
        { items: data.selectedEquipment.cameraAccessories, category: 'Acessórios de Câmera' },
        { items: data.selectedEquipment.tripods, category: 'Tripés' },
        { items: data.selectedEquipment.lights, category: 'Iluminação' },
        { items: data.selectedEquipment.lightModifiers, category: 'Modificadores de Luz' },
        { items: data.selectedEquipment.machinery, category: 'Maquinário' },
        { items: data.selectedEquipment.electrical, category: 'Elétrica' },
        { items: data.selectedEquipment.storage, category: 'Armazenamento' },
        { items: data.selectedEquipment.computers, category: 'Computadores' }
      ];

      categories.forEach(({ items, category }) => {
        items.forEach(item => {
          tableData.push([
            category,
            item.name || 'N/A',
            item.brand || 'N/A',
            'Principal',
            ''
          ]);
        });
      });

      logger.debug('PDF table data prepared', {
        module: 'withdrawal-dialog',
        action: 'pdf_table_prepared',
        data: { rowCount: tableData.length }
      });

      // Gerar tabela
      (doc as any).autoTable({
        head: [['Categoria', 'Nome', 'Marca', 'Tipo', 'Relacionado a']],
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // Adicionar total de itens
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text(`Total de itens: ${tableData.length}`, margin, finalY);

      // Download do arquivo
      const fileName = `Lista_Equipamentos_${data.projectNumber}_${format(new Date(), 'ddMMyyyy')}.pdf`;
      logger.info('PDF file generated successfully', {
        module: 'withdrawal-dialog',
        action: 'pdf_saved',
        data: { fileName, itemCount: tableData.length }
      });
      doc.save(fileName);

      toast({
        title: "PDF Gerado",
        description: "Lista de equipamentos baixada com sucesso!",
      });

    } catch (error) {
      logger.error('Error generating PDF', {
        module: 'withdrawal-dialog',
        action: 'pdf_generation_error',
        error
      });
      toast({
        title: "Erro",
        description: "Falha ao gerar o PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission

    if (!isStepValid()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const selectedUser = users.find(u => u.id === data.responsibleUserId);

    // Convert selected equipment to flat array
    const flattenSelectedEquipment = (): Equipment[] => {
      const equipment: Equipment[] = [];

      // Add cameras and their accessories
      data.selectedEquipment.cameras.forEach(({ camera, accessories }) => {
        equipment.push(camera);
        equipment.push(...accessories);
      });

      // Add all other equipment types
      equipment.push(...data.selectedEquipment.lenses);
      equipment.push(...data.selectedEquipment.cameraAccessories);
      equipment.push(...data.selectedEquipment.tripods);
      equipment.push(...data.selectedEquipment.lights);
      equipment.push(...data.selectedEquipment.lightModifiers);
      equipment.push(...data.selectedEquipment.machinery);
      equipment.push(...data.selectedEquipment.electrical);
      equipment.push(...data.selectedEquipment.storage);
      equipment.push(...data.selectedEquipment.computers);

      return equipment;
    };

    const selectedEquipment = flattenSelectedEquipment();

    const projectData = {
      name: `${data.projectNumber} - ${data.company}: ${data.projectName}`,
      projectNumber: data.projectNumber,
      company: data.company,
      projectName: data.projectName,
      responsibleUserId: data.responsibleUserId,
      responsibleName: selectedUser?.display_name || selectedUser?.email || '',
      responsibleEmail: selectedUser?.email || '',
      department: selectedUser?.department || '',
      startDate: data.withdrawalDate?.toISOString().split('T')[0] || '',
      expectedEndDate: data.returnDate?.toISOString().split('T')[0] || '',
      withdrawalDate: data.withdrawalDate?.toISOString().split('T')[0] || '',
      separationDate: data.separationDate?.toISOString().split('T')[0] || '',
      recordingType: data.recordingType,
      status: 'active' as const,
      equipmentCount: selectedEquipment.length,
      loanIds: []
    };

    logger.info('Creating project with selected equipment', {
      module: 'withdrawal-dialog',
      action: 'create_project_with_equipment',
      data: {
        projectName: projectData.name,
        equipmentCount: selectedEquipment.length,
        equipmentNames: selectedEquipment.map(e => e.name)
      }
    });

    try {
      await onSubmit(projectData, selectedEquipment);

      // Reset form
      setCurrentStep(1);
      setData({
        projectNumber: '',
        company: '',
        projectName: '',
        responsibleUserId: '',
        withdrawalDate: undefined,
        returnDate: undefined,
        separationDate: undefined,
        recordingType: '',
        selectedEquipment: {
          cameras: [],
          lenses: [],
          cameraAccessories: [],
          tripods: [],
          lights: [],
          lightModifiers: [],
          machinery: [],
          electrical: [],
          storage: [],
          computers: [],
        },
      });

      onOpenChange(false);

      toast({
        title: "Sucesso",
        description: "Nova retirada criada com sucesso!",
      });
    } catch (error) {
      logger.error('Error creating withdrawal', {
        module: 'withdrawal-dialog',
        action: 'create_withdrawal_error',
        error
      });
      toast({
        title: "Erro",
        description: "Erro ao criar nova retirada. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for the summary step
  const getTotalEquipmentCount = () => {
    const {
      cameras,
      lenses,
      cameraAccessories,
      tripods,
      lights,
      lightModifiers,
      machinery,
      electrical,
      storage,
      computers
    } = data.selectedEquipment;

    return cameras.length + lenses.length + cameraAccessories.length +
           tripods.length + lights.length + lightModifiers.length +
           machinery.length + electrical.length + storage.length + computers.length;
  };

  const getResponsibleUserName = () => {
    const user = users.find(u => u.id === data.responsibleUserId);
    return user ? user.display_name || user.email : 'Não selecionado';
  };

  const formatDate = (date: Date | undefined) => {
    return date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Não selecionada';
  };

  const renderEquipmentCategoryCard = (
    title: string,
    icon: LucideIcon,
    items: Equipment[] | SelectedCamera[],
    isEmpty: boolean,
    stepNumber?: number
  ) => {
    const IconComponent = icon;
    const count = Array.isArray(items) ? items.length : 0;

    if (isEmpty) {
      return (
        <div
          key={title}
          style={{
            border: '1px dashed hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
            opacity: 0.5,
            minHeight: 160,
          }}
        >
          <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--ds-line-1))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconComponent size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
              <div>
                <h4 style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'hsl(var(--ds-fg-1))',
                  marginBottom: 4,
                }}>
                  {title}
                </h4>
                <span className="pill muted" style={{ fontVariantNumeric: 'tabular-nums' }}>0 itens</span>
              </div>
            </div>
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>Nenhum item selecionado para esta categoria</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={title}
        className="animate-fade-in"
        style={{
          border: '1px solid hsl(var(--ds-accent) / 0.3)',
          background: 'hsl(var(--ds-accent) / 0.05)',
          minHeight: 128,
        }}
      >
        <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--ds-line-1))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconComponent size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))' }} />
              <div>
                <h4 style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'hsl(var(--ds-fg-1))',
                  marginBottom: 4,
                }}>
                  {title}
                </h4>
                <span
                  className="pill"
                  style={{
                    color: 'hsl(var(--ds-accent))',
                    borderColor: 'hsl(var(--ds-accent) / 0.3)',
                    background: 'hsl(var(--ds-accent) / 0.08)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {count} {count === 1 ? 'item' : 'itens'}
                </span>
              </div>
            </div>

            {/* Edit button with tooltip */}
            {count > 0 && stepNumber && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="btn"
                    style={{ height: 28, fontSize: 12 }}
                    onClick={() => setCurrentStep(stepNumber)}
                  >
                    Editar
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar seleção de {title.toLowerCase()}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {title === 'Câmeras' ? (
              (items as SelectedCamera[]).map((selectedCamera) => (
                <div key={selectedCamera.camera.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCamera.camera.name}</div>
                    <div style={{ color: 'hsl(var(--ds-fg-3))', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCamera.camera.brand}</div>
                  </div>
                  {selectedCamera.accessories.length > 0 && (
                    <span className="pill muted" style={{ marginLeft: 8, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                      +{selectedCamera.accessories.length}
                    </span>
                  )}
                </div>
              ))
            ) : (
              (items as Equipment[]).map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ color: 'hsl(var(--ds-fg-3))', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.brand}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  // Configuração dos steps de seleção de equipamentos (steps 6-14)
  // Cada step usa o componente genérico EquipmentSelectionStep
  interface EquipmentStepConfig {
    step: number;
    icon: LucideIcon;
    availableTitle: string;
    selectedTitle: string;
    emptyAvailableText: string;
    emptySelectedText: string;
    getAvailable: () => Equipment[];
    type: keyof WithdrawalData['selectedEquipment'];
    searchKey?: keyof typeof searchFilters;
    searchLabel?: string;
  }

  const equipmentStepConfigs: EquipmentStepConfig[] = [
    {
      step: 6, icon: Camera,
      availableTitle: 'Lentes Disponíveis', selectedTitle: 'Lentes Selecionadas',
      emptyAvailableText: 'Nenhuma lente disponível', emptySelectedText: 'Nenhuma lente selecionada',
      getAvailable: getAvailableLenses, type: 'lenses',
      searchKey: 'lenses', searchLabel: 'Buscar lentes',
    },
    {
      step: 7, icon: Package,
      availableTitle: 'Acessórios Disponíveis', selectedTitle: 'Acessórios Selecionados',
      emptyAvailableText: 'Nenhum acessório disponível', emptySelectedText: 'Nenhum acessório selecionado',
      getAvailable: getAvailableCameraAccessories, type: 'cameraAccessories',
      searchKey: 'cameraAccessories', searchLabel: 'Buscar acessórios',
    },
    {
      step: 8, icon: Settings,
      availableTitle: 'Equipamentos Disponíveis', selectedTitle: 'Equipamentos Selecionados',
      emptyAvailableText: 'Nenhum equipamento disponível', emptySelectedText: 'Nenhum equipamento selecionado',
      getAvailable: getAvailableTripods, type: 'tripods',
    },
    {
      step: 9, icon: Lightbulb,
      availableTitle: 'Luzes Disponíveis', selectedTitle: 'Luzes Selecionadas',
      emptyAvailableText: 'Nenhuma luz disponível', emptySelectedText: 'Nenhuma luz selecionada',
      getAvailable: getAvailableLights, type: 'lights',
    },
    {
      step: 10, icon: Settings,
      availableTitle: 'Modificadores Disponíveis', selectedTitle: 'Modificadores Selecionados',
      emptyAvailableText: 'Nenhum modificador disponível', emptySelectedText: 'Nenhum modificador selecionado',
      getAvailable: getAvailableLightModifiers, type: 'lightModifiers',
    },
    {
      step: 11, icon: Cog,
      availableTitle: 'Equipamentos Disponíveis', selectedTitle: 'Equipamentos Selecionados',
      emptyAvailableText: 'Nenhum equipamento disponível', emptySelectedText: 'Nenhum equipamento selecionado',
      getAvailable: getAvailableMachinery, type: 'machinery',
    },
    {
      step: 12, icon: Zap,
      availableTitle: 'Equipamentos Disponíveis', selectedTitle: 'Equipamentos Selecionados',
      emptyAvailableText: 'Nenhum equipamento disponível', emptySelectedText: 'Nenhum equipamento selecionado',
      getAvailable: getAvailableElectrical, type: 'electrical',
    },
    {
      step: 13, icon: HardDrive,
      availableTitle: 'Computadores Disponíveis', selectedTitle: 'Computadores Selecionados',
      emptyAvailableText: 'Nenhum item disponível', emptySelectedText: 'Nenhum item selecionado',
      getAvailable: getAvailableStorage, type: 'storage',
    },
    {
      step: 14, icon: Monitor,
      availableTitle: 'Computadores Disponíveis', selectedTitle: 'Computadores Selecionados',
      emptyAvailableText: 'Nenhum computador disponível', emptySelectedText: 'Nenhum computador selecionado',
      getAvailable: getAvailableComputers, type: 'computers',
    },
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
            <div>
              <h3 style={{ fontFamily: '"HN Display", sans-serif', fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>Informações do Projeto</h3>
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>Preencha os dados básicos do projeto</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="projectNumber" style={eyebrowLabel}>Número do Projeto *</label>
                <Input
                  id="projectNumber"
                  value={data.projectNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    updateField('projectNumber', value);
                  }}
                  placeholder="Ex: 398"
                  maxLength={4}
                  style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}
                />
                <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                  Apenas números, máximo 4 dígitos
                </p>
              </div>

              <div>
                <label htmlFor="company" style={eyebrowLabel}>Empresa *</label>
                <Input
                  id="company"
                  value={data.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Ex: Hiro Films"
                />
              </div>

              <div>
                <label htmlFor="projectName" style={eyebrowLabel}>Nome do Projeto *</label>
                <Input
                  id="projectName"
                  value={data.projectName}
                  onChange={(e) => updateField('projectName', e.target.value)}
                  placeholder="Ex: Institucional"
                />
              </div>

              {data.projectNumber && data.company && data.projectName && (
                <div style={{
                  padding: 14,
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>Nome final do projeto:</p>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                    {data.projectNumber} - {data.company}: {data.projectName}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
            <div>
              <h3 style={{ fontFamily: '"HN Display", sans-serif', fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>Responsável pelo Projeto</h3>
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>Selecione quem será responsável por este projeto</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="responsible" style={eyebrowLabel}>Responsável *</label>
                <Select
                  value={data.responsibleUserId}
                  onValueChange={(value) => updateField('responsibleUserId', value)}
                  disabled={usersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={usersLoading ? "Carregando usuários..." : "Selecione o responsável"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => {
                      const avatarData = getAvatarData(
                        {
                          app_metadata: { provider: user.user_metadata?.provider || 'email' },
                          user_metadata: user.user_metadata || {},
                          email: user.email
                        } as any,
                        user.avatar_url,
                        user.display_name
                      );

                      return (
                        <SelectItem key={user.id} value={user.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={avatarData.url || undefined} alt={user.display_name || user.email} />
                              <AvatarFallback>{avatarData.initials}</AvatarFallback>
                            </Avatar>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <span style={{ fontWeight: 500 }}>
                                {user.display_name || user.email}
                              </span>
                              <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
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

              {data.responsibleUserId && (
                <div style={{
                  padding: 14,
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                }}>
                  {(() => {
                    const selectedUser = users.find(u => u.id === data.responsibleUserId);
                    return selectedUser ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>Dados do responsável:</p>
                        <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                          <strong style={{ color: 'hsl(var(--ds-fg-2))' }}>Nome:</strong> {selectedUser.display_name || selectedUser.email}
                        </p>
                        <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                          <strong style={{ color: 'hsl(var(--ds-fg-2))' }}>Email:</strong> {selectedUser.email}
                        </p>
                        {selectedUser.department && (
                          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                            <strong style={{ color: 'hsl(var(--ds-fg-2))' }}>Departamento:</strong> {selectedUser.department}
                          </p>
                        )}
                        {selectedUser.position && (
                          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                            <strong style={{ color: 'hsl(var(--ds-fg-2))' }}>Cargo:</strong> {selectedUser.position}
                          </p>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
            <div>
              <h3 style={{ fontFamily: '"HN Display", sans-serif', fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>Datas do Projeto</h3>
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>Defina as datas de separação, retirada e devolução</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }} className="md:[grid-template-columns:1fr_1fr_1fr]">
              {([
                { label: 'Data de Separação *', value: data.separationDate, field: 'separationDate' as const },
                { label: 'Data de Retirada *', value: data.withdrawalDate, field: 'withdrawalDate' as const },
                { label: 'Data de Devolução *', value: data.returnDate, field: 'returnDate' as const },
              ]).map(({ label, value, field }) => (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={eyebrowLabel}>{label}</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          color: value ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                        }}
                      >
                        <CalendarIcon size={13} strokeWidth={1.5} />
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {value ? format(value, "dd/MM/yyyy") : "Selecionar data"}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={value}
                        onSelect={(date) => updateField(field, date)}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const oneYearFromNow = new Date();
                          oneYearFromNow.setFullYear(today.getFullYear() + 1);

                          if (date < today || date > oneYearFromNow) return true;
                          if (field === 'withdrawalDate' && data.separationDate && date < data.separationDate) return true;
                          if (field === 'returnDate' && data.withdrawalDate && date < data.withdrawalDate) return true;

                          return false;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p>• A data de separação deve ser anterior à data de retirada</p>
              <p>• A data de devolução deve ser posterior à data de retirada</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
            <div>
              <h3 style={{ fontFamily: '"HN Display", sans-serif', fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>Tipo de Gravação</h3>
              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>Escolha o tipo de gravação do projeto</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="recordingType" style={eyebrowLabel}>Tipo de Gravação *</label>
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

              {data.recordingType && (
                <div style={{
                  padding: 14,
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>Tipo selecionado:</p>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                    {data.recordingType}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }} className="lg:[grid-template-columns:1fr_1fr]">
                {/* Available Cameras */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginBottom: 16 }}>
                    <Camera size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-2))' }} />
                    <h4 style={{ fontFamily: '"HN Display", sans-serif', fontSize: 14, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                      Câmeras Disponíveis
                    </h4>
                    <span className="pill muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {getAvailableCameras().length} disponíveis
                    </span>
                  </div>

                  {equipmentLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} style={{ height: 96, background: 'hsl(var(--ds-line-2) / 0.3)' }} className="animate-pulse" />
                      ))}
                    </div>
                  ) : getAvailableCameras().length === 0 ? (
                    <div style={{ height: 500, overflowY: 'auto', flex: 1 }}>
                      <div style={{
                        border: '1px dashed hsl(var(--ds-line-1))',
                        background: 'hsl(var(--ds-surface))',
                        padding: '24px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 120,
                      }}>
                        <div style={{ textAlign: 'center', fontSize: 13, color: 'hsl(var(--ds-fg-3))', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <Camera size={28} strokeWidth={1.5} style={{ margin: '0 auto', opacity: 0.5, color: 'hsl(var(--ds-fg-3))' }} />
                          <p style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>Nenhuma câmera disponível</p>
                          <p style={{ fontSize: 11 }}>Todas as câmeras estão em uso no momento</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: 500, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {getAvailableCameras().map((cameraHierarchy) => {
                        const isSelected = data.selectedEquipment.cameras.some(
                          selected => selected.camera.id === cameraHierarchy.item.id
                        );
                        return (
                          <div
                            key={cameraHierarchy.item.id}
                            onClick={() => !isSelected && handleCameraSelect(cameraHierarchy)}
                            style={{
                              border: isSelected
                                ? '1px solid hsl(var(--ds-success) / 0.5)'
                                : '1px solid hsl(var(--ds-line-1))',
                              background: isSelected
                                ? 'hsl(var(--ds-success) / 0.08)'
                                : 'hsl(var(--ds-surface))',
                              cursor: isSelected ? 'default' : 'pointer',
                              height: 96,
                              padding: 16,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                              <div style={{
                                width: 48,
                                height: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                border: isSelected ? '1px solid hsl(var(--ds-success) / 0.3)' : '1px solid hsl(var(--ds-line-1))',
                                background: isSelected ? 'hsl(var(--ds-success) / 0.1)' : 'hsl(var(--ds-line-2) / 0.3)',
                              }}>
                                {isSelected ? (
                                  <Check size={22} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
                                ) : cameraHierarchy.item.image ? (
                                  <img
                                    src={cameraHierarchy.item.image}
                                    alt={cameraHierarchy.item.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <Camera size={22} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                                  <div style={{ flex: 1, minWidth: 0, marginRight: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <p style={{ fontWeight: 500, fontSize: 13, color: 'hsl(var(--ds-fg-1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {cameraHierarchy.item.name}
                                        </p>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{cameraHierarchy.item.name}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                                      {cameraHierarchy.item.brand}
                                    </p>
                                    {cameraHierarchy.accessories.length > 0 && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <Package size={11} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                                        <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                                          {cameraHierarchy.accessories.length} acessórios
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    className="btn"
                                    disabled={isSelected}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!isSelected) handleCameraSelect(cameraHierarchy);
                                    }}
                                    style={isSelected ? {
                                      height: 28,
                                      fontSize: 12,
                                      color: 'hsl(var(--ds-success))',
                                      borderColor: 'hsl(var(--ds-success) / 0.3)',
                                      background: 'hsl(var(--ds-success) / 0.08)',
                                    } : { height: 28, fontSize: 12 }}
                                  >
                                    {isSelected ? (
                                      <>
                                        <Check size={11} strokeWidth={1.5} />
                                        <span>Selecionado</span>
                                      </>
                                    ) : (
                                      "Selecionar"
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Cameras Preview */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginBottom: 16 }}>
                    <Check size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
                    <h4 style={{ fontFamily: '"HN Display", sans-serif', fontSize: 14, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                      Câmeras Selecionadas
                    </h4>
                    <span
                      className="pill"
                      style={{
                        color: 'hsl(var(--ds-accent))',
                        borderColor: 'hsl(var(--ds-accent) / 0.3)',
                        background: 'hsl(var(--ds-accent) / 0.08)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {data.selectedEquipment.cameras.length}
                    </span>
                  </div>

                  {data.selectedEquipment.cameras.length === 0 ? (
                    <div style={{ height: 500, overflowY: 'auto', flex: 1 }}>
                      <div style={{
                        border: '1px dashed hsl(var(--ds-line-1))',
                        background: 'hsl(var(--ds-surface))',
                        padding: '24px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 120,
                      }}>
                        <div style={{ textAlign: 'center', fontSize: 13, color: 'hsl(var(--ds-fg-3))', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <Package size={28} strokeWidth={1.5} style={{ margin: '0 auto', opacity: 0.5, color: 'hsl(var(--ds-fg-3))' }} />
                          <p style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>Nenhuma câmera selecionada</p>
                          <p style={{ fontSize: 11 }}>Clique nas câmeras disponíveis para adicioná-las</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: 500, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {data.selectedEquipment.cameras.map((selectedCamera) => (
                        <div
                          key={selectedCamera.camera.id}
                          className="animate-fade-in"
                          style={{
                            border: '1px solid hsl(var(--ds-accent) / 0.3)',
                            background: 'hsl(var(--ds-accent) / 0.05)',
                            height: 96,
                            padding: 16,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%' }}>
                            <div style={{
                              width: 48,
                              height: 48,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              border: '1px solid hsl(var(--ds-success) / 0.3)',
                              background: 'hsl(var(--ds-success) / 0.1)',
                            }}>
                              <Check size={22} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                                <div style={{ flex: 1, minWidth: 0, marginRight: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                  <p style={{ fontWeight: 500, fontSize: 13, color: 'hsl(var(--ds-fg-1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {selectedCamera.camera.name}
                                  </p>
                                  <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                                    {selectedCamera.camera.brand}
                                  </p>
                                  {selectedCamera.accessories.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                      <Package size={11} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                                      <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                                        {selectedCamera.accessories.length} acessórios
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="btn"
                                  style={{
                                    height: 28,
                                    fontSize: 12,
                                    color: 'hsl(var(--ds-danger))',
                                    borderColor: 'hsl(var(--ds-danger) / 0.3)',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCameraDeselect(selectedCamera.camera.id);
                                  }}
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Summary */}
              {data.selectedEquipment.cameras.length > 0 && (
                <div style={{
                  padding: 16,
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                }}>
                  <h5 style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-2))',
                    marginBottom: 8,
                  }}>
                    Resumo da Seleção
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
                    <div>
                      <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Câmeras:</span>
                      <span style={{ marginLeft: 8, fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
                        {data.selectedEquipment.cameras.length}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Total acessórios:</span>
                      <span style={{ marginLeft: 8, fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
                        {data.selectedEquipment.cameras.reduce((acc, cam) => acc + cam.accessories.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      // Steps 6-14: Seleção de equipamentos por categoria (componente genérico)
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 14: {
        const config = equipmentStepConfigs.find(c => c.step === currentStep);
        if (!config) return null;
        return (
          <EquipmentSelectionStep
            availableItems={config.getAvailable()}
            selectedItems={data.selectedEquipment[config.type] as Equipment[]}
            onSelect={(item) => handleEquipmentSelect(item, config.type)}
            onDeselect={(id) => handleEquipmentDeselect(id, config.type)}
            icon={config.icon}
            availableTitle={config.availableTitle}
            selectedTitle={config.selectedTitle}
            emptyAvailableText={config.emptyAvailableText}
            emptySelectedText={config.emptySelectedText}
            loading={equipmentLoading}
            searchTerm={config.searchKey ? searchFilters[config.searchKey] : undefined}
            onSearchChange={config.searchKey ? (value) => setSearchFilters(prev => ({ ...prev, [config.searchKey!]: value })) : undefined}
            searchLabel={config.searchLabel}
          />
        );
      }
      case 15:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontFamily: '"HN Display", sans-serif', fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>Resumo da Retirada</h3>
              <span
                className="pill"
                style={{
                  color: 'hsl(var(--ds-accent))',
                  borderColor: 'hsl(var(--ds-accent) / 0.3)',
                  background: 'hsl(var(--ds-accent) / 0.08)',
                  fontSize: 13,
                  padding: '6px 14px',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                Total: {getTotalEquipmentCount()} itens
              </span>
            </div>

            {/* Detailed Summary */}
            <div style={{
              border: '1px solid hsl(var(--ds-accent) / 0.2)',
              background: 'hsl(var(--ds-accent) / 0.05)',
              padding: 24,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, textAlign: 'center' }} className="md:[grid-template-columns:repeat(4,1fr)]">
                <div>
                  <div style={{ fontFamily: '"HN Display", sans-serif', fontSize: 24, fontWeight: 700, color: 'hsl(var(--ds-accent))', fontVariantNumeric: 'tabular-nums' }}>
                    {data.selectedEquipment.cameras.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, marginTop: 4 }}>Câmeras</div>
                </div>
                <div>
                  <div style={{ fontFamily: '"HN Display", sans-serif', fontSize: 24, fontWeight: 700, color: 'hsl(var(--ds-accent))', fontVariantNumeric: 'tabular-nums' }}>
                    {data.selectedEquipment.cameras.reduce((acc, cam) => acc + cam.accessories.length, 0)}
                  </div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, marginTop: 4 }}>Acessórios de Câmera</div>
                </div>
                <div>
                  <div style={{ fontFamily: '"HN Display", sans-serif', fontSize: 24, fontWeight: 700, color: 'hsl(var(--ds-accent))', fontVariantNumeric: 'tabular-nums' }}>
                    {data.selectedEquipment.lenses.length + data.selectedEquipment.lights.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, marginTop: 4 }}>Lentes + Luzes</div>
                </div>
                <div>
                  <div style={{ fontFamily: '"HN Display", sans-serif', fontSize: 24, fontWeight: 700, color: 'hsl(var(--ds-accent))', fontVariantNumeric: 'tabular-nums' }}>
                    {getTotalEquipmentCount()}
                  </div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, marginTop: 4 }}>Total Geral</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              {renderEquipmentCategoryCard('Câmeras', Camera, data.selectedEquipment.cameras, data.selectedEquipment.cameras.length === 0, 5)}
              {renderEquipmentCategoryCard('Lentes', Video, data.selectedEquipment.lenses, data.selectedEquipment.lenses.length === 0, 6)}
              {renderEquipmentCategoryCard('Acessórios de Câmera', Settings, data.selectedEquipment.cameraAccessories, data.selectedEquipment.cameraAccessories.length === 0, 7)}
              {renderEquipmentCategoryCard('Tripés', Box, data.selectedEquipment.tripods, data.selectedEquipment.tripods.length === 0, 8)}
              {renderEquipmentCategoryCard('Iluminação', Lightbulb, data.selectedEquipment.lights, data.selectedEquipment.lights.length === 0, 9)}
              {renderEquipmentCategoryCard('Modificadores de Luz', Wrench, data.selectedEquipment.lightModifiers, data.selectedEquipment.lightModifiers.length === 0, 10)}
              {renderEquipmentCategoryCard('Máquinas', Cog, data.selectedEquipment.machinery, data.selectedEquipment.machinery.length === 0, 11)}
              {renderEquipmentCategoryCard('Elétricos', Plug, data.selectedEquipment.electrical, data.selectedEquipment.electrical.length === 0, 12)}
              {renderEquipmentCategoryCard('Armazenamento', HardDrive, data.selectedEquipment.storage, data.selectedEquipment.storage.length === 0, 13)}
              {renderEquipmentCategoryCard('Computadores', Monitor, data.selectedEquipment.computers, data.selectedEquipment.computers.length === 0, 14)}
            </div>

            {/* Project Information Summary */}
            <div style={{
              border: '1px solid hsl(var(--ds-accent) / 0.2)',
              background: 'hsl(var(--ds-accent) / 0.05)',
            }}>
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid hsl(var(--ds-line-1))',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <Package size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                <span style={{
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  color: 'hsl(var(--ds-fg-2))',
                }}>
                  Informações do Projeto
                </span>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, fontSize: 13 }} className="md:[grid-template-columns:1fr_1fr]">
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))', marginBottom: 4 }}>Projeto</div>
                    <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{data.projectName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))', marginBottom: 4 }}>Empresa</div>
                    <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{data.company}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))', marginBottom: 4 }}>Responsável</div>
                    <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{getResponsibleUserName()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))', marginBottom: 4 }}>Data de Retirada</div>
                    <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>{formatDate(data.withdrawalDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))', marginBottom: 4 }}>Data de Retorno</div>
                    <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>{formatDate(data.returnDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))', marginBottom: 4 }}>Tipo de Gravação</div>
                    <div style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{data.recordingType}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-[98vw] sm:max-w-5xl flex flex-col overflow-hidden mobile-safe">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-base sm:text-lg truncate">
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>
                Nova Retirada - Passo {currentStep} de 15
              </span>
            </DialogTitle>
          </DialogHeader>

          <div style={{ flex: 1, overflow: 'hidden', padding: '8px 0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Progress bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>
                <span>Passo {currentStep} de 15</span>
                <span>{Math.round((currentStep / 15) * 100)}% completo</span>
              </div>
              <Progress value={(currentStep / 15) * 100} className="h-2" />
            </div>

            {renderStep()}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 16,
            borderTop: '1px solid hsl(var(--ds-line-1))',
            flexShrink: 0,
          }}>
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

              {currentStep === 15 ? (
                <>
                  <button type="button" className="btn" onClick={generatePDF}>
                    <Download size={13} strokeWidth={1.5} />
                    <span>Baixar PDF</span>
                  </button>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={handleSubmit}
                    disabled={!isStepValid() || isSubmitting}
                  >
                    <Check size={13} strokeWidth={1.5} />
                    <span>{isSubmitting ? 'Criando...' : 'Criar Retirada'}</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Skip button for optional equipment steps (6-14) - only show when no items selected */}
                  {currentStep >= 6 && currentStep <= 14 && (() => {
                    const categoryMap: { [key: number]: keyof WithdrawalData['selectedEquipment'] } = {
                      6: 'lenses',
                      7: 'cameraAccessories',
                      8: 'tripods',
                      9: 'lights',
                      10: 'lightModifiers',
                      11: 'machinery',
                      12: 'electrical',
                      13: 'storage',
                      14: 'computers'
                    };
                    const category = categoryMap[currentStep];
                    const hasItems = category && Array.isArray(data.selectedEquipment[category]) &&
                                    data.selectedEquipment[category].length > 0;

                    return !hasItems ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="btn"
                            style={{ borderColor: 'transparent', background: 'transparent' }}
                            onClick={nextStep}
                          >
                            <span>Pular categoria</span>
                            <ChevronRight size={13} strokeWidth={1.5} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Esta categoria é opcional</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null;
                  })()}

                  <button
                    type="button"
                    className="btn primary"
                    onClick={nextStep}
                    disabled={!isStepValid()}
                  >
                    <span>Próximo</span>
                    <ChevronRight size={13} strokeWidth={1.5} />
                  </button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
