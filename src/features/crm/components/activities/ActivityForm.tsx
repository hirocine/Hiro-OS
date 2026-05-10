import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>Nova Atividade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Título" required>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </Field>
          <Field label="Tipo">
            <Select value={form.activity_type} onValueChange={(v) => set('activity_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Data Agendada">
            <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => set('scheduled_at', e.target.value)} />
          </Field>
          <Field label="Descrição">
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} />
          </Field>
          <DialogFooter>
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button type="submit" className="btn primary" disabled={createActivity.isPending}>
              Criar
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
