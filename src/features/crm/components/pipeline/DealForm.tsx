import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDealMutations } from '../../hooks/useDeals';
import { useContacts } from '../../hooks/useContacts';
import { usePipelineStages } from '../../hooks/usePipelineStages';
import { useTeamProfiles } from '../../hooks/useTeamProfiles';
import { useAuthContext } from '@/contexts/AuthContext';
import { SERVICE_TYPES, type Deal } from '../../types/crm.types';
import { supabase } from '@/integrations/supabase/client';

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  defaultContactId?: string;
}

const emptyForm = {
  title: '', contact_id: '', stage_id: '', estimated_value: '',
  service_type: '', description: '', expected_close_date: '',
  proposal_id: '', assigned_to: '',
};

export function DealForm({ open, onOpenChange, deal, defaultContactId }: DealFormProps) {
  const [form, setForm] = useState(emptyForm);
  const { createDeal, updateDeal } = useDealMutations();
  const { data: contacts } = useContacts();
  const { data: stages } = usePipelineStages();
  const { data: profiles } = useTeamProfiles();
  const { user } = useAuthContext();
  const isEditing = !!deal;

  const { data: proposals } = useQuery({
    queryKey: ['orcamentos-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('id, project_name, client_name, slug, final_value, status')
        .eq('is_latest_version', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (deal) {
      setForm({
        title: deal.title, contact_id: deal.contact_id, stage_id: deal.stage_id,
        estimated_value: deal.estimated_value?.toString() ?? '',
        service_type: deal.service_type ?? '', description: deal.description ?? '',
        expected_close_date: deal.expected_close_date ?? '',
        proposal_id: deal.proposal_id ?? '',
        assigned_to: deal.assigned_to ?? '',
      });
    } else {
      setForm({
        ...emptyForm,
        contact_id: defaultContactId ?? '',
        stage_id: stages?.[0]?.id ?? '',
        assigned_to: user?.id ?? '',
      });
    }
  }, [deal, open, defaultContactId, stages, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.contact_id || !form.stage_id) return;

    const payload = {
      title: form.title, contact_id: form.contact_id, stage_id: form.stage_id,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
      service_type: form.service_type || null, description: form.description || null,
      expected_close_date: form.expected_close_date || null, created_by: user?.id,
      proposal_id: form.proposal_id || null,
      assigned_to: form.assigned_to || null,
    };

    if (isEditing && deal) {
      await updateDeal.mutateAsync({ id: deal.id, ...payload });
    } else {
      await createDeal.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Deal' : 'Novo Deal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Contato *</Label>
              <Select value={form.contact_id} onValueChange={v => set('contact_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {contacts?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Etapa *</Label>
              <Select value={form.stage_id} onValueChange={v => set('stage_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {stages?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Valor Estimado (R$)</Label>
              <Input type="number" step="0.01" value={form.estimated_value} onChange={e => set('estimated_value', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Serviço</Label>
              <Select value={form.service_type || 'none'} onValueChange={v => set('service_type', v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data Prevista de Fechamento</Label>
              <Input type="date" value={form.expected_close_date} onChange={e => set('expected_close_date', e.target.value)} />
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
          </div>
          <div className="space-y-1.5">
            <Label>Proposta vinculada</Label>
            <Select value={form.proposal_id || 'none'} onValueChange={v => set('proposal_id', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {proposals?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.project_name}{p.client_name ? ` — ${p.client_name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createDeal.isPending || updateDeal.isPending}>
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
