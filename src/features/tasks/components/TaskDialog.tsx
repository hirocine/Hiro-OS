import { useState } from 'react';
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
import { Users, Plus, Check, X } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const { createTask, updateTask } = useTaskMutations();
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
    assigned_to: task?.assigned_to || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (task) {
      // Pass oldTask for history tracking
      await updateTask.mutateAsync({ 
        id: task.id, 
        updates: formData,
        oldTask: {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
          department: task.department,
          assigned_to: task.assigned_to,
        }
      });
    } else {
      await createTask.mutateAsync(formData);
    }
    
    onOpenChange(false);
    setFormData({
      title: '',
      description: '',
      priority: 'media',
      status: 'pendente',
      due_date: '',
      department: '',
      assigned_to: '',
    });
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
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Prioridade</Label>
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
                    <SelectItem key={key} value={key} className="focus:bg-transparent">
                      <PriorityBadge priority={key} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
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
                    <SelectItem key={key} value={key} className="focus:bg-transparent">
                      <StatusBadge status={key} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Prazo</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
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
                      <div className="flex items-center gap-2 text-primary">
                        <Plus className="w-4 h-4" />
                        Criar novo departamento...
                      </div>
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
                  <Button
                    type="button"
                    size="sm"
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
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingNewDept(false);
                      setNewDeptName('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_to">Responsável</Label>
            <Select
              value={formData.assigned_to || 'unassigned'}
              onValueChange={(value) => {
                if (value === 'unassigned') {
                  setFormData({ ...formData, assigned_to: '' });
                } else {
                  setFormData({ ...formData, assigned_to: value });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Nenhum</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.display_name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      {user.display_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>
              {task ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
