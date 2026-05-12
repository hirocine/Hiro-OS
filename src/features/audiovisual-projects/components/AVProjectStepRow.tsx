import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronRight, Clock, Loader, CheckCircle, XCircle, Calendar, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { StatusPill } from '@/ds/components/StatusPill';
import { AVProjectStep, AVStepStatus, AV_STEP_STATUS_CONFIG } from '../types';
import { useUpdateAVStep, useCreateAVSubstep, useUpdateAVSubstep, useDeleteAVSubstep } from '../hooks/useAVProjectDetails';
import { useUsers } from '@/hooks/useUsers';

const STATUS_ICONS = {
  pendente: Clock,
  em_progresso: Loader,
  concluido: CheckCircle,
  bloqueado: XCircle,
};

// Map config tone → DS StatusPill token
const toneFromConfig = (key: AVStepStatus): 'warning' | 'info' | 'success' | 'danger' | 'muted' => {
  switch (key) {
    case 'pendente': return 'warning';
    case 'em_progresso': return 'info';
    case 'concluido': return 'success';
    case 'bloqueado': return 'danger';
    default: return 'muted';
  }
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

  const stepTone = toneFromConfig(step.status);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className="grid grid-cols-12 gap-2 px-3 py-2 items-center"
        style={{ transition: 'background 0.15s' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Step Title */}
        <div className="col-span-5 flex items-center gap-2">
          <button
            type="button"
            className="btn"
            style={{ width: 24, height: 24, padding: 0, justifyContent: 'center' }}
            onClick={() => {
              if (!isExpanded) {
                setIsExpanded(true);
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
              <ChevronDown size={13} strokeWidth={1.5} />
            ) : (
              <ChevronRight size={13} strokeWidth={1.5} />
            )}
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {step.title}
          </span>
          {hasSubsteps && (
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
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
            <SelectTrigger
              className="h-7 text-xs px-2 justify-start gap-1"
              style={{ border: 0, background: 'transparent' }}
            >
              <SelectValue placeholder={<span style={{ fontStyle: 'italic', color: 'hsl(var(--ds-fg-3))' }}>Selecionar</span>}>
                {step.responsible_user_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'hsl(var(--ds-fg-1))' }}>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={getUserAvatarUrl(step.responsible_user_id) || undefined} />
                      <AvatarFallback style={{ fontSize: 10, background: 'hsl(var(--ds-accent) / 0.1)', color: 'hsl(var(--ds-accent))' }}>
                        {getInitials(step.responsible_user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {step.responsible_user_name.split(' ')[0]}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {users?.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={u.avatar_url || u.user_metadata?.avatar_url || u.user_metadata?.picture || undefined} />
                      <AvatarFallback style={{ fontSize: 10, background: 'hsl(var(--ds-accent) / 0.1)', color: 'hsl(var(--ds-accent))' }}>
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
              <button
                type="button"
                className="btn"
                style={{
                  height: 28,
                  padding: '0 8px',
                  fontSize: 11,
                  fontWeight: 400,
                  border: 0,
                  background: 'transparent',
                  justifyContent: 'flex-start',
                  color: step.deadline ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <Calendar size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                {step.deadline
                  ? format(new Date(step.deadline), 'dd/MM', { locale: ptBR })
                  : <span style={{ fontStyle: 'italic' }}>Selecionar</span>}
              </button>
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
            <SelectTrigger
              className="h-7 p-0 justify-start gap-1"
              style={{ border: 0, background: 'transparent' }}
            >
              <SelectValue>
                <StatusPill
                  label={statusConfig.label}
                  tone={stepTone}
                  icon={<StatusIcon size={11} strokeWidth={1.5} />}
                />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AV_STEP_STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <StatusPill label={config.label} tone={toneFromConfig(key as AVStepStatus)} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Spacer */}
        <div className="col-span-1" />
      </div>

      {/* Substeps */}
      <CollapsibleContent>
        <div style={{ paddingLeft: 40, paddingRight: 12, paddingBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {step.substeps?.map((substep) => (
            <div
              key={substep.id}
              className="grid grid-cols-12 gap-2 items-center"
              style={{
                fontSize: 13,
                padding: '6px 0 6px 12px',
                borderLeft: '2px solid hsl(var(--ds-line-1))',
              }}
            >
              <div className="col-span-5 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={substep.is_completed}
                  onChange={() => toggleSubtaskComplete(substep.id, substep.is_completed)}
                  style={{ width: 14, height: 14, accentColor: 'hsl(var(--ds-accent))' }}
                />
                <span
                  style={{
                    fontSize: 12,
                    textDecoration: substep.is_completed ? 'line-through' : 'none',
                    color: substep.is_completed ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
                  }}
                >
                  {substep.title}
                </span>
              </div>
              <div className="col-span-2" style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', display: 'flex', alignItems: 'center', gap: 6 }}>
                {substep.responsible_user_name ? (
                  <>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={getUserAvatarUrl(substep.responsible_user_id) || undefined} />
                      <AvatarFallback style={{ fontSize: 10, background: 'hsl(var(--ds-accent) / 0.1)', color: 'hsl(var(--ds-accent))' }}>
                        {getInitials(substep.responsible_user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {substep.responsible_user_name.split(' ')[0]}
                    </span>
                  </>
                ) : (
                  <span style={{ fontStyle: 'italic' }}>-</span>
                )}
              </div>
              <div className="col-span-2" style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                {substep.deadline ? format(new Date(substep.deadline), 'dd/MM') : '-'}
              </div>
              <div className="col-span-2">
                <StatusPill
                  label={substep.is_completed ? 'Feito' : 'Pendente'}
                  tone={substep.is_completed ? 'success' : 'muted'}
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  className="btn"
                  style={{
                    width: 24,
                    height: 24,
                    padding: 0,
                    justifyContent: 'center',
                    color: 'hsl(var(--ds-fg-3))',
                    border: 0,
                    background: 'transparent',
                  }}
                  onClick={() => deleteSubstep.mutate({ id: substep.id, projectId })}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-danger))')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--ds-fg-3))')}
                >
                  <XCircle size={13} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}

          {/* Add Subtask Input */}
          {isAddingSubtask && (
            <div
              className="grid grid-cols-12 gap-2 items-center"
              style={{
                fontSize: 13,
                padding: '6px 0 6px 12px',
                borderLeft: '2px dashed hsl(var(--ds-line-1))',
                opacity: !newSubstep.title ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {/* Title */}
              <div className="col-span-5 flex items-center gap-2">
                <div style={{ width: 14, height: 14 }} />
                <Input
                  value={newSubstep.title}
                  onChange={(e) => setNewSubstep((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome da subtarefa..."
                  className="h-7 text-xs flex-1 p-0"
                  style={{ background: 'transparent', border: 0 }}
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
                  <SelectTrigger
                    className="h-7 text-xs p-0 justify-start gap-1"
                    style={{ border: 0, background: 'transparent' }}
                  >
                    <SelectValue>
                      {newSubstep.responsible_user_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={getUserAvatarUrl(newSubstep.responsible_user_id) || undefined} />
                            <AvatarFallback style={{ fontSize: 10, background: 'hsl(var(--ds-accent) / 0.1)', color: 'hsl(var(--ds-accent))' }}>
                              {getInitials(newSubstep.responsible_user_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {newSubstep.responsible_user_name.split(' ')[0]}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'hsl(var(--ds-fg-4))' }}>Selecionar</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={u.avatar_url || u.user_metadata?.avatar_url || u.user_metadata?.picture || undefined} />
                            <AvatarFallback style={{ fontSize: 10, background: 'hsl(var(--ds-accent) / 0.1)', color: 'hsl(var(--ds-accent))' }}>
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
                    <button
                      type="button"
                      className="btn"
                      style={{
                        height: 28,
                        padding: '0 8px',
                        fontSize: 11,
                        fontWeight: 400,
                        border: 0,
                        background: 'transparent',
                        justifyContent: 'flex-start',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      <Calendar size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                      {newSubstep.deadline ? (
                        format(newSubstep.deadline, 'dd/MM', { locale: ptBR })
                      ) : (
                        <span style={{ fontStyle: 'italic', color: 'hsl(var(--ds-fg-4))' }}>Selecionar</span>
                      )}
                    </button>
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
                <StatusPill label="Pendente" tone="muted" icon={<Clock size={11} strokeWidth={1.5} />} />
              </div>

              {/* Ações */}
              <div className="col-span-1 flex justify-end gap-1">
                <button
                  type="button"
                  className="btn"
                  style={{
                    width: 24,
                    height: 24,
                    padding: 0,
                    justifyContent: 'center',
                    border: 0,
                    background: 'transparent',
                    color: 'hsl(var(--ds-fg-3))',
                    opacity: !newSubstep.title.trim() ? 0.5 : 1,
                  }}
                  onClick={handleAddSubtask}
                  disabled={!newSubstep.title.trim()}
                >
                  <Plus size={14} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{
                    width: 24,
                    height: 24,
                    padding: 0,
                    justifyContent: 'center',
                    border: 0,
                    background: 'transparent',
                    color: 'hsl(var(--ds-fg-3))',
                  }}
                  onClick={handleCancelAddSubtask}
                >
                  <XCircle size={13} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
