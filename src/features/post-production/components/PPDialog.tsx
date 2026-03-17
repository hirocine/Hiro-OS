import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePostProductionMutations } from '../hooks/usePostProductionMutations';
import { useUsers } from '@/hooks/useUsers';
import { PostProductionItem, PPStatus, PPPriority, PP_STATUS_CONFIG, PP_PRIORITY_CONFIG } from '../types';
import { Trash2 } from 'lucide-react';

interface PPDialogProps {
  item: PostProductionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PPDialog({ item, open, onOpenChange }: PPDialogProps) {
  const { updateItem, deleteItem } = usePostProductionMutations();
  const { users } = useUsers();

  const [form, setForm] = useState({
    title: '',
    project_name: '',
    client_name: '',
    editor_id: '',
    status: 'fila' as PPStatus,
    priority: 'media' as PPPriority,
    due_date: '',
    start_date: '',
    notes: '',
  });

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        project_name: item.project_name || '',
        client_name: item.client_name || '',
        editor_id: item.editor_id || '',
        status: item.status,
        priority: item.priority,
        due_date: item.due_date || '',
        start_date: item.start_date || '',
        notes: item.notes || '',
      });
    }
  }, [item]);

  const handleSave = () => {
    if (!item) return;
    const editorUser = users.find(u => u.id === form.editor_id);
    updateItem.mutate({
      id: item.id,
      updates: {
        title: form.title,
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
  };

  const handleDelete = () => {
    if (!item) return;
    deleteItem.mutate(item.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do Vídeo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Projeto</Label>
              <Input value={form.project_name} onChange={e => setForm(prev => ({ ...prev, project_name: e.target.value }))} placeholder="Nome do projeto" />
            </div>
            <div>
              <Label>Cliente</Label>
              <Input value={form.client_name} onChange={e => setForm(prev => ({ ...prev, client_name: e.target.value }))} placeholder="Nome do cliente" />
            </div>
          </div>

          <div>
            <Label>Editor</Label>
            <Select value={form.editor_id} onValueChange={v => setForm(prev => ({ ...prev, editor_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecionar editor" /></SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.display_name || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Etapa</Label>
              <Select value={form.status} onValueChange={v => setForm(prev => ({ ...prev, status: v as PPStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PP_STATUS_CONFIG).map(([v, c]) => (
                    <SelectItem key={v} value={v}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={v => setForm(prev => ({ ...prev, priority: v as PPPriority }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PP_PRIORITY_CONFIG).map(([v, c]) => (
                    <SelectItem key={v} value={v}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm(prev => ({ ...prev, due_date: e.target.value }))} />
            </div>
            <div>
              <Label>Início</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
