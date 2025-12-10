import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AVProject, AV_STATUS_CONFIG } from '../types';
import { useNavigate } from 'react-router-dom';

interface AVProjectCardProps {
  project: AVProject;
}

export function AVProjectCard({ project }: AVProjectCardProps) {
  const navigate = useNavigate();
  const statusConfig = AV_STATUS_CONFIG[project.status];
  
  const isOverdue = project.deadline && new Date(project.deadline) < new Date() && project.status === 'active';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 h-full flex flex-col">
      <CardContent className="p-4 flex flex-col h-full gap-3">
        {/* Logo + Title + Company */}
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 rounded-lg shrink-0">
            {project.logo_url ? (
              <AvatarImage src={project.logo_url} alt={project.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(project.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm line-clamp-1" title={project.name}>
              {project.name}
            </h3>
            {project.company && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{project.company}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0 text-xs`}>
            {statusConfig.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Atrasado
            </Badge>
          )}
        </div>

        {/* Deadline */}
        {project.deadline && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              Prazo: {format(new Date(project.deadline), "dd 'de' MMM, yyyy", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* View Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs"
          onClick={() => navigate(`/projetos-av/${project.id}`)}
        >
          Ver Projeto
        </Button>
      </CardContent>
    </Card>
  );
}
