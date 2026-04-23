import { useState, useRef, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
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
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ExternalLink, Building2, Calendar, DollarSign,
  User, Phone, FileText, MessageSquare, Trash2, Copy, MoreHorizontal, Upload, Save,
  AlertTriangle, Briefcase, Package, Plus, X, Check, Pencil, Sparkles, Loader2
} from 'lucide-react';
import { useProposalAI } from '@/features/proposals/hooks/useProposalAI';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProposalDetailsBySlug } from '@/features/proposals/hooks/useProposalDetailsBySlug';
import { useProposals, generateSlug } from '@/features/proposals/hooks/useProposals';
import type { DiagnosticoDor, CaseItem, EntregavelItem, InclusoCategory, ProposalCase, PaymentOption } from '@/features/proposals/types';
import { DEFAULT_INCLUSO_CATEGORIES, ICON_OPTIONS, CASE_TAG_OPTIONS } from '@/features/proposals/types';
import { usePainPoints } from '@/features/proposals/hooks/usePainPoints';
import { useTestimonials } from '@/features/proposals/hooks/useTestimonials';
import type { Testimonial } from '@/features/proposals/types';
import { useProposalCases } from '@/features/proposals/hooks/useProposalCases';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { DOR_EMOJI_OPTIONS } from '@/features/proposals/types';
import { PaymentOptionsEditor } from '@/features/proposals/components/PaymentOptionsEditor';
import { buildPaymentOption, DEFAULT_PRESET_PARAMS } from '@/features/proposals/lib/paymentPresets';
import { ServicesSection } from '@/features/proposals/components/admin/ServicesSection';

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

function formatWhatsApp(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length > 0 && !digits.startsWith('55')) digits = '55' + digits;
  if (digits.length > 13) digits = digits.slice(0, 13);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `+${digits}`;
  if (digits.length <= 4) return `+${digits.slice(0,2)} (${digits.slice(2)}`;
  if (digits.length <= 9) return `+${digits.slice(0,2)} (${digits.slice(2,4)}) ${digits.slice(4)}`;
  return `+${digits.slice(0,2)} (${digits.slice(2,4)}) ${digits.slice(4,9)}-${digits.slice(9)}`;
}

// Vimeo thumbnail component - defined at module level to avoid re-creation on every render
function VimeoThumbnail({ videoId, videoHash, alt, className }: { videoId: string; videoHash?: string; alt?: string; className?: string }) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!videoId) return;
    setFailed(false);
    setThumbUrl(null);
    let cancelled = false;
    const hashSegment = videoHash ? `/${videoHash}` : '';
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}${hashSegment}`;
    fetch(oembedUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        const raw = data.thumbnail_url as string | undefined;
        const upgraded = raw ? raw.replace(/-d_\d+x\d+/, '-d_1280x720') : null;
        setThumbUrl(upgraded || `https://vumbnail.com/${videoId}.jpg`);
      })
      .catch(() => {
        if (!cancelled) setThumbUrl(`https://vumbnail.com/${videoId}.jpg`);
      });
    return () => {
      cancelled = true;
    };
  }, [videoId, videoHash]);

  if (failed || !thumbUrl) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className || ''}`}>
        <Briefcase className="h-8 w-8 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <img
      src={thumbUrl}
      alt={alt || ''}
      className={`object-cover ${className || ''}`}
      loading="lazy"
      onError={() => {
        if (thumbUrl && !thumbUrl.includes('vumbnail.com')) {
          setThumbUrl(`https://vumbnail.com/${videoId}.jpg`);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

export default function ProposalDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: proposal, isLoading, refetch } = useProposalDetailsBySlug(slug);
  const { updateProposal, deleteProposal, createNewVersion } = useProposals();
  const queryClient = useQueryClient();
  const { enrichClient, parseTranscript, suggestPainPoints, isEnriching, isParsing, isSuggesting } = useProposalAI();
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [pendingSaveSection, setPendingSaveSection] = useState<string | null>(null);
  const { data: painPointsBank = [], createPainPoint } = usePainPoints();
  const { data: casesBank = [], createCase } = useProposalCases();
  const { data: testimonialsBank = [], createTestimonial, updateTestimonial } = useTestimonials();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showDoresBank, setShowDoresBank] = useState(false);
  const [doresBankSearch, setDoresBankSearch] = useState('');
  const [doresBankSelection, setDoresBankSelection] = useState<DiagnosticoDor[]>([]);
  const [showExclusiveDor, setShowExclusiveDor] = useState(false);
  const [exclusiveDorForm, setExclusiveDorForm] = useState({ label: '⭐', title: '', desc: '' });
  const [showCasesBank, setShowCasesBank] = useState(false);
  const [casesBankSearch, setCasesBankSearch] = useState('');
  const [casesBankSelection, setCasesBankSelection] = useState<CaseItem[]>([]);
  const [showNewCase, setShowNewCase] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({ client_name: '', campaign_name: '', vimeo_url: '', tags: [] as string[], destaque: false });
  const [showTestimonialBank, setShowTestimonialBank] = useState(false);
  const [testimonialBankSearch, setTestimonialBankSearch] = useState('');
  const [showNewTestimonial, setShowNewTestimonial] = useState(false);
  const [newTestimonialForm, setNewTestimonialForm] = useState({ name: '', role: '', text: '', image: '' });
  const [uploadingTestimonialImage, setUploadingTestimonialImage] = useState(false);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');

  const [clientForm, setClientForm] = useState({ project_number: '', client_name: '', project_name: '', client_responsible: '', whatsapp_number: '+55 ', company_description: '', validity_date: '' });
  const [investForm, setInvestForm] = useState({ list_price: 0, discount_pct: 0, payment_terms: '', payment_options: [] as PaymentOption[] });
  const [diagForm, setDiagForm] = useState({ objetivo: '' });
  const [testimonialForm, setTestimonialForm] = useState({ testimonial_name: '', testimonial_role: '', testimonial_text: '', testimonial_image: '' });
  const [doresForm, setDoresForm] = useState<DiagnosticoDor[]>([]);
  const [casesForm, setCasesForm] = useState<CaseItem[]>([]);
  const [outputForm, setOutputForm] = useState<EntregavelItem[]>([]);
  const [outputSnapshot, setOutputSnapshot] = useState('');
  const [inclusoForm, setInclusoForm] = useState<InclusoCategory[]>([]);
  const [inclusoSnapshot, setInclusoSnapshot] = useState('');
  const [clientErrors, setClientErrors] = useState({ project_number: false, whatsapp_number: false, validity_date: false });
  const [investErrors, setInvestErrors] = useState({ list_price: false });

  // Populate forms when proposal loads
  useEffect(() => {
    if (!proposal) return;
    setClientForm({
      project_number: proposal.project_number || '',
      client_name: proposal.client_name || '',
      project_name: proposal.project_name || '',
      client_responsible: proposal.client_responsible || '',
      whatsapp_number: proposal.whatsapp_number ? formatWhatsApp(proposal.whatsapp_number) : '+55 ',
      company_description: proposal.company_description || '',
      validity_date: proposal.validity_date || '',
    });
    {
      const lp = proposal.list_price || 0;
      const dp = proposal.discount_pct || 0;
      const fv = lp * (1 - dp / 100);
      const existing = (Array.isArray(proposal.payment_options) ? proposal.payment_options : []) as PaymentOption[];
      const payment_options = existing.length > 0
        ? existing
        : [buildPaymentOption('faturamento', { ...DEFAULT_PRESET_PARAMS.faturamento }, fv, { recomendado: true })];
      setInvestForm({
        list_price: lp,
        discount_pct: dp,
        payment_terms: proposal.payment_terms || '',
        payment_options,
      });
    }
    setDiagForm({ objetivo: proposal.objetivo || '' });
    setTestimonialForm({
      testimonial_name: proposal.testimonial_name || '',
      testimonial_role: proposal.testimonial_role || '',
      testimonial_text: proposal.testimonial_text || '',
      testimonial_image: proposal.testimonial_image || '',
    });
    setDoresForm(Array.isArray(proposal.diagnostico_dores) ? proposal.diagnostico_dores : []);
    setCasesForm(Array.isArray(proposal.cases) ? proposal.cases : []);
    // Parse entregaveis - supports both wizard block format and legacy format
    const rawEntregaveis = proposal.entregaveis as any;
    let parsed: EntregaveisData;
    if (Array.isArray(rawEntregaveis) && rawEntregaveis.length > 0 && rawEntregaveis[0]?.label) {
      const outputBlock = rawEntregaveis.find((b: any) => b.label === 'Output');
      const servicosBlock = rawEntregaveis.find((b: any) => b.label === 'Serviços');
      parsed = {
        entregaveis: outputBlock?.itens || [],
        incluso_categories: (() => {
          const savedCards = servicosBlock?.cards || [];
          return DEFAULT_INCLUSO_CATEGORIES.map(defaultCat => {
            const saved = savedCards.find((c: any) =>
              (c.titulo || c.categoria) === defaultCat.categoria
            );
            if (saved) {
              return {
                categoria: saved.titulo || saved.categoria,
                icone: saved.icone || defaultCat.icone,
                itens: saved.itens || defaultCat.itens,
                subcategorias: saved.subcategorias || defaultCat.subcategorias,
              };
            }
            return JSON.parse(JSON.stringify(defaultCat));
          });
        })(),
      };
    } else if (Array.isArray(rawEntregaveis) && rawEntregaveis.length > 0 && rawEntregaveis[0]?.entregaveis) {
      parsed = {
        entregaveis: rawEntregaveis[0].entregaveis || [],
        incluso_categories: rawEntregaveis[0].incluso_categories || JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES)),
      };
    } else if (rawEntregaveis && !Array.isArray(rawEntregaveis) && rawEntregaveis.entregaveis) {
      parsed = {
        entregaveis: rawEntregaveis.entregaveis || [],
        incluso_categories: rawEntregaveis.incluso_categories || JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES)),
      };
    } else {
      parsed = { entregaveis: [], incluso_categories: JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES)) };
    }
    setOutputForm(parsed.entregaveis);
    setOutputSnapshot(JSON.stringify(parsed.entregaveis));
    setInclusoForm(parsed.incluso_categories);
    setInclusoSnapshot(JSON.stringify(parsed.incluso_categories));
  }, [proposal]);

  const isNewProposal = !proposal?.client_name;

  const clientDirty = useMemo(() => {
    if (!proposal) return false;
    return clientForm.project_number !== (proposal.project_number || '') ||
      clientForm.client_name !== (proposal.client_name || '') ||
      clientForm.project_name !== (proposal.project_name || '') ||
      clientForm.client_responsible !== (proposal.client_responsible || '') ||
      clientForm.whatsapp_number.replace(/\D/g, '') !== (proposal.whatsapp_number || '').replace(/\D/g, '') ||
      clientForm.company_description !== (proposal.company_description || '') ||
      clientForm.validity_date !== (proposal.validity_date || '');
  }, [clientForm, proposal]);

  const investDirty = useMemo(() => {
    if (!proposal) return false;
    return investForm.list_price !== (proposal.list_price || 0) ||
      investForm.discount_pct !== (proposal.discount_pct || 0) ||
      investForm.payment_terms !== (proposal.payment_terms || '') ||
      JSON.stringify(investForm.payment_options) !== JSON.stringify((Array.isArray(proposal.payment_options) ? proposal.payment_options : []) as PaymentOption[]);
  }, [investForm, proposal]);

  const diagDirty = useMemo(() => {
    if (!proposal) return false;
    return diagForm.objetivo !== (proposal.objetivo || '');
  }, [diagForm, proposal]);

  const testimonialDirty = useMemo(() => {
    if (!proposal) return false;
    return testimonialForm.testimonial_name !== (proposal.testimonial_name || '') ||
      testimonialForm.testimonial_role !== (proposal.testimonial_role || '') ||
      testimonialForm.testimonial_text !== (proposal.testimonial_text || '') ||
      testimonialForm.testimonial_image !== (proposal.testimonial_image || '');
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

  const outputDirty = useMemo(() => {
    if (!proposal) return false;
    return JSON.stringify(outputForm) !== outputSnapshot;
  }, [outputForm, outputSnapshot, proposal]);

  const inclusoDirty = useMemo(() => {
    if (!proposal) return false;
    return JSON.stringify(inclusoForm) !== inclusoSnapshot;
  }, [inclusoForm, inclusoSnapshot, proposal]);

  // Group bank by category
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

  const painPointsByCategory = useMemo(() => {
    const groups: Record<string, typeof painPointsBank> = {};
    painPointsBank.forEach(pp => {
      const cat = (pp as any).category || 'Sem categoria';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(pp);
    });
    return groups;
  }, [painPointsBank]);

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

  const filteredCasesBank = useMemo(() => {
    const search = casesBankSearch.toLowerCase();
    if (!search) return casesBank;
    return casesBank.filter(c =>
      c.client_name.toLowerCase().includes(search) ||
      c.campaign_name.toLowerCase().includes(search) ||
      (c.tags || []).some(t => t.toLowerCase().includes(search))
    );
  }, [casesBankSearch, casesBank]);

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
      if (section === 'client') {
        const errors = {
          project_number: !clientForm.project_number.trim(),
          whatsapp_number: clientForm.whatsapp_number.replace(/\D/g, '').length < 12,
          validity_date: !clientForm.validity_date,
        };
        setClientErrors(errors);
        if (Object.values(errors).some(Boolean)) {
          toast.error('Preencha todos os campos obrigatórios');
          return;
        }
        if (clientForm.project_number.trim()) {
          const { data: existing } = await supabase
            .from('orcamentos')
            .select('id, project_name, client_name')
            .eq('project_number', clientForm.project_number.trim())
            .neq('id', proposal.id)
            .maybeSingle();
          if (existing) {
            toast.error(
              `Nº ${clientForm.project_number} já existe (${(existing as any).client_name} — ${(existing as any).project_name}). Considere criar uma nova versão desse orçamento.`,
              { duration: 6000 }
            );
            setClientErrors(p => ({ ...p, project_number: true }));
            return;
          }
        }
      }
      if (section === 'invest') {
        const errors = { list_price: !investForm.list_price || investForm.list_price <= 0 };
        setInvestErrors(errors);
        if (Object.values(errors).some(Boolean)) {
          toast.error('Preencha o valor do investimento');
          return;
        }
      }
      let data: Record<string, any> = {};
      if (section === 'client') {
        const clientName = clientForm.client_name.trim();
        const projectName = clientForm.project_name.trim();
        data = {
          project_number: clientForm.project_number.trim() || null,
          client_name: clientName || null,
          project_name: projectName || null,
          client_responsible: clientForm.client_responsible.trim() || null,
          whatsapp_number: clientForm.whatsapp_number.replace(/\D/g, '').trim() || null,
          company_description: clientForm.company_description.trim() || null,
          validity_date: clientForm.validity_date || null,
        };
        // Auto-generate slug when both names are filled and slug is still a draft placeholder
        if (clientName && projectName && proposal.slug.startsWith('rascunho-')) {
          let newSlug = generateSlug(clientName, projectName);
          // Check uniqueness
          const { data: existing } = await supabase
            .from('orcamentos')
            .select('slug')
            .eq('slug', newSlug)
            .neq('id', proposal.id)
            .maybeSingle();
          if (existing) {
            newSlug = `${newSlug}-${Math.random().toString(36).slice(2, 6)}`;
          }
          data.slug = newSlug;
        }
      } else if (section === 'invest') {
        const finalValue = investForm.list_price * (1 - investForm.discount_pct / 100);
        data = {
          list_price: investForm.list_price || null,
          discount_pct: investForm.discount_pct,
          final_value: finalValue,
          base_value: finalValue,
          payment_terms: investForm.payment_terms.trim(),
          payment_options: investForm.payment_options,
        };
      } else if (section === 'diag') {
        data = { objetivo: diagForm.objetivo.trim() || null };
      } else if (section === 'testimonial') {
        data = {
          testimonial_name: testimonialForm.testimonial_name.trim() || null,
          testimonial_role: testimonialForm.testimonial_role.trim() || null,
          testimonial_text: testimonialForm.testimonial_text.trim() || null,
          testimonial_image: testimonialForm.testimonial_image.trim() || null,
        };
      } else if (section === 'dores') {
        data = { diagnostico_dores: doresForm };
      } else if (section === 'cases') {
        data = { cases: casesForm };
      } else if (section === 'output') {
        data = {
          entregaveis: [
            { label: 'Output', titulo: 'Entregas do Projeto', itens: outputForm },
            { label: 'Serviços', titulo: 'O que está incluso', cards: inclusoForm },
          ],
        };
      } else if (section === 'incluso') {
        data = {
          entregaveis: [
            { label: 'Output', titulo: 'Entregas do Projeto', itens: outputForm },
            { label: 'Serviços', titulo: 'O que está incluso', cards: inclusoForm },
          ],
        };
      }
      await updateProposal.mutateAsync({ id: proposal.id, data });
      if (proposal.status === 'draft') {
        const today = new Date().toLocaleDateString('en-CA');
        await supabase
          .from('orcamentos')
          .update({ status: 'sent', sent_date: today } as any)
          .eq('id', proposal.id);
      }
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Alterações salvas!');
    } catch {
      toast.error('Erro ao salvar alterações');
    }
  };

  const handleSaveClick = (section: string) => {
    setPendingSaveSection(section);
    setShowVersionDialog(true);
  };

  const handleVersionChoice = async (choice: 'update' | 'new') => {
    setShowVersionDialog(false);
    if (choice === 'update' && pendingSaveSection) {
      await saveSection(pendingSaveSection);
    } else if (choice === 'new' && pendingSaveSection) {
      try {
        await saveSection(pendingSaveSection);
        const newProposal = await createNewVersion.mutateAsync(proposal.id);
        navigate(`/orcamentos/${newProposal.slug}`);
      } catch {
        // error handled by mutation
      }
    }
    setPendingSaveSection(null);
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
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
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

  const investFinalValue = useMemo(
    () => investForm.list_price * (1 - investForm.discount_pct / 100),
    [investForm.list_price, investForm.discount_pct],
  );

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





  // Cases bank helpers
  const openCasesBank = () => {
    setCasesBankSelection([...casesForm]);
    setCasesBankSearch('');
    setShowNewCase(false);
    setNewCaseForm({ client_name: '', campaign_name: '', vimeo_url: '', tags: [], destaque: false });
    setShowCasesBank(true);
  };

  const toggleBankCase = (bc: ProposalCase) => {
    setCasesBankSelection(prev => {
      const exists = prev.some(c => c.vimeoId === bc.vimeo_id && c.titulo === bc.campaign_name);
      if (exists) return prev.filter(c => !(c.vimeoId === bc.vimeo_id && c.titulo === bc.campaign_name));
      return [...prev, { tipo: bc.tipo, titulo: bc.campaign_name, descricao: bc.client_name, vimeoId: bc.vimeo_id, vimeoHash: bc.vimeo_hash, destaque: bc.destaque }];
    });
  };

  const isBankCaseSelected = (bc: ProposalCase) => casesBankSelection.some(c => c.vimeoId === bc.vimeo_id && c.titulo === bc.campaign_name);

  const confirmCasesBank = () => {
    setCasesForm(casesBankSelection);
    setShowCasesBank(false);
  };

  const parseVimeoUrl = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/);
    if (!match) return null;
    const hashFromQuery = url.match(/[?&]h=([a-zA-Z0-9]+)/);
    return { vimeo_id: match[1], vimeo_hash: match[2] || hashFromQuery?.[1] || '' };
  };

  const handleCreateCase = async () => {
    if (!newCaseForm.client_name.trim() || !newCaseForm.campaign_name.trim()) return;
    const parsed = parseVimeoUrl(newCaseForm.vimeo_url);
    const vimeo_id = parsed?.vimeo_id || '';
    const vimeo_hash = parsed?.vimeo_hash || '';
    try {
      const created = await createCase.mutateAsync({ ...newCaseForm, vimeo_id, vimeo_hash });
      setCasesBankSelection(prev => [...prev, {
        tipo: created.tipo,
        titulo: created.campaign_name,
        descricao: created.client_name,
        vimeoId: created.vimeo_id,
        vimeoHash: created.vimeo_hash,
        destaque: created.destaque,
      }]);
      setNewCaseForm({ client_name: '', campaign_name: '', vimeo_url: '', tags: [], destaque: false });
      setShowNewCase(false);
      toast.success('Case criado e adicionado!');
    } catch {
      toast.error('Erro ao criar case');
    }
  };

  const removeCase = (i: number) => setCasesForm(prev => prev.filter((_, idx) => idx !== i));
  const toggleCaseDestaque = (i: number) => setCasesForm(prev => prev.map((c, idx) => idx === i ? { ...c, destaque: !c.destaque } : c));


  // Entregaveis helpers
  const addEntregavel = () => setOutputForm(prev => [...prev, { titulo: '', descricao: '', quantidade: '', icone: '🎬' }]);
  const removeEntregavel = (i: number) => setOutputForm(prev => prev.filter((_, idx) => idx !== i));
  const updateEntregavel = (i: number, field: keyof EntregavelItem, value: string) =>
    setOutputForm(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));

  // Incluso toggle helper
  const toggleInclusoItem = (catIdx: number, itemIdx: number, subIdx?: number) => {
    setInclusoForm(prev => {
      const cats = JSON.parse(JSON.stringify(prev));
      const cat = cats[catIdx];
      if (subIdx !== undefined && cat.subcategorias) {
        const item = cat.subcategorias[subIdx].itens[itemIdx];
        item.ativo = !item.ativo;
      } else if (cat.itens) {
        cat.itens[itemIdx].ativo = !cat.itens[itemIdx].ativo;
      }
      return cats;
    });
  };

  return (
    <ResponsiveContainer maxWidth="7xl">
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <BreadcrumbNav items={[
            { label: 'Orçamentos', href: '/orcamentos' },
            { label: proposal.project_name || 'Sem nome', href: `/orcamentos/${proposal.slug}/overview` },
            { label: 'Edição' },
          ]} className="mb-0" />
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {!isNewProposal && (
                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copiado!'); }}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar Link
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!isNewProposal && (
              <Button variant="outline" size="sm" onClick={() => window.open(`/orcamento/${proposal.slug}?v=${Date.now()}`, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-1.5" /> Ver Proposta
              </Button>
            )}
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
                  <h1 className="text-xl font-semibold leading-tight">{proposal.project_name || 'Nova Proposta'}</h1>
                  {proposal.project_number && (
                    <span className="text-xl text-muted-foreground">Nº {proposal.project_number}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{proposal.client_name || 'Preencha os dados do cliente'}</p>
              </div>
              {!isNewProposal && (
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
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Client Section */}
          <Card>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-muted"><Building2 className="h-4 w-4 text-foreground/70" /></div>
                  <CardTitle className="text-sm font-semibold tracking-tight">Cliente e Projeto</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={isParsing} onClick={() => { setTranscriptText(''); setShowTranscriptDialog(true); }}>
                    {isParsing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                    Importar Transcrição
                  </Button>
                  {clientDirty && (
                    <Button size="sm" onClick={() => handleSaveClick('client')} disabled={updateProposal.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                    </Button>
                  )}
                </div>
            </div>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-xs">Nº do Projeto *</Label><Input className={clientErrors.project_number ? 'border-destructive' : ''} value={clientForm.project_number} onChange={e => { setClientForm(p => ({ ...p, project_number: e.target.value })); setClientErrors(p => ({ ...p, project_number: false })); }} placeholder="Ex: 001" maxLength={4} />{clientErrors.project_number && <p className="text-xs text-destructive mt-1">Obrigatório</p>}</div>
                <div className="space-y-1.5"><Label className="text-xs">Nome do Cliente</Label><Input value={clientForm.client_name} onChange={e => setClientForm(p => ({ ...p, client_name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Nome do Projeto</Label><Input value={clientForm.project_name} onChange={e => setClientForm(p => ({ ...p, project_name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Responsável</Label><Input value={clientForm.client_responsible} onChange={e => setClientForm(p => ({ ...p, client_responsible: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label className="text-xs">WhatsApp para Aprovação *</Label><Input className={clientErrors.whatsapp_number ? 'border-destructive' : ''} value={clientForm.whatsapp_number} onChange={e => { setClientForm(p => ({ ...p, whatsapp_number: formatWhatsApp(e.target.value) })); setClientErrors(p => ({ ...p, whatsapp_number: false })); }} maxLength={20} placeholder="+55 (11) 95151-3862" />{clientErrors.whatsapp_number && <p className="text-xs text-destructive mt-1">Informe um número válido com DDD</p>}</div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Validade *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={`w-full justify-start text-left font-normal ${!clientForm.validity_date ? 'text-muted-foreground' : ''} ${clientErrors.validity_date ? 'border-destructive' : ''}`}>
                        <Calendar className="h-4 w-4 mr-2" />
                        {clientForm.validity_date
                          ? new Date(clientForm.validity_date + 'T12:00:00').toLocaleDateString('pt-BR')
                          : 'Selecionar data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={clientForm.validity_date ? new Date(clientForm.validity_date + 'T12:00:00') : undefined}
                        onSelect={(date) => { setClientForm(p => ({ ...p, validity_date: date ? date.toLocaleDateString('en-CA') : '' })); setClientErrors(p => ({ ...p, validity_date: false })); }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {clientErrors.validity_date && <p className="text-xs text-destructive mt-1">Obrigatório</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Descrição da empresa</Label>
                  <Button variant="outline" size="sm" disabled={isEnriching || !clientForm.client_name} onClick={async () => {
                    try {
                      const desc = await enrichClient(clientForm.client_name);
                      if (desc) { setClientForm(p => ({ ...p, company_description: desc })); toast.success('Descrição preenchida com IA'); }
                    } catch (err) { toast.error('Erro ao buscar descrição: ' + (err instanceof Error ? err.message : 'Erro desconhecido')); }
                  }}>
                    {isEnriching ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                    Buscar com IA
                  </Button>
                </div>
                <Textarea value={clientForm.company_description} onChange={e => setClientForm(p => ({ ...p, company_description: e.target.value }))} rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Investment Section */}
          <Card>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-muted"><DollarSign className="h-4 w-4 text-foreground/70" /></div>
                  <CardTitle className="text-sm font-semibold tracking-tight">Investimento</CardTitle>
                </div>
                {investDirty && (
                  <Button size="sm" onClick={() => handleSaveClick('invest')} disabled={updateProposal.isPending}>
                    <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                  </Button>
                )}
            </div>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor sem desconto (R$) *</Label>
                  <Input
                    className={investErrors.list_price ? 'border-destructive' : ''}
                    value={investForm.list_price ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investForm.list_price) : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setInvestForm(p => ({ ...p, list_price: Number(raw) / 100 }));
                      setInvestErrors(p => ({ ...p, list_price: false }));
                    }}
                    placeholder="R$ 0,00"
                  />
                  {investErrors.list_price && <p className="text-xs text-destructive mt-1">Obrigatório</p>}
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Desconto (%)</Label><Input type="number" value={investForm.discount_pct} onChange={e => setInvestForm(p => ({ ...p, discount_pct: Number(e.target.value) }))} /></div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Valor Final: </span>
                <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investFinalValue)}</span>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Condições de Pagamento</Label><Textarea value={investForm.payment_terms} onChange={e => setInvestForm(p => ({ ...p, payment_terms: e.target.value }))} rows={4} /></div>

              {/* Payment Options */}
              <PaymentOptionsEditor
                value={investForm.payment_options}
                onChange={next => setInvestForm(p => ({ ...p, payment_options: next }))}
                finalValue={investFinalValue}
              />
            </CardContent>
          </Card>

          {/* Objective Section */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-muted"><FileText className="h-4 w-4 text-foreground/70" /></div>
                  <CardTitle className="text-sm font-semibold tracking-tight">Objetivo</CardTitle>
                </div>
                {diagDirty && (
                  <Button size="sm" onClick={() => handleSaveClick('diag')} disabled={updateProposal.isPending}>
                    <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                  </Button>
                )}
            </div>
            <CardContent className="pt-6">
              <Textarea value={diagForm.objetivo} onChange={e => setDiagForm({ objetivo: e.target.value })} rows={8} />
            </CardContent>
          </Card>

          {/* Dores do Cliente Section */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-muted"><AlertTriangle className="h-4 w-4 text-foreground/70" /></div>
                  <CardTitle className="text-sm font-semibold tracking-tight">Dores do Cliente</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={isSuggesting} onClick={async () => {
                    try {
                      const dores = await suggestPainPoints(clientForm.client_name, clientForm.project_name, diagForm.objetivo);
                      if (dores.length > 0) { setDoresForm(dores); toast.success(`${dores.length} dores sugeridas pela IA`); }
                    } catch (err) { toast.error('Erro ao sugerir dores: ' + (err instanceof Error ? err.message : 'Erro desconhecido')); }
                  }}>
                    {isSuggesting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                    Sugerir com IA
                  </Button>
                  <Button variant="outline" size="sm" onClick={openDoresBank}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Dores
                  </Button>
                  {doresDirty && (
                    <Button size="sm" onClick={() => handleSaveClick('dores')} disabled={updateProposal.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                    </Button>
                  )}
                </div>
            </div>
            <CardContent className="pt-6">
              {doresForm.length === 0 ? (
                <EmptyState icon={AlertTriangle} title="Nenhuma dor selecionada" description="Nenhuma dor selecionada." compact action={{ label: "Selecionar do banco de dores", onClick: openDoresBank }} />
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
                        <Textarea value={exclusiveDorForm.desc} onChange={e => setExclusiveDorForm(p => ({ ...p, desc: e.target.value }))} rows={3} placeholder="Descreva a dor..." />
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-muted"><Briefcase className="h-4 w-4 text-foreground/70" /></div>
                  <CardTitle className="text-sm font-semibold tracking-tight">Cases / Portfólio</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={openCasesBank}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Cases
                  </Button>
                  {casesDirty && (
                    <Button size="sm" onClick={() => handleSaveClick('cases')} disabled={updateProposal.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                    </Button>
                  )}
                </div>
            </div>
            <CardContent className="pt-6">
              {casesForm.length === 0 ? (
                <EmptyState icon={Briefcase} title="Nenhum case selecionado" description="Nenhum case selecionado." compact action={{ label: "Selecionar do banco de cases", onClick: openCasesBank }} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {casesForm.map((c, i) => (
                    <div key={i} className="group relative border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
                      <button
                        onClick={() => removeCase(i)}
                        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 text-white hover:text-destructive transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {c.vimeoId && (
                        <div className="aspect-video">
                          <VimeoThumbnail videoId={c.vimeoId} videoHash={c.vimeoHash} alt={c.titulo || ''} className="w-full h-full" />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight">{c.titulo || 'Sem título'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{c.descricao}</p>
                          </div>
                          {c.tipo && <Badge variant="secondary" className="text-[10px] whitespace-nowrap shrink-0 self-center">{c.tipo}</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cases Bank Dialog */}
          <Dialog open={showCasesBank} onOpenChange={setShowCasesBank}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                <DialogTitle>Banco de Cases</DialogTitle>
                <div className="pt-3">
                  <Input
                    value={casesBankSearch}
                    onChange={e => setCasesBankSearch(e.target.value)}
                    placeholder="Buscar cases..."
                    className="h-9"
                  />
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {filteredCasesBank.length === 0 && !showNewCase && (
                  <EmptyState icon={Briefcase} title="Nenhum case encontrado" description="Nenhum case encontrado." compact />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCasesBank.map(bc => {
                    const selected = isBankCaseSelected(bc);
                    return (
                      <button
                        key={bc.id}
                        type="button"
                        onClick={() => toggleBankCase(bc)}
                        className={`text-left rounded-lg border overflow-hidden transition-all ${
                          selected
                            ? 'border-primary ring-1 ring-primary/30'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        {bc.vimeo_id && (
                          <div className="aspect-video relative">
                            <VimeoThumbnail videoId={bc.vimeo_id} videoHash={bc.vimeo_hash || undefined} alt={bc.campaign_name} className="w-full h-full" />
                            {selected && (
                              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {(bc.tags || []).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                            ))}
                            
                          </div>
                          <p className="text-sm font-medium leading-tight">{bc.campaign_name}</p>
                          <p className="text-xs text-muted-foreground">{bc.client_name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Create new case section */}
                <div className="border-t border-border pt-4">
                  {!showNewCase ? (
                    <Button variant="ghost" size="sm" onClick={() => setShowNewCase(true)} className="w-full">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Criar novo case (salva no banco)
                    </Button>
                  ) : (
                    <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
                      <h4 className="text-sm font-medium">Novo case</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Cliente</Label>
                          <Input value={newCaseForm.client_name} onChange={e => setNewCaseForm(p => ({ ...p, client_name: e.target.value }))} placeholder="Nome do cliente" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Campanha</Label>
                          <Input value={newCaseForm.campaign_name} onChange={e => setNewCaseForm(p => ({ ...p, campaign_name: e.target.value }))} placeholder="Nome da campanha" />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label className="text-xs">Link do Vimeo</Label>
                          <Input value={newCaseForm.vimeo_url} onChange={e => setNewCaseForm(p => ({ ...p, vimeo_url: e.target.value }))} placeholder="https://vimeo.com/1234567890/abc123def" />
                          {(() => {
                            const parsed = parseVimeoUrl(newCaseForm.vimeo_url);
                            return parsed ? (
                              <img src={`https://vumbnail.com/${parsed.vimeo_id}.jpg`} alt="Preview" className="rounded-lg mt-2 w-full max-w-xs" />
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {CASE_TAG_OPTIONS.map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setNewCaseForm(p => ({
                                ...p,
                                tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag],
                              }))}
                              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                                newCaseForm.tags.includes(tag)
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : 'border-border hover:border-primary/30'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreateCase} disabled={!newCaseForm.client_name.trim() || !newCaseForm.campaign_name.trim() || createCase.isPending}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Criar e Adicionar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowNewCase(false)}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {casesBankSelection.length} case{casesBankSelection.length !== 1 ? 's' : ''} selecionado{casesBankSelection.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCasesBank(false)}>Cancelar</Button>
                  <Button onClick={confirmCasesBank}>Confirmar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Entregas e Serviços Section */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-muted"><Package className="h-4 w-4 text-foreground/70" /></div>
                  <CardTitle className="text-sm font-semibold tracking-tight">Entregas (Output)</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={addEntregavel}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                  </Button>
                  {outputDirty && (
                    <Button size="sm" onClick={() => handleSaveClick('output')} disabled={updateProposal.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar Entregáveis
                    </Button>
                  )}
                </div>
            </div>
            <CardContent className="pt-6 space-y-4">
              {outputForm.length === 0 && (
                <EmptyState icon={Package} title="Nenhuma entrega" description="Nenhuma entrega adicionada." compact />
              )}
              {outputForm.map((ent, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-3 relative">
                  <button onClick={() => removeEntregavel(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Título</Label>
                      <Input value={ent.titulo} onChange={e => updateEntregavel(i, 'titulo', e.target.value)} placeholder="Nome da entrega" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Quantidade</Label>
                      <Input value={ent.quantidade} onChange={e => updateEntregavel(i, 'quantidade', e.target.value)} placeholder="Ex: 3" />
                    </div>
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-10 w-10 p-0 text-lg">
                            {ent.icone || '🎬'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="end">
                          <div className="grid grid-cols-8 gap-1">
                            {ICON_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateEntregavel(i, 'icone', opt.value)}
                                className={`h-8 w-8 rounded-md flex items-center justify-center text-base transition-colors ${
                                  ent.icone === opt.value ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'
                                }`}
                              >
                                {opt.value}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-muted"><Package className="h-4 w-4 text-foreground/70" /></div>
                  <CardTitle className="text-sm font-semibold tracking-tight">Serviços Inclusos</CardTitle>
                </div>
                {inclusoDirty && (
                  <Button size="sm" onClick={() => handleSaveClick('incluso')} disabled={updateProposal.isPending}>
                    <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar Serviços
                  </Button>
                )}
            </div>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {inclusoForm.map((cat, catIdx) => {
                  const phaseEmoji = cat.categoria === 'Pré-produção' ? '📋' : cat.categoria === 'Gravação' ? '🎬' : '✂️';
                  const allItems = [
                    ...(cat.itens || []),
                    ...(cat.subcategorias?.flatMap(s => s.itens) || []),
                  ];
                  const activeCount = allItems.filter(i => i.ativo).length;
                  const totalCount = allItems.length;

                  return (
                    <div key={catIdx} className="border rounded-xl bg-muted/30 p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-border/50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{phaseEmoji}</span>
                          <h4 className="text-sm font-semibold">{cat.categoria}</h4>
                        </div>
                        {activeCount > 0 && (
                          <span className="text-[10px] font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                            {activeCount}/{totalCount}
                          </span>
                        )}
                      </div>
                      {cat.itens && (
                        <div className="space-y-0.5">
                          {cat.itens.map((item, itemIdx) => (
                            <label key={itemIdx} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 -mx-2 transition-colors">
                              <Checkbox
                                checked={item.ativo}
                                onCheckedChange={() => toggleInclusoItem(catIdx, itemIdx)}
                              />
                              <span className={item.ativo ? 'text-foreground' : 'text-muted-foreground'}>{item.nome}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {cat.subcategorias?.map((sub, subIdx) => (
                        <div key={subIdx} className="space-y-0.5">
                          <p className="uppercase tracking-wider text-[10px] text-muted-foreground font-semibold px-2 pt-1 pb-0.5">{sub.nome}</p>
                          {sub.itens.map((item, itemIdx) => (
                            <label key={itemIdx} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5 -mx-2 transition-colors">
                              <Checkbox
                                checked={item.ativo}
                                onCheckedChange={() => toggleInclusoItem(catIdx, itemIdx, subIdx)}
                              />
                              <span className={item.ativo ? 'text-foreground' : 'text-muted-foreground'}>{item.nome}</span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Testimonial Section */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-muted"><MessageSquare className="h-4 w-4 text-foreground/70" /></div>
                  <CardTitle className="text-sm font-semibold tracking-tight">Depoimento</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setShowTestimonialBank(true); setTestimonialBankSearch(''); }}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Selecionar do Banco
                  </Button>
                  {testimonialDirty && (
                    <Button size="sm" onClick={() => handleSaveClick('testimonial')} disabled={updateProposal.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar
                    </Button>
                  )}
                </div>
            </div>
            <CardContent className="pt-6">
              {testimonialForm.testimonial_name ? (
                <div className="border rounded-xl bg-muted/30 p-5 flex gap-4 items-start">
                  <Avatar className="h-14 w-14 shrink-0">
                    <AvatarImage src={testimonialForm.testimonial_image || undefined} />
                    <AvatarFallback>{testimonialForm.testimonial_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{testimonialForm.testimonial_name}</p>
                      {testimonialForm.testimonial_role && (
                        <span className="text-xs text-muted-foreground">• {testimonialForm.testimonial_role}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 italic">"{testimonialForm.testimonial_text}"</p>
                  </div>
                  <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8" onClick={() => setTestimonialForm({ testimonial_name: '', testimonial_role: '', testimonial_text: '', testimonial_image: '' })}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <EmptyState icon={MessageSquare} title="Nenhum depoimento selecionado" description="Clique em 'Selecionar do Banco' para escolher" compact />
              )}
            </CardContent>
          </Card>

          {/* Testimonial Bank Dialog */}
          <Dialog open={showTestimonialBank} onOpenChange={(open) => { setShowTestimonialBank(open); if (!open) { setShowNewTestimonial(false); setEditingTestimonialId(null); } }}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                <DialogTitle>Banco de Depoimentos</DialogTitle>
                <div className="pt-3">
                  <Input
                    value={testimonialBankSearch}
                    onChange={e => setTestimonialBankSearch(e.target.value)}
                    placeholder="Buscar por nome..."
                    className="h-9"
                  />
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {!showNewTestimonial ? (
                  <>
                    <div className="grid grid-cols-1 gap-2">
                      {testimonialsBank
                        .filter(t => !testimonialBankSearch || t.name.toLowerCase().includes(testimonialBankSearch.toLowerCase()))
                        .map(t => {
                          const isSelected = testimonialForm.testimonial_name === t.name && testimonialForm.testimonial_text === t.text;
                          return (
                            <div
                              key={t.id}
                              className={`relative text-left border rounded-lg p-3 transition-all flex gap-3 items-start cursor-pointer ${
                                isSelected
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                  : 'border-border hover:border-primary/30'
                              }`}
                              onClick={() => {
                                setTestimonialForm({
                                  testimonial_name: t.name,
                                  testimonial_role: t.role,
                                  testimonial_text: t.text,
                                  testimonial_image: t.image || '',
                                });
                                setShowTestimonialBank(false);
                              }}
                            >
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={t.image || undefined} />
                                <AvatarFallback className="text-xs">{t.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm flex-1">{t.name}</p>
                                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                                </div>
                                {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">"{t.text}"</p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="shrink-0 h-7 w-7 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTestimonialId(t.id);
                                  setNewTestimonialForm({ name: t.name, role: t.role, text: t.text, image: t.image || '' });
                                  setShowNewTestimonial(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      {testimonialsBank.filter(t => !testimonialBankSearch || t.name.toLowerCase().includes(testimonialBankSearch.toLowerCase())).length === 0 && (
                        <EmptyState icon={MessageSquare} title="Nenhum depoimento encontrado" description="Nenhum depoimento encontrado." compact />
                      )}
                    </div>
                    <div className="border-t border-border pt-4 mt-4">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => { setShowNewTestimonial(true); setEditingTestimonialId(null); setNewTestimonialForm({ name: '', role: '', text: '', image: '' }); }}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Criar novo depoimento
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">{editingTestimonialId ? 'Editar depoimento' : 'Novo depoimento'}</h4>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nome *</Label>
                      <Input value={newTestimonialForm.name} onChange={e => setNewTestimonialForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome da pessoa" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cargo</Label>
                      <Input value={newTestimonialForm.role} onChange={e => setNewTestimonialForm(p => ({ ...p, role: e.target.value }))} placeholder="Cargo, Empresa" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Texto do depoimento *</Label>
                      <Textarea value={newTestimonialForm.text} onChange={e => setNewTestimonialForm(p => ({ ...p, text: e.target.value }))} rows={3} placeholder="O que a pessoa disse..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Foto</Label>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={newTestimonialForm.image || undefined} />
                          <AvatarFallback className="text-xs">{newTestimonialForm.name.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm" disabled={uploadingTestimonialImage} onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (!file) return;
                            setUploadingTestimonialImage(true);
                            try {
                              const ext = file.name.split('.').pop();
                              const path = `testimonials/${crypto.randomUUID()}.${ext}`;
                              const { error } = await supabase.storage.from('orcamentos').upload(path, file, { upsert: true });
                              if (error) throw error;
                              const { data: urlData } = supabase.storage.from('orcamentos').getPublicUrl(path);
                              setNewTestimonialForm(p => ({ ...p, image: urlData.publicUrl }));
                            } catch (err) {
                              toast.error('Erro ao fazer upload da foto');
                            } finally {
                              setUploadingTestimonialImage(false);
                            }
                          };
                          input.click();
                        }}>
                          <Upload className="h-3.5 w-3.5 mr-1.5" /> {uploadingTestimonialImage ? 'Enviando...' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button variant="ghost" size="sm" onClick={() => { setShowNewTestimonial(false); setEditingTestimonialId(null); }}>Voltar</Button>
                      <Button size="sm" disabled={!newTestimonialForm.name.trim() || !newTestimonialForm.text.trim() || createTestimonial.isPending || updateTestimonial.isPending} onClick={async () => {
                        try {
                          const payload = {
                            name: newTestimonialForm.name.trim(),
                            role: newTestimonialForm.role.trim(),
                            text: newTestimonialForm.text.trim(),
                            image: newTestimonialForm.image || null,
                          };
                          if (editingTestimonialId) {
                            await updateTestimonial.mutateAsync({ id: editingTestimonialId, ...payload });
                            toast.success('Depoimento atualizado!');
                          } else {
                            await createTestimonial.mutateAsync(payload);
                            toast.success('Depoimento criado no banco!');
                          }
                          setShowNewTestimonial(false);
                          setEditingTestimonialId(null);
                        } catch {
                          toast.error('Erro ao salvar depoimento');
                        }
                      }}>
                        <Check className="h-3.5 w-3.5 mr-1.5" /> {editingTestimonialId ? 'Salvar alterações' : 'Salvar no banco'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Transcript Dialog */}
        <Dialog open={showTranscriptDialog} onOpenChange={setShowTranscriptDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Importar Transcrição</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <Textarea
                value={transcriptText}
                onChange={e => setTranscriptText(e.target.value)}
                className="h-[40vh] resize-none"
                placeholder="Cole aqui a transcrição da reunião de briefing..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTranscriptDialog(false)}>Cancelar</Button>
              <Button disabled={isParsing || !transcriptText.trim()} onClick={async () => {
                try {
                  const result = await parseTranscript(transcriptText);
                  if (result.client_name) setClientForm(p => ({ ...p, client_name: result.client_name! }));
                  if (result.project_name) setClientForm(p => ({ ...p, project_name: result.project_name! }));
                  if (result.client_responsible) setClientForm(p => ({ ...p, client_responsible: result.client_responsible! }));
                  if (result.objetivo) setDiagForm({ objetivo: result.objetivo });
                  if (result.diagnostico_dores?.length) setDoresForm(result.diagnostico_dores);
                  if (result.entregaveis?.length) setOutputForm(result.entregaveis);
                  toast.success('Transcrição processada com sucesso');
                  setShowTranscriptDialog(false);
                } catch (err) { toast.error('Erro ao processar: ' + (err instanceof Error ? err.message : 'Erro desconhecido')); }
              }}>
                {isParsing ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Processar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Como deseja salvar?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Você pode alterar a versão atual ou criar uma nova versão desta proposta.
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => handleVersionChoice('update')} disabled={createNewVersion.isPending}>
              Alterar esta versão
            </Button>
            <Button onClick={() => handleVersionChoice('new')} disabled={createNewVersion.isPending}>
              {createNewVersion.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Criar nova versão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ResponsiveContainer>
  );
}