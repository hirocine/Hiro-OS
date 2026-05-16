import { useState, useRef, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ExternalLink, Building2, Calendar, DollarSign,
  FileText, MessageSquare, Trash2, Copy, MoreHorizontal, Upload, Save,
  AlertTriangle, Briefcase, Package, Plus, X, Check, Pencil, Sparkles, Loader2
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import { useProposalCases } from '@/features/proposals/hooks/useProposalCases';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { StatusPill } from '@/ds/components/StatusPill';
import { formatMoney } from '@/ds/lib/money';

import { DOR_EMOJI_OPTIONS } from '@/features/proposals/types';
import { PaymentOptionsEditor } from '@/features/proposals/components/PaymentOptionsEditor';
import { buildPaymentOption, DEFAULT_PRESET_PARAMS } from '@/features/proposals/lib/paymentPresets';
import { ServicesSection } from '@/features/proposals/components/admin/ServicesSection';

type StatusTone = 'muted' | 'info' | 'warning' | 'success' | 'danger';

const statusMap: Record<string, { label: string; tone: StatusTone }> = {
  draft: { label: 'Rascunho', tone: 'muted' },
  sent: { label: 'Enviada', tone: 'info' },
  opened: { label: 'Aberta', tone: 'warning' },
  new_version: { label: 'Nova Versão', tone: 'info' },
  approved: { label: 'Aprovada', tone: 'success' },
  expired: { label: 'Arquivada', tone: 'danger' },
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

// DS shared styles
const sectionShellStyle: React.CSSProperties = {
  border: '1px solid hsl(var(--ds-line-1))',
  background: 'hsl(var(--ds-surface))',
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-2))',
};

const eyebrowLabelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const SectionShell: React.FC<{
  icon: LucideIcon;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon: Icon, title, actions, children }) => (
  <div style={sectionShellStyle}>
    <div style={sectionHeaderStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        <span style={sectionTitleStyle}>{title}</span>
      </div>
      {actions}
    </div>
    <div style={{ padding: 18 }}>{children}</div>
  </div>
);

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
      <div
        className={className || ''}
        style={{
          background: 'hsl(var(--ds-line-2) / 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Briefcase size={32} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))' }} />
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
      <div className="ds-shell ds-page">
        <ResponsiveContainer maxWidth="7xl">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </ResponsiveContainer>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="ds-shell ds-page">
        <ResponsiveContainer maxWidth="7xl">
          <p style={{ color: 'hsl(var(--ds-fg-3))', textAlign: 'center', padding: '48px 0' }}>Proposta não encontrada.</p>
        </ResponsiveContainer>
      </div>
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

  const formatCurrencyBR = (v: number) => formatMoney(v);

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

  const currentStatus = statusMap[proposal.status] || statusMap.draft;

  return (
    <div className="ds-shell ds-page">
      <ResponsiveContainer maxWidth="7xl">
        <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BreadcrumbNav items={[
            { label: 'Orçamentos', href: '/orcamentos' },
            { label: proposal.project_name || 'Sem nome', href: `/orcamentos/${proposal.slug}/overview` },
            { label: 'Edição' },
          ]} className="mb-0" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="btn" style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}>
                  <MoreHorizontal size={16} strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {!isNewProposal && (
                  <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copiado!'); }}>
                    <Copy className="mr-2 h-4 w-4" /> Copiar Link
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} style={{ color: 'hsl(var(--ds-danger))' }}>
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!isNewProposal && (
              <button className="btn" onClick={() => window.open(`/orcamento/${proposal.slug}?v=${Date.now()}`, '_blank')}>
                <ExternalLink size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> Ver Proposta
              </button>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <div style={sectionShellStyle}>
          <div style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="relative group" style={{ position: 'relative' }}>
                <Avatar className="h-16 w-16 shrink-0">
                  {proposal.client_logo ? <AvatarImage src={proposal.client_logo} alt={proposal.client_name} /> : null}
                  <AvatarFallback style={{ background: 'hsl(var(--ds-line-2) / 0.3)' }}>
                    <Building2 size={22} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '9999px' }}
                  disabled={uploadingLogo}
                >
                  <Upload size={16} strokeWidth={1.5} style={{ color: 'white' }} />
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.2, color: 'hsl(var(--ds-fg-1))', fontFamily: '"HN Display", sans-serif' }}>
                    {proposal.project_name || 'Nova Proposta'}
                  </h1>
                  {proposal.project_number && (
                    <span style={{ fontSize: 20, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                      Nº {proposal.project_number}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  {proposal.client_name || 'Preencha os dados do cliente'}
                </p>
              </div>
              {!isNewProposal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))' }}>
                    Status
                  </span>
                  <Select value={proposal.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[140px] h-8 border-0 bg-transparent p-0 shadow-none focus:ring-0 [&>svg]:ml-1">
                      <StatusPill label={currentStatus.label} tone={currentStatus.tone} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusMap).map(([value, { label, tone }]) => (
                        <SelectItem key={value} value={value}>
                          <StatusPill label={label} tone={tone} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Client Section */}
          <SectionShell
            icon={Building2}
            title="Cliente e Projeto"
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn" disabled={isParsing} onClick={() => { setTranscriptText(''); setShowTranscriptDialog(true); }}>
                  {isParsing ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 4 }} /> : <Sparkles size={14} strokeWidth={1.5} style={{ marginRight: 4 }} />}
                  Importar Transcrição
                </button>
                {clientDirty && (
                  <button className="btn primary" onClick={() => handleSaveClick('client')} disabled={updateProposal.isPending}>
                    <Save size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> Salvar
                  </button>
                )}
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={eyebrowLabelStyle}>Nº do Projeto *</label>
                  <Input
                    style={clientErrors.project_number ? { borderColor: 'hsl(var(--ds-danger))' } : undefined}
                    value={clientForm.project_number}
                    onChange={e => { setClientForm(p => ({ ...p, project_number: e.target.value })); setClientErrors(p => ({ ...p, project_number: false })); }}
                    placeholder="Ex: 001"
                    maxLength={4}
                  />
                  {clientErrors.project_number && <p style={{ fontSize: 12, color: 'hsl(var(--ds-danger))', marginTop: 4 }}>Obrigatório</p>}
                </div>
                <div>
                  <label style={eyebrowLabelStyle}>Nome do Cliente</label>
                  <Input value={clientForm.client_name} onChange={e => setClientForm(p => ({ ...p, client_name: e.target.value }))} />
                </div>
                <div>
                  <label style={eyebrowLabelStyle}>Nome do Projeto</label>
                  <Input value={clientForm.project_name} onChange={e => setClientForm(p => ({ ...p, project_name: e.target.value }))} />
                </div>
                <div>
                  <label style={eyebrowLabelStyle}>Responsável</label>
                  <Input value={clientForm.client_responsible} onChange={e => setClientForm(p => ({ ...p, client_responsible: e.target.value }))} />
                </div>
                <div>
                  <label style={eyebrowLabelStyle}>WhatsApp para Aprovação *</label>
                  <Input
                    style={clientErrors.whatsapp_number ? { borderColor: 'hsl(var(--ds-danger))' } : undefined}
                    value={clientForm.whatsapp_number}
                    onChange={e => { setClientForm(p => ({ ...p, whatsapp_number: formatWhatsApp(e.target.value) })); setClientErrors(p => ({ ...p, whatsapp_number: false })); }}
                    maxLength={20}
                    placeholder="+55 (11) 95151-3862"
                  />
                  {clientErrors.whatsapp_number && <p style={{ fontSize: 12, color: 'hsl(var(--ds-danger))', marginTop: 4 }}>Informe um número válido com DDD</p>}
                </div>
                <div>
                  <label style={eyebrowLabelStyle}>Validade *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="btn"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          fontWeight: 400,
                          color: !clientForm.validity_date ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
                          borderColor: clientErrors.validity_date ? 'hsl(var(--ds-danger))' : undefined,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        <Calendar size={14} strokeWidth={1.5} style={{ marginRight: 8 }} />
                        {clientForm.validity_date
                          ? new Date(clientForm.validity_date + 'T12:00:00').toLocaleDateString('pt-BR')
                          : 'Selecionar data'}
                      </button>
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
                  {clientErrors.validity_date && <p style={{ fontSize: 12, color: 'hsl(var(--ds-danger))', marginTop: 4 }}>Obrigatório</p>}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ ...eyebrowLabelStyle, marginBottom: 0 }}>Descrição da empresa</label>
                  <button className="btn" disabled={isEnriching || !clientForm.client_name} onClick={async () => {
                    try {
                      const desc = await enrichClient(clientForm.client_name);
                      if (desc) { setClientForm(p => ({ ...p, company_description: desc })); toast.success('Descrição preenchida com IA'); }
                    } catch (err) { toast.error('Erro ao buscar descrição: ' + (err instanceof Error ? err.message : 'Erro desconhecido')); }
                  }}>
                    {isEnriching ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 4 }} /> : <Sparkles size={14} strokeWidth={1.5} style={{ marginRight: 4 }} />}
                    Buscar com IA
                  </button>
                </div>
                <Textarea value={clientForm.company_description} onChange={e => setClientForm(p => ({ ...p, company_description: e.target.value }))} rows={4} />
              </div>
            </div>
          </SectionShell>

          {/* Investment Section */}
          <SectionShell
            icon={DollarSign}
            title="Investimento"
            actions={
              investDirty && (
                <button className="btn primary" onClick={() => handleSaveClick('invest')} disabled={updateProposal.isPending}>
                  <Save size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> Salvar
                </button>
              )
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label style={eyebrowLabelStyle}>Valor sem desconto (R$) *</label>
                  <Input
                    style={{
                      ...(investErrors.list_price ? { borderColor: 'hsl(var(--ds-danger))' } : {}),
                      fontVariantNumeric: 'tabular-nums',
                    }}
                    value={investForm.list_price ? formatCurrencyBR(investForm.list_price) : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setInvestForm(p => ({ ...p, list_price: Number(raw) / 100 }));
                      setInvestErrors(p => ({ ...p, list_price: false }));
                    }}
                    placeholder="R$ 0,00"
                  />
                  {investErrors.list_price && <p style={{ fontSize: 12, color: 'hsl(var(--ds-danger))', marginTop: 4 }}>Obrigatório</p>}
                </div>
                <div>
                  <label style={eyebrowLabelStyle}>Desconto (%)</label>
                  <Input
                    type="number"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                    value={investForm.discount_pct}
                    onChange={e => setInvestForm(p => ({ ...p, discount_pct: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div style={{
                padding: 12,
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-line-2) / 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-3))' }}>
                  Valor Final
                </span>
                <span style={{ fontWeight: 600, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrencyBR(investFinalValue)}
                </span>
              </div>
              <div>
                <label style={eyebrowLabelStyle}>Condições de Pagamento</label>
                <Textarea value={investForm.payment_terms} onChange={e => setInvestForm(p => ({ ...p, payment_terms: e.target.value }))} rows={4} />
              </div>

              {/* Payment Options */}
              <PaymentOptionsEditor
                value={investForm.payment_options}
                onChange={next => setInvestForm(p => ({ ...p, payment_options: next }))}
                finalValue={investFinalValue}
              />
            </div>
          </SectionShell>

          {/* Objective Section */}
          <SectionShell
            icon={FileText}
            title="Objetivo"
            actions={
              diagDirty && (
                <button className="btn primary" onClick={() => handleSaveClick('diag')} disabled={updateProposal.isPending}>
                  <Save size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> Salvar
                </button>
              )
            }
          >
            <Textarea value={diagForm.objetivo} onChange={e => setDiagForm({ objetivo: e.target.value })} rows={8} />
          </SectionShell>

          {/* Dores do Cliente Section */}
          <SectionShell
            icon={AlertTriangle}
            title="Dores do Cliente"
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn" disabled={isSuggesting} onClick={async () => {
                  try {
                    const dores = await suggestPainPoints(clientForm.client_name, clientForm.project_name, diagForm.objetivo);
                    if (dores.length > 0) { setDoresForm(dores); toast.success(`${dores.length} dores sugeridas pela IA`); }
                  } catch (err) { toast.error('Erro ao sugerir dores: ' + (err instanceof Error ? err.message : 'Erro desconhecido')); }
                }}>
                  {isSuggesting ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 4 }} /> : <Sparkles size={14} strokeWidth={1.5} style={{ marginRight: 4 }} />}
                  Sugerir com IA
                </button>
                <button className="btn" onClick={openDoresBank}>
                  <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Adicionar Dores
                </button>
                {doresDirty && (
                  <button className="btn primary" onClick={() => handleSaveClick('dores')} disabled={updateProposal.isPending}>
                    <Save size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> Salvar
                  </button>
                )}
              </div>
            }
          >
            {doresForm.length === 0 ? (
              <EmptyState icon={AlertTriangle} title="Nenhuma dor selecionada" description="Nenhuma dor selecionada." compact action={{ label: "Selecionar do banco de dores", onClick: openDoresBank }} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {doresForm.map((dor, i) => (
                  <div
                    key={i}
                    className="group"
                    style={{
                      position: 'relative',
                      border: '1px solid hsl(var(--ds-line-1))',
                      padding: 16,
                      background: 'hsl(var(--ds-surface))',
                    }}
                  >
                    <button
                      onClick={() => removeDor(i)}
                      className="opacity-0 group-hover:opacity-100"
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'hsl(var(--ds-fg-3))',
                        transition: 'all 0.15s',
                      }}
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        background: 'hsl(var(--ds-accent) / 0.08)',
                        border: '1px solid hsl(var(--ds-line-1))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}>
                        {dor.label || '⭐'}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, color: 'hsl(var(--ds-fg-1))' }}>{dor.title}</p>
                        <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {dor.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionShell>

          {/* Dores Bank Dialog */}
          <Dialog open={showDoresBank} onOpenChange={setShowDoresBank}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 ds-shell">
              <DialogHeader className="px-6 pt-6 pb-4 shrink-0" style={{ borderBottom: '1px solid hsl(var(--ds-line-1))' }}>
                <DialogTitle>
                  <span style={{ fontFamily: '"HN Display", sans-serif' }}>Banco de Dores</span>
                </DialogTitle>
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
                      <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-1))' }}>
                        <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
                          {String(catIdx + 1).padStart(2, '0')}
                        </span>
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
                              style={{
                                textAlign: 'left',
                                padding: 12,
                                border: selected ? '1px solid hsl(var(--ds-accent))' : '1px solid hsl(var(--ds-line-1))',
                                background: selected ? 'hsl(var(--ds-accent) / 0.05)' : 'hsl(var(--ds-surface))',
                                transition: 'all 0.15s',
                              }}
                            >
                              <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  background: 'hsl(var(--ds-line-2) / 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 16,
                                  flexShrink: 0,
                                }}>
                                  {pp.label}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, flex: 1, color: 'hsl(var(--ds-fg-1))' }}>{pp.title}</p>
                                    {selected && <Check size={16} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))', flexShrink: 0 }} />}
                                  </div>
                                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {pp.description}
                                  </p>
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
                <div style={{ borderTop: '1px solid hsl(var(--ds-line-1))', paddingTop: 16 }}>
                  {!showExclusiveDor ? (
                    <button className="btn" onClick={() => setShowExclusiveDor(true)} style={{ width: '100%', justifyContent: 'center' }}>
                      <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Criar dor exclusiva para este projeto
                    </button>
                  ) : (
                    <div style={{ padding: 16, border: '1px dashed hsl(var(--ds-line-1))', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>Dor exclusiva (não salva no banco)</h4>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="btn" style={{ height: 40, width: 40, padding: 0, justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                              {exclusiveDorForm.label}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <div className="grid grid-cols-8 gap-1">
                              {DOR_EMOJI_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setExclusiveDorForm(p => ({ ...p, label: opt.value }))}
                                  style={{
                                    height: 32,
                                    width: 32,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 16,
                                    border: exclusiveDorForm.label === opt.value ? '1px solid hsl(var(--ds-accent))' : '1px solid transparent',
                                    background: exclusiveDorForm.label === opt.value ? 'hsl(var(--ds-accent) / 0.1)' : 'transparent',
                                  }}
                                >
                                  {opt.value}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div style={{ flex: 1 }}>
                          <label style={eyebrowLabelStyle}>Título</label>
                          <Input value={exclusiveDorForm.title} onChange={e => setExclusiveDorForm(p => ({ ...p, title: e.target.value }))} placeholder="Título da dor" />
                        </div>
                      </div>
                      <div>
                        <label style={eyebrowLabelStyle}>Descrição</label>
                        <Textarea value={exclusiveDorForm.desc} onChange={e => setExclusiveDorForm(p => ({ ...p, desc: e.target.value }))} rows={3} placeholder="Descreva a dor..." />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn primary" onClick={addExclusiveDor} disabled={!exclusiveDorForm.title.trim()}>
                          <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Adicionar
                        </button>
                        <button className="btn" onClick={() => setShowExclusiveDor(false)}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid hsl(var(--ds-line-1))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                  {doresBankSelection.length} dore{doresBankSelection.length !== 1 ? 's' : ''} selecionada{doresBankSelection.length !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => setShowDoresBank(false)}>Cancelar</button>
                  <button className="btn primary" onClick={confirmDoresBank}>Confirmar</button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Cases / Portfólio Section */}
          <SectionShell
            icon={Briefcase}
            title="Cases / Portfólio"
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn" onClick={openCasesBank}>
                  <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Adicionar Cases
                </button>
                {casesDirty && (
                  <button className="btn primary" onClick={() => handleSaveClick('cases')} disabled={updateProposal.isPending}>
                    <Save size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> Salvar
                  </button>
                )}
              </div>
            }
          >
            {casesForm.length === 0 ? (
              <EmptyState icon={Briefcase} title="Nenhum case selecionado" description="Nenhum case selecionado." compact action={{ label: "Selecionar do banco de cases", onClick: openCasesBank }} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {casesForm.map((c, i) => (
                  <div
                    key={i}
                    className="group"
                    style={{
                      position: 'relative',
                      border: '1px solid hsl(var(--ds-line-1))',
                      overflow: 'hidden',
                      background: 'hsl(var(--ds-surface))',
                    }}
                  >
                    <button
                      onClick={() => removeCase(i)}
                      className="opacity-0 group-hover:opacity-100"
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        padding: 4,
                        borderRadius: '9999px',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                      }}
                    >
                      <X size={16} strokeWidth={1.5} />
                    </button>
                    {c.vimeoId && (
                      <div className="aspect-video">
                        <VimeoThumbnail videoId={c.vimeoId} videoHash={c.vimeoHash} alt={c.titulo || ''} className="w-full h-full" />
                      </div>
                    )}
                    <div style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, color: 'hsl(var(--ds-fg-1))' }}>{c.titulo || 'Sem título'}</p>
                          <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>{c.descricao}</p>
                        </div>
                        {c.tipo && (
                          <span className="pill muted" style={{ fontSize: 10, whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'center' }}>
                            {c.tipo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionShell>

          {/* Cases Bank Dialog */}
          <Dialog open={showCasesBank} onOpenChange={setShowCasesBank}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 ds-shell">
              <DialogHeader className="px-6 pt-6 pb-4 shrink-0" style={{ borderBottom: '1px solid hsl(var(--ds-line-1))' }}>
                <DialogTitle>
                  <span style={{ fontFamily: '"HN Display", sans-serif' }}>Banco de Cases</span>
                </DialogTitle>
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
                        style={{
                          textAlign: 'left',
                          border: selected ? '1px solid hsl(var(--ds-accent))' : '1px solid hsl(var(--ds-line-1))',
                          background: selected ? 'hsl(var(--ds-accent) / 0.05)' : 'hsl(var(--ds-surface))',
                          overflow: 'hidden',
                          transition: 'all 0.15s',
                        }}
                      >
                        {bc.vimeo_id && (
                          <div className="aspect-video" style={{ position: 'relative' }}>
                            <VimeoThumbnail videoId={bc.vimeo_id} videoHash={bc.vimeo_hash || undefined} alt={bc.campaign_name} className="w-full h-full" />
                            {selected && (
                              <div style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                background: 'hsl(var(--ds-accent))',
                                color: 'white',
                                borderRadius: '9999px',
                                padding: 4,
                              }}>
                                <Check size={12} strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ padding: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                            {(bc.tags || []).map(tag => (
                              <span key={tag} className="pill muted" style={{ fontSize: 10 }}>{tag}</span>
                            ))}
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, color: 'hsl(var(--ds-fg-1))' }}>{bc.campaign_name}</p>
                          <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>{bc.client_name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Create new case section */}
                <div style={{ borderTop: '1px solid hsl(var(--ds-line-1))', paddingTop: 16 }}>
                  {!showNewCase ? (
                    <button className="btn" onClick={() => setShowNewCase(true)} style={{ width: '100%', justifyContent: 'center' }}>
                      <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Criar novo case (salva no banco)
                    </button>
                  ) : (
                    <div style={{ padding: 16, border: '1px dashed hsl(var(--ds-line-1))', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>Novo case</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label style={eyebrowLabelStyle}>Cliente</label>
                          <Input value={newCaseForm.client_name} onChange={e => setNewCaseForm(p => ({ ...p, client_name: e.target.value }))} placeholder="Nome do cliente" />
                        </div>
                        <div>
                          <label style={eyebrowLabelStyle}>Campanha</label>
                          <Input value={newCaseForm.campaign_name} onChange={e => setNewCaseForm(p => ({ ...p, campaign_name: e.target.value }))} placeholder="Nome da campanha" />
                        </div>
                        <div className="col-span-2">
                          <label style={eyebrowLabelStyle}>Link do Vimeo</label>
                          <Input value={newCaseForm.vimeo_url} onChange={e => setNewCaseForm(p => ({ ...p, vimeo_url: e.target.value }))} placeholder="https://vimeo.com/1234567890/abc123def" />
                          {(() => {
                            const parsed = parseVimeoUrl(newCaseForm.vimeo_url);
                            return parsed ? (
                              <img src={`https://vumbnail.com/${parsed.vimeo_id}.jpg`} alt="Preview" style={{ marginTop: 8, width: '100%', maxWidth: 320, border: '1px solid hsl(var(--ds-line-1))' }} />
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <div>
                        <label style={eyebrowLabelStyle}>Tags</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {CASE_TAG_OPTIONS.map(tag => {
                            const active = newCaseForm.tags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setNewCaseForm(p => ({
                                  ...p,
                                  tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag],
                                }))}
                                className="pill"
                                style={active ? {
                                  color: 'hsl(var(--ds-accent))',
                                  borderColor: 'hsl(var(--ds-accent))',
                                  background: 'hsl(var(--ds-accent) / 0.1)',
                                } : {}}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn primary" onClick={handleCreateCase} disabled={!newCaseForm.client_name.trim() || !newCaseForm.campaign_name.trim() || createCase.isPending}>
                          <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Criar e Adicionar
                        </button>
                        <button className="btn" onClick={() => setShowNewCase(false)}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 shrink-0" style={{ borderTop: '1px solid hsl(var(--ds-line-1))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                  {casesBankSelection.length} case{casesBankSelection.length !== 1 ? 's' : ''} selecionado{casesBankSelection.length !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => setShowCasesBank(false)}>Cancelar</button>
                  <button className="btn primary" onClick={confirmCasesBank}>Confirmar</button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Entregas e Serviços Section */}
          <SectionShell
            icon={Package}
            title="Entregas (Output)"
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn" onClick={addEntregavel}>
                  <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Adicionar
                </button>
                {outputDirty && (
                  <button className="btn primary" onClick={() => handleSaveClick('output')} disabled={updateProposal.isPending}>
                    <Save size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> Salvar Entregáveis
                  </button>
                )}
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {outputForm.length === 0 && (
                <EmptyState icon={Package} title="Nenhuma entrega" description="Nenhuma entrega adicionada." compact />
              )}
              {outputForm.map((ent, i) => (
                <div key={i} style={{
                  border: '1px solid hsl(var(--ds-line-1))',
                  padding: 16,
                  background: 'hsl(var(--ds-surface))',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  <button
                    onClick={() => removeEntregavel(i)}
                    style={{ position: 'absolute', top: 8, right: 8, color: 'hsl(var(--ds-fg-3))', transition: 'color 0.15s' }}
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end">
                    <div>
                      <label style={eyebrowLabelStyle}>Título</label>
                      <Input value={ent.titulo} onChange={e => updateEntregavel(i, 'titulo', e.target.value)} placeholder="Nome da entrega" />
                    </div>
                    <div>
                      <label style={eyebrowLabelStyle}>Quantidade</label>
                      <Input
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                        value={ent.quantidade}
                        onChange={e => updateEntregavel(i, 'quantidade', e.target.value)}
                        placeholder="Ex: 3"
                      />
                    </div>
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="btn" style={{ height: 40, width: 40, padding: 0, justifyContent: 'center', fontSize: 18 }}>
                            {ent.icone || '🎬'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="end">
                          <div className="grid grid-cols-8 gap-1">
                            {ICON_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateEntregavel(i, 'icone', opt.value)}
                                style={{
                                  height: 32,
                                  width: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 16,
                                  border: ent.icone === opt.value ? '1px solid hsl(var(--ds-accent))' : '1px solid transparent',
                                  background: ent.icone === opt.value ? 'hsl(var(--ds-accent) / 0.1)' : 'transparent',
                                }}
                              >
                                {opt.value}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div>
                    <label style={eyebrowLabelStyle}>Descrição</label>
                    <Input value={ent.descricao} onChange={e => updateEntregavel(i, 'descricao', e.target.value)} placeholder="Descrição breve" />
                  </div>
                </div>
              ))}
            </div>
          </SectionShell>

          {/* Serviços (Pré, Gravação, Pós) — novo editor com fallback legado */}
          {proposal && (
            <ServicesSection
              proposalId={proposal.id}
              proposalSlug={proposal.slug}
              services={(proposal as any).services ?? null}
              legacyInclusoCategories={inclusoForm}
            />
          )}

          {/* Testimonial Section */}
          <SectionShell
            icon={MessageSquare}
            title="Depoimento"
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn" onClick={() => { setShowTestimonialBank(true); setTestimonialBankSearch(''); }}>
                  <Plus size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> Selecionar do Banco
                </button>
                {testimonialDirty && (
                  <button className="btn primary" onClick={() => handleSaveClick('testimonial')} disabled={updateProposal.isPending}>
                    <Save size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> Salvar
                  </button>
                )}
              </div>
            }
          >
            {testimonialForm.testimonial_name ? (
              <div style={{
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-line-2) / 0.3)',
                padding: 20,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
              }}>
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarImage src={testimonialForm.testimonial_image || undefined} />
                  <AvatarFallback>{testimonialForm.testimonial_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>{testimonialForm.testimonial_name}</p>
                    {testimonialForm.testimonial_role && (
                      <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>• {testimonialForm.testimonial_role}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))', marginTop: 4, fontStyle: 'italic' }}>
                    "{testimonialForm.testimonial_text}"
                  </p>
                </div>
                <button
                  className="btn"
                  style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', flexShrink: 0 }}
                  onClick={() => setTestimonialForm({ testimonial_name: '', testimonial_role: '', testimonial_text: '', testimonial_image: '' })}
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <EmptyState icon={MessageSquare} title="Nenhum depoimento selecionado" description="Clique em 'Selecionar do Banco' para escolher" compact />
            )}
          </SectionShell>

          {/* Testimonial Bank Dialog */}
          <Dialog open={showTestimonialBank} onOpenChange={(open) => { setShowTestimonialBank(open); if (!open) { setShowNewTestimonial(false); setEditingTestimonialId(null); } }}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 ds-shell">
              <DialogHeader className="px-6 pt-6 pb-4 shrink-0" style={{ borderBottom: '1px solid hsl(var(--ds-line-1))' }}>
                <DialogTitle>
                  <span style={{ fontFamily: '"HN Display", sans-serif' }}>Banco de Depoimentos</span>
                </DialogTitle>
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
                              style={{
                                position: 'relative',
                                textAlign: 'left',
                                border: isSelected ? '1px solid hsl(var(--ds-accent))' : '1px solid hsl(var(--ds-line-1))',
                                background: isSelected ? 'hsl(var(--ds-accent) / 0.05)' : 'hsl(var(--ds-surface))',
                                padding: 12,
                                transition: 'all 0.15s',
                                display: 'flex',
                                gap: 12,
                                alignItems: 'flex-start',
                                cursor: 'pointer',
                              }}
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
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <p style={{ fontWeight: 500, fontSize: 13, flex: 1, color: 'hsl(var(--ds-fg-1))' }}>{t.name}</p>
                                  {isSelected && <Check size={16} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))', flexShrink: 0 }} />}
                                </div>
                                {t.role && <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>{t.role}</p>}
                                <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  "{t.text}"
                                </p>
                              </div>
                              <button
                                className="btn"
                                style={{ width: 28, height: 28, padding: 0, justifyContent: 'center', flexShrink: 0, opacity: 0.5 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTestimonialId(t.id);
                                  setNewTestimonialForm({ name: t.name, role: t.role, text: t.text, image: t.image || '' });
                                  setShowNewTestimonial(true);
                                }}
                              >
                                <Pencil size={14} strokeWidth={1.5} />
                              </button>
                            </div>
                          );
                        })}
                      {testimonialsBank.filter(t => !testimonialBankSearch || t.name.toLowerCase().includes(testimonialBankSearch.toLowerCase())).length === 0 && (
                        <EmptyState icon={MessageSquare} title="Nenhum depoimento encontrado" description="Nenhum depoimento encontrado." compact />
                      )}
                    </div>
                    <div style={{ borderTop: '1px solid hsl(var(--ds-line-1))', paddingTop: 16, marginTop: 16 }}>
                      <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setShowNewTestimonial(true); setEditingTestimonialId(null); setNewTestimonialForm({ name: '', role: '', text: '', image: '' }); }}>
                        <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Criar novo depoimento
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                      {editingTestimonialId ? 'Editar depoimento' : 'Novo depoimento'}
                    </h4>
                    <div>
                      <label style={eyebrowLabelStyle}>Nome *</label>
                      <Input value={newTestimonialForm.name} onChange={e => setNewTestimonialForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome da pessoa" />
                    </div>
                    <div>
                      <label style={eyebrowLabelStyle}>Cargo</label>
                      <Input value={newTestimonialForm.role} onChange={e => setNewTestimonialForm(p => ({ ...p, role: e.target.value }))} placeholder="Cargo, Empresa" />
                    </div>
                    <div>
                      <label style={eyebrowLabelStyle}>Texto do depoimento *</label>
                      <Textarea value={newTestimonialForm.text} onChange={e => setNewTestimonialForm(p => ({ ...p, text: e.target.value }))} rows={3} placeholder="O que a pessoa disse..." />
                    </div>
                    <div>
                      <label style={eyebrowLabelStyle}>Foto</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={newTestimonialForm.image || undefined} />
                          <AvatarFallback className="text-xs">{newTestimonialForm.name.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <button className="btn" disabled={uploadingTestimonialImage} onClick={() => {
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
                          <Upload size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> {uploadingTestimonialImage ? 'Enviando...' : 'Upload'}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid hsl(var(--ds-line-1))' }}>
                      <button className="btn" onClick={() => { setShowNewTestimonial(false); setEditingTestimonialId(null); }}>Voltar</button>
                      <button className="btn primary" disabled={!newTestimonialForm.name.trim() || !newTestimonialForm.text.trim() || createTestimonial.isPending || updateTestimonial.isPending} onClick={async () => {
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
                        <Check size={14} strokeWidth={1.5} style={{ marginRight: 6 }} /> {editingTestimonialId ? 'Salvar alterações' : 'Salvar no banco'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Transcript Dialog */}
        <Dialog open={showTranscriptDialog} onOpenChange={setShowTranscriptDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col ds-shell">
            <DialogHeader>
              <DialogTitle>
                <span style={{ fontFamily: '"HN Display", sans-serif' }}>Importar Transcrição</span>
              </DialogTitle>
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
              <button className="btn" onClick={() => setShowTranscriptDialog(false)}>Cancelar</button>
              <button className="btn primary" disabled={isParsing || !transcriptText.trim()} onClick={async () => {
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
                {isParsing ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 4 }} /> : <Sparkles size={14} strokeWidth={1.5} style={{ marginRight: 4 }} />}
                Processar
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="sm:max-w-md ds-shell">
          <DialogHeader>
            <DialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>Como deseja salvar?</span>
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
            Você pode alterar a versão atual ou criar uma nova versão desta proposta.
          </p>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <button className="btn" onClick={() => handleVersionChoice('update')} disabled={createNewVersion.isPending}>
              Alterar esta versão
            </button>
            <button className="btn primary" onClick={() => handleVersionChoice('new')} disabled={createNewVersion.isPending}>
              {createNewVersion.isPending ? <Loader2 size={14} className="animate-spin" style={{ marginRight: 4 }} /> : null}
              Criar nova versão
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </ResponsiveContainer>
    </div>
  );
}
