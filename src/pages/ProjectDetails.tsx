import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, User, Building, Package, Clock, Edit, Archive, CheckCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { ProjectTimeline } from '@/components/Projects/ProjectTimeline';
import { useProjectDetails } from '@/hooks/useProjectDetails';
import { EditProjectDialog } from '@/components/Projects/EditProjectDialog';
import { StepUpdateDialog } from '@/components/Projects/StepUpdateDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { stepLabels } from '@/lib/projectSteps';
import { useState } from 'react';
import { DeleteProjectDialog } from '@/components/Projects/DeleteProjectDialog';
import { AdminOnly } from '@/components/RoleGuard';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    project,
    loading,
    error,
    updateProject,
    completeProject,
    archiveProject,
    deleteProject,
    updateProjectStep
  } = useProjectDetails(id!);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
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
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Projeto não encontrado</h1>
          <p className="text-muted-foreground">{error || 'O projeto solicitado não existe.'}</p>
          <Button onClick={() => navigate('/projects')}>Voltar aos Projetos</Button>
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

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);
      await deleteProject();
      toast({
        title: "Projeto excluído",
        description: "O projeto foi excluído permanentemente.",
        variant: "destructive"
      });
      navigate('/projects');
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o projeto.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={getStatusVariant(project.status)}>
                {project.status === 'active' ? 'Ativo' : 
                 project.status === 'completed' ? 'Finalizado' : 'Arquivado'}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">Atrasado</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {project.company && `${project.company} • `}
              {project.projectNumber && `Nº ${project.projectNumber}`}
            </p>
          </div>
        </div>

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

      {/* Timeline */}
      <Card className="p-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Status do Projeto</CardTitle>
          <CardDescription>
            Progresso atual: {stepLabels[project.step]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectTimeline 
            currentStep={project.step}
            stepHistory={project.stepHistory}
          />
        </CardContent>
      </Card>

      {/* Project Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
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
            
            <div className="grid grid-cols-2 gap-4">
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
                  <Calendar className="h-4 w-4" />
                  <span>
                    {project.actualEndDate 
                      ? new Date(project.actualEndDate).toLocaleDateString('pt-BR')
                      : new Date(project.expectedEndDate).toLocaleDateString('pt-BR')
                    }
                  </span>
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Equipamentos</label>
              <p className="mt-1 flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>{project.equipmentCount} equipamentos vinculados</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Responsible Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Responsável</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="mt-1">{project.responsibleName}</p>
            </div>
            
            {project.responsibleEmail && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="mt-1">{project.responsibleEmail}</p>
              </div>
            )}
            
            {project.department && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Departamento</label>
                <p className="mt-1 flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>{project.department}</span>
                </p>
              </div>
            )}

            {project.company && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                <p className="mt-1 flex items-center space-x-2">
                  <Building className="h-4 w-4" />
                  <span>{project.company}</span>
                </p>
              </div>
            )}
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
            <CardHeader>
              <CardTitle>Equipamentos Vinculados</CardTitle>
              <CardDescription>
                Lista de equipamentos associados a este projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.equipmentCount === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum equipamento vinculado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {project.equipmentCount} equipamentos vinculados a este projeto
                  </p>
                  {/* TODO: Implementar lista de equipamentos */}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Alterações</CardTitle>
              <CardDescription>
                Registro de todas as mudanças de status do projeto
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.stepHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum histórico disponível</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.stepHistory
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <div key={index} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{stepLabels[entry.step]}</p>
                            <span className="text-sm text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
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
    </div>
  );
}