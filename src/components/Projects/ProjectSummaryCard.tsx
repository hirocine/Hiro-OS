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
    navigate(`/projects/${project.id}`);
  };

  return (
    <Card className="hover:shadow-elegant transition-all duration-300 cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1" onClick={handleViewDetails}>
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                {project.name}
              </h3>
              <Badge variant={getStatusVariant(project.status)}>
                {getStatusLabel(project.status)}
              </Badge>
              {isOverdue && <Badge variant="destructive">Atrasado</Badge>}
            </div>
            
            {(project.company || project.projectNumber) && (
              <p className="text-sm text-muted-foreground mb-3 truncate">
                {project.company && project.projectNumber 
                  ? `${project.company} • Nº ${project.projectNumber}`
                  : project.company || `Nº ${project.projectNumber}`
                }
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="flex items-center space-x-2 mb-4">
            <div className="text-sm text-muted-foreground">Status atual:</div>
            <Badge 
              variant={stepColors[project.step] as any}
              className="text-xs"
            >
              {stepLabels[project.step]}
            </Badge>
          </div>

          {/* Project Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="font-medium truncate">{project.responsibleName}</div>
                {project.department && (
                  <div className="text-muted-foreground text-xs truncate">{project.department}</div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="font-medium">{project.equipmentCount} equipamentos</div>
                <div className="text-muted-foreground text-xs">Vinculados</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="font-medium">
                  {new Date(project.startDate).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-muted-foreground text-xs">Data de início</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className={cn(
                  "font-medium",
                  isOverdue && "text-destructive"
                )}>
                  {project.actualEndDate 
                    ? new Date(project.actualEndDate).toLocaleDateString('pt-BR')
                    : new Date(project.expectedEndDate).toLocaleDateString('pt-BR')
                  }
                </div>
                <div className="text-muted-foreground text-xs">
                  {project.actualEndDate ? 'Finalizado em' : 'Previsão de fim'}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewDetails}
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver Projeto
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}