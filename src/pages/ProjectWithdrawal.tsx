import { useState } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { MobileStepperForm } from '@/components/ui/mobile-stepper-form';
import { getAvatarData } from "@/lib/avatarUtils";
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Camera, Package, Minus, Plus, ChevronDown, ChevronUp, Lightbulb, Settings, Cog, Zap, HardDrive, Monitor, Wrench, Download, Video, Plug, Box, ArrowLeft, X, Building2, User, Clock, FileText, Aperture, Link as LinkIcon, Move3d, Layers, Loader2, Eye, Edit, AlertCircle, Calendar as CalendarIconLucide, Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays } from 'date-fns';
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
  withdrawalUserId?: string;
  withdrawalDate: Date | undefined;
  returnDate: Date | undefined;
  separationDate: Date | undefined;
  withdrawalTime?: string;
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

export default function ProjectWithdrawal() {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const isMobile = useIsMobile();
  
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
    if (type === 'cameras') return;
    
    const currentEquipment = data.selectedEquipment[type] as Equipment[];
    updateField('selectedEquipment', {
      ...data.selectedEquipment,
      [type]: [...currentEquipment, equipment],
    });
  };

  const handleEquipmentDeselect = (equipmentId: string, type: keyof WithdrawalData['selectedEquipment']) => {
    if (type === 'cameras') return;
    
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
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPosition = margin;
      
      // HIRO Logo base64 (simplified representation - in production use actual base64)
      const logoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      // Helper function for header
      const addHeader = () => {
        try {
          doc.addImage(logoData, 'PNG', margin, yPosition, 25, 25);
        } catch (e) {
          // Skip logo if fails
        }
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text('LISTA DE EQUIPAMENTOS', pageWidth / 2, yPosition + 10, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('RETIRADA DE PROJETO', pageWidth / 2, yPosition + 18, { align: 'center' });
        
        // Line separator
        doc.setDrawColor(100, 200, 100);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition + 25, pageWidth - margin, yPosition + 25);
        
        return yPosition + 30;
      };
      
      // Helper function for footer
      const addFooter = (pageNum: number) => {
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        
        const timestamp = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        doc.text(`Documento gerado em: ${timestamp}`, margin, footerY);
        doc.text(`Página ${pageNum}`, pageWidth - margin - 20, footerY);
      };
      
      // Add header
      yPosition = addHeader();
      yPosition += 5;
      
      // === SEÇÃO DE IDENTIFICAÇÃO ===
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('📋 IDENTIFICAÇÃO DO PROJETO', margin + 3, yPosition + 5.5);
      yPosition += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      
      doc.text(`Número: ${data.projectNumber}`, margin + 3, yPosition);
      yPosition += 6;
      doc.text(`Empresa: ${data.company}`, margin + 3, yPosition);
      yPosition += 6;
      doc.text(`Projeto: ${data.projectName}`, margin + 3, yPosition);
      yPosition += 6;
      doc.text(`Tipo de Gravação: ${data.recordingType}`, margin + 3, yPosition);
      yPosition += 10;
      
      // === SEÇÃO DE RESPONSÁVEIS ===
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('👤 RESPONSÁVEIS', margin + 3, yPosition + 5.5);
      yPosition += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const responsibleUser = users.find(user => user.id === data.responsibleUserId);
      doc.text(`Responsável pelo Projeto: ${responsibleUser?.display_name || 'N/A'}`, margin + 3, yPosition);
      if (responsibleUser?.department) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`  Departamento: ${responsibleUser.department}`, margin + 3, yPosition + 5);
        yPosition += 5;
      }
      yPosition += 6;
      
      const withdrawalUser = users.find(user => user.id === data.withdrawalUserId);
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(`Retirada por: ${withdrawalUser?.display_name || 'Mesmo responsável'}`, margin + 3, yPosition);
      yPosition += 10;
      
      // === SEÇÃO DE CRONOGRAMA ===
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('📅 CRONOGRAMA', margin + 3, yPosition + 5.5);
      yPosition += 12;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (data.separationDate) {
        doc.text(`Separação: ${format(data.separationDate, 'dd/MM/yyyy', { locale: ptBR })}`, margin + 3, yPosition);
        yPosition += 6;
      }
      
      if (data.withdrawalDate) {
        doc.text(`Retirada: ${format(data.withdrawalDate, 'dd/MM/yyyy', { locale: ptBR })}`, margin + 3, yPosition);
        yPosition += 6;
      }
      
      if (data.returnDate) {
        doc.text(`Devolução Prevista: ${format(data.returnDate, 'dd/MM/yyyy', { locale: ptBR })}`, margin + 3, yPosition);
        yPosition += 6;
        
        // Calculate days of use
        if (data.withdrawalDate) {
          const days = Math.ceil((data.returnDate.getTime() - data.withdrawalDate.getTime()) / (1000 * 60 * 60 * 24));
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 200, 100);
          doc.text(`Período de uso: ${days} dia${days !== 1 ? 's' : ''}`, margin + 3, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          yPosition += 6;
        }
      }
      yPosition += 8;
      
      // === EQUIPAMENTOS POR CATEGORIA ===
      const categoryData = [
        { 
          title: '📷 CÂMERAS', 
          icon: '📷',
          items: data.selectedEquipment.cameras,
          type: 'cameras'
        },
        { 
          title: '🔍 LENTES', 
          icon: '🔍',
          items: data.selectedEquipment.lenses,
          type: 'lenses'
        },
        { 
          title: '🎥 ACESSÓRIOS DE CÂMERA', 
          icon: '🎥',
          items: data.selectedEquipment.cameraAccessories,
          type: 'accessories'
        },
        { 
          title: '📐 TRIPÉS E ESTABILIZADORES', 
          icon: '📐',
          items: data.selectedEquipment.tripods,
          type: 'tripods'
        },
        { 
          title: '💡 ILUMINAÇÃO', 
          icon: '💡',
          items: data.selectedEquipment.lights,
          type: 'lights'
        },
        { 
          title: '🎨 MODIFICADORES DE LUZ', 
          icon: '🎨',
          items: data.selectedEquipment.lightModifiers,
          type: 'modifiers'
        },
        { 
          title: '⚙️ MAQUINÁRIO', 
          icon: '⚙️',
          items: data.selectedEquipment.machinery,
          type: 'machinery'
        },
        { 
          title: '⚡ ELÉTRICA', 
          icon: '⚡',
          items: data.selectedEquipment.electrical,
          type: 'electrical'
        },
        { 
          title: '💾 ARMAZENAMENTO', 
          icon: '💾',
          items: data.selectedEquipment.storage,
          type: 'storage'
        },
        { 
          title: '💻 COMPUTADORES', 
          icon: '💻',
          items: data.selectedEquipment.computers,
          type: 'computers'
        }
      ];
      
      let totalItems = 0;
      const categorySummary: { name: string; count: number }[] = [];
      
      categoryData.forEach(({ title, items, type }) => {
        if (items.length === 0) return;
        
        // Check if new page needed
        if (yPosition > pageHeight - 60) {
          addFooter(1);
          doc.addPage();
          yPosition = addHeader();
          yPosition += 5;
        }
        
        const categoryCount = type === 'cameras' 
          ? items.reduce((sum: number, cam: any) => sum + 1 + cam.accessories.length, 0)
          : items.length;
        
        totalItems += categoryCount;
        categorySummary.push({ name: title.replace(/[📷🔍🎥📐💡🎨⚙️⚡💾💻]/g, '').trim(), count: categoryCount });
        
        // Category header
        doc.setFillColor(100, 200, 100);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`${title} (${categoryCount} ${categoryCount === 1 ? 'item' : 'itens'})`, margin + 3, yPosition + 5.5);
        yPosition += 12;
        
        // Items
        if (type === 'cameras') {
          items.forEach((selectedCamera: any) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            doc.text(`• ${selectedCamera.camera.name} - ${selectedCamera.camera.brand}`, margin + 5, yPosition);
            yPosition += 5;
            
            selectedCamera.accessories.forEach((acc: any) => {
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(80, 80, 80);
              doc.text(`   ↳ ${acc.name} - ${acc.brand}`, margin + 7, yPosition);
              yPosition += 5;
            });
            
            yPosition += 2;
          });
        } else {
          items.forEach((item: any) => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(40, 40, 40);
            doc.text(`• ${item.name} - ${item.brand}`, margin + 5, yPosition);
            yPosition += 5;
          });
        }
        
        yPosition += 5;
      });
      
      // === SEÇÃO DE RESUMO ===
      if (yPosition > pageHeight - 80) {
        addFooter(1);
        doc.addPage();
        yPosition = addHeader();
        yPosition += 5;
      }
      
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('📊 RESUMO', margin + 3, yPosition + 5.5);
      yPosition += 15;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 200, 100);
      doc.text(`Total de Equipamentos: ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`, margin + 3, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      doc.text('Por Categoria:', margin + 3, yPosition);
      yPosition += 6;
      
      categorySummary.forEach(({ name, count }) => {
        doc.text(`  • ${name}: ${count} ${count === 1 ? 'item' : 'itens'}`, margin + 5, yPosition);
        yPosition += 5;
      });
      
      yPosition += 10;
      
      // === CHECKLIST DE CONFERÊNCIA ===
      if (yPosition > pageHeight - 100) {
        addFooter(1);
        doc.addPage();
        yPosition = addHeader();
        yPosition += 5;
      }
      
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('✓ CHECKLIST DE CONFERÊNCIA', margin + 3, yPosition + 5.5);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Separação
      doc.setFont('helvetica', 'bold');
      doc.text('Separação:', margin + 3, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('Conferido por: ____________________________', margin + 5, yPosition);
      doc.text('Data: ___/___/______', pageWidth - margin - 40, yPosition);
      yPosition += 10;
      
      // Retirada
      doc.setFont('helvetica', 'bold');
      doc.text('Retirada:', margin + 3, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('Conferido por: ____________________________', margin + 5, yPosition);
      doc.text('Data: ___/___/______', pageWidth - margin - 40, yPosition);
      yPosition += 6;
      doc.text('Assinatura: _______________________________', margin + 5, yPosition);
      yPosition += 10;
      
      // Devolução
      doc.setFont('helvetica', 'bold');
      doc.text('Devolução:', margin + 3, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      doc.text('Conferido por: ____________________________', margin + 5, yPosition);
      doc.text('Data: ___/___/______', pageWidth - margin - 40, yPosition);
      yPosition += 6;
      doc.text('Assinatura: _______________________________', margin + 5, yPosition);
      
      // Add footer
      addFooter(1);
      
      // Save PDF
      const fileName = `Lista_Equipamentos_${data.projectNumber}_${format(new Date(), 'ddMMyyyy_HHmm')}.pdf`;
      doc.save(fileName);
      
      enhancedToast.success({
        title: "PDF Gerado",
        description: "Lista de equipamentos profissional baixada com sucesso!"
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
    if (isStepValid() && currentStep < 15) {
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
        return data.withdrawalDate && 
               data.returnDate && 
               data.separationDate &&
               data.returnDate >= data.withdrawalDate;
      case 4:
        return data.recordingType !== '';
      case 5:
        return data.selectedEquipment.cameras.length > 0;
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
        return true; // Optional steps and summary
      default:
        return false;
    }
  };

  const shouldShowSkipButton = (): boolean => {
    if (currentStep < 6 || currentStep > 14) return false;
    
    const categoryMap: Record<number, keyof typeof data.selectedEquipment> = {
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
    if (!category) return false;
    
    const items = data.selectedEquipment[category];
    return Array.isArray(items) && items.length === 0;
  };

  const progressPercentage = (currentStep / 15) * 100;

  // Função para obter o título do step atual
  const getStepTitle = (): string => {
    const titles = [
      'Informações do Projeto',
      'Responsável',
      'Datas',
      'Tipo de Gravação',
      'Câmeras',
      'Lentes',
      'Acessórios de Câmera',
      'Tripés e Estabilizadores',
      'Iluminação',
      'Modificadores de Luz',
      'Maquinário',
      'Elétrica',
      'Armazenamento',
      'Computadores',
      'Revisão e Confirmação'
    ];
    return titles[currentStep - 1] || '';
  };

  // Função para obter a descrição do step atual
  const getStepDescription = (): string | null => {
    const descriptions: Record<number, string> = {
      1: 'Preencha as informações básicas do projeto de retirada',
      2: 'Selecione o responsável pela retirada dos equipamentos',
      3: 'Defina as datas de separação, retirada e devolução',
      4: 'Informe o tipo de gravação que será realizada',
      5: 'Selecione as câmeras e seus acessórios',
      6: 'Adicione lentes necessárias (opcional)',
      7: 'Adicione acessórios adicionais de câmera (opcional)',
      8: 'Adicione tripés e estabilizadores (opcional)',
      9: 'Adicione equipamentos de iluminação (opcional)',
      10: 'Adicione modificadores de luz (opcional)',
      11: 'Adicione maquinário necessário (opcional)',
      12: 'Adicione equipamentos elétricos (opcional)',
      13: 'Adicione dispositivos de armazenamento (opcional)',
      14: 'Adicione computadores necessários (opcional)',
      15: 'Revise todos os dados antes de criar a retirada'
    };
    return descriptions[currentStep] || null;
  };

  // Função para obter o ícone do step atual
  const getStepIcon = () => {
    const icons = [
      <FileText className="h-5 w-5 text-primary" />,
      <User className="h-5 w-5 text-primary" />,
      <Clock className="h-5 w-5 text-primary" />,
      <Video className="h-5 w-5 text-primary" />,
      <Camera className="h-5 w-5 text-primary" />,
      <Aperture className="h-5 w-5 text-primary" />,
      <LinkIcon className="h-5 w-5 text-primary" />,
      <Move3d className="h-5 w-5 text-primary" />,
      <Lightbulb className="h-5 w-5 text-primary" />,
      <Layers className="h-5 w-5 text-primary" />,
      <Settings className="h-5 w-5 text-primary" />,
      <Zap className="h-5 w-5 text-primary" />,
      <HardDrive className="h-5 w-5 text-primary" />,
      <Monitor className="h-5 w-5 text-primary" />,
      <Check className="h-5 w-5 text-primary" />
    ];
    return icons[currentStep - 1] || null;
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
              <Card 
                key={item.id}
                className={cn(
                  "transition-all border",
                  "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-sm"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.brand}</p>
                      </div>
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
                  className="transition-all border cursor-pointer hover:bg-accent"
                  onClick={() => handleEquipmentSelect(item, equipmentType)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.brand}</p>
                        </div>
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
          <div className="space-y-2">
            <Label>Câmeras Selecionadas ({data.selectedEquipment.cameras.length})</Label>
            {data.selectedEquipment.cameras.map(({ camera, accessories }) => (
              <Card 
                key={camera.id}
                className={cn(
                  "transition-all border",
                  "bg-green-50 dark:bg-green-950/20 border-green-500/50 shadow-sm"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center flex-shrink-0">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
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
                      className="transition-all border cursor-pointer hover:bg-accent"
                      onClick={() => handleCameraSelect(cameraHierarchy)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium">{cameraHierarchy.item.name}</p>
                              <p className="text-sm text-muted-foreground">{cameraHierarchy.item.brand}</p>
                            </div>
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
      content: (() => {
        const responsibleName = users.find(u => u.id === data.responsibleUserId)?.display_name || '';
        const withdrawalUserName = users.find(u => u.id === data.withdrawalUserId)?.display_name || '';
        
        const CATEGORIES = [
          { key: 'cameras', name: 'Câmeras', icon: <Camera className="h-5 w-5" />, stepNumber: 6 },
          { key: 'lenses', name: 'Lentes', icon: <Aperture className="h-5 w-5" />, stepNumber: 7 },
          { key: 'cameraAccessories', name: 'Acessórios de Câmera', icon: <Settings className="h-5 w-5" />, stepNumber: 8 },
          { key: 'tripods', name: 'Tripés e Estabilizadores', icon: <Move3d className="h-5 w-5" />, stepNumber: 9 },
          { key: 'lights', name: 'Iluminação', icon: <Lightbulb className="h-5 w-5" />, stepNumber: 10 },
          { key: 'lightModifiers', name: 'Modificadores de Luz', icon: <Layers className="h-5 w-5" />, stepNumber: 11 },
          { key: 'machinery', name: 'Maquinário', icon: <Wrench className="h-5 w-5" />, stepNumber: 12 },
          { key: 'electrical', name: 'Elétrica', icon: <Zap className="h-5 w-5" />, stepNumber: 13 },
          { key: 'storage', name: 'Armazenamento', icon: <HardDrive className="h-5 w-5" />, stepNumber: 14 },
          { key: 'computers', name: 'Computadores', icon: <Monitor className="h-5 w-5" />, stepNumber: 15 },
        ];

        const totalEquipment = flattenSelectedEquipment().length;
        const categoriesWithItems = CATEGORIES.filter(cat => {
          const items = data.selectedEquipment[cat.key as keyof typeof data.selectedEquipment];
          return Array.isArray(items) && items.length > 0;
        }).length;

        const durationDays = data.withdrawalDate && data.separationDate
          ? Math.abs(differenceInDays(new Date(data.separationDate), new Date(data.withdrawalDate)))
          : 0;

        return (
          <div className="space-y-6">
            {/* Estatísticas em Destaque */}
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
                    <p className="text-xl md:text-2xl font-bold">{categoriesWithItems}</p>
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

            {/* Informações do Projeto */}
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
                      {data.withdrawalDate ? format(new Date(data.withdrawalDate), 'dd/MM/yyyy', { locale: ptBR }) : ''}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Quem Retira</Label>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {withdrawalUserName || 'Não especificado'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Data de Separação</Label>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <CalendarIconLucide className="h-4 w-4" />
                      {data.separationDate ? format(new Date(data.separationDate), 'dd/MM/yyyy', { locale: ptBR }) : ''}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Horário</Label>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {data.withdrawalTime || 'Não especificado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipamentos por Categoria */}
            {totalEquipment === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-2">
                    Nenhum equipamento selecionado
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                    Você ainda não selecionou nenhum equipamento para este projeto.
                    Volte aos steps anteriores para adicionar equipamentos.
                  </p>
                  <Button variant="outline" onClick={() => goToStep(6)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Equipamentos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {CATEGORIES.map((category) => {
                  const items = data.selectedEquipment[category.key as keyof typeof data.selectedEquipment];
                  if (!Array.isArray(items) || items.length === 0) return null;
                  
                  return (
                    <AccordionItem value={category.key} key={category.key} className="border-none">
                      <Card className="border-muted hover:border-primary/50 transition-colors">
                        <AccordionTrigger className="hover:no-underline px-4 md:px-6 py-4">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                {category.icon}
                              </div>
                              <div className="text-left">
                                <h3 className="font-semibold text-sm md:text-base">{category.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="font-mono text-xs">
                                {items.length}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  goToStep(category.stepNumber);
                                }}
                              >
                                <Edit className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 md:px-6 pb-4">
                          <div className="space-y-2">
                            {(category.key === 'cameras' ? (items as SelectedCamera[]).map(sc => sc.camera) : items as Equipment[]).map((item: any) => (
                              <div 
                                key={item.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                {item.image_url ? (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name}
                                    className="h-10 w-10 md:h-12 md:w-12 rounded object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 md:h-12 md:w-12 rounded bg-muted flex items-center justify-center">
                                    <Package className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{item.name}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{item.brand}</span>
                                    {item.patrimony_number && (
                                      <>
                                        <span>•</span>
                                        <span className="font-mono">{item.patrimony_number}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs hidden md:inline-flex">
                                  {item.status === 'available' ? 'Disponível' : item.status}
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

            {/* Ações Finais */}
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
      })()
    }
  ];

  const currentStepData = steps[currentStep - 1];

  const renderStep = () => {
    return currentStepData?.content;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header Fixo com Backdrop Blur */}
      <div className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-5">
          {/* Breadcrumb */}
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
          
          {/* Título Principal */}
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
          
          {/* Progress Bar Aprimorado */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs md:text-sm font-medium">
              <span className="text-muted-foreground flex items-center gap-2">
                <span className="hidden sm:inline">Progresso:</span>
                <span className="font-semibold text-foreground">Etapa {currentStep}/15</span>
              </span>
              <span className="text-primary font-bold">{Math.round(progressPercentage)}%</span>
            </div>
            <div 
              role="progressbar" 
              aria-valuenow={progressPercentage} 
              aria-valuemin={0} 
              aria-valuemax={100}
              aria-label={`Progresso: ${Math.round(progressPercentage)}% completo`}
            >
              <Progress value={progressPercentage} className="h-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Scrollável com Animação */}
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
      
      {/* Aria Live Region para Acessibilidade */}
      <div 
        role="status" 
        aria-live="polite" 
        className="sr-only"
      >
        Etapa {currentStep} de 15: {getStepTitle()}
      </div>

      {/* Footer Fixo com Shadow e Melhor Hierarquia */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 sticky bottom-0 shadow-elegant pb-safe">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="w-full sm:w-auto h-11 sm:h-10"
              aria-label="Voltar para etapa anterior"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => navigate('/projects')}
                className="w-full sm:w-auto h-11 sm:h-10"
                aria-label="Cancelar criação de retirada"
              >
                Cancelar
              </Button>

              {currentStep === 15 ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={generatePDF}
                    className="w-full sm:w-auto h-11 sm:h-10 border-primary/50 hover:bg-primary/5"
                    aria-label="Baixar PDF da retirada"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto h-12 sm:h-10 bg-primary hover:bg-primary/90 shadow-lg font-semibold"
                    size="lg"
                    aria-label="Finalizar e criar retirada"
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
                      aria-label="Pular esta categoria"
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
                    aria-label="Avançar para próxima etapa"
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
