/**
 * ════════════════════════════════════════════════════════════════
 * /tarefas/nova — criação full-page (substitui o dialog)
 * ════════════════════════════════════════════════════════════════
 *
 * Estética igual à TaskDetails: breadcrumb, card "Detalhes" no grid,
 * card "Descrição" abaixo. Mas com campos editáveis diretos (form),
 * não InlineEdit que exige click pra abrir.
 *
 * Comportamento:
 *   - O criador é automaticamente o responsável (assignee). Reatribuição
 *     vai por inline na tabela ou pela página de detalhes depois.
 *   - Projeto AV é opcional (link com audiovisual_projects).
 *   - Subtarefas/comentários/anexos/links só aparecem depois de salvar
 *     (na página de detalhes da tarefa criada).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useTaskMutations } from '@/features/tasks/hooks/useTaskMutations';
import { useDepartments } from '@/features/tasks/hooks/useDepartments';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  TaskPriority,
  TaskStatus,
} from '@/features/tasks/types';
import { PriorityBadge } from '@/features/tasks/components/PriorityBadge';
import { StatusBadge } from '@/features/tasks/components/StatusBadge';
import { enhancedToast } from '@/components/ui/enhanced-toast';

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
};

interface AVProjectOption {
  id: string;
  name: string;
}

async function fetchProjectOptions(): Promise<AVProjectOption[]> {
  const { data, error } = await supabase
    .from('audiovisual_projects')
    .select('id, name')
    .order('name', { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as AVProjectOption[];
}

export default function TaskNew() {
  const navigate = useNavigate();
  const { createTask } = useTaskMutations();
  const { departments } = useDepartments();

  const projectsQuery = useQuery({
    queryKey: ['av_projects', 'options'],
    queryFn: fetchProjectOptions,
    staleTime: 60_000,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [status, setStatus] = useState<TaskStatus>('pendente');
  const [dueDate, setDueDate] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      enhancedToast.error({ title: 'Título obrigatório' });
      return;
    }
    setSaving(true);
    try {
      const created = await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
        department: department || null,
        project_id: projectId || null,
      } as any);
      navigate(`/tarefas/${created.id}`);
    } catch (err) {
      enhancedToast.error({
        title: 'Erro ao criar tarefa',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <BreadcrumbNav
          items={[
            { label: 'Tarefas', href: '/tarefas' },
            { label: 'Nova tarefa' },
          ]}
        />

        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da tarefa…"
                autoFocus
                style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 28,
                  fontWeight: 700,
                  height: 48,
                  border: 0,
                  background: 'transparent',
                  padding: 0,
                  boxShadow: 'none',
                }}
              />
              <p
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--ds-fg-3))',
                  marginTop: 4,
                }}
              >
                Você será o responsável. Pode reatribuir depois.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                className="btn"
                onClick={() => navigate('/tarefas')}
                disabled={saving}
              >
                <ArrowLeft size={13} strokeWidth={1.5} />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={saving || !title.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                    <span>Criando…</span>
                  </>
                ) : (
                  <>
                    <Save size={13} strokeWidth={1.5} />
                    <span>Criar tarefa</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Details Card */}
            <div
              style={{
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid hsl(var(--ds-line-1))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-2))',
                  }}
                >
                  Detalhes
                </span>
              </div>
              <div style={{ padding: 18 }}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Label htmlFor="status" style={eyebrow}>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                      <SelectTrigger id="status">
                        <SelectValue>
                          <StatusBadge status={status} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            <StatusBadge status={s} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Label htmlFor="priority" style={eyebrow}>Prioridade</Label>
                    <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                      <SelectTrigger id="priority">
                        <SelectValue>
                          <PriorityBadge priority={priority} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                          <SelectItem key={p} value={p}>
                            <PriorityBadge priority={p} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Label htmlFor="due_date" style={eyebrow}>Prazo</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  {/* Department */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Label htmlFor="department" style={eyebrow}>Departamento</Label>
                    <Select
                      value={department || '__none__'}
                      onValueChange={(v) => setDepartment(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {(departments ?? []).map((d) => (
                          <SelectItem key={d.id ?? d.name} value={d.name}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Projeto */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Label htmlFor="project" style={eyebrow}>Projeto</Label>
                    <Select
                      value={projectId || '__none__'}
                      onValueChange={(v) => setProjectId(v === '__none__' ? '' : v)}
                    >
                      <SelectTrigger id="project">
                        <SelectValue
                          placeholder={projectsQuery.isLoading ? 'Carregando…' : 'Sem projeto'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem projeto</SelectItem>
                        {(projectsQuery.data ?? []).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div
              style={{
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid hsl(var(--ds-line-1))',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-2))',
                  }}
                >
                  Descrição
                </span>
              </div>
              <div style={{ padding: 18 }}>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Notas, contexto, links… (opcional)"
                  className="resize-y border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  style={{ background: 'transparent', fontSize: 14 }}
                />
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
              Depois de criar, você poderá adicionar subtarefas, comentários,
              anexos e links externos na página de detalhes da tarefa.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
