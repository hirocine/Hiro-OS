import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Calendar,
  User,
  Package,
  Clock,
  Edit,
  Archive,
  CheckCircle,
  MoreHorizontal,
  Trash2,
  Plus,
  Truck,
  Building2,
  Download,
  LayoutList,
  Eye,
  ChevronUp,
  History,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { WithdrawalWorkflow } from '@/components/Projects/WithdrawalWorkflow';
import { ProjectNextStepButton } from '@/components/Projects/ProjectNextStepButton';
import { useProjectDetails } from '@/features/projects';
import { useProjectEquipment, getEquipmentBreakdown } from '@/features/projects';
import { EditProjectDialog } from '@/components/Projects/EditProjectDialog';
import { StepUpdateDialog } from '@/components/Projects/StepUpdateDialog';
import { SeparationDialog } from '@/components/Projects/SeparationDialog';
import { VerificationDialog } from '@/components/Projects/VerificationDialog';
import { CompletionDialog } from '@/components/Projects/CompletionDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const sectionWrap: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const sectionHeader: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
};

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-2))',
};

const displayFont: React.CSSProperties = {
  fontFamily: '"HN Display", sans-serif',
};

interface StatusPillProps {
  status: string;
  label: string;
}

function StatusPill({ status, label }: StatusPillProps) {
  let color = 'hsl(var(--ds-fg-2))';
  let bg = 'hsl(var(--ds-line-2) / 0.3)';
  let border = 'hsl(var(--ds-line-1))';

  if (status === 'active') {
    color = 'hsl(var(--ds-accent))';
    bg = 'hsl(var(--ds-accent) / 0.08)';
    border = 'hsl(var(--ds-accent) / 0.3)';
  } else if (status === 'completed') {
    color = 'hsl(var(--ds-success))';
    bg = 'hsl(var(--ds-success) / 0.08)';
    border = 'hsl(var(--ds-success) / 0.3)';
  } else if (status === 'archived') {
    color = 'hsl(var(--ds-fg-3))';
    bg = 'hsl(var(--ds-line-2) / 0.3)';
    border = 'hsl(var(--ds-line-1))';
  }

  return (
    <span
      className="pill"
      style={{ color, background: bg, borderColor: border }}
    >
      {label}
    </span>
  );
}

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
    refetch,
  } = useProjectDetails(id!);

  const { equipment: projectEquipment } = useProjectEquipment(id!);
  const equipmentBreakdown = projectEquipment.length > 0 ? getEquipmentBreakdown(projectEquipment) : null;

  // Calculate responsible avatar data
  const responsibleAvatarData = useMemo(() => {
    if (!project) {
      return { url: null, initials: 'U' };
    }

    if (!responsibleProfile) {
      return {
        url: null,
        initials: project.responsibleName
          ? project.responsibleName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
          : 'U',
      };
    }

    const mockUser = {
      id: project.responsibleUserId || '',
      email: project.responsibleEmail || '',
      user_metadata: responsibleProfile.user_metadata || {},
      app_metadata: { provider: responsibleProfile.user_metadata?.provider },
    } as any;

    const avatarData = getAvatarData(mockUser, responsibleProfile.avatar_url, project.responsibleName);

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

        const { data: userData, error: userError } = await supabase.rpc('get_users_for_admin');

        if (!userError && userData) {
          const user = userData.find((u: any) => u.id === project.responsibleUserId);
          if (user) {
            setResponsibleProfile({
              avatar_url: data?.avatar_url,
              user_metadata: user.user_metadata,
            });
          }
        } else {
          setResponsibleProfile({
            avatar_url: data?.avatar_url,
            user_metadata: null,
          });
        }
      } catch (err) {
        logger.error('Failed to fetch responsible profile', {
          module: 'project-details',
          error: err,
        });
      }
    };

    fetchResponsibleProfile();
  }, [project?.responsibleUserId]);

  if (loading) {
    return (
      <div className="ds-shell ds-page">
        <div className="ds-page-inner" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="animate-pulse" style={{ height: 32, width: 240, background: 'hsl(var(--ds-line-2))' }} />
          <div className="animate-pulse" style={{ height: 192, background: 'hsl(var(--ds-line-2))' }} />
          <div className="animate-pulse" style={{ height: 256, background: 'hsl(var(--ds-line-2))' }} />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="ds-shell ds-page">
        <div
          className="ds-page-inner"
          style={{
            textAlign: 'center',
            padding: '64px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <h1 className="ph-title" style={{ color: 'hsl(var(--ds-danger))' }}>
            Retirada não encontrada.
          </h1>
          <p style={{ color: 'hsl(var(--ds-fg-3))' }}>{error || 'A retirada solicitada não existe.'}</p>
          <button className="btn primary" onClick={() => navigate('/retiradas')} type="button">
            Voltar às Retiradas
          </button>
        </div>
      </div>
    );
  }

  const handleEditProject = (_projectId: string, updates: any) => {
    updateProject(updates);
    toast({
      title: 'Projeto atualizado',
      description: 'As alterações foram salvas com sucesso.',
    });
  };

  const handleCompleteProject = () => {
    completeProject();
    toast({
      title: 'Projeto finalizado',
      description: 'O projeto foi marcado como finalizado.',
    });
  };

  const handleArchiveProject = () => {
    archiveProject();
    toast({
      title: 'Projeto arquivado',
      description: 'O projeto foi arquivado com sucesso.',
    });
  };

  const handleUpdateStep = (newStep: any, notes?: string) => {
    updateProjectStep(newStep, notes);
    toast({
      title: 'Status atualizado',
      description: `O projeto foi atualizado para "${stepLabels[newStep as keyof typeof stepLabels]}".`,
    });
  };

  const handleSeparationConfirm = (data: { userId: string; userName: string; timestamp: string }) => {
    updateProjectStep('ready_for_pickup', undefined, data);
    setShowSeparationDialog(false);
    toast({
      title: 'Separação confirmada',
      description: 'Os equipamentos foram separados com sucesso.',
    });
  };

  const handleVerificationConfirm = (data: { userId: string; userName: string; timestamp: string }) => {
    updateProjectStep('pending_verification', undefined, data);
    setShowVerificationDialog(false);
    toast({
      title: 'Verificação confirmada',
      description: 'O check de desmontagem foi realizado.',
    });
  };

  const handleCompletionConfirm = (data: { userId: string; userName: string; timestamp: string }) => {
    updateProjectStep('verified', undefined, data);
    setShowCompletionDialog(false);
    toast({
      title: 'Projeto finalizado',
      description: 'O projeto foi concluído com sucesso.',
    });
  };

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      await deleteProject();
      toast({
        title: 'Projeto excluído',
        description: 'O projeto foi excluído permanentemente.',
        variant: 'destructive',
      });
      navigate('/retiradas');
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a retirada.',
        variant: 'destructive',
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
        title: 'PDF gerado com sucesso',
        description: 'O documento foi baixado para o seu dispositivo.',
      });
    } catch (error) {
      logger.error('PDF generation failed', {
        module: 'projects',
        data: { projectId: project.id },
        error,
      });
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o documento.',
        variant: 'destructive',
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
      computers: [],
    };

    const mainEquipment = projectEquipment.filter((eq) => {
      const equipment = eq as unknown as Equipment;
      return !equipment.parentId;
    });

    const accessoriesMap = new Map<string, Equipment[]>();
    projectEquipment.forEach((eq) => {
      const equipment = eq as unknown as Equipment;
      if (equipment.parentId) {
        if (!accessoriesMap.has(equipment.parentId)) {
          accessoriesMap.set(equipment.parentId, []);
        }
        accessoriesMap.get(equipment.parentId)!.push(equipment);
      }
    });

    mainEquipment.forEach((eq) => {
      const equipment = eq as unknown as Equipment;
      const accessories = accessoriesMap.get(equipment.id) || [];

      if (
        equipment.category === 'Câmera' &&
        (equipment.subcategory === 'Câmera (Corpo e Acessórios)' || equipment.subcategory === 'Câmera')
      ) {
        categorizedEquipment.cameras.push({ camera: equipment, accessories });
      } else if (equipment.category === 'Câmera' && equipment.subcategory === 'Lente') {
        categorizedEquipment.lenses.push(equipment);
      } else if (
        (equipment.category === 'Câmera' || equipment.category === 'Acessórios de Câmera') &&
        [
          'Acessórios (Câmera)',
          'Bateria (Câmera)',
          'Carregador (Bateria de Câmera)',
          'Filtro',
          'Mattebox',
          'Adaptador de Lente',
          'Bateria',
          'Carregador',
        ].includes(equipment.subcategory || '')
      ) {
        categorizedEquipment.cameraAccessories.push(equipment);
      } else if (
        equipment.category === 'Tripé de Câmera' ||
        (equipment.category === 'Movimento' && equipment.subcategory === 'Estabilizador')
      ) {
        categorizedEquipment.tripods.push(equipment);
      } else if (equipment.category === 'Iluminação' && equipment.subcategory === 'Luz') {
        categorizedEquipment.lights.push(equipment);
      } else if (
        equipment.category === 'Iluminação' &&
        ['Acessórios (Luz)', 'Modificador'].includes(equipment.subcategory || '')
      ) {
        categorizedEquipment.lightModifiers.push(equipment);
      } else if (equipment.category === 'Produção' && equipment.subcategory === 'Diversos') {
        categorizedEquipment.machinery.push(equipment);
      } else if (
        (equipment.category === 'Armazenamento' && equipment.subcategory?.includes('Cabo')) ||
        (equipment.category === 'Monitoração e Transmissão' && equipment.subcategory?.includes('Cabos')) ||
        (equipment.category === 'Áudio' && equipment.subcategory?.includes('Cabos'))
      ) {
        categorizedEquipment.electrical.push(equipment);
      } else if (
        equipment.category === 'Armazenamento' &&
        ['Cartão de Memória', 'Leitor de Cartão', 'SSD/HD (Externo)', 'SSD/HD (Interno)'].includes(
          equipment.subcategory || '',
        )
      ) {
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
      selectedEquipment: categorizedEquipment,
    };
  };

  const isOverdue = project.status === 'active' && new Date(project.expectedEndDate) < new Date() && !project.actualEndDate;

  const progress = getStepProgress(project.step);

  const dateMeta: { icon: LucideIcon; color: string; label: string; value: string }[] = [];
  if (project.separationDate) {
    dateMeta.push({
      icon: Calendar,
      color: 'hsl(var(--ds-warning))',
      label: 'Separação',
      value: format(new Date(project.separationDate), 'dd/MM', { locale: ptBR }),
    });
  }
  if (project.withdrawalDate) {
    dateMeta.push({
      icon: Calendar,
      color: 'hsl(var(--ds-accent))',
      label: 'Retirada',
      value: format(new Date(project.withdrawalDate), 'dd/MM', { locale: ptBR }),
    });
  }
  dateMeta.push({
    icon: Calendar,
    color: 'hsl(var(--ds-success))',
    label: 'Devolução',
    value: format(new Date(project.expectedEndDate), 'dd/MM', { locale: ptBR }),
  });

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        {/* Header com breadcrumb e ações */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <BreadcrumbNav
            items={[{ label: 'Retiradas', href: '/retiradas' }, { label: project.name }]}
            className="mb-0"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleDownloadPDF}
                    disabled={!projectEquipment || projectEquipment.length === 0}
                  >
                    <Download size={13} strokeWidth={1.5} />
                    <span>PDF</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Gerar PDF com lista de equipamentos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <button type="button" className="btn" onClick={() => setShowEditDialog(true)}>
              <Edit size={13} strokeWidth={1.5} />
              <span>Editar</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="btn"
                  style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                >
                  <MoreHorizontal size={14} strokeWidth={1.5} />
                </button>
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
                    style={{ color: 'hsl(var(--ds-danger))' }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Projeto
                  </DropdownMenuItem>
                </AdminOnly>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Header Section Consolidado */}
        <div style={{ ...sectionWrap, marginBottom: 24 }}>
          <div style={{ padding: 24 }}>
            {/* Avatar + Title + Pills */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <Avatar className="h-14 w-14 shrink-0" style={{ borderRadius: 0 }}>
                <AvatarImage src={responsibleAvatarData.url || undefined} className="object-cover" />
                <AvatarFallback
                  style={{
                    borderRadius: 0,
                    background: 'hsl(var(--ds-accent) / 0.08)',
                    color: 'hsl(var(--ds-accent))',
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  {responsibleAvatarData.initials}
                </AvatarFallback>
              </Avatar>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h1
                    style={{
                      ...displayFont,
                      fontSize: 22,
                      fontWeight: 700,
                      color: 'hsl(var(--ds-fg-1))',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      margin: 0,
                    }}
                  >
                    {project.name}
                  </h1>
                  <StatusPill status={project.status} label={getStatusLabel(project.status)} />
                  {isOverdue && (
                    <span
                      className="pill"
                      style={{
                        color: 'hsl(var(--ds-danger))',
                        background: 'hsl(var(--ds-danger) / 0.08)',
                        borderColor: 'hsl(var(--ds-danger) / 0.3)',
                      }}
                    >
                      Atrasado
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 8,
                    fontSize: 13,
                    color: 'hsl(var(--ds-fg-3))',
                    flexWrap: 'wrap',
                  }}
                >
                  {project.company && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Building2 size={13} strokeWidth={1.5} />
                      <span>{project.company}</span>
                    </div>
                  )}
                  {project.projectNumber && (
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>Nº {project.projectNumber}</span>
                  )}
                  {project.recordingType && <span>{project.recordingType}</span>}
                  {project.responsibleName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <User size={13} strokeWidth={1.5} />
                      <span>{project.responsibleName}</span>
                    </div>
                  )}
                </div>

                {/* Datas importantes */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginTop: 12,
                    fontSize: 13,
                    flexWrap: 'wrap',
                  }}
                >
                  {dateMeta.map((meta, idx) => {
                    const Icon = meta.icon;
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon size={13} strokeWidth={1.5} style={{ color: meta.color }} />
                        <span style={{ color: 'hsl(var(--ds-fg-3))' }}>{meta.label}:</span>
                        <span style={{ color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
                          {meta.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'hsl(var(--ds-line-1))', margin: '20px 0' }} />

            {/* Progress + Next Step Button */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))', margin: 0 }}>Progresso</p>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', margin: 0 }}>
                    Etapa:{' '}
                    <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{stepLabels[project.step]}</span>
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      background: 'hsl(var(--ds-line-2) / 0.3)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        background: 'hsl(var(--ds-success))',
                        transition: 'width 500ms',
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'hsl(var(--ds-fg-3))',
                      width: 40,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>

              {project.status === 'active' && (
                <ProjectNextStepButton project={project} onStepUpdate={handleUpdateStep} className="flex-shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Workflow Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <LayoutList size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
            <h2 style={eyebrow}>Etapas do Processo</h2>
          </div>

          <div style={sectionWrap}>
            <div style={{ padding: 12 }}>
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
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="equipment" className="space-y-4">
          <TabsList>
            <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="notes">Observações</TabsTrigger>
          </TabsList>

          <TabsContent value="equipment">
            <div style={sectionWrap}>
              <div style={sectionHeader}>
                <span style={eyebrow}>Equipamentos Vinculados</span>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowAddEquipmentDialog(true)}
                >
                  <Plus size={13} strokeWidth={1.5} />
                  <span>Adicionar</span>
                </button>
              </div>
              <div style={{ padding: 18 }}>
                {/* Resumo por categorias - sempre visível */}
                {equipmentBreakdown && (
                  <div
                    style={{
                      padding: 16,
                      background: 'hsl(var(--ds-line-2) / 0.3)',
                      border: '1px solid hsl(var(--ds-line-1))',
                      marginBottom: 16,
                    }}
                  >
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', lineHeight: 1.6, margin: 0 }}>
                      {equipmentBreakdown}
                    </p>
                  </div>
                )}

                {/* Lista completa - expansível */}
                {showAllEquipment ? (
                  <>
                    <ProjectEquipmentList projectId={project.id} />
                    <button
                      type="button"
                      className="btn"
                      style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
                      onClick={() => setShowAllEquipment(false)}
                    >
                      <ChevronUp size={13} strokeWidth={1.5} />
                      <span>Ocultar detalhes</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setShowAllEquipment(true)}
                  >
                    <Eye size={13} strokeWidth={1.5} />
                    <span>Ver todos os equipamentos</span>
                  </button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div style={sectionWrap}>
              <div style={sectionHeader}>
                <div>
                  <span style={eyebrow}>Histórico do Projeto</span>
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4, margin: 0 }}>
                    Registro completo de todas as etapas e ações realizadas
                  </p>
                </div>
              </div>
              <div style={{ padding: 18 }}>
                {(() => {
                  const historyEvents: any[] = [];

                  historyEvents.push({
                    type: 'creation',
                    title: 'Projeto Criado',
                    timestamp: project.createdAt || project.startDate,
                    user: project.createdByUserName || project.responsibleName,
                    icon: Package,
                  });

                  if (project.separationTime) {
                    historyEvents.push({
                      type: 'separation',
                      title: 'Equipamentos Separados',
                      timestamp: project.separationTime,
                      user: project.separationUserName,
                      icon: Package,
                    });
                  }

                  project.stepHistory
                    .filter((h) => h.notes?.toLowerCase().includes('equipamento'))
                    .forEach((h) => {
                      historyEvents.push({
                        type: 'equipment_added',
                        title: 'Equipamento Adicionado',
                        timestamp: h.timestamp,
                        notes: h.notes,
                        user: h.userName,
                        icon: Plus,
                      });
                    });

                  if (project.withdrawalTime) {
                    historyEvents.push({
                      type: 'withdrawal',
                      title: 'Equipamentos Retirados',
                      timestamp: project.withdrawalTime,
                      user: project.withdrawalUserName,
                      icon: Truck,
                    });
                  }

                  if (project.verificationTime) {
                    historyEvents.push({
                      type: 'verification',
                      title: 'Check de Desmontagem Realizado',
                      timestamp: project.verificationTime,
                      user: project.verificationUserName,
                      icon: CheckCircle,
                    });
                  }

                  if (project.officeReceiptTime) {
                    historyEvents.push({
                      type: 'office_receipt',
                      title: 'Equipamentos Devolvidos',
                      timestamp: project.officeReceiptTime,
                      user: project.officeReceiptUserName,
                      icon: Building2,
                    });
                  }

                  if (project.completedTime) {
                    historyEvents.push({
                      type: 'completion',
                      title: 'Projeto Finalizado',
                      timestamp: project.completedTime,
                      user: project.completedByUserName,
                      icon: CheckCircle,
                    });
                  }

                  historyEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                  return historyEvents.length === 0 ? (
                    <EmptyState
                      icon={History}
                      title="Nenhum histórico"
                      description="Nenhum histórico disponível."
                      compact
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {historyEvents.map((event, index) => {
                        const Icon = event.icon;
                        const isLast = index === historyEvents.length - 1;
                        return (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 16,
                              paddingBottom: 16,
                              borderBottom: isLast ? 'none' : '1px solid hsl(var(--ds-line-1))',
                            }}
                          >
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                background: 'hsl(var(--ds-accent) / 0.08)',
                                border: '1px solid hsl(var(--ds-accent) / 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <Icon size={16} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: 8,
                                }}
                              >
                                <div>
                                  <p style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', margin: 0 }}>
                                    {event.title}
                                  </p>
                                  {event.user && (
                                    <p
                                      style={{
                                        fontSize: 13,
                                        color: 'hsl(var(--ds-fg-3))',
                                        marginTop: 4,
                                        margin: 0,
                                      }}
                                    >
                                      Por: {event.user}
                                    </p>
                                  )}
                                  {event.notes && (
                                    <p
                                      style={{
                                        fontSize: 13,
                                        color: 'hsl(var(--ds-fg-3))',
                                        marginTop: 4,
                                        margin: 0,
                                      }}
                                    >
                                      {event.notes}
                                    </p>
                                  )}
                                </div>
                                <span
                                  style={{
                                    fontSize: 13,
                                    color: 'hsl(var(--ds-fg-3))',
                                    whiteSpace: 'nowrap',
                                    fontVariantNumeric: 'tabular-nums',
                                  }}
                                >
                                  {new Date(event.timestamp).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div style={sectionWrap}>
              <div style={sectionHeader}>
                <div>
                  <span style={eyebrow}>Observações</span>
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4, margin: 0 }}>
                    Notas e comentários sobre o projeto
                  </p>
                </div>
              </div>
              <div style={{ padding: 18 }}>
                {project.notes ? (
                  <p
                    style={{
                      whiteSpace: 'pre-wrap',
                      color: 'hsl(var(--ds-fg-1))',
                      fontSize: 13,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {project.notes}
                  </p>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="Nenhuma observação"
                    description="Nenhuma observação adicionada."
                    compact
                  />
                )}
              </div>
            </div>
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
      </div>
    </div>
  );
}
