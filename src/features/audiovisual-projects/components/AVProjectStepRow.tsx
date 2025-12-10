import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronRight, Clock, Loader, CheckCircle, XCircle, Calendar, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
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

interface NewSubstepData {
  title: string;
  responsible_user_id: string | null;
  responsible_user_name: string | null;
  deadline: Date | null;
}

const INITIAL_SUBSTEP: NewSubstepData = {
  title: '',
  responsible_user_id: null,
  responsible_user_name: null,
  deadline: null,
};

interface AVProjectStepRowProps {
  step: AVProjectStep;
  projectId: string;
}

export function AVProjectStepRow({ step, projectId }: AVProjectStepRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubstep, setNewSubstep] = useState<NewSubstepData>(INITIAL_SUBSTEP);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  
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
    if (!newSubstep.title.trim()) return;
    createSubstep.mutate({
      step_id: step.id,
      title: newSubstep.title,
      projectId,
      display_order: (step.substeps?.length || 0) + 1,
      responsible_user_id: newSubstep.responsible_user_id,
      responsible_user_name: newSubstep.responsible_user_name,
      deadline: newSubstep.deadline ? format(newSubstep.deadline, 'yyyy-MM-dd') : null,
    });
    setNewSubstep(INITIAL_SUBSTEP);
    setIsAddingSubtask(false);
  };

  const handleNewSubstepResponsibleChange = (userId: string) => {
    const user = users?.find((u) => u.id === userId);
    setNewSubstep((prev) => ({
      ...prev,
      responsible_user_id: userId,
      responsible_user_name: user?.display_name || null,
    }));
  };

  const handleCancelAddSubtask = () => {
    setNewSubstep(INITIAL_SUBSTEP);
    setIsAddingSubtask(false);
  };

  const toggleSubtaskComplete = (substepId: string, isCompleted: boolean) => {
    updateSubstep.mutate({ id: substepId, projectId, is_completed: !isCompleted });
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  };

  const getUserAvatarUrl = (userId: string | null) => {
    if (!userId) return null;
    const user = users?.find(u => u.id === userId);
    return user?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-muted/30 transition-colors">
        {/* Step Title */}
        <div className="col-span-5 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 shrink-0"
            onClick={() => {
              if (!isExpanded) {
                setIsExpanded(true);
                // Se não tem substeps, abre formulário automaticamente
                if (!hasSubsteps) {
                  setIsAddingSubtask(true);
                }
              } else {
                setIsExpanded(false);
                setIsAddingSubtask(false);
              }
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
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
            <SelectTrigger className="h-7 text-xs border-0 bg-transparent px-2 justify-start gap-1 [&>span]:text-muted-foreground [&>span]:italic">
              <SelectValue placeholder="Selecionar">
                {step.responsible_user_name && (
                  <div className="flex items-center gap-1.5 not-italic text-foreground">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={getUserAvatarUrl(step.responsible_user_id) || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(step.responsible_user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{step.responsible_user_name.split(' ')[0]}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {users?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={u.avatar_url || u.user_metadata?.avatar_url || u.user_metadata?.picture || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(u.display_name || u.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{u.display_name || u.email}</span>
                  </div>
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
                  : <span className="italic">Selecionar</span>}
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
            <SelectTrigger className="h-7 border-0 bg-transparent p-0 justify-start gap-1">
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

        {/* Spacer - coluna vazia para manter alinhamento */}
        <div className="col-span-1" />
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
              <div className="col-span-2 text-xs text-muted-foreground flex items-center gap-1.5">
                {substep.responsible_user_name ? (
                  <>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={getUserAvatarUrl(substep.responsible_user_id) || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(substep.responsible_user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{substep.responsible_user_name.split(' ')[0]}</span>
                  </>
                ) : (
                  <span className="italic">-</span>
                )}
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

          {/* Add Subtask Input - Grid completo estilo tarefas */}
          {isAddingSubtask && (
            <div 
              className={cn(
                "grid grid-cols-12 gap-2 py-1.5 items-center text-sm border-l-2 pl-3 rounded-r transition-all",
                "border-dashed border-muted-foreground/30",
                !newSubstep.title && "opacity-70 hover:opacity-100"
              )}
            >
              {/* Título */}
              <div className="col-span-5 flex items-center gap-2">
                <div className="h-4 w-4" /> {/* Spacer para alinhar com checkbox */}
                <Input
                  value={newSubstep.title}
                  onChange={(e) => setNewSubstep((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome da subtarefa..."
                  className="h-7 text-xs flex-1 bg-transparent border-0 p-0 placeholder:italic placeholder:text-muted-foreground/60 focus-visible:ring-0"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSubstep.title.trim()) handleAddSubtask();
                    if (e.key === 'Escape') handleCancelAddSubtask();
                  }}
                />
              </div>

              {/* Responsável */}
              <div className="col-span-2">
                <Select
                  value={newSubstep.responsible_user_id || ''}
                  onValueChange={handleNewSubstepResponsibleChange}
                >
                  <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 justify-start gap-1">
                    <SelectValue>
                      {newSubstep.responsible_user_name ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={getUserAvatarUrl(newSubstep.responsible_user_id) || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {getInitials(newSubstep.responsible_user_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{newSubstep.responsible_user_name.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground/60">Selecionar</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={u.avatar_url || u.user_metadata?.avatar_url || u.user_metadata?.picture || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {getInitials(u.display_name || u.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{u.display_name || u.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prazo */}
              <div className="col-span-2">
                <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs justify-start font-normal"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {newSubstep.deadline ? (
                        format(newSubstep.deadline, 'dd/MM', { locale: ptBR })
                      ) : (
                        <span className="italic text-muted-foreground/60">Selecionar</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={newSubstep.deadline || undefined}
                      onSelect={(date) => {
                        setNewSubstep((prev) => ({ ...prev, deadline: date || null }));
                        setDeadlineOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <Badge className="text-[10px] bg-muted text-muted-foreground border-0">
                  <Clock className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              </div>

              {/* Ações */}
              <div className="col-span-1 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  onClick={handleAddSubtask}
                  disabled={!newSubstep.title.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={handleCancelAddSubtask}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
