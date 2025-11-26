import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, User, Building, Package, Eye, MoreHorizontal, Edit, CheckCircle, Archive, Clock } from 'lucide-react';
import { Project } from '@/types/project';
import { stepLabels, stepColors } from '@/lib/projectSteps';
import { cn } from '@/lib/utils';
import { getStatusLabel } from '@/lib/projectLabels';

interface ProjectSummaryCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onComplete?: (projectId: string) => void;
  onArchive?: (projectId: string) => void;
}

export function ProjectSummaryCard({ project, onEdit, onComplete, onArchive }: ProjectSummaryCardProps) {
  const navigate = useNavigate();

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

  const handleViewDetails = () => {
    navigate(`/retiradas/${project.id}`);
  };

  const getStepBorderColor = (step: string) => {
    const colors: Record<string, string> = {
      'pending_separation': 'border-l-step-separation',
      'ready_for_pickup': 'border-l-step-pickup',
      'in_use': 'border-l-step-use',
      'pending_verification': 'border-l-step-verification',
      'office_receipt': 'border-l-step-receipt',
      'verified': 'border-l-step-verified'
    };
    return colors[step] || 'border-l-primary';
  };

  return (
    <Card className={cn(
      "hover:shadow-lg hover:scale-[1.01] transition-all duration-300 cursor-pointer group border-l-4 overflow-hidden",
      getStepBorderColor(project.step)
    )}>
      <CardContent className="p-5 md:p-6">
        {/* Header with project info and menu */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0" onClick={handleViewDetails}>
            {/* Project Number */}
            {project.projectNumber && (
              <p className="text-xs font-medium text-muted-foreground/70 mb-1">
                Nº {project.projectNumber}
              </p>
            )}
            
            {/* Project Name with inline badges */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-xl leading-tight group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <Badge variant={getStatusVariant(project.status)} className="shrink-0 text-xs">
                {getStatusLabel(project.status)}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="shrink-0 text-xs">
                  Atrasado
                </Badge>
              )}
            </div>
            
            {/* Company */}
            {project.company && (
              <p className="text-sm text-muted-foreground/80 truncate">
                {project.company}
              </p>
            )}
          </div>

          {/* Action Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="shrink-0 ml-2 h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleViewDetails}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {project.status === 'active' && (
                <>
                  <DropdownMenuSeparator />
                  {onComplete && (
                    <DropdownMenuItem onClick={() => onComplete(project.id)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Finalizar
                    </DropdownMenuItem>
                  )}
                  {onArchive && (
                    <DropdownMenuItem onClick={() => onArchive(project.id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      Arquivar
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div onClick={handleViewDetails}>
          {/* Current Step Badge */}
          <div className="mb-4">
            <Badge 
              variant={stepColors[project.step] as any}
              className="text-sm px-3 py-1"
            >
              {stepLabels[project.step]}
            </Badge>
          </div>

          {/* Project Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {/* Responsible */}
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{project.responsibleName}</p>
                {project.department && (
                  <p className="text-xs text-muted-foreground/70 truncate">{project.department}</p>
                )}
              </div>
            </div>

            {/* Equipment Count */}
            <div className="flex items-start gap-3">
              <Package className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{project.equipmentCount} equipamentos</p>
                <p className="text-xs text-muted-foreground/70">Vinculados</p>
              </div>
            </div>

            {/* Start Date */}
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {new Date(project.startDate).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground/70">Data de início</p>
              </div>
            </div>

            {/* End Date */}
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  isOverdue && "text-destructive"
                )}>
                  {project.actualEndDate 
                    ? new Date(project.actualEndDate).toLocaleDateString('pt-BR')
                    : new Date(project.expectedEndDate).toLocaleDateString('pt-BR')
                  }
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {project.actualEndDate ? 'Finalizado em' : 'Previsão de fim'}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground/80 line-clamp-2">
                {project.description}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewDetails}
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Projeto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}