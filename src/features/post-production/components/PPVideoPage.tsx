import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExternalLink, Plus, Send, Trash2, X, CalendarIcon, Check,
  Clapperboard, MessageSquare, Pencil, MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { usePPVersions } from '../hooks/usePPVersions';
import { usePPComments } from '../hooks/usePPComments';
import { useUsers } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { PostProductionItem, PPStatus, PPPriority, PP_STATUS_CONFIG, PP_PRIORITY_CONFIG } from '../types';
import { PPStatusBadge } from './PPStatusBadge';
import { PPPriorityBadge } from './PPPriorityBadge';

const MACRO_STEPS: { key: PPStatus; label: string }[] = [
  { key: 'fila', label: 'Na Fila' },
  { key: 'edicao', label: 'Edição' },
  { key: 'finalizacao', label: 'Finalização' },
  { key: 'revisao', label: 'Revisão' },
  { key: 'entregue', label: 'Entrega' },
];

const SUB_STEPS: Record<PPStatus, string[]> = {
  fila: [],
  edicao: ['Troca de câmeras', 'Zoom / reenquadramento', 'Ritmo e cortes', 'Ajuste de áudio'],
  color_grading: [],
  finalizacao: ['Color Grading', 'Trilha sonora', 'Motion graphics', 'Legendas', 'SFX'],
  revisao: ['Assistir completo', 'Ajustes', 'Aprovação'],
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

  const composedTitle = composeTitle(form.client_name, form.project_name, form.suffix);
  const selectedEditor = users.find(u => u.id === form.editor_id);

  const isDirty =
    form.status !== item.status ||
    form.priority !== item.priority ||
    form.editor_id !== (item.editor_id || '') ||
    form.due_date !== (item.due_date || '') ||
    form.start_date !== (item.start_date || '');

  const timelineItems = [
    ...versions.map(v => ({ type: 'version' as const, date: v.created_at, data: v })),
    ...comments.map(c => ({ type: 'comment' as const, date: c.created_at, data: c })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSave = () => {
    const editorUser = users.find(u => u.id === form.editor_id);
    updateItem.mutate({
      id: item.id,
      updates: {
        title: composedTitle,
        project_name: form.project_name || null,
        client_name: form.client_name || null,
        editor_id: form.editor_id || null,
        editor_name: editorUser?.display_name || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        start_date: form.start_date || null,
        notes: form.notes || null,
        sub_status_index: subStepIndex,
        ...(form.status === 'entregue' && !item.delivered_date ? { delivered_date: new Date().toISOString().split('T')[0] } : {}),
      },
    });
    toast.success('Salvo!');
  };

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
    const currentIdx = MACRO_STEPS.findIndex(s => s.key === form.status);
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

  // Normalize legacy color_grading status to finalizacao for pipeline display
  const normalizedStatus = form.status === 'color_grading' ? 'finalizacao' : form.status;
  const currentStepIdx = MACRO_STEPS.findIndex(s => s.key === normalizedStatus);
  const nextStep = MACRO_STEPS[currentStepIdx + 1];

  return (
    <ResponsiveContainer maxWidth="7xl">
      <div className="animate-fade-in space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between gap-4">
          <BreadcrumbNav items={[
            { label: 'Esteira de Pós', href: '/esteira-de-pos' },
            { label: composedTitle || 'Vídeo' },
          ]} className="mb-0" />
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate(`/esteira-de-pos/${item.id}/editar`)}>
              <Pencil className="h-4 w-4 mr-1.5" /> Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <Card>
          <CardContent className="p-5">
            {/* Title row */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold leading-tight truncate">
                  {composedTitle || 'Novo Vídeo'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {form.client_name}{form.project_name ? ` · ${form.project_name}` : ''}
                  {' · '}criado em {format(parseISO(item.created_at), 'dd/MM/yyyy')}
                </p>
              </div>
              {latestVersion && (
                <Badge variant="outline" className="shrink-0 text-xs">
                  v{latestVersion.version_number}
                </Badge>
              )}
            </div>

            <Separator className="mb-4" />

            {/* Inline fields row */}
            <div className="flex items-center flex-wrap gap-x-5 gap-y-3">

              {/* Etapa */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Etapa</span>
                <Select value={form.status} onValueChange={v => { setForm(prev => ({ ...prev, status: v as PPStatus })); setSubStepIndex(0); }}>
                  <SelectTrigger className="w-auto h-7 border-0 bg-transparent p-0 shadow-none focus:ring-0 gap-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-50">
                    <PPStatusBadge status={form.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(PP_STATUS_CONFIG).map(v => (
                      <SelectItem key={v} value={v}>
                        <PPStatusBadge status={v as PPStatus} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prioridade */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Prioridade</span>
                <Select value={form.priority} onValueChange={v => setForm(prev => ({ ...prev, priority: v as PPPriority }))}>
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
                <span className="text-xs text-muted-foreground">Editor</span>
                <Select value={form.editor_id} onValueChange={v => setForm(prev => ({ ...prev, editor_id: v }))}>
                  <SelectTrigger className="w-auto h-7 border-0 bg-transparent p-0 shadow-none focus:ring-0 gap-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-50">
                    {selectedEditor ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={getUserAvatarUrl(selectedEditor)} />
                          <AvatarFallback className="text-[9px]">{getInitials(selectedEditor.display_name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{selectedEditor.display_name?.split(' ')[0] || selectedEditor.email}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem editor</span>
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
                <span className="text-xs text-muted-foreground">Prazo</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {form.due_date
                        ? format(new Date(form.due_date + 'T00:00:00'), 'dd/MM/yyyy')
                        : <span className="text-muted-foreground">—</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.due_date ? new Date(form.due_date + 'T00:00:00') : undefined}
                      onSelect={date => setForm(prev => ({ ...prev, due_date: date ? format(date, 'yyyy-MM-dd') : '' }))}
                      initialFocus className="p-3 pointer-events-auto"
                    />
                    {form.due_date && (
                      <div className="p-2 border-t">
                        <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => setForm(prev => ({ ...prev, due_date: '' }))}>
                          <X className="w-3.5 h-3.5 mr-1" /> Limpar
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              {/* Save button — only when dirty */}
              {isDirty && (
                <Button size="sm" className="h-7 ml-auto" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PIPELINE CARD */}
        <Card>
          <div className="flex items-center px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-muted">
                <Clapperboard className="h-4 w-4 text-foreground/70" />
              </div>
              <CardTitle className="text-sm font-semibold tracking-tight">Pipeline de Produção</CardTitle>
            </div>
          </div>

          <CardContent className="pt-5 pb-5 space-y-4">
            {/* 1. Thin progress track */}
            <div className="flex items-center gap-1">
              {MACRO_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-all duration-500',
                    i < currentStepIdx ? 'bg-primary' : i === currentStepIdx ? 'bg-primary/40' : 'bg-border'
                  )}
                />
              ))}
            </div>

            {/* 2. Phase cards */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${MACRO_STEPS.length}, 1fr)` }}>
              {MACRO_STEPS.map((step, i) => {
                const isDone = i < currentStepIdx;
                const isActive = i === currentStepIdx;
                return (
                  <button
                    key={step.key}
                    onClick={() => { setForm(prev => ({ ...prev, status: step.key })); setSubStepIndex(0); }}
                    className={cn(
                      'flex flex-col items-center gap-1 py-3 px-2 rounded-lg border transition-all duration-200 text-center',
                      isDone && 'bg-muted/50 border-border/50',
                      isActive && 'bg-primary/8 border-primary/40',
                      !isDone && !isActive && 'bg-transparent border-border/30 opacity-50 hover:opacity-70',
                    )}
                  >
                    <span className={cn(
                      'text-[10px] font-medium',
                      isDone ? 'text-muted-foreground' : isActive ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {isDone ? '✓' : i + 1}
                    </span>
                    <span className={cn(
                      'text-xs font-medium leading-tight',
                      isDone ? 'text-muted-foreground' : isActive ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3. Sub-steps row — only when current step has sub-steps */}
            {SUB_STEPS[normalizedStatus]?.length > 0 && (
              <div className="bg-muted/40 rounded-lg px-4 py-3 border border-border/40 space-y-3">
                <div className="flex items-center gap-4 flex-wrap">
                  {SUB_STEPS[normalizedStatus].map((sub, i) => {
                    const isDone = i < subStepIndex;
                    const isActive = i === subStepIndex;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSubStepClick(i)}
                        className={cn(
                          'flex items-center gap-1.5 transition-colors',
                          isDone && 'text-muted-foreground',
                          isActive && 'text-primary',
                          !isDone && !isActive && 'text-muted-foreground/60 hover:text-muted-foreground',
                        )}
                      >
                        <div className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all',
                          isDone && 'bg-primary text-primary-foreground',
                          isActive && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                          !isDone && !isActive && 'bg-border text-muted-foreground',
                        )}>
                          {isDone ? <Check className="h-2.5 w-2.5" /> : i + 1}
                        </div>
                        <span className={cn('text-xs whitespace-nowrap', isActive && 'font-medium')}>
                          {sub}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Footer: counter + advance button */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-xs text-muted-foreground">
                    {subStepIndex} de {SUB_STEPS[normalizedStatus].length} concluídas
                  </span>
                  {nextStep && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      variant={subStepIndex >= SUB_STEPS[normalizedStatus].length ? 'default' : 'outline'}
                      onClick={handleAdvanceStage}
                    >
                      Avançar para {nextStep.label} →
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* When no sub-steps: show advance button standalone */}
            {SUB_STEPS[normalizedStatus]?.length === 0 && nextStep && (
              <div className="flex justify-end pt-1">
                <Button size="sm" className="h-7 text-xs" onClick={handleAdvanceStage}>
                  Avançar para {nextStep.label} →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ATIVIDADE & VERSÕES */}
        <Card>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-muted">
                <MessageSquare className="h-4 w-4 text-foreground/70" />
              </div>
              <CardTitle className="text-sm font-semibold tracking-tight">Atividade & Versões</CardTitle>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAddingVersion(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar versão
            </Button>
          </div>

          <CardContent className="pt-5 space-y-4">
            {addingVersion && (
              <div className="flex gap-2 items-center p-3 rounded-lg bg-muted/50 border">
                <Input
                  placeholder="URL do Frame.io"
                  value={newVersionUrl}
                  onChange={e => setNewVersionUrl(e.target.value)}
                  className="flex-1 h-8 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleAddVersion()}
                />
                <Button size="sm" className="h-8 text-xs" onClick={handleAddVersion} disabled={!newVersionUrl.trim()}>
                  Adicionar
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setAddingVersion(false); setNewVersionUrl(''); }}>
                  Cancelar
                </Button>
              </div>
            )}

            <div className="space-y-3">
              {timelineItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade ainda.</p>
              )}
              {timelineItems.map((ti, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  {ti.type === 'version' ? (
                    <>
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        v{ti.data.version_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">Versão {ti.data.version_number}</span>
                          <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">
                            {ti.data.status === 'em_revisao' ? 'Em revisão' : ti.data.status === 'aprovada' ? 'Aprovada' : 'Arquivada'}
                          </span>
                          <a href={ti.data.frame_io_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-0.5">
                            Frame.io <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        {ti.data.notes && <p className="text-xs text-muted-foreground mt-0.5">{ti.data.notes}</p>}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {formatDistanceToNow(parseISO(ti.date), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                        {getInitials(ti.data.user_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm bg-muted/50 rounded-lg px-3 py-2">{ti.data.content}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
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
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                {getInitials(user?.user_metadata?.full_name || user?.email?.split('@')[0])}
              </div>
              <div className="flex flex-1 items-center gap-2 border rounded-lg px-3 h-10 bg-background focus-within:ring-1 focus-within:ring-ring">
                <input
                  placeholder="Adicionar comentário..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 text-sm bg-transparent outline-none"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!comment.trim()}
                  className="shrink-0 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </ResponsiveContainer>
  );
}
