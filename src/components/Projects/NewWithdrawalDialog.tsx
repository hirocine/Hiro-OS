import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarData } from "@/lib/avatarUtils";
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Camera, Package, Minus, Plus, ChevronDown, ChevronUp, Lightbulb, Settings, Cog, Zap, HardDrive, Monitor, Wrench, Download, Video, Plug, Box } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { useEquipment } from '@/hooks/useEquipment';
import { Equipment } from '@/types/equipment';
import { logger } from '@/lib/logger';

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

export function NewWithdrawalDialog({ open, onOpenChange, onSubmit }: NewWithdrawalDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedCameras, setExpandedCameras] = useState<Set<string>>(new Set());
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
        item.item.category === 'camera' && 
        item.item.subcategory === 'Câmera' &&
        item.item.itemType === 'main' && 
        item.item.status === 'available' &&
        !data.selectedEquipment.cameras.some(selected => selected.camera.id === item.item.id)
      );
  };

  // Get available lenses
  const getAvailableLenses = () => {
    return equipmentHierarchy
      .filter(item => 
        item.item.category === 'camera' && 
        item.item.subcategory === 'Lente' &&
        item.item.status === 'available' &&
        !data.selectedEquipment.lenses.some(selected => selected.id === item.item.id)
      )
      .map(item => item.item);
  };

  // Get available camera accessories
  const getAvailableCameraAccessories = () => {
    const cameraAccessorySubcategories = ['Acessórios', 'Bateria', 'Cabo', 'Carregador', 'Case', 'Filtro', 'Monitor', 'Transmissão', 'Cage'];
    return equipmentHierarchy
      .filter(item => 
        item.item.category === 'camera' && 
        cameraAccessorySubcategories.includes(item.item.subcategory || '') &&
        item.item.status === 'available' &&
        !data.selectedEquipment.cameraAccessories.some(selected => selected.id === item.item.id)
      )
      .map(item => item.item);
  };

  // Get available tripods and movement equipment
  const getAvailableTripods = () => {
    return equipmentHierarchy
      .filter(item => 
        ((item.item.category === 'accessories' && item.item.subcategory === 'Tripé de Câmera') ||
         (item.item.category === 'camera' && item.item.subcategory === 'Estabilizador')) &&
        item.item.status === 'available' &&
        !data.selectedEquipment.tripods.some(selected => selected.id === item.item.id)
      )
      .map(item => item.item);
  };

  // Get available lights
  const getAvailableLights = () => {
    return equipmentHierarchy
      .filter(item => 
        item.item.category === 'lighting' && 
        item.item.subcategory === 'Luz' &&
        item.item.status === 'available' &&
        !data.selectedEquipment.lights.some(selected => selected.id === item.item.id)
      )
      .map(item => item.item);
  };

  // Get available light modifiers
  const getAvailableLightModifiers = () => {
    const lightModifierSubcategories = ['Modificador de Luz', 'Tripé de Luz'];
    return equipmentHierarchy
      .filter(item => 
        item.item.category === 'lighting' && 
        lightModifierSubcategories.includes(item.item.subcategory || '') &&
        item.item.status === 'available' &&
        !data.selectedEquipment.lightModifiers.some(selected => selected.id === item.item.id)
      )
      .map(item => item.item);
  };

  // Get available machinery
  const getAvailableMachinery = () => {
    return equipmentHierarchy
      .filter(item => 
        item.item.category === 'accessories' && 
        item.item.subcategory === 'Maquinária' &&
        item.item.status === 'available' &&
        !data.selectedEquipment.machinery.some(selected => selected.id === item.item.id)
      )
      .map(item => item.item);
  };

  // Get available electrical equipment
  const getAvailableElectrical = () => {
    return equipmentHierarchy
      .filter(item => 
        item.item.category === 'accessories' && 
        (item.item.subcategory === 'Cabo' || item.item.subcategory === 'Elétrica') &&
        item.item.status === 'available' &&
        !data.selectedEquipment.electrical.some(selected => selected.id === item.item.id)
      )
      .map(item => item.item);
  };

  // Get available storage equipment
  const getAvailableStorage = () => {
    const storageSubcategories = ['Cartão de Memória', 'Leitor de Cartão', 'SSD/HD'];
    return equipmentHierarchy
      .filter(item => 
        item.item.category === 'storage' && 
        storageSubcategories.includes(item.item.subcategory || '') &&
        item.item.status === 'available' &&
        !data.selectedEquipment.storage.some(selected => selected.id === item.item.id)
      )
      .map(item => item.item);
  };

  // Get available computers
  const getAvailableComputers = () => {
    return equipmentHierarchy
      .filter(item => 
        item.item.category === 'accessories' && 
        item.item.subcategory === 'Computador' &&
        item.item.status === 'available' &&
        !data.selectedEquipment.computers.some(selected => selected.id === item.item.id)
      )
      .map(item => item.item);
  };

  // Filter equipment by search term (name or brand)
  const filterEquipmentBySearch = (items: Equipment[], searchTerm: string) => {
    if (!searchTerm.trim()) return items;
    
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerSearch) ||
      item.brand.toLowerCase().includes(lowerSearch)
    );
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

  const toggleAccessoriesExpansion = (cameraId: string) => {
    const newExpanded = new Set(expandedCameras);
    if (newExpanded.has(cameraId)) {
      newExpanded.delete(cameraId);
    } else {
      newExpanded.add(cameraId);
    }
    setExpandedCameras(newExpanded);
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
      name: `${data.projectNumber} - ${data.company}: ${data.projectName}`, // Required field for database
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
    icon: any,
    items: Equipment[] | SelectedCamera[],
    isEmpty: boolean,
    stepNumber?: number
  ) => {
    const IconComponent = icon;
    const count = Array.isArray(items) ? items.length : 0;
    
    if (isEmpty) {
      return (
        <Card key={title} className="opacity-50 h-40 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconComponent className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle className="text-sm">{title}</CardTitle>
                <Badge variant="secondary" className="text-xs">0 itens</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="py-4 text-center">
              <span className="text-xs text-muted-foreground">Nenhum item selecionado para esta categoria</span>
            </div>
          </CardContent>
        </Card>
      );
    }

      return (
        <Card key={title} className="min-h-32 border-primary/30 bg-primary/5 animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconComponent className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-sm">{title}</CardTitle>
                  <Badge variant="default" className="text-xs">{count} {count === 1 ? 'item' : 'itens'}</Badge>
                </div>
              </div>
              
              {/* Edit button with tooltip */}
              {count > 0 && stepNumber && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentStep(stepNumber)}
                    >
                      Editar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar seleção de {title.toLowerCase()}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {title === 'Câmeras' ? (
                (items as SelectedCamera[]).map((selectedCamera, index) => (
                  <div key={selectedCamera.camera.id} className="flex justify-between items-center text-sm py-1">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{selectedCamera.camera.name}</div>
                      <div className="text-muted-foreground text-xs truncate">{selectedCamera.camera.brand}</div>
                    </div>
                    {selectedCamera.accessories.length > 0 && (
                      <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                        +{selectedCamera.accessories.length}
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                (items as Equipment[]).map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm py-1">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{item.name}</div>
                      <div className="text-muted-foreground text-xs truncate">{item.brand}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-semibold">Informações do Projeto</h3>
              <p className="text-sm text-muted-foreground mt-1">Preencha os dados básicos do projeto</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectNumber">Número do Projeto *</Label>
                <Input
                  id="projectNumber"
                  value={data.projectNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    updateField('projectNumber', value);
                  }}
                  placeholder="Ex: 398"
                  maxLength={4}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Apenas números, máximo 4 dígitos
                </p>
              </div>

              <div>
                <Label htmlFor="company">Empresa *</Label>
                <Input
                  id="company"
                  value={data.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Ex: Hiro Films"
                />
              </div>

              <div>
                <Label htmlFor="projectName">Nome do Projeto *</Label>
                <Input
                  id="projectName"
                  value={data.projectName}
                  onChange={(e) => updateField('projectName', e.target.value)}
                  placeholder="Ex: Institucional"
                />
              </div>

              {data.projectNumber && data.company && data.projectName && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Nome final do projeto:</p>
                  <p className="text-sm text-muted-foreground">
                    {data.projectNumber} - {data.company}: {data.projectName}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-semibold">Responsável pelo Projeto</h3>
              <p className="text-sm text-muted-foreground mt-1">Selecione quem será responsável por este projeto</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="responsible">Responsável *</Label>
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
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={avatarData.url || undefined} alt={user.display_name || user.email} />
                              <AvatarFallback>{avatarData.initials}</AvatarFallback>
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

              {data.responsibleUserId && (
                <div className="p-3 bg-muted rounded-lg">
                  {(() => {
                    const selectedUser = users.find(u => u.id === data.responsibleUserId);
                    return selectedUser ? (
                      <div className="space-y-1">
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
                        {selectedUser.position && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Cargo:</strong> {selectedUser.position}
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
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-semibold">Datas do Projeto</h3>
              <p className="text-sm text-muted-foreground mt-1">Defina as datas de separação, retirada e devolução</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data.separationDate}
                      onSelect={(date) => updateField('separationDate', date)}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const oneYearFromNow = new Date();
                        oneYearFromNow.setFullYear(today.getFullYear() + 1);
                        
                        return date < today || date > oneYearFromNow;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data.withdrawalDate}
                      onSelect={(date) => updateField('withdrawalDate', date)}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const oneYearFromNow = new Date();
                        oneYearFromNow.setFullYear(today.getFullYear() + 1);
                        
                        if (date < today || date > oneYearFromNow) return true;
                        if (data.separationDate && date < data.separationDate) return true;
                        
                        return false;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data.returnDate}
                      onSelect={(date) => updateField('returnDate', date)}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const oneYearFromNow = new Date();
                        oneYearFromNow.setFullYear(today.getFullYear() + 1);
                        
                        if (date < today || date > oneYearFromNow) return true;
                        if (data.withdrawalDate && date < data.withdrawalDate) return true;
                        
                        return false;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• A data de separação deve ser anterior à data de retirada</p>
              <p>• A data de devolução deve ser posterior à data de retirada</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-lg font-semibold">Tipo de Gravação</h3>
              <p className="text-sm text-muted-foreground mt-1">Escolha o tipo de gravação do projeto</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="recordingType">Tipo de Gravação *</Label>
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
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Tipo selecionado:</p>
                  <p className="text-sm text-muted-foreground">
                    {data.recordingType}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Cameras */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                    <Camera className="h-5 w-5" />
                    <h4 className="font-medium">Câmeras Disponíveis</h4>
                    <Badge variant="secondary">
                      {getAvailableCameras().length} disponíveis
                    </Badge>
                  </div>

                  {equipmentLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : getAvailableCameras().length === 0 ? (
                    <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    <Card className="border-dashed">
                      <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                          <div className="text-center text-sm text-muted-foreground space-y-2">
                            <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="font-medium">Nenhuma câmera disponível</p>
                            <p className="text-xs">Todas as câmeras estão em uso no momento</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                     <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                      {getAvailableCameras().map((cameraHierarchy) => {
                        const isSelected = data.selectedEquipment.cameras.some(
                          selected => selected.camera.id === cameraHierarchy.item.id
                        );
                        return (
                      <Card 
                        key={cameraHierarchy.item.id}
                        className={cn(
                          "transition-all border-2 h-24",
                          isSelected
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                            : "cursor-pointer hover:bg-accent/50 hover-scale hover:border-primary/30 bg-card"
                        )}
                        onClick={() => !isSelected && handleCameraSelect(cameraHierarchy)}
                      >
                          <CardContent className="p-4 h-full">
                            <div className="flex items-center gap-3 h-full">
                              <div className={cn(
                                "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                                isSelected 
                                  ? "bg-green-500/10 border border-green-500/30" 
                                  : "bg-primary/10"
                              )}>
                                {isSelected ? (
                                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                                ) : cameraHierarchy.item.image ? (
                                  <img 
                                    src={cameraHierarchy.item.image} 
                                    alt={cameraHierarchy.item.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Camera className="h-6 w-6 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 h-full">
                                <div className="flex items-center justify-between h-full">
                                  <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {cameraHierarchy.item.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{cameraHierarchy.item.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {cameraHierarchy.item.brand}
                                  </p>
                                  {cameraHierarchy.accessories.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Package className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {cameraHierarchy.accessories.length} acessórios
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  disabled={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelected) handleCameraSelect(cameraHierarchy);
                                  }}
                                  className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    "Selecionar"
                                  )}
                                </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Cameras Preview */}
                <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                     <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-medium">Câmeras Selecionadas</h4>
                    <Badge variant="default">
                      {data.selectedEquipment.cameras.length}
                    </Badge>
                  </div>

                  {data.selectedEquipment.cameras.length === 0 ? (
                    <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    <Card className="border-dashed">
                      <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                          <div className="text-center text-sm text-muted-foreground space-y-2">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="font-medium">Nenhuma câmera selecionada</p>
                            <p className="text-xs">Clique nas câmeras disponíveis para adicioná-las</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                      {data.selectedEquipment.cameras.map((selectedCamera) => (
                        <Card key={selectedCamera.camera.id} className="border-primary/30 bg-primary/5 h-24 animate-fade-in">
                          <CardContent className="p-4 h-full">
                            <div className="flex items-center gap-3 h-full">
                               <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                 <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1 min-w-0 h-full">
                                <div className="flex items-center justify-between h-full">
                                  <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                    <p className="font-medium text-sm truncate">
                                      {selectedCamera.camera.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {selectedCamera.camera.brand}
                                    </p>
                                    {selectedCamera.accessories.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Package className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          {selectedCamera.accessories.length} acessórios
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCameraDeselect(selectedCamera.camera.id);
                                    }}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Summary */}
              {data.selectedEquipment.cameras.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Resumo da Seleção:</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Câmeras:</span>
                      <span className="ml-2 font-medium">
                        {data.selectedEquipment.cameras.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total acessórios:</span>
                      <span className="ml-2 font-medium">
                        {data.selectedEquipment.cameras.reduce((acc, cam) => acc + cam.accessories.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 flex-1 overflow-y-auto animate-fade-in">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search-lenses">Buscar lentes</Label>
              <Input
                id="search-lenses"
                placeholder="Digite nome ou marca..."
                value={searchFilters.lenses}
                onChange={(e) => setSearchFilters(prev => ({
                  ...prev,
                  lenses: e.target.value
                }))}
                className="max-w-md"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Lenses */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Camera className="h-5 w-5" />
                  <h4 className="font-medium">Lentes Disponíveis</h4>
                  <Badge variant="secondary">
                    {filterEquipmentBySearch(getAvailableLenses(), searchFilters.lenses).length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : filterEquipmentBySearch(getAvailableLenses(), searchFilters.lenses).length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground space-y-2">
                          <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="font-medium">Nenhuma lente disponível</p>
                          <p className="text-xs">Todas as lentes estão em uso ou seu filtro não encontrou resultados</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {filterEquipmentBySearch(getAvailableLenses(), searchFilters.lenses).map((lens) => {
                      const isSelected = data.selectedEquipment.lenses.some(l => l.id === lens.id);
                      return (
                      <Card 
                        key={lens.id}
                        className={cn(
                          "transition-all border-2 h-24",
                          isSelected
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                            : "cursor-pointer hover:bg-accent/50 hover-scale hover:border-primary/30 bg-card"
                        )}
                        onClick={() => !isSelected && handleEquipmentSelect(lens, 'lenses')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-primary/10"
                            )}>
                              {isSelected ? (
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                              ) : lens.image ? (
                                <img 
                                  src={lens.image} 
                                  alt={lens.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Camera className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {lens.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{lens.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {lens.brand}
                                  </p>
                                </div>
                                 <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  disabled={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelected) handleEquipmentSelect(lens, 'lenses');
                                  }}
                                  className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    "Selecionar"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Lenses */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                   <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium">Lentes Selecionadas</h4>
                  <Badge variant="default">
                    {data.selectedEquipment.lenses.length}
                  </Badge>
                </div>

                {data.selectedEquipment.lenses.length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground space-y-2">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="font-medium">Nenhuma lente selecionada</p>
                          <p className="text-xs">Clique nas lentes disponíveis para adicioná-las</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.lenses.map((lens) => (
                      <Card key={lens.id} className="border-primary/30 bg-primary/5 h-24 animate-fade-in">
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                             <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <p className="font-medium text-sm truncate">
                                    {lens.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {lens.brand}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentDeselect(lens.id, 'lenses');
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6 flex-1 overflow-y-auto animate-fade-in">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search-accessories">Buscar acessórios</Label>
              <Input
                id="search-accessories"
                placeholder="Digite nome ou marca..."
                value={searchFilters.cameraAccessories}
                onChange={(e) => setSearchFilters(prev => ({
                  ...prev,
                  cameraAccessories: e.target.value
                }))}
                className="max-w-md"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Camera Accessories */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Package className="h-5 w-5" />
                  <h4 className="font-medium">Acessórios Disponíveis</h4>
                  <Badge variant="secondary">
                    {filterEquipmentBySearch(getAvailableCameraAccessories(), searchFilters.cameraAccessories).length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : filterEquipmentBySearch(getAvailableCameraAccessories(), searchFilters.cameraAccessories).length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground space-y-2">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="font-medium">Nenhum acessório disponível</p>
                          <p className="text-xs">Todos os acessórios estão em uso ou seu filtro não encontrou resultados</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {filterEquipmentBySearch(getAvailableCameraAccessories(), searchFilters.cameraAccessories).map((accessory) => {
                      const isSelected = data.selectedEquipment.cameraAccessories.some(a => a.id === accessory.id);
                      return (
                      <Card 
                        key={accessory.id}
                        className={cn(
                          "transition-all border-2 h-24",
                          isSelected
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                            : "cursor-pointer hover:bg-accent/50 hover-scale hover:border-primary/30 bg-card"
                        )}
                        onClick={() => !isSelected && handleEquipmentSelect(accessory, 'cameraAccessories')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-primary/10"
                            )}>
                              {isSelected ? (
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                              ) : accessory.image ? (
                                <img 
                                  src={accessory.image} 
                                  alt={accessory.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {accessory.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{accessory.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {accessory.brand} • {accessory.subcategory}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  disabled={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelected) handleEquipmentSelect(accessory, 'cameraAccessories');
                                  }}
                                  className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    "Selecionar"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Camera Accessories */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                   <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium">Acessórios Selecionados</h4>
                  <Badge variant="default">
                    {data.selectedEquipment.cameraAccessories.length}
                  </Badge>
                </div>

                {data.selectedEquipment.cameraAccessories.length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground space-y-2">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="font-medium">Nenhum acessório selecionado</p>
                          <p className="text-xs">Clique nos acessórios disponíveis para adicioná-los</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.cameraAccessories.map((accessory) => (
                      <Card key={accessory.id} className="border-primary/30 bg-primary/5 h-24 animate-fade-in">
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                             <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <p className="font-medium text-sm truncate">
                                    {accessory.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {accessory.brand} • {accessory.subcategory}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentDeselect(accessory.id, 'cameraAccessories');
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Tripods */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Settings className="h-5 w-5" />
                  <h4 className="font-medium">Equipamentos Disponíveis</h4>
                  <Badge variant="secondary">
                    {getAvailableTripods().length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : getAvailableTripods().length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    <Card className="border-dashed">
                      <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum equipamento disponível
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {getAvailableTripods().map((tripod) => {
                      const isSelected = data.selectedEquipment.tripods.some(t => t.id === tripod.id);
                      return (
                      <Card 
                        key={tripod.id}
                        className={cn(
                          "transition-all border-2 h-24",
                          isSelected
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                            : "cursor-pointer hover:bg-muted/50 hover:border-primary/20 bg-card"
                        )}
                        onClick={() => !isSelected && handleEquipmentSelect(tripod, 'tripods')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-primary/10"
                            )}>
                              {isSelected ? (
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                              ) : tripod.image ? (
                                <img 
                                  src={tripod.image} 
                                  alt={tripod.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Settings className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {tripod.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{tripod.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {tripod.brand} • {tripod.subcategory}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  disabled={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelected) handleEquipmentSelect(tripod, 'tripods');
                                  }}
                                  className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    "Selecionar"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Tripods */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                   <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium">Equipamentos Selecionados</h4>
                  <Badge variant="default">
                    {data.selectedEquipment.tripods.length}
                  </Badge>
                </div>

                {data.selectedEquipment.tripods.length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum equipamento selecionado
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.tripods.map((tripod) => (
                      <Card key={tripod.id} className="border-primary/20 h-24">
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                             <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <p className="font-medium text-sm truncate">
                                    {tripod.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {tripod.brand} • {tripod.subcategory}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentDeselect(tripod.id, 'tripods');
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Lights */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Lightbulb className="h-5 w-5" />
                  <h4 className="font-medium">Luzes Disponíveis</h4>
                  <Badge variant="secondary">
                    {getAvailableLights().length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : getAvailableLights().length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma luz disponível
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {getAvailableLights().map((light) => {
                      const isSelected = data.selectedEquipment.lights.some(l => l.id === light.id);
                      return (
                      <Card 
                        key={light.id}
                        className={cn(
                          "transition-all border-2 h-24",
                          isSelected
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                            : "cursor-pointer hover:bg-muted/50 hover:border-primary/20 bg-card"
                        )}
                        onClick={() => !isSelected && handleEquipmentSelect(light, 'lights')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-primary/10"
                            )}>
                              {isSelected ? (
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                              ) : light.image ? (
                                <img 
                                  src={light.image} 
                                  alt={light.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Lightbulb className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {light.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{light.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {light.brand}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  disabled={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelected) handleEquipmentSelect(light, 'lights');
                                  }}
                                  className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    "Selecionar"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Lights */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                   <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium">Luzes Selecionadas</h4>
                  <Badge variant="default">
                    {data.selectedEquipment.lights.length}
                  </Badge>
                </div>

                {data.selectedEquipment.lights.length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma luz selecionada
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.lights.map((light) => (
                      <Card key={light.id} className="border-primary/20 h-24">
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                             <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <p className="font-medium text-sm truncate">
                                    {light.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {light.brand}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentDeselect(light.id, 'lights');
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Light Modifiers */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Settings className="h-5 w-5" />
                  <h4 className="font-medium">Modificadores Disponíveis</h4>
                  <Badge variant="secondary">
                    {getAvailableLightModifiers().length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : getAvailableLightModifiers().length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum modificador disponível
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {getAvailableLightModifiers().map((modifier) => {
                      const isSelected = data.selectedEquipment.lightModifiers.some(m => m.id === modifier.id);
                      return (
                      <Card 
                        key={modifier.id}
                        className={cn(
                          "transition-all border-2 h-24",
                          isSelected
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                            : "cursor-pointer hover:bg-muted/50 hover:border-primary/20 bg-card"
                        )}
                        onClick={() => !isSelected && handleEquipmentSelect(modifier, 'lightModifiers')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-primary/10"
                            )}>
                              {isSelected ? (
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                              ) : modifier.image ? (
                                <img 
                                  src={modifier.image} 
                                  alt={modifier.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Settings className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {modifier.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{modifier.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {modifier.brand} • {modifier.subcategory}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  disabled={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelected) handleEquipmentSelect(modifier, 'lightModifiers');
                                  }}
                                  className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    "Selecionar"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Light Modifiers */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                   <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium">Modificadores Selecionados</h4>
                  <Badge variant="default">
                    {data.selectedEquipment.lightModifiers.length}
                  </Badge>
                </div>

                {data.selectedEquipment.lightModifiers.length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum modificador selecionado
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.lightModifiers.map((modifier) => (
                      <Card key={modifier.id} className="border-primary/20 h-24">
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                             <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <p className="font-medium text-sm truncate">
                                    {modifier.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {modifier.brand} • {modifier.subcategory}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentDeselect(modifier.id, 'lightModifiers');
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 11:
        return (
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Machinery */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Cog className="h-5 w-5" />
                  <h4 className="font-medium">Maquinário Disponível</h4>
                  <Badge variant="secondary">
                    {getAvailableMachinery().length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : getAvailableMachinery().length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Cog className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum maquinário disponível
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {getAvailableMachinery().map((machine) => {
                      const isSelected = data.selectedEquipment.machinery.some(m => m.id === machine.id);
                      return (
                      <Card 
                        key={machine.id}
                        className={cn(
                          "transition-all border-2 h-24",
                          isSelected
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                            : "cursor-pointer hover:bg-muted/50 hover:border-primary/20 bg-card"
                        )}
                        onClick={() => !isSelected && handleEquipmentSelect(machine, 'machinery')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-primary/10"
                            )}>
                              {isSelected ? (
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                              ) : machine.image ? (
                                <img 
                                  src={machine.image} 
                                  alt={machine.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Cog className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {machine.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{machine.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {machine.brand}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  disabled={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelected) handleEquipmentSelect(machine, 'machinery');
                                  }}
                                  className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    "Selecionar"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Machinery */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                   <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium">Maquinário Selecionado</h4>
                  <Badge variant="default">
                    {data.selectedEquipment.machinery.length}
                  </Badge>
                </div>

                {data.selectedEquipment.machinery.length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum maquinário selecionado
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.machinery.map((machine) => (
                      <Card key={machine.id} className="border-primary/20 h-24">
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                             <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <p className="font-medium text-sm truncate">
                                    {machine.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {machine.brand}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentDeselect(machine.id, 'machinery');
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 12:
        return (
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Electrical */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Zap className="h-5 w-5" />
                  <h4 className="font-medium">Equipamentos Disponíveis</h4>
                  <Badge variant="secondary">
                    {getAvailableElectrical().length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : getAvailableElectrical().length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum equipamento disponível
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {getAvailableElectrical().map((electrical) => {
                      const isSelected = data.selectedEquipment.electrical.some(e => e.id === electrical.id);
                      return (
                      <Card 
                        key={electrical.id}
                        className={cn(
                          "transition-all border-2 h-24",
                          isSelected
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                            : "cursor-pointer hover:bg-muted/50 hover:border-primary/20 bg-card"
                        )}
                        onClick={() => !isSelected && handleEquipmentSelect(electrical, 'electrical')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-primary/10"
                            )}>
                              {isSelected ? (
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                              ) : electrical.image ? (
                                <img 
                                  src={electrical.image} 
                                  alt={electrical.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Zap className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {electrical.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{electrical.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {electrical.brand} • {electrical.subcategory}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  disabled={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelected) handleEquipmentSelect(electrical, 'electrical');
                                  }}
                                  className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    "Selecionar"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Electrical */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                   <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium">Equipamentos Selecionados</h4>
                  <Badge variant="default">
                    {data.selectedEquipment.electrical.length}
                  </Badge>
                </div>

                {data.selectedEquipment.electrical.length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum equipamento selecionado
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.electrical.map((electrical) => (
                      <Card key={electrical.id} className="border-primary/20 h-24">
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                             <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <p className="font-medium text-sm truncate">
                                    {electrical.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {electrical.brand} • {electrical.subcategory}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentDeselect(electrical.id, 'electrical');
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 13:
        return (
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Storage */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <HardDrive className="h-5 w-5" />
                  <h4 className="font-medium">Armazenamento Disponível</h4>
                  <Badge variant="secondary">
                    {getAvailableStorage().length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : getAvailableStorage().length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <HardDrive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum armazenamento disponível
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {getAvailableStorage().map((storage) => {
                      const isSelected = data.selectedEquipment.storage.some(s => s.id === storage.id);
                      return (
                      <Card 
                        key={storage.id}
                        className={cn(
                          "transition-all border-2 h-24",
                          isSelected
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                            : "cursor-pointer hover:bg-muted/50 hover:border-primary/20 bg-card"
                        )}
                        onClick={() => !isSelected && handleEquipmentSelect(storage, 'storage')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-primary/10"
                            )}>
                              {isSelected ? (
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                              ) : storage.image ? (
                                <img 
                                  src={storage.image} 
                                  alt={storage.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <HardDrive className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {storage.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{storage.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {storage.brand} • {storage.subcategory}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  disabled={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelected) handleEquipmentSelect(storage, 'storage');
                                  }}
                                  className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    "Selecionar"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Storage */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                   <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium">Armazenamento Selecionado</h4>
                  <Badge variant="default">
                    {data.selectedEquipment.storage.length}
                  </Badge>
                </div>

                {data.selectedEquipment.storage.length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum armazenamento selecionado
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.storage.map((storage) => (
                      <Card key={storage.id} className="border-primary/20 h-24">
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                             <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <p className="font-medium text-sm truncate">
                                    {storage.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {storage.brand} • {storage.subcategory}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentDeselect(storage.id, 'storage');
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 14:
        return (
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Computers */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Monitor className="h-5 w-5" />
                  <h4 className="font-medium">Computadores Disponíveis</h4>
                  <Badge variant="secondary">
                    {getAvailableComputers().length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : getAvailableComputers().length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum computador disponível
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {getAvailableComputers().map((computer) => {
                      const isSelected = data.selectedEquipment.computers.some(c => c.id === computer.id);
                      return (
                      <Card 
                        key={computer.id}
                        className={cn(
                          "transition-all border-2 h-24",
                          isSelected
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-md cursor-default"
                            : "cursor-pointer hover:bg-muted/50 hover:border-primary/20 bg-card"
                        )}
                        onClick={() => !isSelected && handleEquipmentSelect(computer, 'computers')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              isSelected 
                                ? "bg-green-500/10 border border-green-500/30" 
                                : "bg-primary/10"
                            )}>
                              {isSelected ? (
                                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                              ) : computer.image ? (
                                <img 
                                  src={computer.image} 
                                  alt={computer.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Monitor className="h-6 w-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {computer.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{computer.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {computer.brand}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isSelected ? "default" : "outline"}
                                  disabled={isSelected}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelected) handleEquipmentSelect(computer, 'computers');
                                  }}
                                  className={isSelected ? "bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600" : ""}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Selecionado
                                    </>
                                  ) : (
                                    "Selecionar"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Computers */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium">Computadores Selecionados</h4>
                  <Badge variant="default">
                    {data.selectedEquipment.computers.length}
                  </Badge>
                </div>

                {data.selectedEquipment.computers.length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum computador selecionado
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.computers.map((computer) => (
                      <Card key={computer.id} className="border-primary/20 h-24">
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                             <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                               <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0 h-full">
                              <div className="flex items-center justify-between h-full">
                                <div className="flex-1 min-w-0 mr-3 flex flex-col justify-center">
                                  <p className="font-medium text-sm truncate">
                                    {computer.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {computer.brand}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentDeselect(computer.id, 'computers');
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 15:
        return (
          <div className="space-y-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Resumo da Retirada</h3>
              <Badge variant="default" className="text-base px-4 py-2">
                Total: {getTotalEquipmentCount()} itens
              </Badge>
            </div>
            
            {/* Detailed Summary Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {data.selectedEquipment.cameras.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Câmeras</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {data.selectedEquipment.cameras.reduce((acc, cam) => 
                        acc + cam.accessories.length, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Acessórios de Câmera</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {data.selectedEquipment.lenses.length + 
                       data.selectedEquipment.lights.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Lentes + Luzes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {getTotalEquipmentCount()}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Geral</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Equipment Categories */}
              {renderEquipmentCategoryCard(
                'Câmeras',
                Camera,
                data.selectedEquipment.cameras,
                data.selectedEquipment.cameras.length === 0,
                5
              )}
              
              {renderEquipmentCategoryCard(
                'Lentes',
                Video,
                data.selectedEquipment.lenses,
                data.selectedEquipment.lenses.length === 0,
                6
              )}
              
              {renderEquipmentCategoryCard(
                'Acessórios de Câmera',
                Settings,
                data.selectedEquipment.cameraAccessories,
                data.selectedEquipment.cameraAccessories.length === 0,
                7
              )}
              
              {renderEquipmentCategoryCard(
                'Tripés',
                Box,
                data.selectedEquipment.tripods,
                data.selectedEquipment.tripods.length === 0,
                8
              )}
              
              {renderEquipmentCategoryCard(
                'Iluminação',
                Lightbulb,
                data.selectedEquipment.lights,
                data.selectedEquipment.lights.length === 0,
                9
              )}
              
              {renderEquipmentCategoryCard(
                'Modificadores de Luz',
                Wrench,
                data.selectedEquipment.lightModifiers,
                data.selectedEquipment.lightModifiers.length === 0,
                10
              )}
              
              {renderEquipmentCategoryCard(
                'Máquinas',
                Cog,
                data.selectedEquipment.machinery,
                data.selectedEquipment.machinery.length === 0,
                11
              )}
              
              {renderEquipmentCategoryCard(
                'Elétricos',
                Plug,
                data.selectedEquipment.electrical,
                data.selectedEquipment.electrical.length === 0,
                12
              )}
              
              {renderEquipmentCategoryCard(
                'Armazenamento',
                HardDrive,
                data.selectedEquipment.storage,
                data.selectedEquipment.storage.length === 0,
                13
              )}
              
              {renderEquipmentCategoryCard(
                'Computadores',
                Monitor,
                data.selectedEquipment.computers,
                data.selectedEquipment.computers.length === 0,
                14
              )}
            </div>
            
            {/* Project Information Summary */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informações do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Projeto:</span>
                    <div className="font-medium">{data.projectName}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Empresa:</span>
                    <div className="font-medium">{data.company}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Responsável:</span>
                    <div className="font-medium">{getResponsibleUserName()}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Data de Retirada:</span>
                    <div className="font-medium">{formatDate(data.withdrawalDate)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Data de Retorno:</span>
                    <div className="font-medium">{formatDate(data.returnDate)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Tipo de Gravação:</span>
                    <div className="font-medium">{data.recordingType}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <DialogTitle className="text-base sm:text-lg truncate">Nova Retirada - Passo {currentStep} de 15</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden py-2 sm:py-4 flex flex-col min-h-0">
            {/* Progress bar */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Passo {currentStep} de 15</span>
                <span>{Math.round((currentStep / 15) * 100)}% completo</span>
              </div>
              <Progress value={(currentStep / 15) * 100} className="h-2" />
            </div>

            {renderStep()}
          </div>

          <div className="flex justify-between pt-4 border-t flex-shrink-0">
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
                <>
                  <Button variant="outline" onClick={generatePDF}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                  <Button onClick={handleSubmit} disabled={!isStepValid() || isSubmitting}>
                    <Check className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Criando...' : 'Criar Retirada'}
                  </Button>
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
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={nextStep}
                          >
                            Pular categoria
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Esta categoria é opcional</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : null;
                  })()}
                  
                  <Button
                    onClick={nextStep}
                    disabled={!isStepValid()}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
