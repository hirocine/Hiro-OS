import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.contact_type} onValueChange={v => set('contact_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select value={form.lead_source || 'none'} onValueChange={v => set('lead_source', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cargo</Label>
              <Input value={form.position} onChange={e => set('position', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Instagram</Label>
              <Input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@usuario" />
            </div>
            <div className="space-y-1.5">
              <Label>Site</Label>
              <Input value={form.company_website} onChange={e => set('company_website', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <Select value={form.assigned_to || 'none'} onValueChange={v => set('assigned_to', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {profiles?.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createContact.isPending || updateContact.isPending}>
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
