import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink, Building2, Calendar, DollarSign,
  User, Phone, FileText, MessageSquare, Trash2, Copy, MoreHorizontal, Upload, Save
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProposalDetailsById } from '@/features/proposals/hooks/useProposalDetailsById';
import { useProposals } from '@/features/proposals/hooks/useProposals';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'info' | 'warning' | 'success' | 'neutral' }> = {
  draft: { label: 'Rascunho', variant: 'neutral' },
  sent: { label: 'Enviada', variant: 'info' },
  opened: { label: 'Aberta', variant: 'warning' },
  new_version: { label: 'Nova Versão', variant: 'info' },
  approved: { label: 'Aprovada', variant: 'success' },
  expired: { label: 'Arquivada', variant: 'destructive' },
};

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.82);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function ProposalDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: proposal, isLoading, refetch } = useProposalDetailsById(id);
  const { updateProposal, deleteProposal } = useProposals();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [clientForm, setClientForm] = useState({ project_number: '', client_name: '', project_name: '', client_responsible: '', whatsapp_number: '', company_description: '' });
  const [investForm, setInvestForm] = useState({ list_price: 0, discount_pct: 0, payment_terms: '' });
  const [diagForm, setDiagForm] = useState({ objetivo: '' });
  const [testimonialForm, setTestimonialForm] = useState({ testimonial_name: '', testimonial_role: '', testimonial_text: '' });

  // Populate forms when proposal loads
  useEffect(() => {
    if (!proposal) return;
    setClientForm({
      project_number: proposal.project_number || '',
      client_name: proposal.client_name,
      project_name: proposal.project_name,
      client_responsible: proposal.client_responsible || '',
      whatsapp_number: proposal.whatsapp_number || '',
      company_description: proposal.company_description || '',
    });
    setInvestForm({
      list_price: proposal.list_price || 0,
      discount_pct: proposal.discount_pct || 0,
      payment_terms: proposal.payment_terms || '',
    });
    setDiagForm({ objetivo: proposal.objetivo || '' });
    setTestimonialForm({
      testimonial_name: proposal.testimonial_name || '',
      testimonial_role: proposal.testimonial_role || '',
      testimonial_text: proposal.testimonial_text || '',
    });
  }, [proposal]);

  // Dirty checks
  const clientDirty = useMemo(() => {
    if (!proposal) return false;
    return clientForm.project_number !== (proposal.project_number || '') ||
      clientForm.client_name !== proposal.client_name ||
      clientForm.project_name !== proposal.project_name ||
      clientForm.client_responsible !== (proposal.client_responsible || '') ||
      clientForm.whatsapp_number !== (proposal.whatsapp_number || '') ||
      clientForm.company_description !== (proposal.company_description || '');
  }, [clientForm, proposal]);

  const investDirty = useMemo(() => {
    if (!proposal) return false;
    return investForm.list_price !== (proposal.list_price || 0) ||
      investForm.discount_pct !== (proposal.discount_pct || 0) ||
      investForm.payment_terms !== (proposal.payment_terms || '');
  }, [investForm, proposal]);

  const diagDirty = useMemo(() => {
    if (!proposal) return false;
    return diagForm.objetivo !== (proposal.objetivo || '');
  }, [diagForm, proposal]);

  const testimonialDirty = useMemo(() => {
    if (!proposal) return false;
    return testimonialForm.testimonial_name !== (proposal.testimonial_name || '') ||
      testimonialForm.testimonial_role !== (proposal.testimonial_role || '') ||
      testimonialForm.testimonial_text !== (proposal.testimonial_text || '');
  }, [testimonialForm, proposal]);

  if (isLoading) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </ResponsiveContainer>
    );
  }

  if (!proposal) {
    return (
      <ResponsiveContainer maxWidth="7xl">
        <p className="text-muted-foreground text-center py-12">Proposta não encontrada.</p>
      </ResponsiveContainer>
    );
  }

  const publicUrl = `${window.location.origin}/orcamento/${proposal.slug}`;

  const saveSection = async (section: string) => {
    try {
      let data: Record<string, any> = {};
      if (section === 'client') {
        data = {
          project_number: clientForm.project_number.trim() || null,
          client_name: clientForm.client_name.trim(),
          project_name: clientForm.project_name.trim(),
          client_responsible: clientForm.client_responsible.trim() || null,
          whatsapp_number: clientForm.whatsapp_number.trim() || null,
          company_description: clientForm.company_description.trim() || null,
        };
      } else if (section === 'invest') {
        const finalValue = investForm.list_price * (1 - investForm.discount_pct / 100);
        data = {
          list_price: investForm.list_price || null,
          discount_pct: investForm.discount_pct,
          final_value: finalValue,
          base_value: finalValue,
          payment_terms: investForm.payment_terms.trim(),
        };
      } else if (section === 'diag') {
        data = { objetivo: diagForm.objetivo.trim() || null };
      } else if (section === 'testimonial') {
        data = {
          testimonial_name: testimonialForm.testimonial_name.trim() || null,
          testimonial_role: testimonialForm.testimonial_role.trim() || null,
          testimonial_text: testimonialForm.testimonial_text.trim() || null,
        };
      }
      await updateProposal.mutateAsync({ id: proposal.id, data });
      await refetch();
      toast.success('Alterações salvas!');
    } catch {
      toast.error('Erro ao salvar alterações');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateProposal.mutateAsync({ id: proposal.id, data: { status: newStatus } });
    refetch();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const compressed = await compressImage(file);
      const path = `logos/${proposal.id}-${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from('orcamento-assets').upload(path, compressed, { contentType: 'image/webp', upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('orcamento-assets').getPublicUrl(path);
      await updateProposal.mutateAsync({ id: proposal.id, data: { client_logo: urlData.publicUrl } });
      await refetch();
      toast.success('Logo atualizada!');
    } catch {
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta proposta?')) return;
    await deleteProposal.mutateAsync(proposal.id);
    navigate('/orcamentos');
  };

  const investFinalValue = investForm.list_price * (1 - investForm.discount_pct / 100);

  return (
    <ResponsiveContainer maxWidth="7xl">
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <BreadcrumbNav items={[
            { label: 'Orçamentos', href: '/orcamentos' },
            { label: proposal.project_name },
          ]} className="mb-0" />
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copiado!'); }}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => window.open(`/orcamento/${proposal.slug}`, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-1.5" /> Ver Proposta
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="relative group">
                <Avatar className="h-16 w-16 shrink-0">
                  {proposal.client_logo ? <AvatarImage src={proposal.client_logo} alt={proposal.client_name} /> : null}
                  <AvatarFallback className="bg-muted"><Building2 className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploadingLogo}
                >
                  <Upload className="h-4 w-4 text-white" />
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl font-semibold leading-tight">{proposal.project_name}</h1>
                  {proposal.project_number && (
                    <span className="text-xl text-muted-foreground">Nº {proposal.project_number}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{proposal.client_name}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">Status</span>
                <Select value={proposal.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[140px] h-8 border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                    <Badge variant={(statusMap[proposal.status] || statusMap.draft).variant as any}>
                      {(statusMap[proposal.status] || statusMap.draft).label}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusMap).map(([value, { label, variant }]) => (
                      <SelectItem key={value} value={value}>
                        <Badge variant={variant as any}>{label}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Cliente e Projeto</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="space-y-1.5"><Label className="text-xs">Nº do Projeto</Label><Input value={clientForm.project_number} onChange={e => setClientForm(p => ({ ...p, project_number: e.target.value }))} placeholder="Ex: 001" maxLength={3} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Nome do Cliente</Label><Input value={clientForm.client_name} onChange={e => setClientForm(p => ({ ...p, client_name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Nome do Projeto</Label><Input value={clientForm.project_name} onChange={e => setClientForm(p => ({ ...p, project_name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Responsável</Label><Input value={clientForm.client_responsible} onChange={e => setClientForm(p => ({ ...p, client_responsible: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">WhatsApp</Label><Input value={clientForm.whatsapp_number} onChange={e => setClientForm(p => ({ ...p, whatsapp_number: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Descrição da empresa</Label><Textarea value={clientForm.company_description} onChange={e => setClientForm(p => ({ ...p, company_description: e.target.value }))} rows={3} /></div>
            </CardContent>
            {clientDirty && (
              <CardFooter className="pt-0 pb-4 px-6">
                <Button size="sm" onClick={() => saveSection('client')} disabled={updateProposal.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Investment Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Investimento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="space-y-1.5"><Label className="text-xs">Valor de Tabela (R$)</Label><Input type="number" value={investForm.list_price} onChange={e => setInvestForm(p => ({ ...p, list_price: Number(e.target.value) }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Desconto (%)</Label><Input type="number" value={investForm.discount_pct} onChange={e => setInvestForm(p => ({ ...p, discount_pct: Number(e.target.value) }))} /></div>
              <div className="p-3 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground">Valor Final: </span>
                <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investFinalValue)}</span>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Condições de Pagamento</Label><Textarea value={investForm.payment_terms} onChange={e => setInvestForm(p => ({ ...p, payment_terms: e.target.value }))} rows={2} /></div>
            </CardContent>
            {investDirty && (
              <CardFooter className="pt-0 pb-4 px-6">
                <Button size="sm" onClick={() => saveSection('invest')} disabled={updateProposal.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Objective Section */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Objetivo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <Textarea value={diagForm.objetivo} onChange={e => setDiagForm({ objetivo: e.target.value })} rows={6} />
            </CardContent>
            {diagDirty && (
              <CardFooter className="pt-0 pb-4 px-6">
                <Button size="sm" onClick={() => saveSection('diag')} disabled={updateProposal.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Testimonial Section */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Depoimento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Nome</Label><Input value={testimonialForm.testimonial_name} onChange={e => setTestimonialForm(p => ({ ...p, testimonial_name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Cargo</Label><Input value={testimonialForm.testimonial_role} onChange={e => setTestimonialForm(p => ({ ...p, testimonial_role: e.target.value }))} /></div>
                <div className="md:col-span-2 space-y-1.5"><Label className="text-xs">Texto</Label><Textarea value={testimonialForm.testimonial_text} onChange={e => setTestimonialForm(p => ({ ...p, testimonial_text: e.target.value }))} rows={3} /></div>
              </div>
            </CardContent>
            {testimonialDirty && (
              <CardFooter className="pt-0 pb-4 px-6">
                <Button size="sm" onClick={() => saveSection('testimonial')} disabled={updateProposal.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
