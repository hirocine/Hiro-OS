import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ArrowLeft, ExternalLink, Building2, Pencil, X, Check, Calendar, DollarSign,
  User, Phone, FileText, MessageSquare, Trash2, Copy, MoreHorizontal, Upload
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProposalDetailsById } from '@/features/proposals/hooks/useProposalDetailsById';
import { useProposals } from '@/features/proposals/hooks/useProposals';
import type { Proposal } from '@/features/proposals/types';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'secondary' },
  sent: { label: 'Enviada', variant: 'default' },
  approved: { label: 'Aprovada', variant: 'default' },
  expired: { label: 'Expirada', variant: 'destructive' },
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
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Section form states
  const [clientForm, setClientForm] = useState({ client_name: '', project_name: '', client_responsible: '', whatsapp_number: '', company_description: '' });
  const [investForm, setInvestForm] = useState({ list_price: 0, discount_pct: 0, payment_terms: '' });
  const [diagForm, setDiagForm] = useState({ objetivo: '' });
  const [testimonialForm, setTestimonialForm] = useState({ testimonial_name: '', testimonial_role: '', testimonial_text: '' });

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

  const status = statusMap[proposal.status] || statusMap.draft;
  const publicUrl = `${window.location.origin}/orcamento/${proposal.slug}`;
  const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.final_value);

  const startEdit = (section: string) => {
    if (section === 'client') {
      setClientForm({
        client_name: proposal.client_name,
        project_name: proposal.project_name,
        client_responsible: proposal.client_responsible || '',
        whatsapp_number: proposal.whatsapp_number || '',
        company_description: proposal.company_description || '',
      });
    } else if (section === 'invest') {
      setInvestForm({
        list_price: proposal.list_price || 0,
        discount_pct: proposal.discount_pct || 0,
        payment_terms: proposal.payment_terms || '',
      });
    } else if (section === 'diag') {
      setDiagForm({ objetivo: proposal.objetivo || '' });
    } else if (section === 'testimonial') {
      setTestimonialForm({
        testimonial_name: proposal.testimonial_name || '',
        testimonial_role: proposal.testimonial_role || '',
        testimonial_text: proposal.testimonial_text || '',
      });
    }
    setEditingSection(section);
  };

  const saveSection = async (section: string) => {
    try {
      let data: Record<string, any> = {};
      if (section === 'client') {
        data = {
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
      setEditingSection(null);
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

  const SectionHeader = ({ title, section, icon: Icon }: { title: string; section: string; icon: any }) => (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        {editingSection !== section ? (
          <Button variant="ghost" size="sm" onClick={() => startEdit(section)} className="h-7 px-2">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)} className="h-7 px-2">
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={() => saveSection(section)} className="h-7 px-2" disabled={updateProposal.isPending}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </CardHeader>
  );

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value || '—'}</span>
    </div>
  );

  const investFinalValue = investForm.list_price * (1 - investForm.discount_pct / 100);

  return (
    <ResponsiveContainer maxWidth="7xl">
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/orcamentos')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <BreadcrumbNav items={[
              { label: 'Orçamentos', href: '/orcamentos' },
              { label: proposal.project_name },
            ]} className="mb-0" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.open(`/orcamento/${proposal.slug}`, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-1.5" /> Ver Proposta
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copiado!'); }}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
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
                <div className="flex items-center gap-2 mb-1">
                  {proposal.project_number && (
                    <span className="text-xs text-muted-foreground">Nº {proposal.project_number}</span>
                  )}
                </div>
                <h1 className="text-xl font-semibold leading-tight">{proposal.project_name}</h1>
                <p className="text-sm text-muted-foreground">{proposal.client_name}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className="text-lg font-bold">{formattedValue}</p>
                  <p className="text-xs text-muted-foreground">
                    Validade: {format(new Date(proposal.validity_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <Select value={proposal.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="sent">Enviada</SelectItem>
                    <SelectItem value="approved">Aprovada</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Section */}
          <Card>
            <SectionHeader title="Cliente e Projeto" section="client" icon={Building2} />
            <CardContent className="pt-0">
              {editingSection === 'client' ? (
                <div className="space-y-3">
                  <div><Label className="text-xs">Nome do Cliente</Label><Input value={clientForm.client_name} onChange={e => setClientForm(p => ({ ...p, client_name: e.target.value }))} /></div>
                  <div><Label className="text-xs">Nome do Projeto</Label><Input value={clientForm.project_name} onChange={e => setClientForm(p => ({ ...p, project_name: e.target.value }))} /></div>
                  <div><Label className="text-xs">Responsável</Label><Input value={clientForm.client_responsible} onChange={e => setClientForm(p => ({ ...p, client_responsible: e.target.value }))} /></div>
                  <div><Label className="text-xs">WhatsApp</Label><Input value={clientForm.whatsapp_number} onChange={e => setClientForm(p => ({ ...p, whatsapp_number: e.target.value }))} /></div>
                  <div><Label className="text-xs">Descrição da empresa</Label><Textarea value={clientForm.company_description} onChange={e => setClientForm(p => ({ ...p, company_description: e.target.value }))} rows={3} /></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Cliente" value={proposal.client_name} />
                  <InfoRow label="Projeto" value={proposal.project_name} />
                  <InfoRow label="Responsável" value={proposal.client_responsible} />
                  <InfoRow label="WhatsApp" value={proposal.whatsapp_number} />
                  <div className="col-span-2">
                    <InfoRow label="Descrição da empresa" value={proposal.company_description} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Section */}
          <Card>
            <SectionHeader title="Investimento" section="invest" icon={DollarSign} />
            <CardContent className="pt-0">
              {editingSection === 'invest' ? (
                <div className="space-y-3">
                  <div><Label className="text-xs">Valor de Tabela (R$)</Label><Input type="number" value={investForm.list_price} onChange={e => setInvestForm(p => ({ ...p, list_price: Number(e.target.value) }))} /></div>
                  <div><Label className="text-xs">Desconto (%)</Label><Input type="number" value={investForm.discount_pct} onChange={e => setInvestForm(p => ({ ...p, discount_pct: Number(e.target.value) }))} /></div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <span className="text-xs text-muted-foreground">Valor Final: </span>
                    <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investFinalValue)}</span>
                  </div>
                  <div><Label className="text-xs">Condições de Pagamento</Label><Textarea value={investForm.payment_terms} onChange={e => setInvestForm(p => ({ ...p, payment_terms: e.target.value }))} rows={2} /></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Valor de Tabela" value={proposal.list_price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.list_price) : null} />
                  <InfoRow label="Desconto" value={proposal.discount_pct ? `${proposal.discount_pct}%` : '0%'} />
                  <InfoRow label="Valor Final" value={formattedValue} />
                  <div className="col-span-2">
                    <InfoRow label="Condições de Pagamento" value={proposal.payment_terms} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Objective Section */}
          <Card className="lg:col-span-2">
            <SectionHeader title="Objetivo" section="diag" icon={FileText} />
            <CardContent className="pt-0">
              {editingSection === 'diag' ? (
                <div className="space-y-3">
                  <Textarea value={diagForm.objetivo} onChange={e => setDiagForm({ objetivo: e.target.value })} rows={6} />
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{proposal.objetivo || '—'}</p>
              )}
            </CardContent>
          </Card>

          {/* Testimonial Section */}
          <Card className="lg:col-span-2">
            <SectionHeader title="Depoimento" section="testimonial" icon={MessageSquare} />
            <CardContent className="pt-0">
              {editingSection === 'testimonial' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Nome</Label><Input value={testimonialForm.testimonial_name} onChange={e => setTestimonialForm(p => ({ ...p, testimonial_name: e.target.value }))} /></div>
                  <div><Label className="text-xs">Cargo</Label><Input value={testimonialForm.testimonial_role} onChange={e => setTestimonialForm(p => ({ ...p, testimonial_role: e.target.value }))} /></div>
                  <div className="md:col-span-2"><Label className="text-xs">Texto</Label><Textarea value={testimonialForm.testimonial_text} onChange={e => setTestimonialForm(p => ({ ...p, testimonial_text: e.target.value }))} rows={3} /></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="Nome" value={proposal.testimonial_name} />
                  <InfoRow label="Cargo" value={proposal.testimonial_role} />
                  <div className="col-span-2 md:col-span-3">
                    <InfoRow label="Texto" value={proposal.testimonial_text} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveContainer>
  );
}
