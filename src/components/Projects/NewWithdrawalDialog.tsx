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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Camera, Package, Minus, Plus, ChevronDown, ChevronUp, Lightbulb, Settings, Cog, Zap, HardDrive, Monitor, Wrench, Download } from 'lucide-react';
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
    cameraQuantity: number;
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
      cameraQuantity: 1,
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

  const handleCameraQuantityChange = (quantity: number) => {
    const currentQuantity = data.selectedEquipment.cameraQuantity;
    const selectedCameras = data.selectedEquipment.cameras;
    
    if (quantity < selectedCameras.length) {
      // Remove excess cameras
      const newCameras = selectedCameras.slice(0, quantity);
      updateField('selectedEquipment', {
        ...data.selectedEquipment,
        cameraQuantity: quantity,
        cameras: newCameras,
      });
    } else {
      updateField('selectedEquipment', {
        ...data.selectedEquipment,
        cameraQuantity: quantity,
      });
    }
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
    if (type === 'cameras' || type === 'cameraQuantity') return; // Cameras have special handling
    
    const currentEquipment = data.selectedEquipment[type] as Equipment[];
    updateField('selectedEquipment', {
      ...data.selectedEquipment,
      [type]: [...currentEquipment, equipment],
    });
  };

  const handleEquipmentDeselect = (equipmentId: string, type: keyof WithdrawalData['selectedEquipment']) => {
    if (type === 'cameras' || type === 'cameraQuantity') return; // Cameras have special handling
    
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
        return data.withdrawalDate && data.returnDate && data.separationDate;
      case 4:
        return data.recordingType !== '';
      case 5:
        return data.selectedEquipment.cameras.length === data.selectedEquipment.cameraQuantity;
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
          cameraQuantity: 1,
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
    isEmpty: boolean
  ) => {
    const IconComponent = icon;
    const count = Array.isArray(items) ? items.length : 0;
    
    if (isEmpty) {
      return (
        <Card key={title} className="opacity-50 h-40">
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
            <div className="py-4">
              <span className="text-xs text-muted-foreground">Nenhum item selecionado</span>
            </div>
          </CardContent>
        </Card>
      );
    }

      return (
        <Card key={title} className="min-h-32">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <IconComponent className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-sm">{title}</CardTitle>
                <Badge variant="default" className="text-xs">{count} {count === 1 ? 'item' : 'itens'}</Badge>
              </div>
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
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Dados do Projeto</h3>
            
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
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Responsável pelo Projeto</h3>
            
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
                      const initials = user.display_name
                        ? user.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
                        : user.email?.substring(0, 2).toUpperCase() || 'U';
                      
                      return (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || user.email} />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
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
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Datas do Projeto</h3>
            
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
                      disabled={(date) => data.separationDate && date < data.separationDate}
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
                      disabled={(date) => data.withdrawalDate && date < data.withdrawalDate}
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
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Tipo de Gravação</h3>
            
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
            <h3 className="text-lg font-semibold">Seleção de Câmeras</h3>
            
            <div className="space-y-6">
              {/* Camera Quantity Selection */}
              <div className="space-y-3">
                <Label>Quantidade de Câmeras *</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCameraQuantityChange(Math.max(1, data.selectedEquipment.cameraQuantity - 1))}
                    disabled={data.selectedEquipment.cameraQuantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-mono text-lg font-semibold w-8 text-center">
                    {data.selectedEquipment.cameraQuantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCameraQuantityChange(Math.min(10, data.selectedEquipment.cameraQuantity + 1))}
                    disabled={data.selectedEquipment.cameraQuantity >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground ml-2">
                    (máximo 10 câmeras)
                  </span>
                </div>
              </div>

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
                          <div className="text-center text-sm text-muted-foreground">
                            <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            Nenhuma câmera disponível
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                     <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                      {getAvailableCameras().map((cameraHierarchy) => (
                        <Card 
                          key={cameraHierarchy.item.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20 h-24"
                          onClick={() => 
                            data.selectedEquipment.cameras.length < data.selectedEquipment.cameraQuantity && 
                            handleCameraSelect(cameraHierarchy)
                          }
                        >
                          <CardContent className="p-4 h-full">
                            <div className="flex items-center gap-3 h-full">
                              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                {cameraHierarchy.item.image ? (
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
                                    disabled={data.selectedEquipment.cameras.length >= data.selectedEquipment.cameraQuantity}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCameraSelect(cameraHierarchy);
                                    }}
                                  >
                                    Selecionar
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

                {/* Selected Cameras Preview */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                     <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-medium">Câmeras Selecionadas</h4>
                    <Badge variant="default">
                      {data.selectedEquipment.cameras.length} / {data.selectedEquipment.cameraQuantity}
                    </Badge>
                  </div>

                  {data.selectedEquipment.cameras.length === 0 ? (
                    <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    <Card className="border-dashed">
                      <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                          <div className="text-center text-sm text-muted-foreground">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            Nenhuma câmera selecionada
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                      {data.selectedEquipment.cameras.map((selectedCamera) => (
                        <Card key={selectedCamera.camera.id} className="border-primary/20 h-24">
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
                        {data.selectedEquipment.cameras.length} / {data.selectedEquipment.cameraQuantity}
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
          <div className="space-y-6 flex-1 overflow-y-auto">
            <h3 className="text-lg font-semibold">Seleção de Lentes</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Lenses */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Camera className="h-5 w-5" />
                  <h4 className="font-medium">Lentes Disponíveis</h4>
                  <Badge variant="secondary">
                    {getAvailableLenses().length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : getAvailableLenses().length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma lente disponível
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {getAvailableLenses().map((lens) => (
                      <Card 
                        key={lens.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20 h-24"
                        onClick={() => handleEquipmentSelect(lens, 'lenses')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {lens.image ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentSelect(lens, 'lenses');
                                  }}
                                >
                                  Selecionar
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
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma lente selecionada
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.lenses.map((lens) => (
                      <Card key={lens.id} className="border-primary/20 h-24">
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
          <div className="space-y-6 flex-1 overflow-y-auto">
            <h3 className="text-lg font-semibold">Acessórios de Câmera</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Available Camera Accessories */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 flex-shrink-0 mb-4">
                  <Package className="h-5 w-5" />
                  <h4 className="font-medium">Acessórios Disponíveis</h4>
                  <Badge variant="secondary">
                    {getAvailableCameraAccessories().length} disponíveis
                  </Badge>
                </div>

                {equipmentLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : getAvailableCameraAccessories().length === 0 ? (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                  <Card className="border-dashed">
                    <CardContent className="pt-6 flex items-center justify-center" style={{ minHeight: '120px' }}>
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum acessório disponível
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {getAvailableCameraAccessories().map((accessory) => (
                      <Card 
                        key={accessory.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20 h-24"
                        onClick={() => handleEquipmentSelect(accessory, 'cameraAccessories')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {accessory.image ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentSelect(accessory, 'cameraAccessories');
                                  }}
                                >
                                  Selecionar
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
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhum acessório selecionado
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="space-y-3 h-[500px] overflow-y-auto flex-1">
                    {data.selectedEquipment.cameraAccessories.map((accessory) => (
                      <Card key={accessory.id} className="border-primary/20 h-24">
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
            <h3 className="text-lg font-semibold">Tripé e Movimento</h3>
            
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
                    {getAvailableTripods().map((tripod) => (
                      <Card 
                        key={tripod.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20 h-24"
                        onClick={() => handleEquipmentSelect(tripod, 'tripods')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {tripod.image ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentSelect(tripod, 'tripods');
                                  }}
                                >
                                  Selecionar
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
            <h3 className="text-lg font-semibold">Luz</h3>
            
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
                    {getAvailableLights().map((light) => (
                      <Card 
                        key={light.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20 h-24"
                        onClick={() => handleEquipmentSelect(light, 'lights')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {light.image ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentSelect(light, 'lights');
                                  }}
                                >
                                  Selecionar
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
            <h3 className="text-lg font-semibold">Modificadores de Luz</h3>
            
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
                    {getAvailableLightModifiers().map((modifier) => (
                      <Card 
                        key={modifier.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20 h-24"
                        onClick={() => handleEquipmentSelect(modifier, 'lightModifiers')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {modifier.image ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentSelect(modifier, 'lightModifiers');
                                  }}
                                >
                                  Selecionar
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
            <h3 className="text-lg font-semibold">Maquinária</h3>
            
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
                    {getAvailableMachinery().map((machine) => (
                      <Card 
                        key={machine.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20 h-24"
                        onClick={() => handleEquipmentSelect(machine, 'machinery')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {machine.image ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentSelect(machine, 'machinery');
                                  }}
                                >
                                  Selecionar
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
            <h3 className="text-lg font-semibold">Elétrica</h3>
            
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
                    {getAvailableElectrical().map((electrical) => (
                      <Card 
                        key={electrical.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20 h-24"
                        onClick={() => handleEquipmentSelect(electrical, 'electrical')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {electrical.image ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentSelect(electrical, 'electrical');
                                  }}
                                >
                                  Selecionar
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
            <h3 className="text-lg font-semibold">Armazenamento/Log</h3>
            
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
                    {getAvailableStorage().map((storage) => (
                      <Card 
                        key={storage.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20 h-24"
                        onClick={() => handleEquipmentSelect(storage, 'storage')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {storage.image ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentSelect(storage, 'storage');
                                  }}
                                >
                                  Selecionar
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
            <h3 className="text-lg font-semibold">Computador</h3>
            
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
                    {getAvailableComputers().map((computer) => (
                      <Card 
                        key={computer.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20 h-24"
                        onClick={() => handleEquipmentSelect(computer, 'computers')}
                      >
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center gap-3 h-full">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {computer.image ? (
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEquipmentSelect(computer, 'computers');
                                  }}
                                >
                                  Selecionar
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
              <Badge variant="outline" className="text-lg px-3 py-1">
                {getTotalEquipmentCount()} {getTotalEquipmentCount() === 1 ? 'item selecionado' : 'itens selecionados'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Equipment Categories */}
              {renderEquipmentCategoryCard(
                'Câmeras',
                Camera,
                data.selectedEquipment.cameras,
                data.selectedEquipment.cameras.length === 0
              )}
              
              {renderEquipmentCategoryCard(
                'Lentes',
                Zap,
                data.selectedEquipment.lenses,
                data.selectedEquipment.lenses.length === 0
              )}
              
              {renderEquipmentCategoryCard(
                'Acessórios de Câmera',
                Settings,
                data.selectedEquipment.cameraAccessories,
                data.selectedEquipment.cameraAccessories.length === 0
              )}
              
              {renderEquipmentCategoryCard(
                'Tripés',
                Cog,
                data.selectedEquipment.tripods,
                data.selectedEquipment.tripods.length === 0
              )}
              
              {renderEquipmentCategoryCard(
                'Iluminação',
                Lightbulb,
                data.selectedEquipment.lights,
                data.selectedEquipment.lights.length === 0
              )}
              
              {renderEquipmentCategoryCard(
                'Modificadores de Luz',
                Wrench,
                data.selectedEquipment.lightModifiers,
                data.selectedEquipment.lightModifiers.length === 0
              )}
              
              {renderEquipmentCategoryCard(
                'Máquinas',
                Cog,
                data.selectedEquipment.machinery,
                data.selectedEquipment.machinery.length === 0
              )}
              
              {renderEquipmentCategoryCard(
                'Elétricos',
                Zap,
                data.selectedEquipment.electrical,
                data.selectedEquipment.electrical.length === 0
              )}
              
              {renderEquipmentCategoryCard(
                'Armazenamento',
                HardDrive,
                data.selectedEquipment.storage,
                data.selectedEquipment.storage.length === 0
              )}
              
              {renderEquipmentCategoryCard(
                'Computadores',
                Monitor,
                data.selectedEquipment.computers,
                data.selectedEquipment.computers.length === 0
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
            <div className="w-full bg-muted rounded-full h-2 mb-6">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(currentStep / 15) * 100}%` }}
              />
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
    </TooltipProvider>
  );
}
