import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles, Loader2, ArrowRight, ArrowLeft, Check,
  Building2, Target, FileText, Package, DollarSign,
  CalendarIcon, Plus, Trash2, MessageSquare, Video, Film,
  ListChecks, MessageSquareQuote, Paperclip, FileIcon, X,
  Copy, ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProposalAI } from '../hooks/useProposalAI';
import type { AnalyzeResult } from '../hooks/useProposalAI';
import { useProposals } from '../hooks/useProposals';
import { usePainPoints } from '../hooks/usePainPoints';
import { useProposalCases } from '../hooks/useProposalCases';
import { useTestimonials } from '../hooks/useTestimonials';
import { PageHeader } from '@/components/ui/page-header';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { copyToClipboard } from '@/lib/clipboard';
import { StatusPill } from '@/ds/components/StatusPill';

const extractVimeoId = (raw: string): string => {
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return raw;
  const match = raw.match(/(\d{6,})/);
  return match ? match[1] : raw;
};
import type { DiagnosticoDor, EntregavelItem, InclusoCategory, InclusoItem, PaymentOption } from '../types';
import { PaymentOptionsEditor } from './PaymentOptionsEditor';
import { buildPaymentOption, DEFAULT_PRESET_PARAMS } from '../lib/paymentPresets';
import { ICON_OPTIONS, DEFAULT_INCLUSO_CATEGORIES, CASE_TAG_OPTIONS, DOR_EMOJI_OPTIONS } from '../types';

// ── Loading messages ──
const ANALYZE_MESSAGES = [
  'Lendo o briefing...',
  'Identificando o cliente...',
  'Analisando o escopo...',
];

const FINALIZE_MESSAGES = [
  'Preparando os campos...',
  'Buscando dados da empresa...',
  'Quase pronto...',
];

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


// ── Steps config ──
const STEPS = [
  { key: 'briefing', label: 'Briefing', icon: FileText },
  { key: 'dados', label: 'Dados do Projeto', icon: Building2 },
  { key: 'objetivo', label: 'Objetivo', icon: Target },
  { key: 'dores', label: 'Dores', icon: MessageSquare },
  { key: 'cases', label: 'Portfólio', icon: Video },
  { key: 'entregaveis', label: 'Entregáveis', icon: Package },
  { key: 'inclusos', label: 'Serviços Inclusos', icon: ListChecks },
  { key: 'depoimento', label: 'Depoimento', icon: MessageSquareQuote },
  { key: 'investimento', label: 'Investimento', icon: DollarSign },
  { key: 'revisao', label: 'Revisão', icon: Check },
];

// ── DS style helpers ──
const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label style={fieldLabel}>
    {children}
    {required && <span style={{ marginLeft: 4, color: 'hsl(var(--ds-danger))' }}>*</span>}
  </label>
);

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

const SectionShell: React.FC<{
  icon?: LucideIcon;
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  padding?: number | string;
}> = ({ icon: Icon, title, actions, children, padding = 18 }) => (
  <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
    {(title || Icon || actions) && (
      <div style={sectionHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Icon && <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />}
          {title && <span style={sectionTitleStyle}>{title}</span>}
        </div>
        {actions}
      </div>
    )}
    <div style={{ padding }}>{children}</div>
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
    const hashSegment = videoHash ? `/${videoHash}` : '';
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}${hashSegment}`;
    fetch(oembedUrl)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const url = (data.thumbnail_url as string)?.replace(/-d_\d+x\d+/, '-d_1280x720') || data.thumbnail_url;
        setThumbUrl(url);
      })
      .catch(() => {
        setThumbUrl(`https://vumbnail.com/${videoId}.jpg`);
      });
  }, [videoId, videoHash]);
  if (failed || !thumbUrl) {
    return (
      <div
        className={className || ''}
        style={{ background: 'hsl(var(--ds-line-2) / 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Film size={24} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))' }} />
      </div>
    );
  }
  return (
    <img src={thumbUrl} alt={alt || ''} className={`object-cover ${className || ''}`} loading="lazy"
      onError={() => {
        if (!thumbUrl.includes('vumbnail.com')) {
          setThumbUrl(`https://vumbnail.com/${videoId}.jpg`);
        } else { setFailed(true); }
      }}
    />
  );
}

export function ProposalGuidedWizard() {
  const navigate = useNavigate();
  const { createProposal } = useProposals();
  const {
    enrichClient, suggestPainPoints, analyzeTranscript, finalizeTranscript,
    isEnriching, isAnalyzing, isFinalizing,
  } = useProposalAI();
  const { data: painPointsBank = [] } = usePainPoints();
  const { data: casesBank = [], createCase } = useProposalCases();
  const { data: testimonialsBank = [], createTestimonial } = useTestimonials();

  // ── State ──
  const [step, setStep] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [, setSkippedBriefing] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);

  // Sub-step state for questions within step 0
  const [showQuestions, setShowQuestions] = useState(false);
  const [analyzeResultState, setAnalyzeResultState] = useState<AnalyzeResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step1Errors, setStep1Errors] = useState({ projectNumber: false, clientName: false, projectName: false, whatsapp: false, validityDate: false });

  // Form data
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [clientResponsible, setClientResponsible] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+55 ');
  const [companyDescription, setCompanyDescription] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [dores, setDores] = useState<DiagnosticoDor[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [entregaveis, setEntregaveis] = useState<EntregavelItem[]>([]);
  const [validityDate, setValidityDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [listPrice, setListPrice] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>(() => [
    buildPaymentOption('faturamento', { ...DEFAULT_PRESET_PARAMS.faturamento }, 0, { recomendado: true }),
  ]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [testimonialName, setTestimonialName] = useState('');
  const [testimonialRole, setTestimonialRole] = useState('');
  const [testimonialText, setTestimonialText] = useState('');
  const [testimonialImage, setTestimonialImage] = useState('');
  const [inclusoCategories, setInclusoCategories] = useState<InclusoCategory[]>(
    () => JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES))
  );
  const [selectedTestimonialId, setSelectedTestimonialId] = useState<string | null>(null);
  // New case dialog
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);
  const [newCase, setNewCase] = useState({ client_name: '', campaign_name: '', vimeo_url: '', tags: [] as string[], destaque: false });
  // New testimonial dialog
  const [showNewTestimonialDialog, setShowNewTestimonialDialog] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({ name: '', role: '', text: '', image: '' });
  // PDF upload ref
  const pdfInputRef = useRef<HTMLInputElement>(null);
  // Track AI-filled fields
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);
  const [generatedProposalId, setGeneratedProposalId] = useState<string | null>(null);

  const finalValue = listPrice * (1 - discountPct / 100);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Payment option recalculation now lives inside <PaymentOptionsEditor />.

  const activeLoadingMessages = isFinalizing ? FINALIZE_MESSAGES : ANALYZE_MESSAGES;


  // Rotate loading messages
  useEffect(() => {
    if (!isAnalyzing && !isFinalizing && !isEnriching) return;
    setLoadingMsg(0);
    const interval = setInterval(() => {
      setLoadingMsg(prev => (prev + 1) % activeLoadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAnalyzing, isFinalizing, isEnriching, activeLoadingMessages.length]);

  // Check if all questions answered
  const allQuestionsAnswered = useMemo(() => {
    if (!analyzeResultState?.questions?.length) return true;
    return analyzeResultState.questions.every(q => answers[q.id]);
  }, [analyzeResultState, answers]);

  // ── Fill form from finalized result ──
  const fillFormFromResult = (result: any, filled: Set<string>) => {
    if (result.client_name) { setClientName(result.client_name); filled.add('client_name'); }
    if (result.project_name) { setProjectName(result.project_name); filled.add('project_name'); }
    if (result.client_responsible) { setClientResponsible(result.client_responsible); filled.add('client_responsible'); }
    if (result.objetivo) { setObjetivo(result.objetivo); filled.add('objetivo'); }
    if (result.diagnostico_dores?.length) { setDores(result.diagnostico_dores); filled.add('dores'); }
    if (result.entregaveis?.length) { setEntregaveis(result.entregaveis); filled.add('entregaveis'); }
  };

  // ── Handlers ──
  const handleAnalyzeBriefing = async () => {
    if (!transcript.trim() && !attachedFile) return;

    try {
      let combinedText = transcript.trim();
      if (attachedFile) {
        setIsExtractingPdf(true);
        try {
          const fileText = await extractTextFromFile(attachedFile);
          combinedText = combinedText ? combinedText + '\n\n' + fileText : fileText;
        } catch {
          toast.error('Erro ao extrair texto do arquivo.');
          setIsExtractingPdf(false);
          return;
        }
        setIsExtractingPdf(false);
      }
      if (!combinedText.trim()) return;

      const result = await analyzeTranscript(combinedText);
      if (!result) return;

      if (!result.questions || result.questions.length === 0) {
        // No ambiguities — finalize directly
        const finalResult = await finalizeTranscript(transcript, {});
        if (!finalResult) return;

        const filled = new Set<string>();
        fillFormFromResult(finalResult, filled);

        // Enrich client
        const cName = finalResult.client_name || result.confirmed?.client_name;
        if (cName) {
          const desc = await enrichClient(cName);
          if (desc) { setCompanyDescription(desc); filled.add('company_description'); }
        }

        setAiFilledFields(filled);
        toast.success('Briefing analisado com sucesso!');
        setStep(1);
      } else {
        // Has questions — show sub-step
        setAnalyzeResultState(result);
        setAnswers({});
        setShowQuestions(true);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao analisar o briefing');
    }
  };

  const handleContinueFromQuestions = async () => {
    if (!allQuestionsAnswered) return;

    try {
      // Format answers with the actual selected labels for better context
      const formattedAnswers: Record<string, string> = {};
      for (const q of analyzeResultState?.questions || []) {
        const selectedOptId = answers[q.id];
        const selectedOpt = q.options.find(o => o.id === selectedOptId);
        formattedAnswers[q.text] = selectedOpt?.label || selectedOptId || '';
      }

      const finalResult = await finalizeTranscript(transcript, formattedAnswers);
      if (!finalResult) return;

      const filled = new Set<string>();
      fillFormFromResult(finalResult, filled);

      // Enrich client
      const cName = finalResult.client_name || analyzeResultState?.confirmed?.client_name;
      if (cName) {
        const desc = await enrichClient(cName);
        if (desc) { setCompanyDescription(desc); filled.add('company_description'); }
      }

      setAiFilledFields(filled);
      setShowQuestions(false);
      setAnalyzeResultState(null);
      toast.success('Briefing analisado com sucesso!');
      setStep(1);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao processar as respostas');
    }
  };

  const handleSuggestDores = async () => {
    const result = await suggestPainPoints(clientName, projectName, objetivo);
    if (result?.length) {
      setDores(result);
      setAiFilledFields(prev => new Set([...prev, 'dores']));
      toast.success('Dores sugeridas pela IA!');
    }
  };

  const toggleBankDor = (pp: { label: string; title: string; description: string }) => {
    const exists = dores.find(d => d.title === pp.title);
    if (exists) {
      setDores(dores.filter(d => d.title !== pp.title));
    } else if (dores.length < 3) {
      setDores([...dores, { label: pp.label, title: pp.title, desc: pp.description }]);
    }
  };

  const toggleCase = (id: string) => {
    if (selectedCaseIds.includes(id)) {
      setSelectedCaseIds(selectedCaseIds.filter(x => x !== id));
    } else {
      setSelectedCaseIds([...selectedCaseIds, id]);
    }
  };

  // ── Vimeo URL parser ──
  const parseVimeoUrl = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/);
    return match ? { vimeo_id: match[1], vimeo_hash: match[2] || '' } : null;
  };

  const handleCreateCase = async () => {
    const parsed = parseVimeoUrl(newCase.vimeo_url);
    if (!parsed || !newCase.client_name.trim() || !newCase.campaign_name.trim()) {
      toast.error('Preencha todos os campos obrigatórios e insira uma URL válida do Vimeo.');
      return;
    }
    try {
      const result = await createCase.mutateAsync({
        client_name: newCase.client_name,
        campaign_name: newCase.campaign_name,
        vimeo_id: parsed.vimeo_id,
        vimeo_hash: parsed.vimeo_hash,
        tags: newCase.tags,
        destaque: newCase.destaque,
      });
      setSelectedCaseIds(prev => [...prev, result.id]);
      setShowNewCaseDialog(false);
      setNewCase({ client_name: '', campaign_name: '', vimeo_url: '', tags: [], destaque: false });
      toast.success('Case criado com sucesso!');
    } catch {
      toast.error('Erro ao criar case');
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.name.toLowerCase().endsWith('.txt')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.readAsText(file);
      });
    }
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'doc' || ext === 'docx') {
      toast.error('Formato não suportado. Converta para PDF ou cole o texto.');
      e.target.value = '';
      return;
    }
    setAttachedFile(file);
    e.target.value = '';
  };

  const handleCreateTestimonial = async () => {
    if (!newTestimonial.name.trim() || !newTestimonial.text.trim()) {
      toast.error('Preencha nome e depoimento.');
      return;
    }
    try {
      const result = await createTestimonial.mutateAsync({
        name: newTestimonial.name,
        role: newTestimonial.role,
        text: newTestimonial.text,
        image: newTestimonial.image || null,
      });
      setSelectedTestimonialId(result.id);
      setTestimonialName(result.name);
      setTestimonialRole(result.role);
      setTestimonialText(result.text);
      setTestimonialImage(result.image || '');
      setShowNewTestimonialDialog(false);
      setNewTestimonial({ name: '', role: '', text: '', image: '' });
      toast.success('Depoimento criado com sucesso!');
    } catch {
      toast.error('Erro ao criar depoimento');
    }
  };

  const addEntregavel = () => setEntregaveis([...entregaveis, { titulo: '', descricao: '', quantidade: '1', icone: '🎬' }]);
  const removeEntregavel = (idx: number) => setEntregaveis(entregaveis.filter((_, i) => i !== idx));
  const updateEntregavel = (idx: number, field: keyof EntregavelItem, value: string) => {
    const u = [...entregaveis]; u[idx] = { ...u[idx], [field]: value }; setEntregaveis(u);
  };

  // ── Incluso helpers ──
  const toggleInclusoItem = (catIdx: number, subIdx: number | null, itemIdx: number) => {
    setInclusoCategories(prev => {
      const cats = JSON.parse(JSON.stringify(prev)) as InclusoCategory[];
      const cat = cats[catIdx];
      let item: InclusoItem;
      if (subIdx !== null && cat.subcategorias) {
        item = cat.subcategorias[subIdx].itens[itemIdx];
      } else if (cat.itens) {
        item = cat.itens[itemIdx];
      } else return prev;
      item.ativo = !item.ativo;
      return cats;
    });
  };

  const updateInclusoQuantidade = (catIdx: number, subIdx: number | null, itemIdx: number, value: string) => {
    setInclusoCategories(prev => {
      const cats = JSON.parse(JSON.stringify(prev)) as InclusoCategory[];
      const cat = cats[catIdx];
      if (subIdx !== null && cat.subcategorias) {
        cat.subcategorias[subIdx].itens[itemIdx].quantidade = value;
      } else if (cat.itens) {
        cat.itens[itemIdx].quantidade = value;
      }
      return cats;
    });
  };

  const addCustomInclusoItem = (catIdx: number, subIdx: number | null) => {
    setInclusoCategories(prev => {
      const cats = JSON.parse(JSON.stringify(prev)) as InclusoCategory[];
      const newItem: InclusoItem = { nome: '', ativo: true, custom: true };
      const cat = cats[catIdx];
      if (subIdx !== null && cat.subcategorias) {
        cat.subcategorias[subIdx].itens.push(newItem);
      } else if (cat.itens) {
        cat.itens.push(newItem);
      }
      return cats;
    });
  };

  const updateCustomInclusoName = (catIdx: number, subIdx: number | null, itemIdx: number, name: string) => {
    setInclusoCategories(prev => {
      const cats = JSON.parse(JSON.stringify(prev)) as InclusoCategory[];
      const cat = cats[catIdx];
      if (subIdx !== null && cat.subcategorias) {
        cat.subcategorias[subIdx].itens[itemIdx].nome = name;
      } else if (cat.itens) {
        cat.itens[itemIdx].nome = name;
      }
      return cats;
    });
  };

  const countActiveInclusos = () => {
    let count = 0;
    for (const cat of inclusoCategories) {
      if (cat.itens) count += cat.itens.filter(i => i.ativo).length;
      if (cat.subcategorias) {
        for (const sub of cat.subcategorias) {
          count += sub.itens.filter(i => i.ativo).length;
        }
      }
    }
    return count;
  };

  const totalInclusoItems = () => {
    let count = 0;
    for (const cat of inclusoCategories) {
      if (cat.itens) count += cat.itens.length;
      if (cat.subcategorias) {
        for (const sub of cat.subcategorias) count += sub.itens.length;
      }
    }
    return count;
  };

  const PHASE_EMOJIS: Record<string, string> = {
    'Pré-produção': '📋',
    'Gravação': '🎬',
    'Pós-produção': '🎨',
  };

  const handleCreateProposal = async () => {
    try {
      const result = await createProposal.mutateAsync({
        client_name: clientName,
        project_number: projectNumber.trim() || null,
        project_name: projectName,
        client_responsible: clientResponsible,
        client_logo: '',
        whatsapp_number: whatsappNumber,
        company_description: companyDescription,
        sent_date: new Date(),
        validity_date: validityDate,
        objetivo,
        diagnostico_dores: dores,
        selected_case_ids: selectedCaseIds,
        entregaveis,
        incluso_categories: inclusoCategories,
        list_price: listPrice,
        base_value: finalValue,
        discount_pct: discountPct,
        payment_terms: paymentNotes,
        payment_options: paymentOptions,
        testimonial_name: testimonialName,
        testimonial_role: testimonialRole,
        testimonial_text: testimonialText,
        testimonial_image: testimonialImage,
      });
      setGeneratedSlug(result.slug);
      setGeneratedProposalId(result.id);
    } catch (err) {
      // handled by mutation
    }
  };

  const aiBadge = (field: string) =>
    aiFilledFields.has(field) ? (
      <span style={{ marginLeft: 8, display: 'inline-flex' }}>
        <StatusPill label="IA" tone="accent" icon={<Sparkles size={10} strokeWidth={1.5} />} />
      </span>
    ) : null;

  // ── Success screen ──
  if (generatedSlug) {
    const publicUrl = `${window.location.origin}/orcamento/${generatedSlug}`;
    return (
      <div className="max-w-3xl mx-auto space-y-6 w-full">
        <PageHeader
          title="Proposta Criada"
          subtitle="O link público está pronto para compartilhar com o cliente"
        />

        <div style={{ border: '1px solid hsl(var(--ds-line-1))', height: 500, overflow: 'hidden', background: 'hsl(var(--ds-surface))' }}>
          <iframe
            src={`/orcamento/${generatedSlug}?v=${Date.now()}`}
            className="w-full h-full"
            title="Preview da proposta"
          />
        </div>

        <div className="flex justify-between items-start">
          <button type="button" className="btn" onClick={() => navigate('/orcamentos')}>
            <ArrowLeft size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Voltar para Orçamentos
          </button>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-3">
              <button
                type="button"
                className="btn"
                onClick={() => copyToClipboard(publicUrl).then(ok => ok && toast.success('Link copiado!'))}
              >
                <Copy size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Copiar Link
              </button>
              {generatedProposalId && (
                <button
                  type="button"
                  className="btn"
                  onClick={() => navigate(`/orcamentos/${generatedProposalId}`)}
                >
                  Editar Proposta
                </button>
              )}
              <button
                type="button"
                className="btn primary"
                onClick={() => window.open(publicUrl, '_blank')}
              >
                Ver Proposta <ExternalLink size={14} strokeWidth={1.5} style={{ marginLeft: 4 }} />
              </button>
            </div>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                color: 'hsl(var(--ds-fg-3))',
                fontVariantNumeric: 'tabular-nums',
              }}
              className="hover:underline"
            >
              {publicUrl}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Step navigation ──
  const goNext = async () => {
    if (step === 1) {
      const errors = {
        projectNumber: !projectNumber.trim(),
        clientName: !clientName.trim(),
        projectName: !projectName.trim(),
        whatsapp: whatsappNumber.replace(/\D/g, '').length < 12,
        validityDate: !validityDate,
      };
      setStep1Errors(errors);
      if (Object.values(errors).some(Boolean)) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
      if (projectNumber.trim()) {
        const { data: existing } = await supabase
          .from('orcamentos')
          .select('id, project_name, client_name')
          .eq('project_number', projectNumber.trim())
          .maybeSingle();
        if (existing) {
          toast.error(
            `Nº ${projectNumber} já existe (${(existing as any).client_name} — ${(existing as any).project_name}). Considere criar uma nova versão desse orçamento.`,
            { duration: 6000 }
          );
          return;
        }
      }
    }
    setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };
  const goBack = () => setStep(prev => Math.max(prev - 1, 0));

  const isLoadingAI = isAnalyzing || isFinalizing || isEnriching;

  const stepSubtitles: Record<number, string> = {
    0: showQuestions ? 'Algumas dúvidas sobre o briefing' : 'Cole o briefing e deixe a IA preencher',
    1: 'Dados do Projeto',
    2: 'Objetivo do Projeto',
    3: 'Dores do Cliente',
    4: 'Portfólio / Cases',
    5: 'Entregáveis',
    6: 'Serviços Inclusos',
    7: 'Depoimento',
    8: 'Investimento',
    9: 'Revisão Final',
  };

  // Bottom nav buttons (reused across steps)
  const NavButtons = ({
    nextLabel = 'Continuar',
    onNext,
    nextDisabled = false,
    nextLeading,
  }: {
    nextLabel?: string;
    onNext?: () => void;
    nextDisabled?: boolean;
    nextLeading?: React.ReactNode;
  }) => (
    <div className="flex justify-between">
      <button type="button" className="btn" onClick={goBack}>
        <ArrowLeft size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Voltar
      </button>
      <button
        type="button"
        className="btn primary"
        onClick={onNext || goNext}
        disabled={nextDisabled}
      >
        {nextLeading}
        {nextLabel}
        <ArrowRight size={14} strokeWidth={1.5} style={{ marginLeft: 4 }} />
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      {/* ── PageHeader fixo ── */}
      {!generatedSlug && <PageHeader title="Nova Proposta" subtitle={stepSubtitles[step] || ''} />}

      {/* ── Stepper ── */}
      {(step > 0 || showQuestions) && !generatedSlug && (
        <div className="flex items-center gap-1 overflow-hidden" style={{ scrollbarWidth: 'none' }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={s.key}
                onClick={() => i < step && setStep(i)}
                className="flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  padding: '6px 10px',
                  border: '1px solid',
                  borderColor: isActive
                    ? 'hsl(var(--ds-accent) / 0.4)'
                    : isDone
                      ? 'hsl(var(--ds-line-1))'
                      : 'hsl(var(--ds-line-1))',
                  background: isActive
                    ? 'hsl(var(--ds-accent) / 0.08)'
                    : 'transparent',
                  color: isActive
                    ? 'hsl(var(--ds-accent))'
                    : isDone
                      ? 'hsl(var(--ds-fg-2))'
                      : 'hsl(var(--ds-fg-4))',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  cursor: i > step ? 'default' : 'pointer',
                  opacity: i > step ? 0.45 : 1,
                  transition: 'all 0.15s',
                }}
                disabled={i > step}
              >
                <Icon size={12} strokeWidth={1.5} />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 0 — BRIEFING (includes questions sub-step)
         ══════════════════════════════════════════════════════════════ */}
      {step === 0 && !showQuestions && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 py-8">

          {isLoadingAI ? (
            <div className="w-full max-w-2xl space-y-4 animate-fade-in">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-12 w-2/3 mx-auto" />
              <p
                className="text-center animate-pulse"
                style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}
              >
                {activeLoadingMessages[loadingMsg % activeLoadingMessages.length]}
              </p>
            </div>
          ) : (
            <>
              {attachedFile && (
                <div className="w-full max-w-2xl mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div
                    className="flex items-center gap-3 max-w-xs"
                    style={{
                      padding: 10,
                      border: '1px solid hsl(var(--ds-line-1))',
                      background: 'hsl(var(--ds-line-2) / 0.3)',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        background: 'hsl(var(--ds-line-2) / 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileIcon size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}
                      >
                        {attachedFile.name}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: 'hsl(var(--ds-fg-3))',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {(attachedFile.size / (1024 * 1024)).toFixed(2)}MB · {attachedFile.name.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => setAttachedFile(null)}
                      className="flex-shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}
              <div className="w-full max-w-2xl">
                <div
                  style={{
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-surface))',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Textarea
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder="Cole aqui o resumo da reunião do Google Meet, transcrição ou briefing do projeto..."
                    className="min-h-[280px] text-sm border-0 focus-visible:ring-0 scrollbar-thin resize-none"
                    style={{ borderRadius: 0 }}
                  />
                   <div
                    className="flex items-center justify-between"
                    style={{
                      padding: '10px 12px',
                      borderTop: '1px solid hsl(var(--ds-line-1))',
                    }}
                   >
                    <button
                      onClick={() => { setSkippedBriefing(true); setStep(1); }}
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--ds-fg-3))',
                        transition: 'color 0.15s',
                      }}
                    >
                      Preencher manualmente →
                    </button>
                    <div className="flex items-center gap-2">
                      <input
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        className="btn"
                        onClick={() => pdfInputRef.current?.click()}
                        style={{ height: 30, padding: '0 10px', fontSize: 11 }}
                      >
                        <Paperclip size={12} strokeWidth={1.5} />
                        <span className="hidden sm:inline" style={{ marginLeft: 4 }}>Anexar</span>
                      </button>
                      <button
                        type="button"
                        className="btn primary"
                        onClick={handleAnalyzeBriefing}
                        disabled={(!transcript.trim() && !attachedFile) || isExtractingPdf}
                        style={{ height: 30, padding: '0 12px', fontSize: 11 }}
                      >
                        <Sparkles size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />
                        Analisar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="w-full max-w-2xl flex items-center justify-end gap-1.5 mt-1"
                style={{ fontSize: 11, color: 'hsl(var(--ds-fg-4))' }}
              >
                <Sparkles size={10} strokeWidth={1.5} />
                <span>Powered by Claude · Anthropic</span>
              </div>
            </>
          )}
          </div>
        </div>
      )}

      {/* ── Sub-step: Questions (within step 0) ── */}
      {step === 0 && showQuestions && analyzeResultState && (
        <div className="flex flex-col space-y-6">
          {isLoadingAI ? (
            <div className="w-full space-y-4 py-12 animate-fade-in">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-10 w-1/2" />
              <p
                className="animate-pulse"
                style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}
              >
                {activeLoadingMessages[loadingMsg % activeLoadingMessages.length]}
              </p>
            </div>
          ) : (
            <>
              <p
                className="animate-fade-in"
                style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}
              >
                {analyzeResultState.confirmed.summary}
              </p>

              <div className="w-full space-y-4">
                {analyzeResultState.questions.map((q, i) => (
                  <div
                    key={q.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${i * 200}ms`, animationFillMode: 'both' }}
                  >
                    <div
                      style={{
                        border: '1px solid hsl(var(--ds-line-1))',
                        background: 'hsl(var(--ds-surface))',
                        padding: 18,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{ fontSize: 22 }}>{q.emoji}</span>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'hsl(var(--ds-fg-1))',
                            paddingTop: 2,
                          }}
                        >
                          {q.text}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 40, marginTop: 12 }}>
                        {q.options.map(opt => {
                          const isSelected = answers[q.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                              style={{
                                textAlign: 'left',
                                padding: '12px 14px',
                                border: '1px solid',
                                borderColor: isSelected
                                  ? 'hsl(var(--ds-accent))'
                                  : 'hsl(var(--ds-line-1))',
                                background: isSelected
                                  ? 'hsl(var(--ds-accent) / 0.06)'
                                  : 'transparent',
                                transition: 'all 0.15s',
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: isSelected ? 500 : 400,
                                  color: 'hsl(var(--ds-fg-1))',
                                }}
                              >
                                {opt.label}
                              </p>
                              {opt.description && (
                                <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                                  {opt.description}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  className="btn"
                  onClick={() => { setShowQuestions(false); setAnalyzeResultState(null); setAnswers({}); }}
                >
                  <ArrowLeft size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Voltar
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleContinueFromQuestions}
                  disabled={!allQuestionsAnswered}
                >
                  Continuar <ArrowRight size={14} strokeWidth={1.5} style={{ marginLeft: 4 }} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 1 — DADOS DO PROJETO
         ══════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-6">

          <SectionShell icon={Building2} title="Dados do Projeto">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <FieldLabel>Nº do Projeto</FieldLabel>
                  <Input
                    value={projectNumber}
                    onChange={e => { setProjectNumber(e.target.value); setStep1Errors(p => ({ ...p, projectNumber: false })); }}
                    placeholder="Ex: 001"
                    maxLength={4}
                    style={step1Errors.projectNumber ? { borderColor: 'hsl(var(--ds-danger))' } : undefined}
                  />
                </div>
                <div>
                  <FieldLabel>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>Nome do Cliente {aiBadge('client_name')}</span>
                  </FieldLabel>
                  <Input
                    value={clientName}
                    onChange={e => { setClientName(e.target.value); setStep1Errors(p => ({ ...p, clientName: false })); }}
                    placeholder="Ex: Cacau Show"
                    style={step1Errors.clientName ? { borderColor: 'hsl(var(--ds-danger))' } : undefined}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <FieldLabel>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>Nome do Projeto {aiBadge('project_name')}</span>
                  </FieldLabel>
                  <Input
                    value={projectName}
                    onChange={e => { setProjectName(e.target.value); setStep1Errors(p => ({ ...p, projectName: false })); }}
                    placeholder="Ex: Campanha Natal 2026"
                    style={step1Errors.projectName ? { borderColor: 'hsl(var(--ds-danger))' } : undefined}
                  />
                </div>
                <div>
                  <FieldLabel>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>Responsável {aiBadge('client_responsible')}</span>
                  </FieldLabel>
                  <Input value={clientResponsible} onChange={e => setClientResponsible(e.target.value)} placeholder="Ex: João Silva" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <FieldLabel>WhatsApp para Aprovação</FieldLabel>
                  <div className="relative">
                    <Input
                      value={whatsappNumber}
                      onChange={e => { setWhatsappNumber(formatWhatsApp(e.target.value)); setStep1Errors(p => ({ ...p, whatsapp: false })); }}
                      placeholder="+55 (11) 95151-3862"
                      maxLength={20}
                      className="pr-20"
                      style={{
                        fontVariantNumeric: 'tabular-nums',
                        ...(step1Errors.whatsapp ? { borderColor: 'hsl(var(--ds-danger))' } : {}),
                      }}
                    />
                    {whatsappNumber.replace(/\D/g, '').length >= 12 && (
                      <button
                        type="button"
                        onClick={() => window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`, '_blank')}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{
                          fontSize: 11,
                          color: 'hsl(var(--ds-success))',
                          fontWeight: 500,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Testar →
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <FieldLabel>Validade da Proposta</FieldLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          fontWeight: 400,
                          color: validityDate ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                          fontVariantNumeric: 'tabular-nums',
                          ...(step1Errors.validityDate ? { borderColor: 'hsl(var(--ds-danger))' } : {}),
                        }}
                      >
                        <CalendarIcon size={14} strokeWidth={1.5} style={{ marginRight: 8 }} />
                        {validityDate ? format(validityDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={validityDate}
                        onSelect={(date) => { setValidityDate(date); setCalendarOpen(false); setStep1Errors(p => ({ ...p, validityDate: false })); }}
                        locale={ptBR}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                  <label style={{ ...fieldLabel, marginBottom: 0, display: 'inline-flex', alignItems: 'center' }}>
                    Descrição da empresa {aiBadge('company_description')}
                  </label>
                  {!aiFilledFields.has('company_description') && clientName.trim() && (
                    <button
                      type="button"
                      className="btn"
                      disabled={isEnriching}
                      style={{ height: 28, padding: '0 10px', fontSize: 11 }}
                      onClick={async () => {
                        const desc = await enrichClient(clientName);
                        if (desc) {
                          setCompanyDescription(desc);
                          setAiFilledFields(prev => new Set([...prev, 'company_description']));
                          toast.success('Descrição preenchida!');
                        }
                      }}
                    >
                      {isEnriching
                        ? <Loader2 size={12} strokeWidth={1.5} className="animate-spin" style={{ marginRight: 4 }} />
                        : <Sparkles size={12} strokeWidth={1.5} style={{ marginRight: 4 }} />}
                      Buscar com IA
                    </button>
                  )}
                </div>
                <Textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} rows={4} placeholder="Descrição breve da empresa do cliente..." />
              </div>
            </div>
          </SectionShell>

          <NavButtons />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 2 — OBJETIVO
         ══════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-6">

          <SectionShell icon={Target} title="Objetivo">
            <div>
              <FieldLabel>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>Objetivo {aiBadge('objetivo')}</span>
              </FieldLabel>
              <Textarea
                value={objetivo}
                onChange={e => setObjetivo(e.target.value)}
                rows={10}
                placeholder="O objetivo deste projeto é desenvolver..."
                className="scrollbar-thin"
              />
            </div>
          </SectionShell>

          <NavButtons />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 3 — DORES DO CLIENTE
         ══════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-6">

          {/* AI suggestion button */}
          {dores.length === 0 && clientName.trim() && (
            <button
              type="button"
              className="btn"
              onClick={handleSuggestDores}
              style={{ alignSelf: 'flex-start' }}
            >
              <Sparkles size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Sugerir dores com IA
            </button>
          )}

          {/* Selected dores */}
          {dores.length > 0 && (
            <div className="space-y-3">
              <label style={fieldLabel}>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>Dores selecionadas ({dores.length}/3)</span>
              </label>
              {dores.map((dor, i) => (
                <div
                  key={i}
                  style={{
                    border: '1px solid hsl(var(--ds-accent) / 0.3)',
                    background: 'hsl(var(--ds-surface))',
                    padding: 14,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              style={{
                                fontSize: 18,
                                padding: 2,
                                border: '1px solid hsl(var(--ds-line-1))',
                                background: 'hsl(var(--ds-surface))',
                                width: 30,
                                height: 30,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Trocar emoji"
                            >
                              {dor.label}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" align="start">
                            <div className="grid grid-cols-6 gap-1">
                              {DOR_EMOJI_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  style={{
                                    fontSize: 18,
                                    padding: 6,
                                    background: dor.label === opt.value ? 'hsl(var(--ds-accent) / 0.1)' : 'transparent',
                                    transition: 'background 0.15s',
                                  }}
                                  onClick={() => { const u = [...dores]; u[i] = { ...u[i], label: opt.value }; setDores(u); }}
                                  title={opt.label}
                                >
                                  {opt.value}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Input
                          value={dor.title}
                          onChange={e => {
                            const u = [...dores]; u[i] = { ...u[i], title: e.target.value }; setDores(u);
                          }}
                          style={{ fontSize: 13, fontWeight: 500, height: 32 }}
                        />
                      </div>
                      <Textarea
                        value={dor.desc}
                        onChange={e => {
                          const u = [...dores]; u[i] = { ...u[i], desc: e.target.value }; setDores(u);
                        }}
                        rows={2}
                        className="scrollbar-thin"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setDores(dores.filter((_, j) => j !== i))}
                      style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', color: 'hsl(var(--ds-danger))', borderColor: 'hsl(var(--ds-danger) / 0.3)' }}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                  {aiFilledFields.has('dores') && (
                    <div style={{ marginTop: 8 }}>
                      <StatusPill
                        label="Sugerido pela IA"
                        tone="accent"
                        icon={<Sparkles size={10} strokeWidth={1.5} />}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bank of pain points */}
          {painPointsBank.length > 0 && dores.length < 3 && (
            <div className="space-y-2">
              <p
                style={{
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  color: 'hsl(var(--ds-fg-3))',
                }}
              >
                Banco de dores
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-1">
                {painPointsBank.filter(pp => !dores.find(d => d.title === pp.title)).map(pp => (
                  <button
                    key={pp.id}
                    onClick={() => toggleBankDor(pp)}
                    className="flex items-start gap-3 text-left group"
                    style={{
                      padding: 12,
                      border: '1px solid hsl(var(--ds-line-1))',
                      background: 'hsl(var(--ds-surface))',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--ds-accent) / 0.4)';
                      e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                      e.currentTarget.style.background = 'hsl(var(--ds-surface))';
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: 'hsl(var(--ds-line-2) / 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {pp.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))', lineHeight: 1.3 }}>
                        {pp.title}
                      </p>
                      <p
                        className="line-clamp-2"
                        style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}
                      >
                        {pp.description}
                      </p>
                    </div>
                    <Plus
                      size={14}
                      strokeWidth={1.5}
                      style={{
                        color: 'hsl(var(--ds-fg-3))',
                        flexShrink: 0,
                        marginTop: 4,
                        opacity: 0,
                        transition: 'opacity 0.15s',
                      }}
                      className="group-hover:opacity-100"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <NavButtons />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 4 — CASES / PORTFÓLIO
         ══════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="space-y-6">

          {casesBank.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {casesBank.map(c => {
                const isSelected = selectedCaseIds.includes(c.id);
                return (
                   <button
                    key={c.id}
                    onClick={() => toggleCase(c.id)}
                    className="relative flex items-center gap-3 text-left"
                    style={{
                      padding: 12,
                      border: '1px solid',
                      borderColor: isSelected ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-line-1))',
                      background: isSelected ? 'hsl(var(--ds-accent) / 0.06)' : 'hsl(var(--ds-surface))',
                      transition: 'all 0.15s',
                    }}
                  >
                    <Checkbox checked={isSelected} className="absolute top-2 right-2 z-10" />
                    {c.vimeo_id ? (
                      <div style={{ width: 96, height: 64, overflow: 'hidden', flexShrink: 0 }}>
                        <VimeoThumbnail
                          videoId={extractVimeoId(c.vimeo_id)}
                          videoHash={c.vimeo_hash || undefined}
                          alt={c.campaign_name}
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 96,
                          height: 64,
                          background: 'hsl(var(--ds-line-2) / 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Video size={20} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}
                      >
                        {c.client_name}
                      </p>
                      <p
                        className="truncate"
                        style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}
                      >
                        {c.campaign_name}
                      </p>
                      {c.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {c.tags.map(tag => (
                            <span
                              key={tag}
                              className="pill muted"
                              style={{ fontSize: 10, padding: '1px 6px' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p
              className="text-center"
              style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', padding: '32px 0' }}
            >
              Nenhum case cadastrado no banco.
            </p>
          )}

          <button
            type="button"
            className="btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setShowNewCaseDialog(true)}
          >
            <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Criar novo case
          </button>

          {/* New Case Dialog */}
          <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  <span style={{ fontFamily: '"HN Display", sans-serif' }}>Novo Case</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <FieldLabel required>Nome do Cliente</FieldLabel>
                  <Input value={newCase.client_name} onChange={e => setNewCase(p => ({ ...p, client_name: e.target.value }))} placeholder="Ex: Empresa X" />
                </div>
                <div>
                  <FieldLabel required>Nome da Campanha</FieldLabel>
                  <Input value={newCase.campaign_name} onChange={e => setNewCase(p => ({ ...p, campaign_name: e.target.value }))} placeholder="Ex: Campanha de Verão" />
                </div>
                <div>
                  <FieldLabel required>URL do Vimeo</FieldLabel>
                  <Input value={newCase.vimeo_url} onChange={e => setNewCase(p => ({ ...p, vimeo_url: e.target.value }))} placeholder="https://vimeo.com/123456789" />
                  {newCase.vimeo_url && parseVimeoUrl(newCase.vimeo_url) && (
                    <img
                      src={`https://vumbnail.com/${parseVimeoUrl(newCase.vimeo_url)!.vimeo_id}.jpg`}
                      alt="Preview"
                      className="w-full aspect-video object-cover mt-2"
                      style={{ background: 'hsl(var(--ds-line-2) / 0.3)' }}
                    />
                  )}
                </div>
                <div>
                  <FieldLabel>Tags</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {CASE_TAG_OPTIONS.map(tag => {
                      const active = newCase.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNewCase(p => ({
                            ...p,
                            tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag],
                          }))}
                          style={{
                            fontSize: 11,
                            padding: '4px 10px',
                            border: '1px solid',
                            borderColor: active ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-line-1))',
                            background: active ? 'hsl(var(--ds-accent) / 0.1)' : 'transparent',
                            color: active ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-2))',
                            transition: 'all 0.15s',
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <button type="button" className="btn" onClick={() => setShowNewCaseDialog(false)}>Cancelar</button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleCreateCase}
                  disabled={createCase.isPending}
                >
                  {createCase.isPending ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" style={{ marginRight: 4 }} /> : null}
                  Criar Case
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <NavButtons />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 5 — ENTREGÁVEIS
         ══════════════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div className="space-y-6">

          <div className="space-y-3">
            {entregaveis.map((ent, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-surface))',
                  padding: 14,
                }}
              >
                <div className="flex items-start gap-3">
                  <Select value={ent.icone} onValueChange={v => updateEntregavel(i, 'icone', v)}>
                    <SelectTrigger className="w-20 h-8 text-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.value} {opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1 grid grid-cols-[1fr_80px] gap-2">
                    <Input value={ent.titulo} onChange={e => updateEntregavel(i, 'titulo', e.target.value)} placeholder="Nome do entregável" className="h-8 text-sm" />
                    <Input
                      value={ent.quantidade}
                      onChange={e => updateEntregavel(i, 'quantidade', e.target.value)}
                      placeholder="Qtd"
                      className="h-8 text-sm text-center"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => removeEntregavel(i)}
                    style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', color: 'hsl(var(--ds-danger))', borderColor: 'hsl(var(--ds-danger) / 0.3)' }}
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
                <Textarea
                  value={ent.descricao}
                  onChange={e => updateEntregavel(i, 'descricao', e.target.value)}
                  placeholder="Descrição breve..."
                  rows={2}
                  className="mt-2 text-sm"
                />
                {aiFilledFields.has('entregaveis') && (
                  <div style={{ marginTop: 8 }}>
                    <StatusPill label="IA" tone="accent" icon={<Sparkles size={10} strokeWidth={1.5} />} />
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn"
              onClick={addEntregavel}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Adicionar Entregável
            </button>
          </div>

          <NavButtons />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 6 — SERVIÇOS INCLUSOS
         ══════════════════════════════════════════════════════════════ */}
      {step === 6 && (
        <div className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inclusoCategories.map((cat, catIdx) => {
              const emoji = PHASE_EMOJIS[cat.categoria] || '📦';
              const activeCount = cat.itens
                ? cat.itens.filter(i => i.ativo).length
                : cat.subcategorias
                  ? cat.subcategorias.reduce((acc, sub) => acc + sub.itens.filter(i => i.ativo).length, 0)
                  : 0;
              const totalCount = cat.itens
                ? cat.itens.length
                : cat.subcategorias
                  ? cat.subcategorias.reduce((acc, sub) => acc + sub.itens.length, 0)
                  : 0;

              return (
                <div
                  key={cat.categoria}
                  style={{
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-surface))',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid hsl(var(--ds-line-1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 16 }}>{emoji}</span>
                      <h3
                        style={{
                          fontSize: 11,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          fontWeight: 500,
                          color: 'hsl(var(--ds-fg-2))',
                        }}
                      >
                        {cat.categoria}
                      </h3>
                    </div>
                    <span
                      className="pill muted"
                      style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {activeCount}/{totalCount}
                    </span>
                  </div>

                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Flat items (Pré-produção, Pós-produção) */}
                    {cat.itens && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {cat.itens.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="flex items-center gap-2"
                            style={{ padding: '6px 8px', transition: 'background 0.15s' }}
                          >
                            <Checkbox
                              checked={item.ativo}
                              onCheckedChange={() => toggleInclusoItem(catIdx, null, itemIdx)}
                            />
                            {item.custom ? (
                              <Input
                                value={item.nome}
                                onChange={e => updateCustomInclusoName(catIdx, null, itemIdx, e.target.value)}
                                placeholder="Nome do item"
                                className="h-7 text-sm flex-1"
                              />
                            ) : (
                              <span
                                className="flex-1"
                                style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}
                              >
                                {item.nome}
                              </span>
                            )}
                            {item.ativo && 'quantidade' in item && (
                              <Input
                                value={item.quantidade || ''}
                                onChange={e => updateInclusoQuantidade(catIdx, null, itemIdx, e.target.value)}
                                placeholder="Qtd"
                                className="h-7 w-16 text-sm text-center"
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                              />
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addCustomInclusoItem(catIdx, null)}
                          className="flex items-center gap-1.5"
                          style={{
                            fontSize: 11,
                            color: 'hsl(var(--ds-fg-3))',
                            padding: '4px 8px',
                            transition: 'color 0.15s',
                          }}
                        >
                          <Plus size={12} strokeWidth={1.5} /> Adicionar item
                        </button>
                      </div>
                    )}

                    {/* Subcategories (Gravação) */}
                    {cat.subcategorias && cat.subcategorias.map((sub, subIdx) => (
                      <div key={sub.nome} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <p
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.14em',
                            color: 'hsl(var(--ds-fg-3))',
                            padding: '4px 8px 0',
                          }}
                        >
                          {sub.nome}
                        </p>
                        {sub.itens.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="flex items-center gap-2"
                            style={{ padding: '6px 8px', transition: 'background 0.15s' }}
                          >
                            <Checkbox
                              checked={item.ativo}
                              onCheckedChange={() => toggleInclusoItem(catIdx, subIdx, itemIdx)}
                            />
                            {item.custom ? (
                              <Input
                                value={item.nome}
                                onChange={e => updateCustomInclusoName(catIdx, subIdx, itemIdx, e.target.value)}
                                placeholder="Nome do item"
                                className="h-7 text-sm flex-1"
                              />
                            ) : (
                              <span
                                className="flex-1"
                                style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}
                              >
                                {item.nome}
                              </span>
                            )}
                            {item.ativo && 'quantidade' in item && (
                              <Input
                                value={item.quantidade || ''}
                                onChange={e => updateInclusoQuantidade(catIdx, subIdx, itemIdx, e.target.value)}
                                placeholder="Qtd"
                                className="h-7 w-16 text-sm text-center"
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                              />
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => addCustomInclusoItem(catIdx, subIdx)}
                          className="flex items-center gap-1.5"
                          style={{
                            fontSize: 11,
                            color: 'hsl(var(--ds-fg-3))',
                            padding: '4px 8px',
                            transition: 'color 0.15s',
                          }}
                        >
                          <Plus size={12} strokeWidth={1.5} /> Adicionar item
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <NavButtons />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 7 — DEPOIMENTO
         ══════════════════════════════════════════════════════════════ */}
      {step === 7 && (
        <div className="space-y-6">

          {testimonialsBank.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testimonialsBank.map(t => {
                  const isSelected = selectedTestimonialId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTestimonialId(t.id);
                        setTestimonialName(t.name);
                        setTestimonialRole(t.role);
                        setTestimonialText(t.text);
                        setTestimonialImage(t.image || '');
                      }}
                      className="flex items-start gap-3 text-left"
                      style={{
                        padding: 14,
                        border: '1px solid',
                        borderColor: isSelected ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-line-1))',
                        background: isSelected ? 'hsl(var(--ds-accent) / 0.06)' : 'hsl(var(--ds-surface))',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        {t.image && <AvatarImage src={t.image} />}
                        <AvatarFallback className="text-xs">{t.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{t.name}</p>
                        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>{t.role}</p>
                        <p
                          className="line-clamp-2"
                          style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}
                        >
                          {t.text}
                        </p>
                      </div>
                      {isSelected && (
                        <Check
                          size={14}
                          strokeWidth={1.5}
                          style={{ color: 'hsl(var(--ds-accent))', flexShrink: 0, marginTop: 4 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn"
                onClick={() => setShowNewTestimonialDialog(true)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Criar novo depoimento
              </button>
            </>
          ) : (
            <>
              <SectionShell icon={MessageSquareQuote} title="Depoimento">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                    Nenhum depoimento cadastrado. Preencha manualmente:
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Nome</FieldLabel>
                      <Input value={testimonialName} onChange={e => setTestimonialName(e.target.value)} placeholder="Ex: João Silva" />
                    </div>
                    <div>
                      <FieldLabel>Cargo</FieldLabel>
                      <Input value={testimonialRole} onChange={e => setTestimonialRole(e.target.value)} placeholder="Ex: CEO, Empresa X" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Depoimento</FieldLabel>
                    <Textarea
                      value={testimonialText}
                      onChange={e => setTestimonialText(e.target.value)}
                      rows={3}
                      placeholder="O que o cliente disse..."
                      className="scrollbar-thin"
                    />
                  </div>
                </div>
              </SectionShell>

              <button
                type="button"
                className="btn"
                onClick={() => setShowNewTestimonialDialog(true)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Plus size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Criar novo depoimento
              </button>
            </>
          )}

          {/* New Testimonial Dialog */}
          <Dialog open={showNewTestimonialDialog} onOpenChange={setShowNewTestimonialDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  <span style={{ fontFamily: '"HN Display", sans-serif' }}>Novo Depoimento</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Nome</FieldLabel>
                    <Input value={newTestimonial.name} onChange={e => setNewTestimonial(p => ({ ...p, name: e.target.value }))} placeholder="Ex: João Silva" />
                  </div>
                  <div>
                    <FieldLabel>Cargo</FieldLabel>
                    <Input value={newTestimonial.role} onChange={e => setNewTestimonial(p => ({ ...p, role: e.target.value }))} placeholder="Ex: CEO, Empresa X" />
                  </div>
                </div>
                <div>
                  <FieldLabel required>Depoimento</FieldLabel>
                  <Textarea
                    value={newTestimonial.text}
                    onChange={e => setNewTestimonial(p => ({ ...p, text: e.target.value }))}
                    rows={3}
                    placeholder="O que o cliente disse..."
                    className="scrollbar-thin"
                  />
                </div>
                <div>
                  <FieldLabel>URL da foto (opcional)</FieldLabel>
                  <Input value={newTestimonial.image} onChange={e => setNewTestimonial(p => ({ ...p, image: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <DialogFooter>
                <button type="button" className="btn" onClick={() => setShowNewTestimonialDialog(false)}>Cancelar</button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleCreateTestimonial}
                  disabled={createTestimonial.isPending}
                >
                  {createTestimonial.isPending ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" style={{ marginRight: 4 }} /> : null}
                  Criar Depoimento
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <NavButtons />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 8 — INVESTIMENTO
         ══════════════════════════════════════════════════════════════ */}
      {step === 8 && (
        <div className="space-y-6">

          <SectionShell icon={DollarSign} title="Investimento">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Valor de Tabela (R$)</FieldLabel>
                  <Input
                    type="number"
                    value={listPrice || ''}
                    onChange={e => setListPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                </div>
                <div>
                  <FieldLabel>Desconto (%)</FieldLabel>
                  <Input
                    type="number"
                    value={discountPct || ''}
                    onChange={e => setDiscountPct(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                </div>
              </div>
              <div
                className="flex items-center justify-between"
                style={{
                  padding: 14,
                  background: 'hsl(var(--ds-line-2) / 0.3)',
                  border: '1px solid hsl(var(--ds-line-1))',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-3))',
                  }}
                >
                  Valor Final
                </span>
                <span
                  style={{
                    fontFamily: '"HN Display", sans-serif',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'hsl(var(--ds-fg-1))',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {fmt(finalValue)}
                </span>
              </div>
              <PaymentOptionsEditor
                value={paymentOptions}
                onChange={setPaymentOptions}
                finalValue={finalValue}
              />
              <div>
                <FieldLabel>Observações de pagamento</FieldLabel>
                <Textarea
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  rows={3}
                  placeholder="Condições adicionais, prazos, etc."
                  className="scrollbar-thin"
                />
              </div>
            </div>
          </SectionShell>

          <NavButtons nextLabel="Revisar Proposta" />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 9 — REVISÃO FINAL
         ══════════════════════════════════════════════════════════════ */}
      {step === 9 && (
        <div className="space-y-6">

          <div className="space-y-3">
            {/* Reusable review row */}
            {(() => {
              const ReviewRow = ({
                label,
                onClick,
                children,
              }: {
                label: React.ReactNode;
                onClick: () => void;
                children: React.ReactNode;
              }) => (
                <button
                  type="button"
                  onClick={onClick}
                  className="flex items-center justify-between w-full text-left"
                  style={{
                    padding: 14,
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-surface))',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(var(--ds-surface))'; }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      {label}
                    </p>
                    <div style={{ marginTop: 4 }}>{children}</div>
                  </div>
                  <ArrowRight size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
                </button>
              );

              return (
                <>
                  <ReviewRow label="Cliente" onClick={() => setStep(1)}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                      {clientName || '—'} · {projectName || '—'}
                    </p>
                    {clientResponsible && (
                      <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>Resp: {clientResponsible}</p>
                    )}
                  </ReviewRow>

                  <ReviewRow label="Objetivo" onClick={() => setStep(2)}>
                    <p
                      className="line-clamp-2"
                      style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}
                    >
                      {objetivo || '—'}
                    </p>
                  </ReviewRow>

                  <ReviewRow label={<span style={{ fontVariantNumeric: 'tabular-nums' }}>Dores ({dores.length})</span>} onClick={() => setStep(3)}>
                    <div className="flex flex-wrap gap-2">
                      {dores.map((d, i) => (
                        <span key={i} className="pill muted" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                          {d.label} {d.title}
                        </span>
                      ))}
                      {dores.length === 0 && (
                        <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>Nenhuma dor selecionada</p>
                      )}
                    </div>
                  </ReviewRow>

                  <ReviewRow label={<span style={{ fontVariantNumeric: 'tabular-nums' }}>Cases ({selectedCaseIds.length})</span>} onClick={() => setStep(4)}>
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>
                      {selectedCaseIds.length > 0
                        ? <span style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedCaseIds.length} case(s) selecionado(s)</span>
                        : 'Nenhum case selecionado'}
                    </p>
                  </ReviewRow>

                  <ReviewRow label={<span style={{ fontVariantNumeric: 'tabular-nums' }}>Entregáveis ({entregaveis.length})</span>} onClick={() => setStep(5)}>
                    <div className="flex gap-1 flex-wrap">
                      {entregaveis.map((e, i) => (
                        <span key={i} className="pill muted" style={{ fontSize: 11 }}>
                          {e.icone} {e.titulo || 'Sem nome'}
                        </span>
                      ))}
                      {entregaveis.length === 0 && (
                        <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>Nenhum entregável</p>
                      )}
                    </div>
                  </ReviewRow>

                  <ReviewRow label="Serviços Inclusos" onClick={() => setStep(6)}>
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
                      {countActiveInclusos()}/{totalInclusoItems()} serviços selecionados
                    </p>
                  </ReviewRow>

                  <ReviewRow label="Depoimento" onClick={() => setStep(7)}>
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>
                      {testimonialName ? `${testimonialName} — ${testimonialRole}` : 'Nenhum depoimento'}
                    </p>
                  </ReviewRow>

                  <ReviewRow label="Investimento" onClick={() => setStep(8)}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'hsl(var(--ds-fg-1))',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {fmt(finalValue)}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {paymentOptions.map((opt, i) =>
                        opt.recomendado ? (
                          <StatusPill
                            key={i}
                            label={`${opt.titulo}: ${opt.valor}`}
                            tone="accent"
                          />
                        ) : (
                          <span
                            key={i}
                            className="pill"
                            style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}
                          >
                            {opt.titulo}: {opt.valor}
                          </span>
                        )
                      )}
                    </div>
                  </ReviewRow>
                </>
              );
            })()}
          </div>

          <div className="flex justify-between">
            <button type="button" className="btn" onClick={goBack}>
              <ArrowLeft size={14} strokeWidth={1.5} style={{ marginRight: 4 }} /> Voltar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleCreateProposal}
              disabled={createProposal.isPending || !clientName.trim() || !projectName.trim() || !validityDate}
              style={{ height: 40, padding: '0 18px' }}
            >
              {createProposal.isPending
                ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" style={{ marginRight: 6 }} />
                : <Sparkles size={14} strokeWidth={1.5} style={{ marginRight: 6 }} />}
              Criar Proposta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
