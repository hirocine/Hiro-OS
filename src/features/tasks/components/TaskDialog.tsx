/**
 * ════════════════════════════════════════════════════════════════
 * TaskDialog — criar / editar tarefa
 * ════════════════════════════════════════════════════════════════
 *
 * Comportamento da CRIAÇÃO:
 *   - O criador é automaticamente o responsável (assignee).
 *   - Sem multi-select de "Responsáveis" — reatribuição vai pela
 *     célula inline na tabela ou pela página de detalhes.
 *   - Campo "Projeto" opcional (link com audiovisual_projects).
 *
 * Comportamento da EDIÇÃO:
 *   - Atualiza os mesmos campos. Responsáveis ainda são editados
 *     fora deste dialog (inline na tabela / detalhe).
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { useDepartments } from '../hooks/useDepartments';
import { Task, TaskPriority, TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG } from '../types';
import { Loader2 } from 'lucide-react';
import { enhancedToast } from '@/components/ui/enhanced-toast';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}

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

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const isEditing = !!task;
  const { createTask, updateTask } = useTaskMutations();
  const { departments } = useDepartments();

  const projectsQuery = useQuery({
    queryKey: ['av_projects', 'options'],
    queryFn: fetchProjectOptions,
    staleTime: 60_000,
    enabled: open,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [status, setStatus] = useState<TaskStatus>('pendente');
  const [dueDate, setDueDate] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Hydrate / reset when opening
  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title ?? '');
      setDescription(task.description ?? '');
      setPriority(task.priority ?? 'media');
      setStatus(task.status ?? 'pendente');
      setDueDate(task.due_date ?? '');
      setDepartment(task.department ?? '');
      setProjectId(task.project_id ?? '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('media');
      setStatus('pendente');
      setDueDate('');
      setDepartment('');
      setProjectId('');
    }
  }, [open, task]);

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...(departments ?? []).map((d) => d.name),
          ...(department ? [department] : []),
        ]),
      ).filter(Boolean),
    [departments, department],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      enhancedToast.error({ title: 'Título obrigatório' });
      return;
    }
    setSaving(true);
    try {
      const basePayload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
        due_date: dueDate || null,
        department: department || null,
        project_id: projectId || null,
      };

      if (isEditing && task) {
        await updateTask.mutateAsync({
          id: task.id,
          updates: basePayload as any,
          oldTask: {
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            due_date: task.due_date,
            department: task.department,
          },
        });
      } else {
        await createTask.mutateAsync(basePayload as any);
      }
      onOpenChange(false);
    } catch (err) {
      enhancedToast.error({
        title: 'Erro ao salvar tarefa',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
          {!isEditing && (
            <DialogDescription>
              A tarefa será criada com você como responsável. Você pode
              reatribuir depois.
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span style={{ color: 'hsl(var(--ds-danger))' }}>*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Editar reel do projeto X"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Notas, contexto, links…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_CONFIG[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="due_date">Prazo</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Select
                value={department || '__none__'}
                onValueChange={(v) => setDepartment(v === '__none__' ? '' : v)}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {departmentOptions.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">
              Projeto{' '}
              <span style={{ color: 'hsl(var(--ds-fg-3))', fontWeight: 400, fontSize: 11 }}>
                — opcional
              </span>
            </Label>
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
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando…</span>
                </>
              ) : (
                <span>{isEditing ? 'Salvar' : 'Criar tarefa'}</span>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
