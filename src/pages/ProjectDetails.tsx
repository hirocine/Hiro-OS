import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, User, Package, Clock, Edit, Archive, CheckCircle, MoreHorizontal, Trash2, Plus, Truck, Building2, Download, LayoutList, Eye, ChevronUp } from 'lucide-react';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { WithdrawalWorkflow } from '@/components/Projects/WithdrawalWorkflow';
import { ProjectNextStepButton } from '@/components/Projects/ProjectNextStepButton';
import { useProjectDetails } from '@/features/projects';
import { useProjectEquipment, getEquipmentBreakdown } from '@/features/projects';
import { EditProjectDialog } from '@/components/Projects/EditProjectDialog';
import { StepUpdateDialog } from '@/components/Projects/StepUpdateDialog';
import { SeparationDialog } from '@/components/Projects/SeparationDialog';
import { VerificationDialog } from '@/components/Projects/VerificationDialog';
import { CompletionDialog } from '@/components/Projects/CompletionDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { stepLabels, getStatusLabel } from '@/lib/projectLabels';
import { getStepProgress } from '@/lib/projectSteps';
import { DeleteProjectDialog } from '@/components/Projects/DeleteProjectDialog';
import { ProjectEquipmentList } from '@/components/Projects/ProjectEquipmentList';
import { AddEquipmentToProjectDialog } from '@/components/Projects/AddEquipmentToProjectDialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarData } from '@/lib/avatarUtils';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { generateProjectPDF, PDFProjectData } from '@/lib/pdfGenerator';
import { Equipment } from '@/types/equipment';
import { AdminOnly } from '@/components/RoleGuard';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddEquipmentDialog, setShowAddEquipmentDialog] = useState(false);
  const [showSeparationDialog, setShowSeparationDialog] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [responsibleProfile, setResponsibleProfile] = useState<{
    avatar_url: string | null;
    user_metadata: any;
  } | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAllEquipment, setShowAllEquipment] = useState(false);
  
  const {
    project,
    loading,
    error,
    updateProject,
    completeProject,
    archiveProject,
    deleteProject,
    updateProjectStep,
    refetch
  } = useProjectDetails(id!);

  const { equipment: projectEquipment } = useProjectEquipment(id!);
  const equipmentBreakdown = projectEquipment.length > 0 
    ? getEquipmentBreakdown(projectEquipment) 
    : null;

  // Calculate responsible avatar data
  const responsibleAvatarData = useMemo(() => {
    if (!project) {
      return { url: null, initials: 'U' };
    }

    if (!responsibleProfile) {
      return {
        url: null,
        initials: project.responsibleName
          ? project.responsibleName.split(' ').map(n => n[0]).join('').toUpperCase()
          : 'U'
      };
    }
    
    const mockUser = {
      id: project.responsibleUserId || '',
      email: project.responsibleEmail || '',
      user_metadata: responsibleProfile.user_metadata || {},
      app_metadata: { provider: responsibleProfile.user_metadata?.provider }
    } as any;
    
    const avatarData = getAvatarData(
      mockUser,
      responsibleProfile.avatar_url,
      project.responsibleName
    );
    
    return { url: avatarData.url, initials: avatarData.initials };
  }, [responsibleProfile, project]);

  // Listen for add equipment dialog events
  useEffect(() => {
    const handleOpenAddEquipmentDialog = () => {
      setShowAddEquipmentDialog(true);
    };

    window.addEventListener('openAddEquipmentDialog', handleOpenAddEquipmentDialog);
    return () => {
      window.removeEventListener('openAddEquipmentDialog', handleOpenAddEquipmentDialog);
    };
  }, []);

  // Fetch responsible user profile
  useEffect(() => {
    const fetchResponsibleProfile = async () => {
      if (!project?.responsibleUserId) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, user_id')
          .eq('user_id', project.responsibleUserId)
          .maybeSingle();
        
        if (error) throw error;
        
        const { data: userData, error: userError } = await supabase.rpc(
          'get_users_for_admin'
        );
        
        if (!userError && userData) {
          const user = userData.find((u: any) => u.id === project.responsibleUserId);
          if (user) {
            setResponsibleProfile({
              avatar_url: data?.avatar_url,
              user_metadata: user.user_metadata
            });
          }
        } else {
          setResponsibleProfile({
            avatar_url: data?.avatar_url,
            user_metadata: null
          });
        }
      } catch (err) {
        logger.error('Failed to fetch responsible profile', {
          module: 'project-details',
          error: err
        });
      }
    };

    fetchResponsibleProfile();
  }, [project?.responsibleUserId]);

  if (loading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-muted rounded" />
            <div className="h-8 w-64 bg-muted rounded" />
          </div>
          <div className="h-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </ResponsiveContainer>
    );
  }

  if (error || !project) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Retirada não encontrada</h1>
          <p className="text-muted-foreground">{error || 'A retirada solicitada não existe.'}</p>
          <Button onClick={() => navigate('/retiradas')}>Voltar às Retiradas</Button>
        </div>
      </ResponsiveContainer>
    );
  }

  const handleEditProject = (projectId: string, updates: any) => {
    updateProject(updates);
    toast({
      title: "Projeto atualizado",
      description: "As alterações foram salvas com sucesso.",
    });
  };

  const handleCompleteProject = () => {
    completeProject();
    toast({
      title: "Projeto finalizado",
      description: "O projeto foi marcado como finalizado.",
    });
  };

  const handleArchiveProject = () => {
    archiveProject();
    toast({
      title: "Projeto arquivado",
      description: "O projeto foi arquivado com sucesso.",
    });
  };

  const handleUpdateStep = (newStep: any, notes?: string) => {
    updateProjectStep(newStep, notes);
    toast({
      title: "Status atualizado",
      description: `O projeto foi atualizado para "${stepLabels[newStep]}".`,
    });
  };

  const handleSeparationConfirm = (data: { userId: string; userName: string; timestamp: string }) => {
    updateProjectStep('ready_for_pickup', undefined, data);
    setShowSeparationDialog(false);
    toast({
      title: "Separação confirmada",
      description: "Os equipamentos foram separados com sucesso.",
    });
  };

  const handleVerificationConfirm = (data: { userId: string; userName: string; timestamp: string }) => {
    updateProjectStep('pending_verification', undefined, data);
    setShowVerificationDialog(false);
    toast({
      title: "Verificação confirmada",
      description: "O check de desmontagem foi realizado.",
    });
  };

  const handleCompletionConfirm = (data: { userId: string; userName: string; timestamp: string }) => {
    updateProjectStep('verified', undefined, data);
    setShowCompletionDialog(false);
    toast({
      title: "Projeto finalizado",
      description: "O projeto foi concluído com sucesso.",
    });
  };

  const handleOfficeReceiptConfirm = (data: { userId: string; userName: string; receiptTime: string }) => {
    updateProjectStep('office_receipt', undefined, {
      userId: data.userId,
      userName: data.userName,
      timestamp: data.receiptTime
    });
    toast({
      title: "Recebimento confirmado",
      description: "Os equipamentos foram recebidos no escritório.",
    });
  };

  const handleWithdrawalConfirm = (data: { userId: string; userName: string; withdrawalTime: string }) => {
    updateProjectStep('in_use', undefined, {
      userId: data.userId,
      userName: data.userName,
      timestamp: data.withdrawalTime
    });
    toast({
      title: "Retirada confirmada",
      description: "Os equipamentos foram retirados.",
    });
  };

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      await deleteProject();
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído permanentemente.",
        variant: "destructive"
      });
      navigate('/retiradas');
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a retirada.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!project || !projectEquipment) return;
    
    try {
      const pdfData = transformProjectDataForPDF();
      await generateProjectPDF(pdfData);
      
      toast({
        title: "PDF gerado com sucesso",
        description: "O documento foi baixado para o seu dispositivo.",
      });
    } catch (error) {
      logger.error('PDF generation failed', {
        module: 'projects',
        data: { projectId: project.id },
        error
      });
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o documento.",
        variant: "destructive"
      });
    }
  };

  const transformProjectDataForPDF = (): PDFProjectData => {
    const categorizedEquipment: PDFProjectData['selectedEquipment'] = {
      cameras: [],
      lenses: [],
      cameraAccessories: [],
      tripods: [],
      lights: [],
      lightModifiers: [],
      machinery: [],
      electrical: [],
      storage: [],
      computers: []
    };

    const mainEquipment = projectEquipment.filter(eq => {
      const equipment = eq as unknown as Equipment;
      return !equipment.parentId;
    });
    
    const accessoriesMap = new Map<string, Equipment[]>();
    projectEquipment.forEach(eq => {
      const equipment = eq as unknown as Equipment;
      if (equipment.parentId) {
        if (!accessoriesMap.has(equipment.parentId)) {
          accessoriesMap.set(equipment.parentId, []);
        }
        accessoriesMap.get(equipment.parentId)!.push(equipment);
      }
    });

    mainEquipment.forEach(eq => {
      const equipment = eq as unknown as Equipment;
      const accessories = accessoriesMap.get(equipment.id) || [];
      
      if (equipment.category === 'Câmera' && (equipment.subcategory === 'Câmera (Corpo e Acessórios)' || equipment.subcategory === 'Câmera')) {
        categorizedEquipment.cameras.push({ camera: equipment, accessories });
      } else if (equipment.category === 'Câmera' && equipment.subcategory === 'Lente') {
        categorizedEquipment.lenses.push(equipment);
      } else if ((equipment.category === 'Câmera' || equipment.category === 'Acessórios de Câmera') && 
                 ['Acessórios (Câmera)', 'Bateria (Câmera)', 'Carregador (Bateria de Câmera)', 'Filtro', 'Mattebox', 'Adaptador de Lente', 'Bateria', 'Carregador'].includes(equipment.subcategory || '')) {
        categorizedEquipment.cameraAccessories.push(equipment);
      } else if ((equipment.category === 'Tripé de Câmera') ||
                 (equipment.category === 'Movimento' && equipment.subcategory === 'Estabilizador')) {
        categorizedEquipment.tripods.push(equipment);
      } else if (equipment.category === 'Iluminação' && equipment.subcategory === 'Luz') {
        categorizedEquipment.lights.push(equipment);
      } else if (equipment.category === 'Iluminação' && 
                 ['Acessórios (Luz)', 'Modificador'].includes(equipment.subcategory || '')) {
        categorizedEquipment.lightModifiers.push(equipment);
      } else if (equipment.category === 'Produção' && equipment.subcategory === 'Diversos') {
        categorizedEquipment.machinery.push(equipment);
      } else if ((equipment.category === 'Armazenamento' && equipment.subcategory?.includes('Cabo')) ||
                 (equipment.category === 'Monitoração e Transmissão' && equipment.subcategory?.includes('Cabos')) ||
                 (equipment.category === 'Áudio' && equipment.subcategory?.includes('Cabos'))) {
        categorizedEquipment.electrical.push(equipment);
      } else if (equipment.category === 'Armazenamento' && 
                 ['Cartão de Memória', 'Leitor de Cartão', 'SSD/HD (Externo)', 'SSD/HD (Interno)'].includes(equipment.subcategory || '')) {
        categorizedEquipment.storage.push(equipment);
      } else if (equipment.category === 'Tecnologia') {
        categorizedEquipment.computers.push(equipment);
      }
    });

    return {
      projectNumber: project.projectNumber,
      company: project.company,
      projectName: project.name,
      responsibleName: project.responsibleName,
      responsibleDepartment: project.department,
      withdrawalDate: project.withdrawalDate ? new Date(project.withdrawalDate) : undefined,
      returnDate: project.expectedEndDate ? new Date(project.expectedEndDate) : undefined,
      separationDate: project.separationDate ? new Date(project.separationDate) : undefined,
      recordingType: project.recordingType,
      selectedEquipment: categorizedEquipment
    };
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'success';
      case 'archived': return 'secondary';
      default: return 'outline';
    }
  };

  const isOverdue = project.status === 'active' && 
    new Date(project.expectedEndDate) < new Date() && 
    !project.actualEndDate;

  const progress = getStepProgress(project.step);

  return (
    <ResponsiveContainer maxWidth="7xl">
      {/* Header com breadcrumb e ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <BreadcrumbNav 
          items={[
            { label: 'Retiradas', href: '/retiradas' },
            { label: project.name }
          ]}
          className="mb-0"
        />
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={!projectEquipment || projectEquipment.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gerar PDF com lista de equipamentos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {project.status === 'active' && (
                <>
                  <DropdownMenuItem onClick={() => setShowStepDialog(true)}>
                    <Clock className="mr-2 h-4 w-4" />
                    Atualizar Status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCompleteProject}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finalizar Projeto
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchiveProject}>
                    <Archive className="mr-2 h-4 w-4" />
                    Arquivar Projeto
                  </DropdownMenuItem>
                </>
              )}
              <AdminOnly>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Projeto
                </DropdownMenuItem>
              </AdminOnly>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Header Card Consolidado */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {/* Avatar + Title + Badges */}
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 rounded-lg shrink-0">
              <AvatarImage 
                src={responsibleAvatarData.url || undefined} 
                className="object-cover"
              />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg font-semibold">
                {responsibleAvatarData.initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{project.name}</h1>
                <Badge variant={getStatusVariant(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive">Atrasado</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                {project.company && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{project.company}</span>
                  </div>
                )}
                {project.projectNumber && (
                  <span>Nº {project.projectNumber}</span>
                )}
                {project.recordingType && (
                  <span>{project.recordingType}</span>
                )}
                {project.responsibleName && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{project.responsibleName}</span>
                  </div>
                )}
              </div>

              {/* Datas importantes */}
              <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                {project.separationDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="text-muted-foreground">Separação:</span>
                    <span>{format(new Date(project.separationDate), "dd/MM", { locale: ptBR })}</span>
                  </div>
                )}
                {project.withdrawalDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Retirada:</span>
                    <span>{format(new Date(project.withdrawalDate), "dd/MM", { locale: ptBR })}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Devolução:</span>
                  <span>{format(new Date(project.expectedEndDate), "dd/MM", { locale: ptBR })}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-5" />

          {/* Progress + Next Step Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Progresso</p>
                <p className="text-sm text-muted-foreground">
                  Etapa: <span className="font-medium text-foreground">{stepLabels[project.step]}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {project.status === 'active' && (
              <ProjectNextStepButton 
                project={project}
                onStepUpdate={handleUpdateStep}
                className="flex-shrink-0"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Section - Minimal */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-muted">
            <LayoutList className="h-4 w-4 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-medium text-muted-foreground">Etapas do Processo</h2>
        </div>

        <Card>
          <CardContent className="p-3">
            <WithdrawalWorkflow 
              currentStep={project.step}
              stepHistory={project.stepHistory}
              projectStatus={project.status}
              separationUser={{ name: project.separationUserName, time: project.separationTime }}
              withdrawalUser={{ name: project.withdrawalUserName, time: project.withdrawalTime }}
              verificationUser={{ name: project.verificationUserName, time: project.verificationTime }}
              officeReceiptUser={{ name: project.officeReceiptUserName, time: project.officeReceiptTime }}
              completedByUser={{ name: project.completedByUserName, time: project.completedTime }}
              createdByUser={{ name: project.createdByUserName, time: project.createdAt }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="notes">Observações</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Equipamentos Vinculados</CardTitle>
                  <CardDescription className="mt-1">
                    {projectEquipment.length} equipamentos associados a este projeto
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAddEquipmentDialog(true)}
                  size="sm"
                  variant="outline"
                  className="w-fit"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Equipamentos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Resumo por categorias - sempre visível */}
              {equipmentBreakdown && (
                <div className="p-4 bg-muted/50 rounded-lg mb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {equipmentBreakdown}
                  </p>
                </div>
              )}
              
              {/* Lista completa - expansível */}
              {showAllEquipment ? (
                <>
                  <ProjectEquipmentList projectId={project.id} />
                  <Button
                    variant="ghost"
                    className="w-full mt-4"
                    onClick={() => setShowAllEquipment(false)}
                  >
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Ocultar detalhes
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAllEquipment(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver todos os equipamentos
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico do Projeto</CardTitle>
              <CardDescription>
                Registro completo de todas as etapas e ações realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const historyEvents: any[] = [];
                
                historyEvents.push({
                  type: 'creation',
                  title: 'Projeto Criado',
                  timestamp: project.createdAt || project.startDate,
                  user: project.createdByUserName || project.responsibleName,
                  icon: Package
                });
                
                if (project.separationTime) {
                  historyEvents.push({
                    type: 'separation',
                    title: 'Equipamentos Separados',
                    timestamp: project.separationTime,
                    user: project.separationUserName,
                    icon: Package
                  });
                }
                
                project.stepHistory
                  .filter(h => h.notes?.toLowerCase().includes('equipamento'))
                  .forEach(h => {
                    historyEvents.push({
                      type: 'equipment_added',
                      title: 'Equipamento Adicionado',
                      timestamp: h.timestamp,
                      notes: h.notes,
                      user: h.userName,
                      icon: Plus
                    });
                  });
                
                if (project.withdrawalTime) {
                  historyEvents.push({
                    type: 'withdrawal',
                    title: 'Equipamentos Retirados',
                    timestamp: project.withdrawalTime,
                    user: project.withdrawalUserName,
                    icon: Truck
                  });
                }
                
                if (project.verificationTime) {
                  historyEvents.push({
                    type: 'verification',
                    title: 'Check de Desmontagem Realizado',
                    timestamp: project.verificationTime,
                    user: project.verificationUserName,
                    icon: CheckCircle
                  });
                }
                
                if (project.officeReceiptTime) {
                  historyEvents.push({
                    type: 'office_receipt',
                    title: 'Equipamentos Devolvidos',
                    timestamp: project.officeReceiptTime,
                    user: project.officeReceiptUserName,
                    icon: Building2
                  });
                }
                
                if (project.completedTime) {
                  historyEvents.push({
                    type: 'completion',
                    title: 'Projeto Finalizado',
                    timestamp: project.completedTime,
                    user: project.completedByUserName,
                    icon: CheckCircle
                  });
                }
                
                historyEvents.sort((a, b) => 
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                );
                
                return historyEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum histórico disponível</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyEvents.map((event, index) => {
                      const Icon = event.icon;
                      return (
                        <div key={index} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{event.title}</p>
                                {event.user && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Por: {event.user}
                                  </p>
                                )}
                                {event.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {event.notes}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {new Date(event.timestamp).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
              <CardDescription>
                Notas e comentários sobre o projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.notes ? (
                <p className="whitespace-pre-wrap">{project.notes}</p>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma observação adicionada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditProjectDialog
        project={project}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleEditProject}
      />

      <StepUpdateDialog
        project={project}
        open={showStepDialog}
        onOpenChange={setShowStepDialog}
        onUpdate={handleUpdateStep}
      />

      <DeleteProjectDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        projectName={project.name}
        onConfirm={handleDeleteProject}
        loading={isDeleting}
      />

      <AddEquipmentToProjectDialog
        open={showAddEquipmentDialog}
        onOpenChange={setShowAddEquipmentDialog}
        project={project}
        onSuccess={() => refetch()}
      />

      <SeparationDialog
        open={showSeparationDialog}
        onOpenChange={setShowSeparationDialog}
        onConfirm={handleSeparationConfirm}
      />

      <VerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        onConfirm={handleVerificationConfirm}
      />

      <CompletionDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        onConfirm={handleCompletionConfirm}
      />
    </ResponsiveContainer>
  );
}
