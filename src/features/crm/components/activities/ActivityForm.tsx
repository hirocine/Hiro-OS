import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useActivityMutations } from '../../hooks/useActivities';
import { useAuthContext } from '@/contexts/AuthContext';
import { ACTIVITY_TYPES } from '../../types/crm.types';

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: string;
  dealId?: string;
}

export function ActivityForm({ open, onOpenChange, contactId, dealId }: ActivityFormProps) {
  const [form, setForm] = useState({ title: '', activity_type: 'nota', description: '', scheduled_at: '' });
  const { createActivity } = useActivityMutations();
  const { user } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createActivity.mutateAsync({
      title: form.title, activity_type: form.activity_type,
      description: form.description || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      contact_id: contactId ?? null, deal_id: dealId ?? null,
      created_by: user?.id,
    });
    setForm({ title: '', activity_type: 'nota', description: '', scheduled_at: '' });
    onOpenChange(false);
  };

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.activity_type} onValueChange={v => set('activity_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Data Agendada</Label>
            <Input type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createActivity.isPending}>Criar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
