import { useState } from 'react';
import { ArrowLeft, Save, FileText, Info, CalendarIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

// --- DS Field Label ---
const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

// --- DS Section Shell ---
function SectionShell({
  icon: Icon,
  title,
  actions,
  children,
}: {
  icon: React.ElementType;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-2))',
            }}
          >
            {title}
          </span>
        </div>
        {actions}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

// --- Date Picker Helper ---
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={fieldLabelStyle}>{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="btn"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <CalendarIcon size={13} strokeWidth={1.5} />
            <span
              style={{
                fontVariantNumeric: 'tabular-nums',
                color: value ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
              }}
            >
              {value ? format(new Date(value + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? new Date(value + 'T00:00:00') : undefined}
            onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          {value && (
            <div style={{ padding: 8, borderTop: '1px solid hsl(var(--ds-line-1))' }}>
              <button
                type="button"
                className="btn"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                onClick={() => onChange('')}
              >
                <X size={13} strokeWidth={1.5} /> Limpar
              </button>
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

  const saveAction = isDirty ? (
    <button type="button" className="btn primary" onClick={handleSave}>
      <Save size={13} strokeWidth={1.5} /> Salvar
    </button>
  ) : undefined;

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
      <div className="animate-fade-in space-y-6">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="btn"
              style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
              onClick={onBack}
              aria-label="Voltar"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
            </button>
            <div className="min-w-0">
              <p style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))' }}>
                Esteira de Pós
              </p>
              <h1
                style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'hsl(var(--ds-fg-1))',
                }}
                className="truncate"
              >
                {composedTitle || 'Editar Vídeo'}
              </h1>
            </div>
          </div>
        </div>

        {/* ===== DADOS DO VÍDEO ===== */}
        <SectionShell icon={FileText} title="Dados do Vídeo" actions={saveAction}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="edit-client" style={fieldLabelStyle}>Empresa</label>
                <Input id="edit-client" value={form.client_name} onChange={e => setForm(prev => ({ ...prev, client_name: e.target.value }))} placeholder="Ex: Cacau Show" />
              </div>
              <div>
                <label htmlFor="edit-project" style={fieldLabelStyle}>Projeto</label>
                <Input id="edit-project" value={form.project_name} onChange={e => setForm(prev => ({ ...prev, project_name: e.target.value }))} placeholder="Ex: Campanha de Natal" />
              </div>
              <div>
                <label htmlFor="edit-suffix" style={fieldLabelStyle}>Sufixo</label>
                <Input id="edit-suffix" value={form.suffix} onChange={e => setForm(prev => ({ ...prev, suffix: e.target.value }))} placeholder="Ex: Criativo 1" />
              </div>
            </div>
            <div>
              <label style={fieldLabelStyle}>Título gerado</label>
              <Input
                value={composedTitle}
                readOnly
                disabled
                style={{
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                  color: 'hsl(var(--ds-fg-3))',
                  cursor: 'not-allowed',
                }}
              />
            </div>
            <div>
              <label htmlFor="edit-notes" style={fieldLabelStyle}>Observações</label>
              <Textarea id="edit-notes" value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
            </div>
          </div>
        </SectionShell>

        {/* ===== INFORMAÇÕES ===== */}
        <SectionShell icon={Info} title="Informações" actions={saveAction}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label style={fieldLabelStyle}>Etapa</label>
              <Select value={form.status} onValueChange={v => setForm(prev => ({ ...prev, status: v as PPStatus }))}>
                <SelectTrigger>
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
              <label style={fieldLabelStyle}>Prioridade</label>
              <Select value={form.priority} onValueChange={v => setForm(prev => ({ ...prev, priority: v as PPPriority }))}>
                <SelectTrigger>
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
              <label style={fieldLabelStyle}>Editor</label>
              <Select value={form.editor_id} onValueChange={v => setForm(prev => ({ ...prev, editor_id: v }))}>
                <SelectTrigger>
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
        </SectionShell>
      </div>
      </div>
    </div>
  );
}
