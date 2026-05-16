import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { useUsers } from '@/hooks/useUsers';
import { useAuthContext } from '@/contexts/AuthContext';
import { PostProductionItem, PPStatus, PPPriority, PP_STATUS_CONFIG, PP_PRIORITY_CONFIG } from '../types';
import { PPStatusBadge } from './PPStatusBadge';
import { PPPriorityBadge } from './PPPriorityBadge';
import { Trash2, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={fieldLabel}>{label}</label>
    {children}
  </div>
);

function parseTitle(title: string): { client_name: string; project_name: string; suffix: string } {
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
  return name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

export function PPDialog({ item, open, onOpenChange }: PPDialogProps) {
  const { updateItem, deleteItem, createItem } = usePostProductionMutations();
  const { users } = useUsers();
  const { user } = useAuthContext();
  const isCreating = !item;

  const [form, setForm] = useState(defaultForm);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

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
  const selectedEditor = users.find((u) => u.id === form.editor_id);

  const handleSave = async () => {
    if (!form.client_name.trim()) return;
    const title = composedTitle;
    const editorUser = users.find((u) => u.id === form.editor_id);

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
          ...(form.status === 'entregue' && !item.delivered_date
            ? { delivered_date: new Date().toISOString().split('T')[0] }
            : {}),
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto ds-shell">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>
            {isCreating ? 'Novo Vídeo' : 'Editar Vídeo'}
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <Field label="Empresa">
              <Input
                value={form.client_name}
                onChange={(e) => setForm((prev) => ({ ...prev, client_name: e.target.value }))}
                placeholder="Ex: Cacau Show"
              />
            </Field>
            <Field label="Projeto">
              <Input
                value={form.project_name}
                onChange={(e) => setForm((prev) => ({ ...prev, project_name: e.target.value }))}
                placeholder="Ex: Campanha de Natal"
              />
            </Field>
            <Field label="Sufixo">
              <Input
                value={form.suffix}
                onChange={(e) => setForm((prev) => ({ ...prev, suffix: e.target.value }))}
                placeholder="Ex: Criativo 1"
              />
            </Field>
          </div>

          <Field label="Título do Vídeo">
            <Input
              value={composedTitle}
              readOnly
              disabled
              style={{
                background: 'hsl(var(--ds-line-2) / 0.4)',
                color: 'hsl(var(--ds-fg-3))',
                cursor: 'not-allowed',
              }}
              placeholder="Preencha os campos acima…"
            />
          </Field>

          <Field label="Editor">
            <Select value={form.editor_id} onValueChange={(v) => setForm((prev) => ({ ...prev, editor_id: v }))}>
              <SelectTrigger>
                {selectedEditor ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Avatar style={{ width: 22, height: 22 }}>
                      <AvatarImage src={getUserAvatarUrl(selectedEditor)} />
                      <AvatarFallback style={{ fontSize: 9 }}>
                        {getInitials(selectedEditor.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedEditor.display_name || selectedEditor.email}
                    </span>
                  </div>
                ) : (
                  <SelectValue placeholder="Selecionar editor" />
                )}
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Avatar style={{ width: 22, height: 22 }}>
                        <AvatarImage src={getUserAvatarUrl(u)} />
                        <AvatarFallback style={{ fontSize: 9 }}>
                          {getInitials(u.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{u.display_name || u.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="Etapa">
              <Select value={form.status} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v as PPStatus }))}>
                <SelectTrigger>
                  <PPStatusBadge status={form.status} />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(PP_STATUS_CONFIG).map((v) => (
                    <SelectItem key={v} value={v}>
                      <PPStatusBadge status={v as PPStatus} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={form.priority} onValueChange={(v) => setForm((prev) => ({ ...prev, priority: v as PPPriority }))}>
                <SelectTrigger>
                  <PPPriorityBadge priority={form.priority} />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(PP_PRIORITY_CONFIG).map((v) => (
                    <SelectItem key={v} value={v}>
                      <PPPriorityBadge priority={v as PPPriority} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="Início">
              <Popover modal={false} open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      gap: 8,
                      color: form.start_date ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-4))',
                    }}
                  >
                    <CalendarIcon size={14} strokeWidth={1.5} />
                    {form.start_date
                      ? format(new Date(form.start_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecionar data'}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 z-[200]"
                  align="start"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <Calendar
                    mode="single"
                    selected={form.start_date ? new Date(form.start_date + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      setForm((prev) => ({ ...prev, start_date: date ? format(date, 'yyyy-MM-dd') : '' }));
                      setStartDateOpen(false);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {form.start_date && (
                <button
                  type="button"
                  style={{
                    fontSize: 11,
                    color: 'hsl(var(--ds-fg-3))',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    marginTop: 4,
                    alignSelf: 'flex-start',
                  }}
                  onClick={() => setForm((prev) => ({ ...prev, start_date: '' }))}
                >
                  Limpar
                </button>
              )}
            </Field>
            <Field label="Data de Entrega">
              <Popover modal={false} open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      gap: 8,
                      color: form.due_date ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-4))',
                    }}
                  >
                    <CalendarIcon size={14} strokeWidth={1.5} />
                    {form.due_date
                      ? format(new Date(form.due_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Selecionar data'}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 z-[200]"
                  align="start"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <Calendar
                    mode="single"
                    selected={form.due_date ? new Date(form.due_date + 'T00:00:00') : undefined}
                    onSelect={(date) => {
                      setForm((prev) => ({ ...prev, due_date: date ? format(date, 'yyyy-MM-dd') : '' }));
                      setDueDateOpen(false);
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {form.due_date && (
                <button
                  type="button"
                  style={{
                    fontSize: 11,
                    color: 'hsl(var(--ds-fg-3))',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    marginTop: 4,
                    alignSelf: 'flex-start',
                  }}
                  onClick={() => setForm((prev) => ({ ...prev, due_date: '' }))}
                >
                  Limpar
                </button>
              )}
            </Field>
          </div>

          <Field label="Observações">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </Field>
        </div>

        <DialogFooter style={{ justifyContent: 'space-between', display: 'flex' }}>
          {!isCreating ? (
            <button
              type="button"
              className="btn"
              style={{
                color: 'hsl(var(--ds-danger))',
                borderColor: 'hsl(var(--ds-danger) / 0.3)',
              }}
              onClick={handleDelete}
            >
              <Trash2 size={14} strokeWidth={1.5} />
              <span>Excluir</span>
            </button>
          ) : (
            <div />
          )}
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleSave}
              disabled={!form.client_name.trim()}
            >
              {isCreating ? 'Criar' : 'Salvar'}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
