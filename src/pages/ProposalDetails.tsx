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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink, Building2, Calendar, DollarSign,
  User, Phone, FileText, MessageSquare, Trash2, Copy, MoreHorizontal, Upload, Save,
  AlertTriangle, Briefcase, Package, Plus, X, Check
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProposalDetailsById } from '@/features/proposals/hooks/useProposalDetailsById';
import { useProposals } from '@/features/proposals/hooks/useProposals';
import type { DiagnosticoDor, CaseItem, EntregavelItem, InclusoCategory } from '@/features/proposals/types';
import { DEFAULT_INCLUSO_CATEGORIES, ICON_OPTIONS } from '@/features/proposals/types';
import { usePainPoints } from '@/features/proposals/hooks/usePainPoints';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const DOR_EMOJI_OPTIONS = [
  { value: '⭐', label: 'Estrela' },
  { value: '🎯', label: 'Alvo' },
  { value: '⚡', label: 'Raio' },
  { value: '🔥', label: 'Fogo' },
  { value: '💡', label: 'Ideia' },
  { value: '🚀', label: 'Foguete' },
  { value: '⏰', label: 'Relógio' },
  { value: '🛡️', label: 'Escudo' },
  { value: '👁️', label: 'Olho' },
  { value: '❤️', label: 'Coração' },
  { value: '📊', label: 'Gráfico' },
  { value: '🎬', label: 'Cinema' },
  { value: '📱', label: 'Celular' },
  { value: '🏆', label: 'Troféu' },
  { value: '⚠️', label: 'Alerta' },
  { value: '🚫', label: 'Proibido' },
  { value: '📐', label: 'Régua' },
  { value: '🔍', label: 'Lupa' },
  { value: '⚖', label: 'Balança' },
  { value: '📅', label: 'Calendário' },
  { value: '🔄', label: 'Ciclo' },
  { value: '📦', label: 'Pacote' },
  { value: '🚨', label: 'Sirene' },
  { value: '😤', label: 'Frustração' },
  { value: '🤷', label: 'Dúvida' },
  { value: '💸', label: 'Dinheiro' },
  { value: '🧩', label: 'Puzzle' },
  { value: '📉', label: 'Queda' },
  { value: '📵', label: 'Bloqueio' },
  { value: '🎨', label: 'Arte' },
  { value: '🧠', label: 'Cérebro' },
  { value: '⚔️', label: 'Espadas' },
  { value: '🧭', label: 'Bússola' },
  { value: '😴', label: 'Sono' },
  { value: '📈', label: 'Crescimento' },
  { value: '🧮', label: 'Ábaco' },
  { value: '🏷', label: 'Etiqueta' },
  { value: '💰', label: 'Saco' },
  { value: '🏛', label: 'Governo' },
  { value: '📋', label: 'Clipboard' },
  { value: '🔮', label: 'Bola' },
  { value: '🏢', label: 'Prédio' },
  { value: '🏗', label: 'Construção' },
  { value: '🔐', label: 'Cadeado' },
  { value: '📆', label: 'Agenda' },
  { value: '🤝', label: 'Aperto' },
  { value: '🌐', label: 'Globo' },
];

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

interface EntregaveisData {
  entregaveis: EntregavelItem[];
  incluso_categories: InclusoCategory[];
}

export default function ProposalDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: proposal, isLoading, refetch } = useProposalDetailsById(id);
  const { updateProposal, deleteProposal } = useProposals();
  const { data: painPointsBank = [], createPainPoint } = usePainPoints();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showDoresBank, setShowDoresBank] = useState(false);
  const [doresBankSearch, setDoresBankSearch] = useState('');
  const [doresBankSelection, setDoresBankSelection] = useState<DiagnosticoDor[]>([]);
  const [showExclusiveDor, setShowExclusiveDor] = useState(false);
  const [exclusiveDorForm, setExclusiveDorForm] = useState({ label: '⭐', title: '', desc: '' });

  const [clientForm, setClientForm] = useState({ project_number: '', client_name: '', project_name: '', client_responsible: '', whatsapp_number: '', company_description: '' });
  const [investForm, setInvestForm] = useState({ list_price: 0, discount_pct: 0, payment_terms: '' });
  const [diagForm, setDiagForm] = useState({ objetivo: '' });
  const [testimonialForm, setTestimonialForm] = useState({ testimonial_name: '', testimonial_role: '', testimonial_text: '' });
  const [doresForm, setDoresForm] = useState<DiagnosticoDor[]>([]);
  const [casesForm, setCasesForm] = useState<CaseItem[]>([]);
  const [entregaveisForm, setEntregaveisForm] = useState<EntregaveisData>({ entregaveis: [], incluso_categories: [] });

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
    setDoresForm(Array.isArray(proposal.diagnostico_dores) ? proposal.diagnostico_dores : []);
    setCasesForm(Array.isArray(proposal.cases) ? proposal.cases : []);
    // Parse entregaveis - it stores both entregaveis and incluso_categories
    const rawEntregaveis = proposal.entregaveis as any;
    if (Array.isArray(rawEntregaveis) && rawEntregaveis.length > 0 && rawEntregaveis[0]?.entregaveis) {
      setEntregaveisForm({
        entregaveis: rawEntregaveis[0].entregaveis || [],
        incluso_categories: rawEntregaveis[0].incluso_categories || JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES)),
      });
    } else if (rawEntregaveis && !Array.isArray(rawEntregaveis) && rawEntregaveis.entregaveis) {
      setEntregaveisForm({
        entregaveis: rawEntregaveis.entregaveis || [],
        incluso_categories: rawEntregaveis.incluso_categories || JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES)),
      });
    } else {
      setEntregaveisForm({ entregaveis: [], incluso_categories: JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES)) });
    }
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

  const doresDirty = useMemo(() => {
    if (!proposal) return false;
    const original = Array.isArray(proposal.diagnostico_dores) ? proposal.diagnostico_dores : [];
    return JSON.stringify(doresForm) !== JSON.stringify(original);
  }, [doresForm, proposal]);

  const casesDirty = useMemo(() => {
    if (!proposal) return false;
    const original = Array.isArray(proposal.cases) ? proposal.cases : [];
    return JSON.stringify(casesForm) !== JSON.stringify(original);
  }, [casesForm, proposal]);

  const entregaveisDirty = useMemo(() => {
    if (!proposal) return false;
    return true; // Always allow save for complex nested structure
  }, [entregaveisForm, proposal]);

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
      } else if (section === 'dores') {
        data = { diagnostico_dores: doresForm };
      } else if (section === 'cases') {
        data = { cases: casesForm };
      } else if (section === 'entregaveis') {
        data = { entregaveis: entregaveisForm };
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

  // Dores helpers
  const removeDor = (i: number) => setDoresForm(prev => prev.filter((_, idx) => idx !== i));

  const openDoresBank = () => {
    setDoresBankSelection([...doresForm]);
    setDoresBankSearch('');
    setShowExclusiveDor(false);
    setExclusiveDorForm({ label: '⭐', title: '', desc: '' });
    setShowDoresBank(true);
  };

  const toggleBankDor = (pp: { label: string; title: string; description: string }) => {
    setDoresBankSelection(prev => {
      const exists = prev.some(d => d.title === pp.title);
      if (exists) return prev.filter(d => d.title !== pp.title);
      return [...prev, { label: pp.label, title: pp.title, desc: pp.description }];
    });
  };

  const isBankDorSelected = (title: string) => doresBankSelection.some(d => d.title === title);

  const confirmDoresBank = () => {
    setDoresForm(doresBankSelection);
    setShowDoresBank(false);
  };

  const addExclusiveDor = () => {
    if (!exclusiveDorForm.title.trim()) return;
    setDoresBankSelection(prev => [...prev, { ...exclusiveDorForm }]);
    setExclusiveDorForm({ label: '⭐', title: '', desc: '' });
    setShowExclusiveDor(false);
  };

  // Group bank by category
  const painPointsByCategory = useMemo(() => {
    const groups: Record<string, typeof painPointsBank> = {};
    painPointsBank.forEach(pp => {
      const cat = (pp as any).category || 'Sem categoria';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(pp);
    });
    return groups;
  }, [painPointsBank]);

  const categoryOrder = [
    'Qualidade & padrão visual',
    'Prazo & velocidade de entrega',
    'Experiência com fornecedores anteriores',
    'Diferencial criativo & estratégico',
    'Performance & resultado de negócio',
    'Orçamento & justificativa de investimento',
    'Operacional & estrutura de produção',
    'Escala & recorrência',
  ];

  const filteredCategories = useMemo(() => {
    const search = doresBankSearch.toLowerCase();
    if (!search) return categoryOrder.filter(c => painPointsByCategory[c]?.length > 0);
    return categoryOrder.filter(c => {
      const pps = painPointsByCategory[c];
      if (!pps) return false;
      return pps.some(pp => pp.title.toLowerCase().includes(search) || pp.description.toLowerCase().includes(search));
    });
  }, [doresBankSearch, painPointsByCategory]);

  const filterPainPoints = (pps: typeof painPointsBank) => {
    const search = doresBankSearch.toLowerCase();
    if (!search) return pps;
    return pps.filter(pp => pp.title.toLowerCase().includes(search) || pp.description.toLowerCase().includes(search));
  };

  // Cases helpers
  const addCase = () => setCasesForm(prev => [...prev, { tipo: 'video', titulo: '', descricao: '', vimeoId: '', vimeoHash: '', destaque: false }]);
  const removeCase = (i: number) => setCasesForm(prev => prev.filter((_, idx) => idx !== i));
  const updateCase = (i: number, field: keyof CaseItem, value: any) =>
    setCasesForm(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  // Entregaveis helpers
  const addEntregavel = () => setEntregaveisForm(prev => ({
    ...prev,
    entregaveis: [...prev.entregaveis, { titulo: '', descricao: '', quantidade: '', icone: 'Video' }],
  }));
  const removeEntregavel = (i: number) => setEntregaveisForm(prev => ({
    ...prev,
    entregaveis: prev.entregaveis.filter((_, idx) => idx !== i),
  }));
  const updateEntregavel = (i: number, field: keyof EntregavelItem, value: string) =>
    setEntregaveisForm(prev => ({
      ...prev,
      entregaveis: prev.entregaveis.map((e, idx) => idx === i ? { ...e, [field]: value } : e),
    }));

  // Incluso toggle helper
  const toggleInclusoItem = (catIdx: number, itemIdx: number, subIdx?: number) => {
    setEntregaveisForm(prev => {
      const cats = JSON.parse(JSON.stringify(prev.incluso_categories));
      const cat = cats[catIdx];
      if (subIdx !== undefined && cat.subcategorias) {
        const item = cat.subcategorias[subIdx].itens[itemIdx];
        item.ativo = !item.ativo;
      } else if (cat.itens) {
        cat.itens[itemIdx].ativo = !cat.itens[itemIdx].ativo;
      }
      return { ...prev, incluso_categories: cats };
    });
  };

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
              <div className="space-y-1.5">
                <Label className="text-xs">Valor sem desconto (R$)</Label>
                <Input
                  value={investForm.list_price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investForm.list_price) : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setInvestForm(p => ({ ...p, list_price: Number(raw) / 100 }));
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
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

          {/* Dores do Cliente Section */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Dores do Cliente</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={openDoresBank}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Dores
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              {doresForm.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma dor selecionada.</p>
                  <Button variant="link" size="sm" onClick={openDoresBank} className="mt-1">
                    Selecionar do banco de dores
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {doresForm.map((dor, i) => (
                    <div key={i} className="group relative border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                      <button
                        onClick={() => removeDor(i)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
                          {dor.label || '⭐'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight">{dor.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dor.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {doresDirty && (
              <CardFooter className="pt-0 pb-4 px-6">
                <Button size="sm" onClick={() => saveSection('dores')} disabled={updateProposal.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Dores Bank Dialog */}
          <Dialog open={showDoresBank} onOpenChange={setShowDoresBank}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                <DialogTitle>Banco de Dores</DialogTitle>
                <div className="pt-3">
                  <Input
                    value={doresBankSearch}
                    onChange={e => setDoresBankSearch(e.target.value)}
                    placeholder="Buscar dores..."
                    className="h-9"
                  />
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                {filteredCategories.map((cat, catIdx) => {
                  const pps = filterPainPoints(painPointsByCategory[cat] || []);
                  if (pps.length === 0) return null;
                  return (
                    <div key={cat}>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">{String(catIdx + 1).padStart(2, '0')}</span>
                        {cat}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {pps.map(pp => {
                          const selected = isBankDorSelected(pp.title);
                          return (
                            <button
                              key={pp.id}
                              type="button"
                              onClick={() => toggleBankDor(pp)}
                              className={`text-left p-3 rounded-lg border transition-all ${
                                selected
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                  : 'border-border hover:border-primary/30'
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center text-base shrink-0">
                                  {pp.label}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium leading-tight flex-1">{pp.title}</p>
                                    {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pp.description}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Exclusive pain point section */}
                <div className="border-t border-border pt-4">
                  {!showExclusiveDor ? (
                    <Button variant="ghost" size="sm" onClick={() => setShowExclusiveDor(true)} className="w-full">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Criar dor exclusiva para este projeto
                    </Button>
                  ) : (
                    <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
                      <h4 className="text-sm font-medium">Dor exclusiva (não salva no banco)</h4>
                      <div className="flex items-end gap-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 w-10 p-0 shrink-0 text-lg">
                              {exclusiveDorForm.label}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <div className="grid grid-cols-8 gap-1">
                              {DOR_EMOJI_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setExclusiveDorForm(p => ({ ...p, label: opt.value }))}
                                  className={`h-8 w-8 rounded-md flex items-center justify-center text-base transition-colors ${
                                    exclusiveDorForm.label === opt.value ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                                  }`}
                                >
                                  {opt.value}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs">Título</Label>
                          <Input value={exclusiveDorForm.title} onChange={e => setExclusiveDorForm(p => ({ ...p, title: e.target.value }))} placeholder="Título da dor" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Descrição</Label>
                        <Textarea value={exclusiveDorForm.desc} onChange={e => setExclusiveDorForm(p => ({ ...p, desc: e.target.value }))} rows={2} placeholder="Descreva a dor..." />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addExclusiveDor} disabled={!exclusiveDorForm.title.trim()}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowExclusiveDor(false)}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {doresBankSelection.length} dore{doresBankSelection.length !== 1 ? 's' : ''} selecionada{doresBankSelection.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDoresBank(false)}>Cancelar</Button>
                  <Button onClick={confirmDoresBank}>Confirmar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Cases / Portfólio Section */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Cases / Portfólio</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={addCase}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              {casesForm.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum case adicionado.</p>
              )}
              {casesForm.map((c, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-3 relative">
                  <button onClick={() => removeCase(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo</Label>
                      <Select value={c.tipo || 'video'} onValueChange={v => updateCase(i, 'tipo', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Vídeo</SelectItem>
                          <SelectItem value="foto">Foto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs">Título</Label>
                      <Input value={c.titulo || ''} onChange={e => updateCase(i, 'titulo', e.target.value)} placeholder="Nome do case" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Descrição</Label>
                    <Input value={c.descricao || ''} onChange={e => updateCase(i, 'descricao', e.target.value)} placeholder="Descrição breve" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Vimeo ID</Label>
                      <Input value={c.vimeoId || ''} onChange={e => updateCase(i, 'vimeoId', e.target.value)} placeholder="123456789" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Vimeo Hash</Label>
                      <Input value={c.vimeoHash || ''} onChange={e => updateCase(i, 'vimeoHash', e.target.value)} placeholder="abc123def" />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <Switch checked={!!c.destaque} onCheckedChange={v => updateCase(i, 'destaque', v)} />
                      <Label className="text-xs">Destaque</Label>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            {casesDirty && (
              <CardFooter className="pt-0 pb-4 px-6">
                <Button size="sm" onClick={() => saveSection('cases')} disabled={updateProposal.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Entregas e Serviços Section */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Entregas (Output)</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={addEntregavel}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              {entregaveisForm.entregaveis.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma entrega adicionada.</p>
              )}
              {entregaveisForm.entregaveis.map((ent, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-3 relative">
                  <button onClick={() => removeEntregavel(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Ícone</Label>
                      <Select value={ent.icone} onValueChange={v => updateEntregavel(i, 'icone', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantidade</Label>
                      <Input value={ent.quantidade} onChange={e => updateEntregavel(i, 'quantidade', e.target.value)} placeholder="Ex: 3" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs">Título</Label>
                      <Input value={ent.titulo} onChange={e => updateEntregavel(i, 'titulo', e.target.value)} placeholder="Nome da entrega" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Descrição</Label>
                    <Input value={ent.descricao} onChange={e => updateEntregavel(i, 'descricao', e.target.value)} placeholder="Descrição breve" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Serviços Inclusos Section */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Serviços Inclusos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">
              {entregaveisForm.incluso_categories.map((cat, catIdx) => (
                <div key={catIdx} className="space-y-3">
                  <h4 className="text-sm font-medium">{cat.categoria}</h4>
                  {cat.itens && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {cat.itens.map((item, itemIdx) => (
                        <label key={itemIdx} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={item.ativo}
                            onCheckedChange={() => toggleInclusoItem(catIdx, itemIdx)}
                          />
                          <span>{item.nome}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {cat.subcategorias?.map((sub, subIdx) => (
                    <div key={subIdx} className="ml-2 space-y-2">
                      <h5 className="text-xs font-medium text-muted-foreground">{sub.nome}</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {sub.itens.map((item, itemIdx) => (
                          <label key={itemIdx} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={item.ativo}
                              onCheckedChange={() => toggleInclusoItem(catIdx, itemIdx, subIdx)}
                            />
                            <span>{item.nome}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
            {entregaveisDirty && (
              <CardFooter className="pt-0 pb-4 px-6">
                <Button size="sm" onClick={() => saveSection('entregaveis')} disabled={updateProposal.isPending}>
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