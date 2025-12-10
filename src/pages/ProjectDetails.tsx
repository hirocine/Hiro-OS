import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, User, Package, Clock, Edit, Archive, CheckCircle, MoreHorizontal, Trash2, Plus, Truck, Building2, Download } from 'lucide-react';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { ProjectTimeline } from '@/components/Projects/ProjectTimeline';
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

// Force rebuild to clear SeparationConfirmationDialog cache

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

  // Calculate responsible avatar data (must be before early returns)
  const responsibleAvatarData = useMemo(() => {
    if (!project) {
      return {
        url: null,
        initials: 'U'
      };
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
    
    return {
      url: avatarData.url,
      initials: avatarData.initials
    };
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
      <div className="container mx-auto p-6 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-muted rounded" />
            <div className="h-8 w-64 bg-muted rounded" />
          </div>
          <div className="h-32 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Retirada não encontrada</h1>
          <p className="text-muted-foreground">{error || 'A retirada solicitada não existe.'}</p>
          <Button onClick={() => navigate('/retiradas')}>Voltar às Retiradas</Button>
        </div>
      </div>
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

    // Separar equipamentos principais e acessórios
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

    // Agrupar equipamentos por categoria mantendo hierarquia
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

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-4 md:space-y-6">
      <BreadcrumbNav 
        items={[
          { label: 'Retiradas', href: '/retiradas' },
          { label: project.name }
        ]} 
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl md:text-3xl font-bold">{project.name}</h1>
              <Badge variant={getStatusVariant(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">Atrasado</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              {project.projectName && (
                <span className="font-medium">{project.projectName}</span>
              )}
              {project.company && (
                <>
                  {project.projectName && <span>•</span>}
                  <span>{project.company}</span>
                </>
              )}
              {project.projectNumber && (
                <>
                  <span>•</span>
                  <span>Nº {project.projectNumber}</span>
                </>
              )}
              {project.recordingType && (
                <>
                  <span>•</span>
                  <span>{project.recordingType}</span>
                </>
              )}
            </div>
          </div>
        </div>

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
                  Baixar PDF
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gerar PDF com lista de equipamentos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Projeto
            </DropdownMenuItem>
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

      {/* Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status da Retirada</CardTitle>
              <CardDescription>
                Progresso atual: {stepLabels[project.step]}
              </CardDescription>
            </div>
            {project.status === 'active' && (
              <ProjectNextStepButton 
                project={project}
                onStepUpdate={handleUpdateStep}
                className="flex-shrink-0"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ProjectTimeline 
            currentStep={project.step}
            stepHistory={project.stepHistory}
            projectStatus={project.status}
          />
        </CardContent>
      </Card>

      {/* Project Info - Consolidated */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Informações do Projeto</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Descrição</label>
              <p className="mt-1">{project.description}</p>
            </div>
          )}
          
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {project.separationDate && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Data de Separação</label>
          <p className="mt-1 flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-orange-500" />
            <span>{new Date(project.separationDate).toLocaleDateString('pt-BR')}</span>
          </p>
        </div>
      )}
            
      {project.withdrawalDate && (
        <div>
          <label className="text-sm font-medium text-muted-foreground">Data de Retirada</label>
          <p className="mt-1 flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-red-500" />
            <span>{new Date(project.withdrawalDate).toLocaleDateString('pt-BR')}</span>
          </p>
        </div>
      )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
              <p className="mt-1 flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(project.startDate).toLocaleDateString('pt-BR')}</span>
              </p>
            </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground">
          {project.actualEndDate ? 'Data de Finalização' : 'Previsão de Fim'}
        </label>
        <p className="mt-1 flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-green-500" />
          <span>
            {project.actualEndDate 
              ? new Date(project.actualEndDate).toLocaleDateString('pt-BR')
              : new Date(project.expectedEndDate).toLocaleDateString('pt-BR')
            }
          </span>
        </p>
      </div>
          </div>

          <Separator className="my-4" />

          <div>
            <label className="text-sm font-medium text-muted-foreground">Responsável</label>
            <div className="mt-2 flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={responsibleAvatarData.url || undefined} 
                  alt={project.responsibleName} 
                />
                <AvatarFallback className="text-sm font-medium">
                  {responsibleAvatarData.initials}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{project.responsibleName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="equipment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="notes">Observações</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos Vinculados</CardTitle>
              <CardDescription>
                Lista de equipamentos associados a este projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {equipmentBreakdown || `${project.equipmentCount} equipamentos vinculados a este projeto`}
                </span>
                <Button 
                  onClick={() => setShowAddEquipmentDialog(true)}
                  size="sm"
                  variant="outline"
                >
                  Adicionar Equipamentos
                </Button>
              </div>
              <ProjectEquipmentList projectId={project.id} />
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
                
                // 1. Criação do projeto
                historyEvents.push({
                  type: 'creation',
                  title: 'Projeto Criado',
                  timestamp: project.createdAt || project.startDate,
                  user: project.createdByUserName || project.responsibleName,
                  icon: Package
                });
                
                // 2. Separação
                if (project.separationTime) {
                  historyEvents.push({
                    type: 'separation',
                    title: 'Equipamentos Separados',
                    timestamp: project.separationTime,
                    user: project.separationUserName,
                    icon: Package
                  });
                }
                
                // 3. Equipamentos adicionados (do stepHistory)
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
                
                // 4. Retirada
                if (project.withdrawalTime) {
                  historyEvents.push({
                    type: 'withdrawal',
                    title: 'Equipamentos Retirados',
                    timestamp: project.withdrawalTime,
                    user: project.withdrawalUserName,
                    icon: Truck
                  });
                }
                
                // 5. Check Desmontagem
                if (project.verificationTime) {
                  historyEvents.push({
                    type: 'verification',
                    title: 'Check de Desmontagem Realizado',
                    timestamp: project.verificationTime,
                    user: project.verificationUserName,
                    icon: CheckCircle
                  });
                }
                
                // 6. Devolução
                if (project.officeReceiptTime) {
                  historyEvents.push({
                    type: 'office_receipt',
                    title: 'Equipamentos Devolvidos',
                    timestamp: project.officeReceiptTime,
                    user: project.officeReceiptUserName,
                    icon: Building2
                  });
                }
                
                // 7. Finalização
                if (project.completedTime) {
                  historyEvents.push({
                    type: 'completion',
                    title: 'Projeto Finalizado',
                    timestamp: project.completedTime,
                    user: project.completedByUserName,
                    icon: CheckCircle
                  });
                }
                
                // Ordenar por timestamp (mais recente primeiro)
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
        onSuccess={() => {
          // Trigger a refresh of project data
          refetch();
        }}
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
    </div>
  );
}