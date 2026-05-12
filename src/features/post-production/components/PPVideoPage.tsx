import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink, Plus, Send, Trash2, X, CalendarIcon, Check,
  Clapperboard, MessageSquare, Pencil, MoreHorizontal
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StatusPill } from '@/ds/components/StatusPill';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { usePPVersions } from '../hooks/usePPVersions';
import { usePPComments } from '../hooks/usePPComments';
import { useUsers } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { PostProductionItem, PPStatus, PPPriority, PP_PRIORITY_CONFIG } from '../types';
import { PPStatusBadge } from './PPStatusBadge';
import { PPPriorityBadge } from './PPPriorityBadge';

const MACRO_STEPS: { key: PPStatus; label: string }[] = [
  { key: 'fila', label: 'Na Fila' },
  { key: 'edicao', label: 'Edição' },
  { key: 'finalizacao', label: 'Finalização' },
  { key: 'revisao', label: 'Revisão' },
  { key: 'validacao_cliente', label: 'Validação Cliente' },
  { key: 'entregue', label: 'Entrega' },
];

const SUB_STEPS: Record<PPStatus, string[]> = {
  fila: [],
  edicao: ['Troca de câmeras', 'Zoom / reenquadramento', 'Ritmo e cortes', 'Ajuste de áudio'],
  color_grading: [],
  finalizacao: ['Color Grading', 'Trilha sonora', 'Motion graphics', 'Legendas', 'SFX'],
  revisao: ['Assistir completo', 'Ajustes', 'Aprovação'],
  validacao_cliente: ['Enviar ao cliente', 'Aguardando feedback', 'Cliente aprovou'],
  entregue: ['Export final', 'Envio ao cliente'],
};

function parseTitle(title: string) {
  const colonIdx = title.indexOf(':');
  if (colonIdx === -1) return { client_name: title, project_name: '', suffix: '' };
  const client_name = title.slice(0, colonIdx).trim();
  const rest = title.slice(colonIdx + 1).trim();
  const dashIdx = rest.indexOf(' - ');
  if (dashIdx === -1) return { client_name, project_name: rest, suffix: '' };
  return { client_name, project_name: rest.slice(0, dashIdx).trim(), suffix: rest.slice(dashIdx + 3).trim() };
}

function composeTitle(client: string, project: string, suffix: string): string {
  let title = client.trim();
  if (project.trim()) title += `: ${project.trim()}`;
  if (suffix.trim()) title += ` - ${suffix.trim()}`;
  return title;
}

function getUserAvatarUrl(user: { avatar_url?: string | null; user_metadata?: { avatar_url?: string; picture?: string } }): string | undefined {
  return user.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || undefined;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

const sectionShellStyle: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-2))',
};

interface Props {
  item: PostProductionItem;
  onBack: () => void;
}

export function PPVideoPage({ item, onBack }: Props) {
  const navigate = useNavigate();
  const { updateItem, deleteItem } = usePostProductionMutations();
  const { versions, addVersion, latestVersion } = usePPVersions(item.id);
  const { comments, addComment } = usePPComments(item.id);
  const { users } = useUsers();
  const { user } = useAuthContext();

  const parsed = parseTitle(item.title);

  const [form, setForm] = useState({
    client_name: item.client_name || parsed.client_name,
    project_name: item.project_name || parsed.project_name,
    suffix: parsed.suffix,
    editor_id: item.editor_id || '',
    status: item.status,
    priority: item.priority,
    due_date: item.due_date || '',
    start_date: item.start_date || '',
    notes: item.notes || '',
  });

  const [subStepIndex, setSubStepIndex] = useState(item.sub_status_index ?? 0);
  const [addingVersion, setAddingVersion] = useState(false);
  const [newVersionUrl, setNewVersionUrl] = useState('');
  const [comment, setComment] = useState('');
  const [requestingCorrection, setRequestingCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState('');

  const composedTitle = composeTitle(form.client_name, form.project_name, form.suffix);
  const selectedEditor = users.find(u => u.id === form.editor_id);

  // Normalize legacy color_grading status to finalizacao for pipeline display
  const normalizedStatus = form.status === 'color_grading' ? 'finalizacao' : form.status;
  const currentStepIdx = MACRO_STEPS.findIndex(s => s.key === normalizedStatus);
  const nextStep = MACRO_STEPS[currentStepIdx + 1];


  const timelineItems = [
    ...versions.map(v => ({ type: 'version' as const, date: v.created_at, data: v })),
    ...comments.map(c => ({ type: 'comment' as const, date: c.created_at, data: c })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  const handleDelete = () => {
    deleteItem.mutate(item.id);
    onBack();
  };

  const handleSubStepClick = (i: number) => {
    const newIndex = i < subStepIndex ? i : i + 1;
    setSubStepIndex(newIndex);
    updateItem.mutate({ id: item.id, updates: { sub_status_index: newIndex } });
  };

  const handleAdvanceStage = () => {
    const currentIdx = MACRO_STEPS.findIndex(s => s.key === normalizedStatus);
    const next = MACRO_STEPS[currentIdx + 1];
    if (!next) return;
    setForm(prev => ({ ...prev, status: next.key }));
    setSubStepIndex(0);
    updateItem.mutate({
      id: item.id,
      updates: {
        status: next.key,
        sub_status_index: 0,
        ...(next.key === 'edicao' && !form.start_date ? { start_date: new Date().toISOString().split('T')[0] } : {}),
        ...(next.key === 'entregue' ? { delivered_date: new Date().toISOString().split('T')[0] } : {}),
      },
    });
    toast.success(`Avançado para ${next.label}`);
  };

  const handleGoBack = () => {
    // If there are previous sub-steps, go back one sub-step
    if (subStepIndex > 0) {
      const newIndex = subStepIndex - 1;
      setSubStepIndex(newIndex);
      updateItem.mutate({ id: item.id, updates: { sub_status_index: newIndex } });
      return;
    }
    // If on first sub-step (or no sub-steps), go back to previous macro stage
    const currentIdx = MACRO_STEPS.findIndex(s => s.key === normalizedStatus);
    const prev = MACRO_STEPS[currentIdx - 1];
    if (!prev) return;
    const prevSubSteps = SUB_STEPS[prev.key] || [];
    setForm(p => ({ ...p, status: prev.key }));
    setSubStepIndex(prevSubSteps.length);
    updateItem.mutate({ id: item.id, updates: { status: prev.key, sub_status_index: prevSubSteps.length } });
    toast.success(`Voltou para ${prev.label}`);
  };

  const handleAddVersion = async () => {
    if (!newVersionUrl.trim()) return;
    await addVersion.mutateAsync({ frame_io_url: newVersionUrl.trim() });
    setNewVersionUrl('');
    setAddingVersion(false);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    await addComment.mutateAsync(comment.trim());
    setComment('');
  };

  const handleRequestCorrection = async () => {
    const note = correctionText.trim()
      ? `🔄 Cliente solicitou correção: ${correctionText.trim()}`
      : '🔄 Cliente solicitou correção';
    try {
      await addComment.mutateAsync(note);
    } catch (e) { /* continue even if comment fails */ }
    setForm(prev => ({ ...prev, status: 'edicao' }));
    setSubStepIndex(0);
    updateItem.mutate({
      id: item.id,
      updates: { status: 'edicao', sub_status_index: 0 },
    });
    setCorrectionText('');
    setRequestingCorrection(false);
    toast.success('Vídeo retornou para Edição');
  };


  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
      <div className="animate-fade-in space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <BreadcrumbNav items={[
            { label: 'Esteira de Pós', href: '/esteira-de-pos' },
            { label: composedTitle || 'Vídeo' },
          ]} className="mb-0" />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="btn"
              onClick={() => navigate(`/esteira-de-pos/${item.id}/editar`)}
            >
              <Pencil size={13} strokeWidth={1.5} /> Editar
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="btn"
                  style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                  aria-label="Mais ações"
                >
                  <MoreHorizontal size={14} strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} style={{ color: 'hsl(var(--ds-danger))' }}>
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* SUMMARY (no header) */}
        <div style={sectionShellStyle}>
          <div style={{ padding: 18 }}>
            {/* Title row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h1
                  style={{
                    fontFamily: '"HN Display", sans-serif',
                    fontSize: 20,
                    fontWeight: 600,
                    color: 'hsl(var(--ds-fg-1))',
                    lineHeight: 1.2,
                  }}
                  className="truncate"
                >
                  {composedTitle || 'Novo Vídeo'}
                </h1>
                <p
                  style={{
                    fontSize: 13,
                    color: 'hsl(var(--ds-fg-3))',
                    marginTop: 4,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {form.client_name}{form.project_name ? ` · ${form.project_name}` : ''}
                  {' · '}criado em {format(parseISO(item.created_at), 'dd/MM/yyyy')}
                </p>
              </div>
              {latestVersion && (
                <StatusPill label={`v${latestVersion.version_number}`} tone="muted" />
              )}
            </div>

            <Separator className="mb-4" />

            {/* Inline fields row */}
            <div className="flex items-center flex-wrap gap-x-5 gap-y-3">

              {/* Etapa */}
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))' }}>Etapa</span>
                <PPStatusBadge status={form.status} />
              </div>

              {/* Prioridade */}
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))' }}>Prioridade</span>
                <Select value={form.priority} onValueChange={v => {
                  setForm(prev => ({ ...prev, priority: v as PPPriority }));
                  updateItem.mutate({ id: item.id, updates: { priority: v as PPPriority } });
                }}>
                  <SelectTrigger className="w-auto h-7 border-0 bg-transparent p-0 shadow-none focus:ring-0 gap-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-50">
                    <PPPriorityBadge priority={form.priority} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(PP_PRIORITY_CONFIG).map(v => (
                      <SelectItem key={v} value={v}>
                        <PPPriorityBadge priority={v as PPPriority} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Editor */}
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))' }}>Editor</span>
                <Select value={form.editor_id} onValueChange={v => {
                  const editorUser = users.find(u => u.id === v);
                  setForm(prev => ({ ...prev, editor_id: v }));
                  updateItem.mutate({ id: item.id, updates: { editor_id: v || null, editor_name: editorUser?.display_name || null } });
                }}>
                  <SelectTrigger className="w-auto h-7 border-0 bg-transparent p-0 shadow-none focus:ring-0 gap-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-50">
                    {selectedEditor ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={getUserAvatarUrl(selectedEditor)} />
                          <AvatarFallback className="text-[9px]">{getInitials(selectedEditor.display_name)}</AvatarFallback>
                        </Avatar>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{selectedEditor.display_name?.split(' ')[0] || selectedEditor.email}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>Sem editor</span>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={getUserAvatarUrl(u)} />
                            <AvatarFallback className="text-[9px]">{getInitials(u.display_name)}</AvatarFallback>
                          </Avatar>
                          <span>{u.display_name || u.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prazo */}
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))' }}>Prazo</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                      style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-1))' }}
                    >
                      <CalendarIcon size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                      {form.due_date
                        ? format(new Date(form.due_date + 'T00:00:00'), 'dd/MM/yyyy')
                        : <span style={{ color: 'hsl(var(--ds-fg-3))' }}>—</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.due_date ? new Date(form.due_date + 'T00:00:00') : undefined}
                      onSelect={date => {
                        const val = date ? format(date, 'yyyy-MM-dd') : '';
                        setForm(prev => ({ ...prev, due_date: val }));
                        updateItem.mutate({ id: item.id, updates: { due_date: val || null } });
                      }}
                      initialFocus className="p-3 pointer-events-auto"
                    />
                    {form.due_date && (
                      <div style={{ padding: 8, borderTop: '1px solid hsl(var(--ds-line-1))' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{ width: '100%', justifyContent: 'flex-start' }}
                          onClick={() => {
                            setForm(prev => ({ ...prev, due_date: '' }));
                            updateItem.mutate({ id: item.id, updates: { due_date: null } });
                          }}
                        >
                          <X size={13} strokeWidth={1.5} /> Limpar
                        </button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

            </div>
          </div>
        </div>

        {/* PIPELINE */}
        <div style={sectionShellStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clapperboard size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
              <span style={sectionTitleStyle}>Pipeline de Produção</span>
            </div>
          </div>

          <div style={{ padding: 18 }} className="space-y-4">
            {/* 1. Thin progress track */}
            <div className="flex items-center gap-1">
              {MACRO_STEPS.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full transition-all duration-500"
                  style={{
                    background: i < currentStepIdx
                      ? 'hsl(var(--ds-accent))'
                      : i === currentStepIdx
                      ? 'hsl(var(--ds-accent) / 0.4)'
                      : 'hsl(var(--ds-line-1))',
                  }}
                />
              ))}
            </div>

            {/* 2. Phase cards */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${MACRO_STEPS.length}, 1fr)` }}>
              {MACRO_STEPS.map((step, i) => {
                const isDone = i < currentStepIdx;
                const isActive = i === currentStepIdx;
                const phaseStyle: React.CSSProperties = isActive
                  ? {
                      background: 'hsl(var(--ds-accent) / 0.1)',
                      border: '1px solid hsl(var(--ds-accent))',
                    }
                  : isDone
                  ? {
                      background: 'transparent',
                      border: '1px solid transparent',
                      opacity: 0.35,
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid hsl(var(--ds-line-1) / 0.3)',
                      opacity: 0.4,
                    };
                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center gap-1 py-3 px-2 transition-all duration-300 text-center cursor-default"
                    style={phaseStyle}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: isActive ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      {isDone ? '✓' : i + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        lineHeight: 1.2,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 3. Sub-steps row — only when current step has sub-steps */}
            {SUB_STEPS[normalizedStatus]?.length > 0 && (
              <div
                style={{
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                  border: '1px solid hsl(var(--ds-line-1))',
                  padding: '12px 16px',
                }}
                className="space-y-3"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  {SUB_STEPS[normalizedStatus].map((sub, i) => {
                    const isDone = i < subStepIndex;
                    const isActive = i === subStepIndex;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSubStepClick(i)}
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1 transition-all duration-200',
                          isDone && 'opacity-40',
                          !isDone && !isActive && 'opacity-50 hover:opacity-80',
                        )}
                        style={isActive ? { background: 'hsl(var(--ds-accent) / 0.1)' } : undefined}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: isActive
                              ? 'hsl(var(--ds-accent))'
                              : isDone
                              ? 'hsl(var(--ds-fg-3) / 0.3)'
                              : 'hsl(var(--ds-line-1) / 0.6)',
                            color: isActive ? 'hsl(var(--ds-surface))' : 'hsl(var(--ds-fg-3))',
                            transform: isActive ? 'scale(1.1)' : undefined,
                            boxShadow: isActive ? '0 0 0 3px hsl(var(--ds-accent) / 0.25)' : undefined,
                          }}
                        >
                          {isDone ? <Check className="h-2.5 w-2.5" /> : i + 1}
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            whiteSpace: 'nowrap',
                            textDecoration: isDone ? 'line-through' : undefined,
                            fontWeight: isActive ? 600 : 400,
                            color: isActive
                              ? 'hsl(var(--ds-accent))'
                              : isDone
                              ? 'hsl(var(--ds-fg-3))'
                              : 'hsl(var(--ds-fg-3) / 0.6)',
                          }}
                        >
                          {sub}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Footer: counter + advance/back buttons */}
                <div
                  className="flex items-center justify-between pt-2"
                  style={{ borderTop: '1px solid hsl(var(--ds-line-1))' }}
                >
                  <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                    {subStepIndex} de {SUB_STEPS[normalizedStatus].length} concluídas
                  </span>
                  <div className="flex items-center gap-2">
                    {(currentStepIdx > 0 || subStepIndex > 0) && (
                      <button type="button" className="btn" onClick={handleGoBack}>
                        ← Voltar
                      </button>
                    )}
                    {normalizedStatus === 'validacao_cliente' && (
                      <button
                        type="button"
                        className="btn"
                        style={{
                          color: 'hsl(var(--ds-warning))',
                          borderColor: 'hsl(var(--ds-warning) / 0.4)',
                        }}
                        onClick={() => setRequestingCorrection(v => !v)}
                      >
                        🔄 Solicitar correção
                      </button>
                    )}
                    {subStepIndex < SUB_STEPS[normalizedStatus].length ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          const newIndex = subStepIndex + 1;
                          setSubStepIndex(newIndex);
                          updateItem.mutate({ id: item.id, updates: { sub_status_index: newIndex } });
                        }}
                      >
                        Próxima sub-etapa →
                      </button>
                    ) : nextStep ? (
                      <button type="button" className="btn primary" onClick={handleAdvanceStage}>
                        Avançar para {nextStep.label} →
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Correction request inline panel */}
                {normalizedStatus === 'validacao_cliente' && requestingCorrection && (
                  <div
                    className="pt-3 space-y-2 animate-fade-in"
                    style={{ borderTop: '1px solid hsl(var(--ds-line-1))' }}
                  >
                    <Textarea
                      value={correctionText}
                      onChange={e => setCorrectionText(e.target.value)}
                      placeholder="O que precisa ajustar? (opcional)"
                      style={{ minHeight: 70 }}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => { setRequestingCorrection(false); setCorrectionText(''); }}
                      >
                        Cancelar
                      </button>
                      <button type="button" className="btn primary" onClick={handleRequestCorrection}>
                        Confirmar correção
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* When no sub-steps: show back/advance buttons standalone */}
            {SUB_STEPS[normalizedStatus]?.length === 0 && (
              <div className="flex items-center justify-end gap-2 pt-1">
                {currentStepIdx > 0 && (
                  <button type="button" className="btn" onClick={handleGoBack}>
                    ← Voltar
                  </button>
                )}
                {nextStep && (
                  <button type="button" className="btn primary" onClick={handleAdvanceStage}>
                    Avançar para {nextStep.label} →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ATIVIDADE & VERSÕES */}
        <div style={sectionShellStyle}>
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
              <span style={sectionTitleStyle}>Atividade & Versões</span>
            </div>
            <button type="button" className="btn" onClick={() => setAddingVersion(true)}>
              <Plus size={13} strokeWidth={1.5} /> Adicionar versão
            </button>
          </div>

          <div style={{ padding: 18 }} className="space-y-4">
            {addingVersion && (
              <div
                className="flex gap-2 items-center"
                style={{
                  padding: 12,
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                  border: '1px solid hsl(var(--ds-line-1))',
                }}
              >
                <Input
                  placeholder="URL do Frame.io"
                  value={newVersionUrl}
                  onChange={e => setNewVersionUrl(e.target.value)}
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && handleAddVersion()}
                />
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleAddVersion}
                  disabled={!newVersionUrl.trim()}
                >
                  Adicionar
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setAddingVersion(false); setNewVersionUrl(''); }}
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="space-y-3">
              {timelineItems.length === 0 && (
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', textAlign: 'center', padding: '32px 0' }}>
                  Nenhuma atividade ainda.
                </p>
              )}
              {timelineItems.map((ti, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  {ti.type === 'version' ? (
                    <>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: 'hsl(var(--ds-accent) / 0.1)',
                          color: 'hsl(var(--ds-accent))',
                          fontSize: 12,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        v{ti.data.version_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                            Versão {ti.data.version_number}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: 'hsl(var(--ds-fg-3))',
                              border: '1px solid hsl(var(--ds-line-1))',
                              borderRadius: 999,
                              padding: '2px 8px',
                            }}
                          >
                            {ti.data.status === 'em_revisao' ? 'Em revisão' : ti.data.status === 'aprovada' ? 'Aprovada' : 'Arquivada'}
                          </span>
                          <a
                            href={ti.data.frame_io_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-0.5"
                            style={{ fontSize: 11, color: 'hsl(var(--ds-accent))' }}
                          >
                            Frame.io <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {ti.data.notes && (
                          <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                            {ti.data.notes}
                          </p>
                        )}
                        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                          {formatDistanceToNow(parseISO(ti.date), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: 'hsl(var(--ds-line-2) / 0.5)',
                          color: 'hsl(var(--ds-fg-2))',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(ti.data.user_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          style={{
                            fontSize: 13,
                            color: 'hsl(var(--ds-fg-1))',
                            background: 'hsl(var(--ds-line-2) / 0.5)',
                            padding: '8px 12px',
                          }}
                        >
                          {ti.data.content}
                        </p>
                        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                          {ti.data.user_name} · {formatDistanceToNow(parseISO(ti.date), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <Separator />
            <div className="flex gap-3 items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: 'hsl(var(--ds-line-2) / 0.5)',
                  color: 'hsl(var(--ds-fg-2))',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {getInitials(user?.user_metadata?.full_name || user?.email?.split('@')[0])}
              </div>
              <div
                className="flex flex-1 items-center gap-2 px-3 h-10 focus-within:ring-1"
                style={{
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-surface))',
                }}
              >
                <input
                  placeholder="Adicionar comentário..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                  className="shrink-0 disabled:opacity-30 transition-colors"
                  style={{ color: 'hsl(var(--ds-fg-3))' }}
                >
                  <Send size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
}
