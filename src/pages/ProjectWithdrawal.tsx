import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { MobileStepperForm } from '@/components/ui/mobile-stepper-form';
import { getAvatarData } from "@/lib/avatarUtils";
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Camera, Package, Minus, Plus, ChevronDown, ChevronUp, Lightbulb, Settings, Cog, Zap, HardDrive, Monitor, Wrench, Download, Video, Plug, Box, ArrowLeft, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

export default function ProjectWithdrawal() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const isMobile = useIsMobile();
  
  const [currentStep, setCurrentStep] = useState(0);
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
  const { equipmentHierarchy, loading: equipmentLoading } = useEquipment();

  const updateField = <K extends keyof WithdrawalData>(field: K, value: WithdrawalData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

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

  const filterEquipmentBySearch = (items: Equipment[], searchTerm: string) => {
    if (!searchTerm.trim()) return items;
    
    const lowerSearch = searchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerSearch) ||
      item.brand.toLowerCase().includes(lowerSearch)
    );
  };

  const handleCameraQuantityChange = (quantity: number) => {
    const selectedCameras = data.selectedEquipment.cameras;
    
    if (quantity < selectedCameras.length) {
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

  const handleEquipmentSelect = (equipment: Equipment, type: keyof WithdrawalData['selectedEquipment']) => {
    if (type === 'cameras' || type === 'cameraQuantity') return;
    
    const currentEquipment = data.selectedEquipment[type] as Equipment[];
    updateField('selectedEquipment', {
      ...data.selectedEquipment,
      [type]: [...currentEquipment, equipment],
    });
  };

  const handleEquipmentDeselect = (equipmentId: string, type: keyof WithdrawalData['selectedEquipment']) => {
    if (type === 'cameras' || type === 'cameraQuantity') return;
    
    const currentEquipment = data.selectedEquipment[type] as Equipment[];
    const updatedEquipment = currentEquipment.filter(item => item.id !== equipmentId);
    
    updateField('selectedEquipment', {
      ...data.selectedEquipment,
      [type]: updatedEquipment,
    });
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

  const flattenSelectedEquipment = (): Equipment[] => {
    const equipment: Equipment[] = [];
    
    data.selectedEquipment.cameras.forEach(({ camera, accessories }) => {
      equipment.push(camera);
      equipment.push(...accessories);
    });
    
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

  const generatePDF = () => {
    try {
      logger.info('Initiating PDF generation', {
        module: 'project-withdrawal',
        action: 'generate_pdf'
      });
      
      if (!data.projectNumber || !data.projectName) {
        enhancedToast.error({
          title: "Erro",
          description: "Dados do projeto incompletos para gerar PDF."
        });
        return;
      }
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = margin;
      
      doc.setFontSize(20);
      doc.text('Lista de Equipamentos - Retirada', margin, yPosition);
      yPosition += 15;
      
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
      
      const tableData: string[][] = [];
      
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
      
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text(`Total de itens: ${tableData.length}`, margin, finalY);
      
      const fileName = `Lista_Equipamentos_${data.projectNumber}_${format(new Date(), 'ddMMyyyy')}.pdf`;
      doc.save(fileName);
      
      enhancedToast.success({
        title: "PDF Gerado",
        description: "Lista de equipamentos baixada com sucesso!"
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
        step: 'pending_separation' as const,
        stepHistory: [],
        equipmentCount: selectedEquipment.length,
        loanIds: []
      };

      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (projectError) throw projectError;

      const loansToCreate = selectedEquipment.map(equipment => ({
        equipment_id: equipment.id,
        equipment_name: equipment.name,
        borrower_name: projectData.responsibleName,
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
      navigate('/projects');
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

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return data.projectNumber.trim() !== '' && 
               data.company.trim() !== '' && 
               data.projectName.trim() !== '' &&
               /^\d{1,4}$/.test(data.projectNumber.trim());
      case 1:
        return data.responsibleUserId !== '';
      case 2:
        return data.withdrawalDate && 
               data.returnDate && 
               data.separationDate &&
               data.returnDate >= data.withdrawalDate;
      case 3:
        return data.recordingType !== '';
      case 4:
        return data.selectedEquipment.cameras.length === data.selectedEquipment.cameraQuantity;
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 13:
      case 14:
        return true;
      default:
        return true;
    }
  };

  const renderEquipmentSelectionStep = (
    title: string,
    icon: React.ReactNode,
    equipmentType: keyof WithdrawalData['selectedEquipment'],
    getAvailableItems: () => Equipment[],
    searchKey: keyof typeof searchFilters
  ) => {
    const selectedItems = data.selectedEquipment[equipmentType] as Equipment[];
    const availableItems = filterEquipmentBySearch(getAvailableItems(), searchFilters[searchKey]);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        {selectedItems.length > 0 && (
          <div className="space-y-2">
            <Label>Selecionados ({selectedItems.length})</Label>
            {selectedItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.brand}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEquipmentDeselect(item.id, equipmentType)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label>Disponíveis</Label>
          <Input
            placeholder="Buscar por nome ou marca..."
            value={searchFilters[searchKey]}
            onChange={(e) => setSearchFilters(prev => ({ ...prev, [searchKey]: e.target.value }))}
          />
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {availableItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum equipamento disponível
              </p>
            ) : (
              availableItems.map((item) => (
                <Card 
                  key={item.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleEquipmentSelect(item, equipmentType)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const steps = [
    {
      title: 'Informações do Projeto',
      content: (
        <div className="space-y-6">
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
            <p className="text-xs text-muted-foreground mt-1">
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
      )
    },
    {
      title: 'Responsável',
      content: (
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
      )
    },
    {
      title: 'Datas',
      content: (
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
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )
    },
    {
      title: 'Tipo de Gravação',
      content: (
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
      )
    },
    {
      title: 'Câmeras',
      content: (
        <div className="space-y-4">
          <div>
            <Label>Quantidade de Câmeras</Label>
            <div className="flex items-center gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCameraQuantityChange(Math.max(1, data.selectedEquipment.cameraQuantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={10}
                value={data.selectedEquipment.cameraQuantity}
                onChange={(e) => handleCameraQuantityChange(parseInt(e.target.value) || 1)}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCameraQuantityChange(Math.min(10, data.selectedEquipment.cameraQuantity + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Câmeras Selecionadas ({data.selectedEquipment.cameras.length}/{data.selectedEquipment.cameraQuantity})</Label>
            {data.selectedEquipment.cameras.map(({ camera, accessories }) => (
              <Card key={camera.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <div>
                        <CardTitle className="text-sm">{camera.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{camera.brand}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCameraDeselect(camera.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {accessories.length > 0 && (
                  <CardContent className="pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => toggleAccessoriesExpansion(camera.id)}
                    >
                      <span className="text-xs">
                        {accessories.length} acessórios incluídos
                      </span>
                      {expandedCameras.has(camera.id) ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                    {expandedCameras.has(camera.id) && (
                      <div className="mt-2 space-y-1 pl-4">
                        {accessories.map((acc) => (
                          <p key={acc.id} className="text-xs text-muted-foreground">
                            • {acc.name}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {data.selectedEquipment.cameras.length < data.selectedEquipment.cameraQuantity && (
            <div className="space-y-2">
              <Label>Câmeras Disponíveis</Label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {getAvailableCameras().length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma câmera disponível
                  </p>
                ) : (
                  getAvailableCameras().map((cameraHierarchy) => (
                    <Card 
                      key={cameraHierarchy.item.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleCameraSelect(cameraHierarchy)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{cameraHierarchy.item.name}</p>
                            <p className="text-sm text-muted-foreground">{cameraHierarchy.item.brand}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {cameraHierarchy.accessories.length > 0 && (
                              <Badge variant="secondary">+{cameraHierarchy.accessories.length}</Badge>
                            )}
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Lentes',
      content: renderEquipmentSelectionStep(
        'Lentes',
        <Video className="h-5 w-5" />,
        'lenses',
        getAvailableLenses,
        'lenses'
      )
    },
    {
      title: 'Acessórios de Câmera',
      content: renderEquipmentSelectionStep(
        'Acessórios de Câmera',
        <Settings className="h-5 w-5" />,
        'cameraAccessories',
        getAvailableCameraAccessories,
        'cameraAccessories'
      )
    },
    {
      title: 'Tripés e Estabilizadores',
      content: renderEquipmentSelectionStep(
        'Tripés e Estabilizadores',
        <Package className="h-5 w-5" />,
        'tripods',
        getAvailableTripods,
        'tripods'
      )
    },
    {
      title: 'Iluminação',
      content: renderEquipmentSelectionStep(
        'Iluminação',
        <Lightbulb className="h-5 w-5" />,
        'lights',
        getAvailableLights,
        'lights'
      )
    },
    {
      title: 'Modificadores de Luz',
      content: renderEquipmentSelectionStep(
        'Modificadores de Luz',
        <Cog className="h-5 w-5" />,
        'lightModifiers',
        getAvailableLightModifiers,
        'lightModifiers'
      )
    },
    {
      title: 'Maquinário',
      content: renderEquipmentSelectionStep(
        'Maquinário',
        <Wrench className="h-5 w-5" />,
        'machinery',
        getAvailableMachinery,
        'machinery'
      )
    },
    {
      title: 'Elétrica',
      content: renderEquipmentSelectionStep(
        'Elétrica',
        <Zap className="h-5 w-5" />,
        'electrical',
        getAvailableElectrical,
        'electrical'
      )
    },
    {
      title: 'Armazenamento',
      content: renderEquipmentSelectionStep(
        'Armazenamento',
        <HardDrive className="h-5 w-5" />,
        'storage',
        getAvailableStorage,
        'storage'
      )
    },
    {
      title: 'Computadores',
      content: renderEquipmentSelectionStep(
        'Computadores',
        <Monitor className="h-5 w-5" />,
        'computers',
        getAvailableComputers,
        'computers'
      )
    },
    {
      title: 'Resumo',
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Projeto:</strong> {data.projectNumber} - {data.company}: {data.projectName}</p>
              <p><strong>Responsável:</strong> {users.find(u => u.id === data.responsibleUserId)?.display_name}</p>
              <p><strong>Tipo:</strong> {data.recordingType}</p>
              <p><strong>Separação:</strong> {data.separationDate ? format(data.separationDate, 'dd/MM/yyyy') : '-'}</p>
              <p><strong>Retirada:</strong> {data.withdrawalDate ? format(data.withdrawalDate, 'dd/MM/yyyy') : '-'}</p>
              <p><strong>Devolução:</strong> {data.returnDate ? format(data.returnDate, 'dd/MM/yyyy') : '-'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equipamentos Selecionados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.selectedEquipment.cameras.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Câmeras</span>
                  <Badge>{data.selectedEquipment.cameras.length}</Badge>
                </div>
              )}
              {data.selectedEquipment.lenses.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Lentes</span>
                  <Badge>{data.selectedEquipment.lenses.length}</Badge>
                </div>
              )}
              {data.selectedEquipment.cameraAccessories.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Acessórios de Câmera</span>
                  <Badge>{data.selectedEquipment.cameraAccessories.length}</Badge>
                </div>
              )}
              {data.selectedEquipment.tripods.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tripés</span>
                  <Badge>{data.selectedEquipment.tripods.length}</Badge>
                </div>
              )}
              {data.selectedEquipment.lights.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Iluminação</span>
                  <Badge>{data.selectedEquipment.lights.length}</Badge>
                </div>
              )}
              {data.selectedEquipment.lightModifiers.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Modificadores de Luz</span>
                  <Badge>{data.selectedEquipment.lightModifiers.length}</Badge>
                </div>
              )}
              {data.selectedEquipment.machinery.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Maquinário</span>
                  <Badge>{data.selectedEquipment.machinery.length}</Badge>
                </div>
              )}
              {data.selectedEquipment.electrical.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Elétrica</span>
                  <Badge>{data.selectedEquipment.electrical.length}</Badge>
                </div>
              )}
              {data.selectedEquipment.storage.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Armazenamento</span>
                  <Badge>{data.selectedEquipment.storage.length}</Badge>
                </div>
              )}
              {data.selectedEquipment.computers.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Computadores</span>
                  <Badge>{data.selectedEquipment.computers.length}</Badge>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-sm">Total de equipamentos</span>
                  <Badge variant="default">{flattenSelectedEquipment().length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={generatePDF}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <ResponsiveContainer maxWidth="4xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nova Retirada</h1>
            <p className="text-sm text-muted-foreground">
              Crie um novo projeto de retirada de equipamentos
            </p>
          </div>
        </div>

        <MobileStepperForm
          steps={steps}
          currentStep={currentStep}
          onStepChange={(step) => {
            if (step > currentStep && !isStepValid(currentStep)) {
              enhancedToast.error({
                title: "Atenção",
                description: "Preencha todos os campos obrigatórios antes de continuar."
              });
              return;
            }
            setCurrentStep(step);
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitText="Criar Retirada"
        />
      </div>
    </ResponsiveContainer>
  );
}
