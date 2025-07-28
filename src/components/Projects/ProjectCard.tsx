import React from 'react';
import { Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Package, User, Building2, FileText, MoreHorizontal, Archive } from 'lucide-react';
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

  const getAvailableSteps = () => {
    if (project.status === 'active') {
      // Para projetos ativos - lógica atual de transição
      return stepOrder.filter(step => 
        step !== project.step && canTransitionTo(project.step, step)
      );
    } else {
      // Para projetos finalizados/arquivados - qualquer step
      return stepOrder.filter(step => step !== project.step);
    }
  };

  const handleStepChange = (newStep: string) => {
    if (newStep === project.step) return;
    
    const step = newStep as import('@/types/project').ProjectStep;
    onStepUpdate?.(project.id, step);
    toast({
      title: "Status atualizado",
      description: `Projeto alterado para: ${stepLabels[step]}`,
    });
  };

  const availableSteps = getAvailableSteps();
  const showStepSelector = availableSteps.length > 0;

  return (
    <Card 
      className={cn(
        "hover:shadow-elegant transition-all duration-300 border-l-4",
        `border-l-${stepColors[project.step]}`
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
              <Badge variant={getStatusVariant(project.status)}>
                {statusLabels[project.status]}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">Atrasado</Badge>
              )}
              <Badge variant={stepColors[project.step] as any}>
                <StepIcon className="w-3 h-3 mr-1" />
                {stepLabels[project.step]}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
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
      </CardHeader>
      
      <CardContent className="space-y-2">
        {/* Informações principais em grid compacto */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-xs">Retirada</p>
              <p className="text-muted-foreground truncate">
                {new Date(project.startDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-xs">Responsável</p>
              <p className="text-muted-foreground truncate">{project.responsibleName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-xs">Devolução</p>
              <p className="text-muted-foreground truncate">
                {project.actualEndDate
                  ? new Date(project.actualEndDate).toLocaleDateString('pt-BR')
                  : new Date(project.expectedEndDate).toLocaleDateString('pt-BR')
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-xs">Equipamentos</p>
              <p className="text-muted-foreground truncate">{project.equipmentCount} itens</p>
            </div>
          </div>
        </div>
        
        {/* Departamento */}
        {project.department && (
          <div className="flex items-center gap-2 text-sm pt-1">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{project.department}</span>
          </div>
        )}
        
        {/* Observações */}
        {project.notes && (
          <div className="text-sm pt-1">
            <p className="font-medium text-xs mb-1">Observações:</p>
            <p className="text-muted-foreground text-xs leading-relaxed">{project.notes}</p>
          </div>
        )}
        
        {/* Ações e Seletor de Status */}
        <div className="pt-2 border-t border-border/50 space-y-2">
          {/* Botão de Arquivar */}
          {project.status !== 'archived' && onArchive && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onArchive(project.id)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Archive className="h-4 w-4" />
              Arquivar Projeto
            </Button>
          )}
          
          {/* Seletor de Status */}
          {showStepSelector && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">Alterar Status:</span>
              </div>
              <Select onValueChange={handleStepChange} value={project.step}>
                <SelectTrigger className="w-full h-8">
                  <SelectValue placeholder="Selecionar novo status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={project.step} disabled>
                    <div className="flex items-center gap-2">
                      {React.createElement(stepIcons[project.step], { className: "w-4 h-4" })}
                      <span>{stepLabels[project.step]} (atual)</span>
                    </div>
                  </SelectItem>
                  {availableSteps.map((step) => (
                    <SelectItem key={step} value={step}>
                      <div className="flex items-center gap-2">
                        {React.createElement(stepIcons[step], { className: "w-4 h-4" })}
                        <span>{stepLabels[step]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}