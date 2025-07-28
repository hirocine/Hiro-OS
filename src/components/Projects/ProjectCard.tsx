import React from 'react';
import { Project } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const getAvailableSteps = () => {
    if (project.status !== 'active') return [];
    
    return stepOrder.filter(step => 
      step !== project.step && canTransitionTo(project.step, step)
    );
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
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
            
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
        
        {/* Step Selector */}
        {showStepSelector && (
          <div className="pt-2 border-t">
            <Select onValueChange={handleStepChange} value={project.step}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alterar status..." />
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
      </CardContent>
    </Card>
  );
}