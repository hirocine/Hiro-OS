import React from 'react';
import { Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Package, User, Building2, FileText, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { statusLabels } from '@/data/mockProjects';
import { stepLabels, stepColors, stepIcons, getStepProgress, canTransitionTo, stepOrder } from '@/lib/projectSteps';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onComplete?: (projectId: string) => void;
  onArchive?: (projectId: string) => void;
  onStepUpdate?: (projectId: string, step: import('@/types/project').ProjectStep, notes?: string) => void;
}

export function ProjectCard({ project, onEdit, onComplete, onArchive, onStepUpdate }: ProjectCardProps) {
  const { toast } = useToast();
  
  const getStatusVariant = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'default';
    }
  };

  const isOverdue = project.status === 'active' && new Date(project.expectedEndDate) < new Date();
  const StepIcon = stepIcons[project.step];
  const progress = getStepProgress(project.step);

  const getNextStep = () => {
    const currentIndex = stepOrder.indexOf(project.step);
    if (currentIndex < stepOrder.length - 1) {
      return stepOrder[currentIndex + 1];
    }
    return null;
  };

  const getStepActionLabel = (step: import('@/types/project').ProjectStep) => {
    switch (step) {
      case 'separated':
        return 'Marcar como Separado';
      case 'in_use':
        return 'Marcar como Em Uso';
      case 'pending_verification':
        return 'Solicitar Verificação';
      case 'verified':
        return 'Verificar Retorno';
      default:
        return 'Próximo Step';
    }
  };

  const handleQuickStepUpdate = (nextStep: import('@/types/project').ProjectStep) => {
    onStepUpdate?.(project.id, nextStep);
    toast({
      title: "Status atualizado",
      description: `Projeto alterado para: ${stepLabels[nextStep]}`,
    });
  };

  const nextStep = getNextStep();
  const canShowQuickAction = nextStep && project.status === 'active' && canTransitionTo(project.step, nextStep);

  return (
    <Card 
      className={cn(
        "hover:shadow-elegant transition-all duration-300 border-l-4",
        `border-l-${stepColors[project.step]}`
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
            
            {/* Progress indicator */}
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <StepIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Progresso: {Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    `bg-${stepColors[project.step]}`
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1">
              <Badge variant={getStatusVariant(project.status)}>
                {statusLabels[project.status]}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">Atrasado</Badge>
              )}
            </div>
            <Badge variant={stepColors[project.step] as any}>
              <StepIcon className="w-3 h-3 mr-1" />
              {stepLabels[project.step]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(project)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {project.status === 'active' && (
                  <DropdownMenuItem onClick={() => onComplete?.(project.id)}>
                    <Package className="mr-2 h-4 w-4" />
                    Finalizar
                  </DropdownMenuItem>
                )}
                {project.status === 'completed' && (
                  <DropdownMenuItem onClick={() => onArchive?.(project.id)}>
                    <Package className="mr-2 h-4 w-4" />
                    Arquivar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Retirada</p>
              <p className="text-muted-foreground">
                {new Date(project.startDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Devolução</p>
              <p className="text-muted-foreground">
                {project.actualEndDate
                  ? new Date(project.actualEndDate).toLocaleDateString('pt-BR')
                  : new Date(project.expectedEndDate).toLocaleDateString('pt-BR')
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Equipamentos</p>
              <p className="text-muted-foreground">{project.equipmentCount} itens</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Responsável</p>
              <p className="text-muted-foreground">{project.responsibleName}</p>
            </div>
          </div>
        </div>
        
        {project.department && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{project.department}</span>
          </div>
        )}
        
        {project.notes && (
          <div className="text-sm">
            <p className="font-medium mb-1">Observações:</p>
            <p className="text-muted-foreground">{project.notes}</p>
          </div>
        )}
        
        {/* Quick Action Button */}
        {canShowQuickAction && nextStep && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full transition-colors",
                `hover:bg-${stepColors[nextStep]}/10 hover:border-${stepColors[nextStep]} hover:text-${stepColors[nextStep]}`
              )}
              onClick={() => handleQuickStepUpdate(nextStep)}
            >
              {React.createElement(stepIcons[nextStep], { className: "w-4 h-4 mr-2" })}
              {getStepActionLabel(nextStep)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}