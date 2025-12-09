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
      "hover:shadow-lg transition-all duration-300 cursor-pointer group border-l-4 overflow-hidden",
      getStepBorderColor(project.step)
    )}>
      <CardContent className="p-4">
        {/* Header with project info and menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0" onClick={handleViewDetails}>
            {/* Project Number */}
            {project.projectNumber && (
              <p className="text-xs font-medium text-muted-foreground/70 mb-0.5">
                Nº {project.projectNumber}
              </p>
            )}
            
            {/* Project Name */}
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1 mb-1">
              {project.name}
            </h3>
            
            {/* Company */}
            {project.company && (
              <p className="text-xs text-muted-foreground/80 truncate">
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
                className="shrink-0 ml-2 h-7 w-7 p-0"
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
          {/* Status + Step Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <Badge variant={getStatusVariant(project.status)} className="text-xs px-2 py-0.5">
              {getStatusLabel(project.status)}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs px-2 py-0.5">
                Atrasado
              </Badge>
            )}
            <Badge 
              variant={stepColors[project.step] as any}
              className="text-xs px-2 py-0.5"
            >
              {stepLabels[project.step]}
            </Badge>
          </div>

          {/* Project Info - Compact */}
          <div className="space-y-1.5 text-xs mb-3">
            {/* Responsible */}
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              <span className="truncate">{project.responsibleName}</span>
            </div>

            {/* Equipment Count */}
            <div className="flex items-center gap-2">
              <Package className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              <span>{project.equipmentCount} equipamentos</span>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              <span>
                {new Date(project.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                {' → '}
                <span className={cn(isOverdue && "text-destructive font-medium")}>
                  {project.actualEndDate 
                    ? new Date(project.actualEndDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    : new Date(project.expectedEndDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                  }
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleViewDetails}
          className="w-full h-8 text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
        >
          <Eye className="mr-1.5 h-3 w-3" />
          Ver Retirada
        </Button>
      </CardContent>
    </Card>
  );
}