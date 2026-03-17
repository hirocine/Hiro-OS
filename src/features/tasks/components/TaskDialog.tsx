import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const { createTask, updateTask, updateAssignees } = useTaskMutations();
  const { users } = useUsers();
  const { departments, createDepartment } = useDepartments();
  
  const [isCreatingNewDept, setIsCreatingNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'media' as TaskPriority,
    status: task?.status || 'pendente' as TaskStatus,
    due_date: task?.due_date || '',
    department: task?.department || '',
    assignee_ids: task?.assignees?.map(a => a.user_id) || [] as string[],
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
        assignee_ids: task.assignees?.map(a => a.user_id) || [],
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
        }
      });
      // Update assignees separately
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
    setFormData(prev => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(userId)
        ? prev.assignee_ids.filter(id => id !== userId)
        : [...prev.assignee_ids, userId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue><PriorityBadge priority={formData.priority} /></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((key) => (
                    <SelectItem key={key} value={key} className="focus:bg-transparent"><PriorityBadge priority={key} /></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue><StatusBadge status={formData.status} /></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((key) => (
                    <SelectItem key={key} value={key} className="focus:bg-transparent"><StatusBadge status={key} /></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Prazo</Label>
              <Input id="due_date" type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
            </div>

            <div>
              <Label htmlFor="department">Departamento</Label>
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
                  <SelectTrigger><SelectValue placeholder="Selecione um departamento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                    ))}
                    <SelectItem value="create_new">
                      <div className="flex items-center gap-2 text-primary"><Plus className="w-4 h-4" />Criar novo departamento...</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
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
                  <Button type="button" size="sm" onClick={() => {
                    if (newDeptName.trim()) {
                      createDepartment.mutateAsync(newDeptName).then((dept) => {
                        setFormData({ ...formData, department: dept.name });
                        setIsCreatingNewDept(false);
                        setNewDeptName('');
                      });
                    }
                  }} disabled={!newDeptName.trim() || createDepartment.isPending}><Check className="w-4 h-4" /></Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setIsCreatingNewDept(false); setNewDeptName(''); }}><X className="w-4 h-4" /></Button>
                </div>
              )}
            </div>
          </div>

          {/* Multi-assignee selection */}
          <div>
            <Label>Responsáveis</Label>
            <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto mt-1">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={formData.assignee_ids.includes(u.id)}
                    onCheckedChange={() => toggleAssignee(u.id)}
                  />
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback>{u.display_name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{u.display_name || u.email}</span>
                </label>
              ))}
            </div>
            {formData.assignee_ids.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formData.assignee_ids.length} responsável(is) selecionado(s)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>{task ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
