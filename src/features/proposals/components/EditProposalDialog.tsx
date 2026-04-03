import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CalendarIcon, Loader2, Building2, Phone, Camera, Upload, X, Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useProposals } from '../hooks/useProposals';
import type { Proposal } from '../types';

interface EditProposalDialogProps {
  proposal: Proposal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'sent', label: 'Enviada' },
  { value: 'approved', label: 'Aprovada' },
  { value: 'expired', label: 'Expirada' },
];

export function EditProposalDialog({ proposal, open, onOpenChange }: EditProposalDialogProps) {
  const { updateProposal } = useProposals();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [clientResponsible, setClientResponsible] = useState('');
  const [clientLogo, setClientLogo] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [validityDate, setValidityDate] = useState<Date | undefined>();
  const [sentDate, setSentDate] = useState<Date | undefined>();
  const [status, setStatus] = useState('draft');
  const [objetivo, setObjetivo] = useState('');
  const [listPrice, setListPrice] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [testimonialName, setTestimonialName] = useState('');
  const [testimonialRole, setTestimonialRole] = useState('');
  const [testimonialText, setTestimonialText] = useState('');
  const [testimonialImage, setTestimonialImage] = useState('');

  // Populate form when proposal changes
  useEffect(() => {
    if (proposal) {
      setClientName(proposal.client_name || '');
      setProjectName(proposal.project_name || '');
      setClientResponsible(proposal.client_responsible || '');
      setClientLogo(proposal.client_logo || '');
      setWhatsappNumber(proposal.whatsapp_number || '');
      setCompanyDescription(proposal.company_description || '');
      setValidityDate(proposal.validity_date ? new Date(proposal.validity_date) : undefined);
      setSentDate(proposal.sent_date ? new Date(proposal.sent_date) : undefined);
      setStatus(proposal.status || 'draft');
      setObjetivo(proposal.objetivo || '');
      setListPrice(proposal.list_price || proposal.final_value || 0);
      setDiscountPct(proposal.discount_pct || 0);
      setPaymentTerms(proposal.payment_terms || '');
      setTestimonialName(proposal.testimonial_name || '');
      setTestimonialRole(proposal.testimonial_role || '');
      setTestimonialText(proposal.testimonial_text || '');
      setTestimonialImage(proposal.testimonial_image || '');
    }
  }, [proposal]);

  const compressImage = (file: File, maxSize = 800): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/webp', 0.85);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadingLogo(true);
    try {
      const compressed = await compressImage(file);
      const path = `logos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const { error } = await supabase.storage.from('proposal-moodboard').upload(path, compressed, { contentType: 'image/webp' });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('proposal-moodboard').getPublicUrl(path);
      setClientLogo(urlData.publicUrl);
    } catch (err) {
      console.error('Logo upload error:', err);
      const { toast } = await import('sonner');
      toast.error('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const finalValue = listPrice * (1 - (discountPct || 0) / 100);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleSave = async () => {
    if (!proposal) return;
    setSaving(true);

    const paymentOptions = [
      {
        titulo: 'À Vista',
        valor: fmt(finalValue * 0.95),
        descricao: '5% de desconto para pagamento único',
        destaque: 'Melhor custo',
        recomendado: false,
      },
      {
        titulo: '2x sem juros',
        valor: `2x ${fmt(finalValue / 2)}`,
        descricao: '50% no fechamento + 50% na entrega',
        destaque: '',
        recomendado: true,
      },
    ];

    try {
      await updateProposal.mutateAsync({
        id: proposal.id,
        data: {
          client_name: clientName.trim(),
          project_name: projectName.trim(),
          client_responsible: clientResponsible.trim() || null,
          client_logo: clientLogo.trim() || null,
          whatsapp_number: whatsappNumber.trim() || null,
          company_description: companyDescription.trim() || null,
          validity_date: validityDate?.toISOString().split('T')[0],
          sent_date: sentDate?.toISOString().split('T')[0] || null,
          status,
          objetivo: objetivo.trim() || null,
          list_price: listPrice || null,
          discount_pct: discountPct,
          base_value: finalValue,
          final_value: finalValue,
          payment_terms: paymentTerms.trim(),
          payment_options: paymentOptions,
          testimonial_name: testimonialName.trim() || null,
          testimonial_role: testimonialRole.trim() || null,
          testimonial_text: testimonialText.trim() || null,
          testimonial_image: testimonialImage.trim() || null,
        },
      });
      onOpenChange(false);
    } catch {
      // error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Editar Proposta</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-130px)] px-6">
          <div className="space-y-6 pb-6">

            {/* ── CLIENTE E PROJETO ── */}
            <section className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cliente e Projeto</h4>

              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                  <Avatar className="h-16 w-16 ring-2 ring-border">
                    <AvatarImage src={clientLogo || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <Building2 className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingLogo ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Camera className="h-4 w-4 text-white" />}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {clientLogo ? 'Alterar' : 'Logo'}
                  </Button>
                  {clientLogo && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setClientLogo('')}>
                      <X className="mr-1.5 h-3.5 w-3.5" /> Remover
                    </Button>
                  )}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome do Cliente *</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nome do Projeto *</Label>
                  <Input value={projectName} onChange={e => setProjectName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Responsável</Label>
                  <Input value={clientResponsible} onChange={e => setClientResponsible(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Descrição da Empresa</Label>
                <Textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} rows={2} className="text-sm" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data de Envio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-9 text-xs">
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {sentDate ? format(sentDate, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={sentDate} onSelect={d => d && setSentDate(d)} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data de Validade</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs", !validityDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {validityDate ? format(validityDate, "dd/MM/yyyy") : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={validityDate} onSelect={d => setValidityDate(d)} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </section>

            <Separator />

            {/* ── DIAGNÓSTICO ── */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Diagnóstico</h4>
              <div className="space-y-1">
                <Label className="text-xs">Objetivo Estratégico</Label>
                <Textarea value={objetivo} onChange={e => setObjetivo(e.target.value)} rows={4} className="text-sm leading-relaxed" />
              </div>
            </section>

            <Separator />

            {/* ── INVESTIMENTO ── */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Investimento</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Valor de Lista (R$)</Label>
                  <Input type="number" value={listPrice || ''} onChange={e => setListPrice(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Desconto (%)</Label>
                  <Input type="number" value={discountPct || ''} onChange={e => setDiscountPct(Number(e.target.value))} min={0} max={100} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valor Final</Label>
                  <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-semibold">
                    {fmt(finalValue)}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Condições de Pagamento</Label>
                <Textarea value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} rows={2} className="text-sm" />
              </div>
            </section>

            <Separator />

            {/* ── DEPOIMENTO ── */}
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Depoimento</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input value={testimonialName} onChange={e => setTestimonialName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cargo</Label>
                  <Input value={testimonialRole} onChange={e => setTestimonialRole(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Texto do Depoimento</Label>
                <Textarea value={testimonialText} onChange={e => setTestimonialText(e.target.value)} rows={2} className="text-sm" />
              </div>
            </section>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !clientName.trim() || !projectName.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
