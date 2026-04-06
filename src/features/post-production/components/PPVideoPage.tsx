import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Plus, Send, Trash2, X, CalendarIcon, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';
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

// --- Macro pipeline steps using existing PPStatus ---
const MACRO_STEPS: { key: PPStatus; label: string }[] = [
  { key: 'fila', label: 'Na Fila' },
  { key: 'edicao', label: 'Edição' },
  { key: 'color_grading', label: 'Color Grading' },
  { key: 'finalizacao', label: 'Finalização' },
  { key: 'revisao', label: 'Revisão' },
  { key: 'entregue', label: 'Entrega' },
];

const SUB_STEPS: Record<PPStatus, string[]> = {
  fila: [],
  edicao: ['Troca de câmeras', 'Zoom / reenquadramento', 'Ritmo e cortes', 'Ajuste de áudio'],
  color_grading: ['Color grading base', 'Ajustes finos'],
  finalizacao: ['Trilha sonora', 'Motion graphics', 'Legendas', 'SFX'],
  revisao: ['Assistir completo', 'Ajustes', 'Aprovação'],
  entregue: ['Export final', 'Envio ao cliente'],
};

// --- Helpers ---
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

// --- Component ---
interface Props {
  item: PostProductionItem;
  onBack: () => void;
}

export function PPVideoPage({ item, onBack }: Props) {
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

  // Timeline: merge versions + comments
  const timelineItems = [
    ...versions.map(v => ({ type: 'version' as const, date: v.created_at, data: v })),
    ...comments.map(c => ({ type: 'comment' as const, date: c.created_at, data: c })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Days in current stage
  const daysInStage = differenceInDays(new Date(), parseISO(item.updated_at));

  // --- Handlers ---
  const handleSave = () => {
    const title = composedTitle;
    const editorUser = users.find(u => u.id === form.editor_id);
    updateItem.mutate({
      id: item.id,
      updates: {
        title,
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

  // --- Date Picker Helper ---
  const DateField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <Label className="text-xs text-muted-foreground block mb-1.5">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-sm", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {value ? format(new Date(value + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value + 'T00:00:00') : undefined}
            onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
          {value && (
            <div className="p-2 border-t">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => onChange('')}>
                <X className="w-3.5 h-3.5 mr-1" /> Limpar
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 px-6 py-4 bg-background/95 backdrop-blur border-b flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">{composedTitle || 'Novo Vídeo'}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {form.client_name}{form.project_name ? ` · ${form.project_name}` : ''} · criado em {format(parseISO(item.created_at), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Excluir
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!form.client_name.trim()}>
            Salvar
          </Button>
        </div>
      </div>

      {/* ===== PIPELINE ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pipeline de Produção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Macro steps */}
          <div className="flex items-center w-full">
            {MACRO_STEPS.map((step, i) => {
              const currentIdx = MACRO_STEPS.findIndex(s => s.key === form.status);
              const isDone = i < currentIdx;
              const isActive = i === currentIdx;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <button
                    onClick={() => {
                      setForm(prev => ({ ...prev, status: step.key }));
                      setSubStepIndex(0);
                    }}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors border-2",
                      isDone && "bg-primary text-primary-foreground border-primary",
                      isActive && "bg-primary/10 text-primary border-primary",
                      !isDone && !isActive && "bg-muted text-muted-foreground border-transparent",
                    )}>
                      {isDone ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className={cn(
                      "text-xs whitespace-nowrap transition-colors",
                      isActive ? "text-foreground font-medium" : "text-muted-foreground",
                    )}>
                      {step.label}
                    </span>
                  </button>
                  {i < MACRO_STEPS.length - 1 && (
                    <div className={cn(
                      "h-0.5 flex-1 mx-2 rounded-full mt-[-16px]",
                      i < currentIdx ? "bg-primary" : "bg-border",
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Sub-steps */}
          {SUB_STEPS[form.status]?.length > 0 && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">
                Sub-etapas · {MACRO_STEPS.find(s => s.key === form.status)?.label}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {SUB_STEPS[form.status].map((sub, i) => {
                  const isDone = i < subStepIndex;
                  const isActive = i === subStepIndex;
                  return (
                    <div key={i} className="flex items-center gap-1.5">
                      <button onClick={() => handleSubStepClick(i)} className="flex items-center gap-1.5 group">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors",
                          isDone && "bg-primary text-primary-foreground",
                          isActive && "bg-primary/20 text-primary ring-1 ring-primary",
                          !isDone && !isActive && "bg-muted text-muted-foreground",
                        )}>
                          {isDone ? <Check className="h-3 w-3" /> : i + 1}
                        </div>
                        <span className={cn(
                          "text-xs transition-colors",
                          isActive ? "text-foreground font-medium" : "text-muted-foreground",
                        )}>
                          {sub}
                        </span>
                      </button>
                      {i < SUB_STEPS[form.status].length - 1 && (
                        <div className={cn("h-px w-4 rounded-full", i < subStepIndex ? "bg-primary/40" : "bg-border")} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  {subStepIndex} de {SUB_STEPS[form.status].length} concluídas
                </span>
                {(() => {
                  const currentIdx = MACRO_STEPS.findIndex(s => s.key === form.status);
                  const nextStep = MACRO_STEPS[currentIdx + 1];
                  const allDone = subStepIndex >= SUB_STEPS[form.status].length;
                  return nextStep ? (
                    <Button size="sm" variant={allDone ? 'default' : 'outline'} onClick={handleAdvanceStage} className="text-xs h-7">
                      Avançar para {nextStep.label} →
                    </Button>
                  ) : null;
                })()}
              </div>
            </div>
          )}

          {/* Na Fila: just start button */}
          {form.status === 'fila' && (
            <div className="pt-2 border-t">
              <Button size="sm" onClick={handleAdvanceStage} className="text-xs h-7">
                Iniciar Edição →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== TWO COLUMN LAYOUT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Vídeo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Dados do Vídeo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="vp-client" className="text-xs text-muted-foreground block mb-1.5">Empresa</Label>
                  <Input id="vp-client" value={form.client_name} onChange={e => setForm(prev => ({ ...prev, client_name: e.target.value }))} placeholder="Ex: Cacau Show" className="h-9" />
                </div>
                <div>
                  <Label htmlFor="vp-project" className="text-xs text-muted-foreground block mb-1.5">Projeto</Label>
                  <Input id="vp-project" value={form.project_name} onChange={e => setForm(prev => ({ ...prev, project_name: e.target.value }))} placeholder="Ex: Campanha de Natal" className="h-9" />
                </div>
                <div>
                  <Label htmlFor="vp-suffix" className="text-xs text-muted-foreground block mb-1.5">Sufixo</Label>
                  <Input id="vp-suffix" value={form.suffix} onChange={e => setForm(prev => ({ ...prev, suffix: e.target.value }))} placeholder="Ex: Criativo 1" className="h-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground block mb-1.5">Título gerado</Label>
                <Input value={composedTitle} readOnly disabled className="bg-muted text-muted-foreground cursor-not-allowed h-9" />
              </div>
              <div>
                <Label htmlFor="vp-notes" className="text-xs text-muted-foreground block mb-1.5">Observações</Label>
                <Textarea id="vp-notes" value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right column — Informações */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <Label className="text-xs text-muted-foreground block mb-1.5">Etapa</Label>
                <Select value={form.status} onValueChange={v => { setForm(prev => ({ ...prev, status: v as PPStatus })); setSubStepIndex(0); }}>
                  <SelectTrigger className="h-9">
                    <PPStatusBadge status={form.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(PP_STATUS_CONFIG).map(v => (
                      <SelectItem key={v} value={v}><PPStatusBadge status={v as PPStatus} /></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <Label className="text-xs text-muted-foreground block mb-1.5">Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm(prev => ({ ...prev, priority: v as PPPriority }))}>
                  <SelectTrigger className="h-9">
                    <PPPriorityBadge priority={form.priority} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(PP_PRIORITY_CONFIG).map(v => (
                      <SelectItem key={v} value={v}><PPPriorityBadge priority={v as PPPriority} /></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Editor */}
              <div>
                <Label className="text-xs text-muted-foreground block mb-1.5">Editor</Label>
                <Select value={form.editor_id} onValueChange={v => setForm(prev => ({ ...prev, editor_id: v }))}>
                  <SelectTrigger className="h-9">
                    {selectedEditor ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={getUserAvatarUrl(selectedEditor)} />
                          <AvatarFallback className="text-[9px]">{getInitials(selectedEditor.display_name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">{selectedEditor.display_name || selectedEditor.email}</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Selecionar editor" />
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
                          <span className="text-sm">{u.display_name || u.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Dates */}
              <DateField label="Prazo" value={form.due_date} onChange={v => setForm(prev => ({ ...prev, due_date: v }))} />
              <DateField label="Início" value={form.start_date} onChange={v => setForm(prev => ({ ...prev, start_date: v }))} />

              {/* Delivered date (read-only) */}
              <div>
                <Label className="text-xs text-muted-foreground block mb-1.5">Entregue em</Label>
                <p className="text-sm mt-1">
                  {item.delivered_date ? format(parseISO(item.delivered_date), 'dd/MM/yyyy') : '—'}
                </p>
              </div>

              <Separator />

              {/* Time in stage */}
              <div>
                <Label className="text-xs text-muted-foreground block mb-1.5">Tempo na etapa atual</Label>
                <p className="text-sm mt-1 font-medium">
                  {daysInStage === 0 ? 'Hoje' : `${daysInStage} dia${daysInStage !== 1 ? 's' : ''}`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
