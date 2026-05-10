import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTaskMutations } from '../hooks/useTaskMutations';
import { Task, TaskPriority, TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG } from '../types';
import { useUsers } from '@/hooks/useUsers';
import { useDepartments } from '../hooks/useDepartments';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Check, X } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';
import { Checkbox } from '@/components/ui/checkbox';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={fieldLabel}>
      {label}
      {required && <span style={{ marginLeft: 4, color: 'hsl(var(--ds-danger))' }}>*</span>}
    </label>
    {children}
  </div>
);

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const { createTask, updateTask, updateAssignees } = useTaskMutations();
  const { users } = useUsers();
  const { departments, createDepartment } = useDepartments();

  const [isCreatingNewDept, setIsCreatingNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || ('media' as TaskPriority),
    status: task?.status || ('pendente' as TaskStatus),
    due_date: task?.due_date || '',
    department: task?.department || '',
    assignee_ids: task?.assignees?.map((a) => a.user_id) || ([] as string[]),
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: task.status,
        due_date: task.due_date || '',
        department: task.department || '',
        assignee_ids: task.assignees?.map((a) => a.user_id) || [],
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (task) {
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          title: formData.title,
          description: formData.description || null,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || null,
          department: formData.department || null,
        } as any,
        oldTask: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
          department: task.department,
        },
      });
      await updateAssignees.mutateAsync({ taskId: task.id, assigneeIds: formData.assignee_ids });
    } else {
      await createTask.mutateAsync({
        ...formData,
        description: formData.description || null,
        due_date: formData.due_date || null,
        department: formData.department || null,
      } as any);
    }

    onOpenChange(false);
    setFormData({
      title: '',
      description: '',
      priority: 'media',
      status: 'pendente',
      due_date: '',
      department: '',
      assignee_ids: [],
    });
  };

  const toggleAssignee = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(userId)
        ? prev.assignee_ids.filter((id) => id !== userId)
        : [...prev.assignee_ids, userId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Título" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </Field>

          <Field label="Descrição">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="Prioridade">
              <Select
                value={formData.priority}
                onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue>
                    <PriorityBadge priority={formData.priority} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      <PriorityBadge priority={key} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Status">
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue>
                    <StatusBadge status={formData.status} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      <StatusBadge status={key} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="Prazo">
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </Field>

            <Field label="Departamento">
              {!isCreatingNewDept ? (
                <Select
                  value={formData.department || 'none'}
                  onValueChange={(value) => {
                    if (value === 'create_new') {
                      setIsCreatingNewDept(true);
                      setNewDeptName('');
                    } else if (value === 'none') {
                      setFormData({ ...formData, department: '' });
                    } else {
                      setFormData({ ...formData, department: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="create_new">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(var(--ds-accent))' }}>
                        <Plus size={14} strokeWidth={1.5} />
                        Criar novo departamento…
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <Input
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Nome do novo departamento"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newDeptName.trim()) {
                        e.preventDefault();
                        createDepartment.mutateAsync(newDeptName).then((dept) => {
                          setFormData({ ...formData, department: dept.name });
                          setIsCreatingNewDept(false);
                          setNewDeptName('');
                        });
                      } else if (e.key === 'Escape') {
                        setIsCreatingNewDept(false);
                        setNewDeptName('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn primary"
                    style={{ width: 36, padding: 0 }}
                    onClick={() => {
                      if (newDeptName.trim()) {
                        createDepartment.mutateAsync(newDeptName).then((dept) => {
                          setFormData({ ...formData, department: dept.name });
                          setIsCreatingNewDept(false);
                          setNewDeptName('');
                        });
                      }
                    }}
                    disabled={!newDeptName.trim() || createDepartment.isPending}
                  >
                    <Check size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ width: 36, padding: 0 }}
                    onClick={() => {
                      setIsCreatingNewDept(false);
                      setNewDeptName('');
                    }}
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </Field>
          </div>

          <div>
            <span style={fieldLabel}>Responsáveis</span>
            <div
              style={{
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxHeight: 192,
                overflowY: 'auto',
              }}
            >
              {users.map((u) => {
                const checked = formData.assignee_ids.includes(u.id);
                return (
                  <label
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleAssignee(u.id)} />
                    <Avatar style={{ width: 22, height: 22 }}>
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback style={{ fontSize: 10 }}>
                        {u.display_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>
                      {u.display_name || u.email}
                    </span>
                  </label>
                );
              })}
            </div>
            {formData.assignee_ids.length > 0 && (
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 6 }}>
                {formData.assignee_ids.length} responsável(is) selecionado(s)
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={createTask.isPending || updateTask.isPending}
            >
              {task ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
