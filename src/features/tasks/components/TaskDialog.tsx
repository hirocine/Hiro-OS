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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
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
  
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'media' as TaskPriority,
    status: task?.status || 'pendente' as TaskStatus,
    due_date: task?.due_date || '',
    department: task?.department || '',
    assigned_to: task?.assigned_to || '',
    is_team_task: task?.is_team_task || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (task) {
      await updateTask.mutateAsync({ id: task.id, updates: formData });
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
      is_team_task: false,
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
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Ex: Audiovisual"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assigned_to">Responsável</Label>
            <Select
              value={formData.is_team_task ? 'team_hiro' : (formData.assigned_to || 'unassigned')}
              onValueChange={(value) => {
                if (value === 'team_hiro') {
                  setFormData({ ...formData, assigned_to: '', is_team_task: true });
                } else if (value === 'unassigned') {
                  setFormData({ ...formData, assigned_to: '', is_team_task: false });
                } else {
                  setFormData({ ...formData, assigned_to: value, is_team_task: false });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Nenhum</SelectItem>
                <SelectItem value="team_hiro">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    Time Hiro
                  </div>
                </SelectItem>
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
