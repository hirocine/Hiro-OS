import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { useUsers } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { PostProductionItem, PPStatus, PPPriority, PP_STATUS_CONFIG, PP_PRIORITY_CONFIG } from '../types';
import { PPStatusBadge } from './PPStatusBadge';
import { PPPriorityBadge } from './PPPriorityBadge';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PPDialogProps {
  item: PostProductionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultForm = {
  client_name: '',
  project_name: '',
  suffix: '',
  editor_id: '',
  status: 'fila' as PPStatus,
  priority: 'media' as PPPriority,
  due_date: '',
  start_date: '',
  notes: '',
};

function parseTitle(title: string): { client_name: string; project_name: string; suffix: string } {
  // Try to parse "Empresa: Projeto - Sufixo"
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

export function PPDialog({ item, open, onOpenChange }: PPDialogProps) {
  const { updateItem, deleteItem, createItem } = usePostProductionMutations();
  const { users } = useUsers();
  const { user } = useAuthContext();
  const isCreating = !item;

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (item) {
      const parsed = parseTitle(item.title);
      setForm({
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
    } else {
      setForm(defaultForm);
    }
  }, [item, open]);

  const composedTitle = composeTitle(form.client_name, form.project_name, form.suffix);

  const selectedEditor = users.find(u => u.id === form.editor_id);

  const handleSave = async () => {
    if (!form.client_name.trim()) return;
    const title = composedTitle;
    const editorUser = users.find(u => u.id === form.editor_id);

    if (isCreating) {
      if (!user) return;
      try {
        await createItem.mutateAsync({
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
        });
        onOpenChange(false);
      } catch {
        toast.error('Erro ao criar vídeo');
      }
    } else {
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
      onOpenChange(false);
    }
  };

  const handleDelete = () => {
    if (!item) return;
    deleteItem.mutate(item.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreating ? 'Novo Vídeo' : 'Editar Vídeo'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pp-client">Empresa</Label>
              <Input id="pp-client" value={form.client_name} onChange={e => setForm(prev => ({ ...prev, client_name: e.target.value }))} placeholder="Ex: Cacau Show" />
            </div>
            <div>
              <Label htmlFor="pp-project">Projeto</Label>
              <Input id="pp-project" value={form.project_name} onChange={e => setForm(prev => ({ ...prev, project_name: e.target.value }))} placeholder="Ex: Campanha de Natal" />
            </div>
            <div>
              <Label htmlFor="pp-suffix">Sufixo</Label>
              <Input id="pp-suffix" value={form.suffix} onChange={e => setForm(prev => ({ ...prev, suffix: e.target.value }))} placeholder="Ex: Criativo 1" />
            </div>
          </div>

          <div>
            <Label>Título do Vídeo</Label>
            <Input
              value={composedTitle}
              readOnly
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
              placeholder="Preencha os campos acima..."
            />
          </div>

          {/* Editor com Avatar */}
          <div>
            <Label>Editor</Label>
            <Select value={form.editor_id} onValueChange={v => setForm(prev => ({ ...prev, editor_id: v }))}>
              <SelectTrigger>
                {selectedEditor ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={getUserAvatarUrl(selectedEditor)} />
                      <AvatarFallback className="text-[10px]">{getInitials(selectedEditor.display_name)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{selectedEditor.display_name || selectedEditor.email}</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Selecionar editor" />
                )}
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={getUserAvatarUrl(u)} />
                        <AvatarFallback className="text-[10px]">{getInitials(u.display_name)}</AvatarFallback>
                      </Avatar>
                      <span>{u.display_name || u.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Etapa e Prioridade com Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Etapa</Label>
              <Select value={form.status} onValueChange={v => setForm(prev => ({ ...prev, status: v as PPStatus }))}>
                <SelectTrigger>
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
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={v => setForm(prev => ({ ...prev, priority: v as PPPriority }))}>
                <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prazo</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.due_date
                      ? format(new Date(form.due_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.due_date ? new Date(form.due_date + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      setForm(prev => ({ ...prev, due_date: date ? format(date, 'yyyy-MM-dd') : '' }));
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  {form.due_date && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setForm(prev => ({ ...prev, due_date: '' }))}>
                        <X className="w-4 h-4 mr-2" /> Limpar
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.start_date
                      ? format(new Date(form.start_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecionar data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.start_date ? new Date(form.start_date + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      setForm(prev => ({ ...prev, start_date: date ? format(date, 'yyyy-MM-dd') : '' }));
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  {form.start_date && (
                    <div className="p-2 border-t">
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setForm(prev => ({ ...prev, start_date: '' }))}>
                        <X className="w-4 h-4 mr-2" /> Limpar
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="pp-notes">Observações</Label>
            <Textarea id="pp-notes" value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {!isCreating ? (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.client_name.trim()}>
              {isCreating ? 'Criar' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
