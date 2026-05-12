import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useContactMutations } from '../../hooks/useContacts';
import { useTeamProfiles } from '../../hooks/useTeamProfiles';
import { useAuthContext } from '@/contexts/AuthContext';
import { CONTACT_TYPES, LEAD_SOURCES, type Contact } from '../../types/crm.types';

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
}

const emptyForm = {
  name: '', email: '', phone: '', company_name: '', position: '',
  contact_type: 'lead', lead_source: '', instagram: '', company_website: '',
  company_segment: '', notes: '', assigned_to: '',
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

// Wraps the control inside the <label> so the native label↔control
// association works without needing an explicit htmlFor/id pair on
// every call site. Click on the text focuses the input, screen
// readers announce them as paired.
const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <label style={{ display: 'flex', flexDirection: 'column' }}>
    <span style={fieldLabel}>
      {label}
      {required && <span style={{ marginLeft: 4, color: 'hsl(var(--ds-danger))' }}>*</span>}
    </span>
    {children}
  </label>
);

export function ContactForm({ open, onOpenChange, contact }: ContactFormProps) {
  const [form, setForm] = useState(emptyForm);
  const { createContact, updateContact } = useContactMutations();
  const { data: profiles } = useTeamProfiles();
  const { user } = useAuthContext();
  const isEditing = !!contact;

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name ?? '', email: contact.email ?? '', phone: contact.phone ?? '',
        company_name: contact.company_name ?? '', position: contact.position ?? '',
        contact_type: contact.contact_type ?? 'lead', lead_source: contact.lead_source ?? '',
        instagram: contact.instagram ?? '', company_website: contact.company_website ?? '',
        company_segment: contact.company_segment ?? '', notes: contact.notes ?? '',
        assigned_to: contact.assigned_to ?? '',
      });
    } else {
      setForm({ ...emptyForm, assigned_to: user?.id ?? '' });
    }
  }, [contact, open, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      ...form,
      lead_source: form.lead_source || null,
      assigned_to: form.assigned_to || null,
      created_by: user?.id,
    };

    if (isEditing && contact) {
      await updateContact.mutateAsync({ id: contact.id, ...payload });
    } else {
      await createContact.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>
            {isEditing ? 'Editar Contato' : 'Novo Contato'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Nome" required>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="E-mail">
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Telefone">
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="Tipo">
              <Select value={form.contact_type} onValueChange={(v) => set('contact_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Origem">
              <Select value={form.lead_source || 'none'} onValueChange={(v) => set('lead_source', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {LEAD_SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="Empresa">
              <Input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
            </Field>
            <Field label="Cargo">
              <Input value={form.position} onChange={(e) => set('position', e.target.value)} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="Instagram">
              <Input value={form.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@usuario" />
            </Field>
            <Field label="Site">
              <Input value={form.company_website} onChange={(e) => set('company_website', e.target.value)} />
            </Field>
          </div>
          <Field label="Responsável">
            <Select value={form.assigned_to || 'none'} onValueChange={(v) => set('assigned_to', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {profiles?.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Observações">
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
          </Field>
          <DialogFooter>
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button
              type="submit"
              className="btn primary"
              disabled={createContact.isPending || updateContact.isPending}
            >
              {isEditing ? 'Salvar' : 'Criar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
