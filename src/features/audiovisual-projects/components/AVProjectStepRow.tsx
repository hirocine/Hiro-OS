import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Clock, Loader, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AVProjectStep, AVStepStatus, AV_STEP_STATUS_CONFIG } from '../types';
import { useUpdateAVStep, useCreateAVSubstep, useUpdateAVSubstep, useDeleteAVSubstep } from '../hooks/useAVProjectDetails';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';

const STATUS_ICONS = {
  pendente: Clock,
  em_progresso: Loader,
  concluido: CheckCircle,
  bloqueado: XCircle,
};

interface AVProjectStepRowProps {
  step: AVProjectStep;
  projectId: string;
}

export function AVProjectStepRow({ step, projectId }: AVProjectStepRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  
  const { users } = useUsers();
  const updateStep = useUpdateAVStep();
  const createSubstep = useCreateAVSubstep();
  const updateSubstep = useUpdateAVSubstep();
  const deleteSubstep = useDeleteAVSubstep();

  const statusConfig = AV_STEP_STATUS_CONFIG[step.status];
  const StatusIcon = STATUS_ICONS[step.status];
  const hasSubsteps = step.substeps && step.substeps.length > 0;

  const handleStatusChange = (newStatus: AVStepStatus) => {
    updateStep.mutate({ id: step.id, projectId, status: newStatus });
  };

  const handleResponsibleChange = (userId: string) => {
    const user = users?.find((u) => u.id === userId);
    updateStep.mutate({
      id: step.id,
      projectId,
      responsible_user_id: userId,
      responsible_user_name: user?.display_name || null,
    });
  };

  const handleDeadlineChange = (date: Date | undefined) => {
    updateStep.mutate({
      id: step.id,
      projectId,
      deadline: date ? format(date, 'yyyy-MM-dd') : null,
    });
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    createSubstep.mutate({
      step_id: step.id,
      title: newSubtaskTitle,
      projectId,
      display_order: (step.substeps?.length || 0) + 1,
    });
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  const toggleSubtaskComplete = (substepId: string, isCompleted: boolean) => {
    updateSubstep.mutate({ id: substepId, projectId, is_completed: !isCompleted });
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-muted/30 transition-colors">
        {/* Step Title */}
        <div className="col-span-5 flex items-center gap-2">
          {hasSubsteps ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}
          <span className="text-sm font-medium truncate">{step.title}</span>
          {hasSubsteps && (
            <span className="text-xs text-muted-foreground">
              ({step.substeps?.filter((s) => s.is_completed).length}/{step.substeps?.length})
            </span>
          )}
        </div>

        {/* Responsible */}
        <div className="col-span-2">
          <Select
            value={step.responsible_user_id || ''}
            onValueChange={handleResponsibleChange}
          >
            <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0">
              <SelectValue>
                {step.responsible_user_name ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(step.responsible_user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{step.responsible_user_name.split(' ')[0]}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {users?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.display_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deadline */}
        <div className="col-span-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-2 text-xs justify-start font-normal',
                  !step.deadline && 'text-muted-foreground'
                )}
              >
                <Calendar className="h-3 w-3 mr-1" />
                {step.deadline
                  ? format(new Date(step.deadline), 'dd/MM', { locale: ptBR })
                  : '-'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={step.deadline ? new Date(step.deadline) : undefined}
                onSelect={handleDeadlineChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Status */}
        <div className="col-span-2">
          <Select value={step.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-7 border-0 bg-transparent p-0">
              <SelectValue>
                <Badge className={cn('text-xs', statusConfig.bgColor, statusConfig.color, 'border-0')}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AV_STEP_STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <Badge className={cn('text-xs', config.bgColor, config.color, 'border-0')}>
                    {config.label}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="col-span-1 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddingSubtask(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Subtarefa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Substeps */}
      <CollapsibleContent>
        <div className="pl-10 pr-3 pb-2 space-y-1">
          {step.substeps?.map((substep) => (
            <div
              key={substep.id}
              className="grid grid-cols-12 gap-2 py-1.5 items-center text-sm border-l-2 border-muted pl-3 hover:bg-muted/20 rounded-r"
            >
              <div className="col-span-5 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={substep.is_completed}
                  onChange={() => toggleSubtaskComplete(substep.id, substep.is_completed)}
                  className="h-4 w-4 rounded border-muted-foreground/30"
                />
                <span className={cn('text-xs', substep.is_completed && 'line-through text-muted-foreground')}>
                  {substep.title}
                </span>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">
                {substep.responsible_user_name?.split(' ')[0] || '-'}
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">
                {substep.deadline ? format(new Date(substep.deadline), 'dd/MM') : '-'}
              </div>
              <div className="col-span-2">
                {substep.is_completed ? (
                  <Badge className="text-[10px] bg-success/10 text-success border-0">Feito</Badge>
                ) : (
                  <Badge className="text-[10px] bg-muted text-muted-foreground border-0">Pendente</Badge>
                )}
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteSubstep.mutate({ id: substep.id, projectId })}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add Subtask Input */}
          {isAddingSubtask && (
            <div className="flex items-center gap-2 pl-3">
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Nome da subtarefa..."
                className="h-7 text-xs flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtask();
                  if (e.key === 'Escape') setIsAddingSubtask(false);
                }}
              />
              <Button size="sm" className="h-7 text-xs" onClick={handleAddSubtask}>
                Adicionar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setIsAddingSubtask(false)}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
