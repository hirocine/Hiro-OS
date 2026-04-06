import { useState } from 'react';
import { ArrowLeft, Save, FileText, Info, CalendarIcon, X } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { useUsers } from '@/hooks/useUsers';
import { PostProductionItem, PPStatus, PPPriority, PP_STATUS_CONFIG, PP_PRIORITY_CONFIG } from '../types';
import { PPStatusBadge } from './PPStatusBadge';
import { PPPriorityBadge } from './PPPriorityBadge';

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

function SectionHeader({ icon: Icon, title, actions }: { icon: React.ElementType; title: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-muted">
          <Icon className="h-4 w-4 text-foreground/70" />
        </div>
        <CardTitle className="text-sm font-semibold tracking-tight">{title}</CardTitle>
      </div>
      {actions}
    </div>
  );
}

// --- Date Picker Helper ---
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
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
}

// --- Component ---
interface Props {
  item: PostProductionItem;
  onBack: () => void;
}

export function PPVideoEditForm({ item, onBack }: Props) {
  const { updateItem } = usePostProductionMutations();
  const { users } = useUsers();

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

  const composedTitle = composeTitle(form.client_name, form.project_name, form.suffix);
  const selectedEditor = users.find(u => u.id === form.editor_id);

  // isDirty check
  const isDirty =
    form.client_name !== (item.client_name || parsed.client_name) ||
    form.project_name !== (item.project_name || parsed.project_name) ||
    form.suffix !== parsed.suffix ||
    form.editor_id !== (item.editor_id || '') ||
    form.status !== item.status ||
    form.priority !== item.priority ||
    form.due_date !== (item.due_date || '') ||
    form.start_date !== (item.start_date || '') ||
    form.notes !== (item.notes || '');

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
        ...(form.status === 'entregue' && !item.delivered_date ? { delivered_date: new Date().toISOString().split('T')[0] } : {}),
      },
    });
    toast.success('Salvo!');
    onBack();
  };

  return (
    <ResponsiveContainer maxWidth="7xl">
      <div className="animate-fade-in space-y-6">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Esteira de Pós</p>
              <h1 className="text-lg font-semibold truncate">{composedTitle || 'Editar Vídeo'}</h1>
            </div>
          </div>
        </div>

        {/* ===== DADOS DO VÍDEO ===== */}
        <Card>
          <SectionHeader
            icon={FileText}
            title="Dados do Vídeo"
            actions={
              isDirty ? (
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                </Button>
              ) : undefined
            }
          />
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-client" className="text-xs text-muted-foreground block mb-1.5">Empresa</Label>
                <Input id="edit-client" value={form.client_name} onChange={e => setForm(prev => ({ ...prev, client_name: e.target.value }))} placeholder="Ex: Cacau Show" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-project" className="text-xs text-muted-foreground block mb-1.5">Projeto</Label>
                <Input id="edit-project" value={form.project_name} onChange={e => setForm(prev => ({ ...prev, project_name: e.target.value }))} placeholder="Ex: Campanha de Natal" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-suffix" className="text-xs text-muted-foreground block mb-1.5">Sufixo</Label>
                <Input id="edit-suffix" value={form.suffix} onChange={e => setForm(prev => ({ ...prev, suffix: e.target.value }))} placeholder="Ex: Criativo 1" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground block mb-1.5">Título gerado</Label>
              <Input value={composedTitle} readOnly disabled className="bg-muted text-muted-foreground cursor-not-allowed h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes" className="text-xs text-muted-foreground block mb-1.5">Observações</Label>
              <Textarea id="edit-notes" value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* ===== INFORMAÇÕES ===== */}
        <Card>
          <SectionHeader
            icon={Info}
            title="Informações"
            actions={
              isDirty ? (
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                </Button>
              ) : undefined
            }
          />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground block mb-1.5">Etapa</Label>
                <Select value={form.status} onValueChange={v => setForm(prev => ({ ...prev, status: v as PPStatus }))}>
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
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
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

              {/* Prazo */}
              <DateField label="Prazo" value={form.due_date} onChange={v => setForm(prev => ({ ...prev, due_date: v }))} />

              {/* Início */}
              <DateField label="Início" value={form.start_date} onChange={v => setForm(prev => ({ ...prev, start_date: v }))} />
            </div>
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
}
