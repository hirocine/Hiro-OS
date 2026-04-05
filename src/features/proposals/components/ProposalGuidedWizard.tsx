import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles, Loader2, ArrowRight, ArrowLeft, Check,
  Building2, Target, FileText, Package, DollarSign,
  CalendarIcon, Plus, Trash2, MessageSquare, Video,
  ListChecks, MessageSquareQuote, Paperclip, FileIcon, X
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

const extractVimeoId = (raw: string): string => {
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return raw;
  const match = raw.match(/(\d{6,})/);
  return match ? match[1] : raw;
};
import type { DiagnosticoDor, EntregavelItem, InclusoCategory, InclusoItem, ProposalCase } from '../types';
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

// ── Payment presets ──
const PAYMENT_PRESETS = [
  { value: '50_50', label: '50% + 50%', text: '50% no fechamento do projeto mediante contrato e os outros 50% na entrega do material final' },
  { value: '100_antecipado', label: '100% antecipado', text: '100% antecipado com 5% de desconto sobre o valor final' },
  { value: '3x', label: '3x iguais', text: '3 parcelas iguais: 1ª no fechamento, 2ª na metade do projeto e 3ª na entrega do material final' },
  { value: 'custom', label: 'Personalizado', text: '' },
];

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

export function ProposalGuidedWizard() {
  const navigate = useNavigate();
  const { createProposal } = useProposals();
  const {
    enrichClient, parseTranscript, suggestPainPoints, analyzeTranscript, finalizeTranscript,
    isEnriching, isParsing, isSuggesting, isAnalyzing, isFinalizing,
  } = useProposalAI();
  const { data: painPointsBank = [] } = usePainPoints();
  const { data: casesBank = [], createCase } = useProposalCases();
  const { data: testimonialsBank = [], createTestimonial } = useTestimonials();

  // ── State ──
  const [step, setStep] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [skippedBriefing, setSkippedBriefing] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);

  // Sub-step state for questions within step 0
  const [showQuestions, setShowQuestions] = useState(false);
  const [analyzeResultState, setAnalyzeResultState] = useState<AnalyzeResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Form data
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [clientResponsible, setClientResponsible] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [dores, setDores] = useState<DiagnosticoDor[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [entregaveis, setEntregaveis] = useState<EntregavelItem[]>([]);
  const [validityDate, setValidityDate] = useState<Date | undefined>(undefined);
  const [listPrice, setListPrice] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('50% no fechamento do projeto mediante contrato e os outros 50% na entrega do material final');
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
  // Payment preset
  const [paymentPreset, setPaymentPreset] = useState('50_50');
  // PDF upload ref
  const pdfInputRef = useRef<HTMLInputElement>(null);
  // Track AI-filled fields
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);

  const finalValue = listPrice * (1 - discountPct / 100);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

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
        payment_terms: paymentTerms,
        testimonial_name: testimonialName,
        testimonial_role: testimonialRole,
        testimonial_text: testimonialText,
        testimonial_image: testimonialImage,
      });
      setGeneratedSlug(result.slug);
    } catch (err) {
      // handled by mutation
    }
  };

  const aiBadge = (field: string) =>
    aiFilledFields.has(field) ? (
      <Badge variant="outline" className="text-xs gap-1 font-normal ml-2">
        <Sparkles className="h-3 w-3" /> IA
      </Badge>
    ) : null;

  // ── Success screen ──
  if (generatedSlug) {
    const publicUrl = `${window.location.origin}/orcamento/${generatedSlug}`;
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Proposta Criada!</h2>
        <p className="text-muted-foreground">O link público está pronto para compartilhar com o cliente.</p>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Link da proposta:</p>
          <p className="text-sm font-mono break-all text-foreground">{publicUrl}</p>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(publicUrl).then(() => toast.success('Link copiado!'))}>
            Copiar Link
          </Button>
          <Button onClick={() => window.open(`/orcamento/${generatedSlug}`, '_blank')}>
            Ver Proposta
          </Button>
          <Button variant="secondary" onClick={() => navigate('/orcamentos')}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // ── Step navigation ──
  const goNext = () => setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  const goBack = () => setStep(prev => Math.max(prev - 1, 0));

  const isLoadingAI = isAnalyzing || isFinalizing || isEnriching;

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      {/* ── Stepper ── */}
      {step > 0 && (
        <div className="flex items-center gap-1 overflow-hidden" style={{ scrollbarWidth: 'none' }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={s.key}
                onClick={() => i < step && setStep(i)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs whitespace-nowrap',
                  isActive ? 'bg-primary/10 text-primary font-medium' :
                  isDone ? 'cursor-pointer hover:bg-muted text-muted-foreground' :
                  'opacity-40 text-muted-foreground'
                )}
                disabled={i > step}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
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
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Nova Proposta</h1>
              <p className="text-sm text-muted-foreground">Cole o briefing e deixe a IA preencher sua proposta</p>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8 py-8">

          {isLoadingAI ? (
            <div className="w-full max-w-2xl space-y-4 animate-fade-in">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-12 rounded-lg w-2/3 mx-auto" />
              <p className="text-sm text-muted-foreground text-center animate-pulse">
                {activeLoadingMessages[loadingMsg % activeLoadingMessages.length]}
              </p>
            </div>
          ) : (
            <>
              {attachedFile && (
                <div className="w-full max-w-2xl mb-4">
                  <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/50 max-w-xs">
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{attachedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(attachedFile.size / (1024 * 1024)).toFixed(2)}MB · {attachedFile.name.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                    <button onClick={() => setAttachedFile(null)} className="flex-shrink-0 p-1 rounded-md hover:bg-muted">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}
              <div className="w-full max-w-2xl">
                <div className="rounded-xl border border-border bg-background flex flex-col">
                  <Textarea
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    placeholder="Cole aqui o resumo da reunião do Google Meet, transcrição ou briefing do projeto..."
                    className="min-h-[280px] text-sm border-0 focus-visible:ring-0 scrollbar-thin resize-none rounded-b-none"
                  />
                  <div className="flex items-center justify-end gap-2 p-3 border-t border-border">
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                      onClick={() => pdfInputRef.current?.click()}
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Anexar</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAnalyzeBriefing}
                      disabled={(!transcript.trim() && !attachedFile) || isExtractingPdf}
                      className="gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Analisar
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-left mt-2">
                  No Google Meet, vá em Transcrições → Resumo e copie o conteúdo completo
                </p>
              </div>

              <button
                onClick={() => { setSkippedBriefing(true); setStep(1); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Quero preencher manualmente →
              </button>
            </>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <Sparkles className="h-3 w-3" />
            <span>Powered by Claude · Anthropic</span>
          </div>
          </div>
        </div>
      )}

      {/* ── Sub-step: Questions (within step 0) ── */}
      {step === 0 && showQuestions && analyzeResultState && (
        <div className="flex flex-col items-center min-h-[60vh] space-y-8 py-12">
          {isLoadingAI ? (
            <div className="w-full max-w-2xl space-y-4 py-12 animate-fade-in">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-10 rounded-lg w-1/2 mx-auto" />
              <p className="text-sm text-muted-foreground text-center animate-pulse">
                {activeLoadingMessages[loadingMsg % activeLoadingMessages.length]}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-3 max-w-lg animate-fade-in">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Algumas dúvidas</h2>
                <p className="text-sm text-muted-foreground">
                  {analyzeResultState.confirmed.summary}
                </p>
              </div>

              <div className="w-full max-w-2xl space-y-4">
                {analyzeResultState.questions.map((q, i) => (
                  <div
                    key={q.id}
                    className="animate-in fade-in slide-in-from-bottom-4"
                    style={{ opacity: 0, animationDelay: `${i * 200}ms`, animationFillMode: 'forwards' }}
                  >
                    <Card>
                      <CardContent className="pt-5 pb-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{q.emoji}</span>
                          <p className="text-sm font-semibold text-foreground pt-1">{q.text}</p>
                        </div>
                        <div className="flex flex-col gap-2 pl-10">
                          {q.options.map(opt => {
                            const isSelected = answers[q.id] === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                                className={cn(
                                  'text-left rounded-lg border px-4 py-3 transition-all',
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted/50'
                                )}
                              >
                                <p className={cn('text-sm', isSelected ? 'font-medium text-foreground' : 'text-foreground')}>
                                  {opt.label}
                                </p>
                                {opt.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setShowQuestions(false); setAnalyzeResultState(null); setAnswers({}); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Voltar ao briefing
                </button>
                <Button
                  size="lg"
                  onClick={handleContinueFromQuestions}
                  disabled={!allQuestionsAnswered}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Continuar
                </Button>
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
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Dados do Projeto</h2>
            {!skippedBriefing && (
              <p className="text-sm text-muted-foreground">
                Identifiquei as informações do projeto. Confira se está tudo certo:
              </p>
            )}
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nº do Projeto</Label>
                  <Input value={projectNumber} onChange={e => setProjectNumber(e.target.value)} placeholder="Ex: 001" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center">Nome do Cliente {aiBadge('client_name')}</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex: Cacau Show" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center">Nome do Projeto {aiBadge('project_name')}</Label>
                  <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Ex: Campanha Natal 2026" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center">Responsável {aiBadge('client_responsible')}</Label>
                  <Input value={clientResponsible} onChange={e => setClientResponsible(e.target.value)} placeholder="Ex: João Silva" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">WhatsApp para Aprovação</Label>
                  <Input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="+55 (11) 95151-3862" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Validade da Proposta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !validityDate && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {validityDate ? format(validityDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={validityDate} onSelect={setValidityDate} locale={ptBR} /></PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center">Descrição da empresa {aiBadge('company_description')}</Label>
                  {!aiFilledFields.has('company_description') && clientName.trim() && (
                    <Button variant="outline" size="sm" disabled={isEnriching} onClick={async () => {
                      const desc = await enrichClient(clientName);
                      if (desc) {
                        setCompanyDescription(desc);
                        setAiFilledFields(prev => new Set([...prev, 'company_description']));
                        toast.success('Descrição preenchida!');
                      }
                    }}>
                      {isEnriching ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                      Buscar com IA
                    </Button>
                  )}
                </div>
                <Textarea value={companyDescription} onChange={e => setCompanyDescription(e.target.value)} rows={3} placeholder="Descrição breve da empresa do cliente..." />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
            <Button onClick={goNext} disabled={!clientName.trim() || !projectName.trim()}>
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 2 — OBJETIVO
         ══════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Objetivo do Projeto</h2>
            <p className="text-sm text-muted-foreground">
              {aiFilledFields.has('objetivo')
                ? 'Com base no briefing, sugiro este objetivo. Edite como quiser:'
                : 'Descreva o objetivo estratégico do projeto:'}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center">Objetivo {aiBadge('objetivo')}</Label>
                <Textarea value={objetivo} onChange={e => setObjetivo(e.target.value)} rows={10} placeholder="O objetivo deste projeto é desenvolver..." className="scrollbar-thin" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
            <Button onClick={goNext}>Continuar <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 3 — DORES DO CLIENTE
         ══════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Dores do Cliente</h2>
                <p className="text-sm text-muted-foreground">
                  {aiFilledFields.has('dores')
                    ? 'Identifiquei essas dores a partir do briefing. Você pode editar ou selecionar do banco:'
                    : 'Selecione até 3 dores do banco ou peça sugestões à IA:'}
                </p>
              </div>
              <Button variant="outline" size="sm" disabled={isSuggesting} onClick={handleSuggestDores}>
                {isSuggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Sugerir com IA
              </Button>
            </div>
          </div>

          {/* Selected dores */}
          {dores.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Dores selecionadas ({dores.length}/3)</Label>
              {dores.map((dor, i) => (
                <Card key={i} className="border-primary/30">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-lg hover:bg-muted rounded p-0.5 transition-colors" title="Trocar emoji">{dor.label}</button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-3" align="start">
                              <div className="grid grid-cols-6 gap-1">
                                {DOR_EMOJI_OPTIONS.map(opt => (
                                  <button
                                    key={opt.value}
                                    className={cn('text-lg p-1.5 rounded hover:bg-muted transition-colors', dor.label === opt.value && 'bg-primary/10')}
                                    onClick={() => { const u = [...dores]; u[i] = { ...u[i], label: opt.value }; setDores(u); }}
                                    title={opt.label}
                                  >
                                    {opt.value}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Input value={dor.title} onChange={e => {
                            const u = [...dores]; u[i] = { ...u[i], title: e.target.value }; setDores(u);
                          }} className="text-sm font-medium h-8" />
                        </div>
                        <Textarea value={dor.desc} onChange={e => {
                          const u = [...dores]; u[i] = { ...u[i], desc: e.target.value }; setDores(u);
                        }} rows={2} className="text-sm scrollbar-thin" />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setDores(dores.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {aiFilledFields.has('dores') && <Badge variant="outline" className="text-xs gap-1 mt-2"><Sparkles className="h-3 w-3" /> Sugerido pela IA</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Bank of pain points */}
          {painPointsBank.length > 0 && dores.length < 3 && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Banco de dores</Label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto scrollbar-thin">
                {painPointsBank.filter(pp => !dores.find(d => d.title === pp.title)).map(pp => (
                  <button
                    key={pp.id}
                    onClick={() => toggleBankDor(pp)}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    <span>{pp.label}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{pp.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{pp.description}</p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
            <Button onClick={goNext}>Continuar <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 4 — CASES / PORTFÓLIO
         ══════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Portfólio / Cases</h2>
            <p className="text-sm text-muted-foreground">Selecione cases do portfólio para incluir na proposta:</p>
          </div>

          {casesBank.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {casesBank.map(c => {
                const isSelected = selectedCaseIds.includes(c.id);
                return (
                   <button
                    key={c.id}
                    onClick={() => toggleCase(c.id)}
                    className={cn(
                      'relative flex items-center gap-3 p-3 rounded-lg border transition-all text-left',
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <Checkbox checked={isSelected} className="absolute top-2 right-2 z-10" />
                    {c.vimeo_id ? (
                      <>
                        <img
                          src={`https://vumbnail.com/${extractVimeoId(c.vimeo_id)}.jpg`}
                          alt={c.campaign_name}
                          className="w-28 aspect-video rounded-lg object-cover bg-muted flex-shrink-0"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = '1';
                              target.src = `https://i.vimeocdn.com/video/${extractVimeoId(c.vimeo_id)}_640x360.jpg`;
                            } else {
                              target.style.display = 'none';
                              (target.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                            }
                          }}
                        />
                        <div className="hidden w-28 aspect-video rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Video className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </>
                    ) : (
                      <div className="w-28 aspect-video rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Video className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.client_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.campaign_name}</p>
                      {c.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {c.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum case cadastrado no banco.</p>
          )}

          <Button variant="outline" className="w-full gap-2" onClick={() => setShowNewCaseDialog(true)}>
            <Plus className="h-4 w-4" /> Criar novo case
          </Button>

          {/* New Case Dialog */}
          <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Case</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome do Cliente *</Label>
                  <Input value={newCase.client_name} onChange={e => setNewCase(p => ({ ...p, client_name: e.target.value }))} placeholder="Ex: Empresa X" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome da Campanha *</Label>
                  <Input value={newCase.campaign_name} onChange={e => setNewCase(p => ({ ...p, campaign_name: e.target.value }))} placeholder="Ex: Campanha de Verão" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">URL do Vimeo *</Label>
                  <Input value={newCase.vimeo_url} onChange={e => setNewCase(p => ({ ...p, vimeo_url: e.target.value }))} placeholder="https://vimeo.com/123456789" />
                  {newCase.vimeo_url && parseVimeoUrl(newCase.vimeo_url) && (
                    <img
                      src={`https://vumbnail.com/${parseVimeoUrl(newCase.vimeo_url)!.vimeo_id}.jpg`}
                      alt="Preview"
                      className="w-full aspect-video rounded object-cover bg-muted mt-2"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {CASE_TAG_OPTIONS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setNewCase(p => ({
                          ...p,
                          tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag],
                        }))}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full border transition-colors',
                          newCase.tags.includes(tag) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowNewCaseDialog(false)}>Cancelar</Button>
                <Button onClick={handleCreateCase} disabled={createCase.isPending}>
                  {createCase.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Criar Case
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
            <Button onClick={goNext}>Continuar <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 5 — ENTREGÁVEIS
         ══════════════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Entregáveis</h2>
            <p className="text-sm text-muted-foreground">
              {aiFilledFields.has('entregaveis')
                ? 'Identifiquei esses entregáveis no briefing. Ajuste e adicione mais:'
                : 'Defina os entregáveis da proposta:'}
            </p>
          </div>

          <div className="space-y-3">
            {entregaveis.map((ent, i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
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
                      <Input value={ent.quantidade} onChange={e => updateEntregavel(i, 'quantidade', e.target.value)} placeholder="Qtd" className="h-8 text-sm text-center" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeEntregavel(i)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <Textarea value={ent.descricao} onChange={e => updateEntregavel(i, 'descricao', e.target.value)} placeholder="Descrição breve..." rows={2} className="mt-2 text-sm" />
                  {aiFilledFields.has('entregaveis') && <Badge variant="outline" className="text-xs gap-1 mt-2"><Sparkles className="h-3 w-3" /> IA</Badge>}
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addEntregavel} className="w-full gap-1">
              <Plus className="h-4 w-4" /> Adicionar Entregável
            </Button>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
            <Button onClick={goNext}>Continuar <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 6 — SERVIÇOS INCLUSOS
         ══════════════════════════════════════════════════════════════ */}
      {step === 6 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Serviços Inclusos</h2>
            <p className="text-sm text-muted-foreground">Selecione os serviços inclusos nesta proposta</p>
          </div>

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
                <div key={cat.categoria} className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{emoji}</span>
                      <h3 className="text-sm font-semibold">{cat.categoria}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">{activeCount}/{totalCount}</Badge>
                  </div>

                  {/* Flat items (Pré-produção, Pós-produção) */}
                  {cat.itens && (
                    <div className="space-y-1">
                      {cat.itens.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
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
                            <span className="text-sm flex-1">{item.nome}</span>
                          )}
                          {item.ativo && 'quantidade' in item && (
                            <Input
                              value={item.quantidade || ''}
                              onChange={e => updateInclusoQuantidade(catIdx, null, itemIdx, e.target.value)}
                              placeholder="Qtd"
                              className="h-7 w-16 text-sm text-center"
                            />
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addCustomInclusoItem(catIdx, null)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                      >
                        <Plus className="h-3 w-3" /> Adicionar item
                      </button>
                    </div>
                  )}

                  {/* Subcategories (Gravação) */}
                  {cat.subcategorias && cat.subcategorias.map((sub, subIdx) => (
                    <div key={sub.nome} className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 pt-1">{sub.nome}</p>
                      {sub.itens.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
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
                            <span className="text-sm flex-1">{item.nome}</span>
                          )}
                          {item.ativo && 'quantidade' in item && (
                            <Input
                              value={item.quantidade || ''}
                              onChange={e => updateInclusoQuantidade(catIdx, subIdx, itemIdx, e.target.value)}
                              placeholder="Qtd"
                              className="h-7 w-16 text-sm text-center"
                            />
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addCustomInclusoItem(catIdx, subIdx)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                      >
                        <Plus className="h-3 w-3" /> Adicionar item
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
            <Button onClick={goNext}>Continuar <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 7 — DEPOIMENTO
         ══════════════════════════════════════════════════════════════ */}
      {step === 7 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Depoimento</h2>
            <p className="text-sm text-muted-foreground">Escolha um depoimento de cliente para incluir na proposta</p>
          </div>

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
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-lg border transition-all text-left',
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      )}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        {t.image && <AvatarImage src={t.image} />}
                        <AvatarFallback className="text-xs">{t.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.text}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={() => setShowNewTestimonialDialog(true)}>
                <Plus className="h-4 w-4" /> Criar novo depoimento
              </Button>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm text-muted-foreground">Nenhum depoimento cadastrado. Preencha manualmente:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nome</Label>
                      <Input value={testimonialName} onChange={e => setTestimonialName(e.target.value)} placeholder="Ex: João Silva" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cargo</Label>
                      <Input value={testimonialRole} onChange={e => setTestimonialRole(e.target.value)} placeholder="Ex: CEO, Empresa X" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Depoimento</Label>
                    <Textarea value={testimonialText} onChange={e => setTestimonialText(e.target.value)} rows={3} placeholder="O que o cliente disse..." className="scrollbar-thin" />
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full gap-2" onClick={() => setShowNewTestimonialDialog(true)}>
                <Plus className="h-4 w-4" /> Criar novo depoimento
              </Button>
            </>
          )}

          {/* New Testimonial Dialog */}
          <Dialog open={showNewTestimonialDialog} onOpenChange={setShowNewTestimonialDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Depoimento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nome *</Label>
                    <Input value={newTestimonial.name} onChange={e => setNewTestimonial(p => ({ ...p, name: e.target.value }))} placeholder="Ex: João Silva" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cargo</Label>
                    <Input value={newTestimonial.role} onChange={e => setNewTestimonial(p => ({ ...p, role: e.target.value }))} placeholder="Ex: CEO, Empresa X" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Depoimento *</Label>
                  <Textarea value={newTestimonial.text} onChange={e => setNewTestimonial(p => ({ ...p, text: e.target.value }))} rows={3} placeholder="O que o cliente disse..." className="scrollbar-thin" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">URL da foto (opcional)</Label>
                  <Input value={newTestimonial.image} onChange={e => setNewTestimonial(p => ({ ...p, image: e.target.value }))} placeholder="https://..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowNewTestimonialDialog(false)}>Cancelar</Button>
                <Button onClick={handleCreateTestimonial} disabled={createTestimonial.isPending}>
                  {createTestimonial.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Criar Depoimento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
            <Button onClick={goNext}>Continuar <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 8 — INVESTIMENTO
         ══════════════════════════════════════════════════════════════ */}
      {step === 8 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Investimento</h2>
            <p className="text-sm text-muted-foreground">Defina os valores e condições de pagamento:</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor de Tabela (R$)</Label>
                  <Input type="number" value={listPrice || ''} onChange={e => setListPrice(parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Desconto (%)</Label>
                  <Input type="number" value={discountPct || ''} onChange={e => setDiscountPct(parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <span className="text-sm text-muted-foreground">Valor Final</span>
                <span className="text-xl font-bold">{fmt(finalValue)}</span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Condições de Pagamento</Label>
                <Select value={paymentPreset} onValueChange={(v) => {
                  setPaymentPreset(v);
                  const preset = PAYMENT_PRESETS.find(p => p.value === v);
                  if (preset && v !== 'custom') setPaymentTerms(preset.text);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_PRESETS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  rows={3}
                  readOnly={paymentPreset !== 'custom'}
                  className={cn('scrollbar-thin', paymentPreset !== 'custom' && 'opacity-60')}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
            <Button onClick={goNext}>Revisar Proposta <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 9 — REVISÃO FINAL
         ══════════════════════════════════════════════════════════════ */}
      {step === 9 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Revisão Final</h2>
            <p className="text-sm text-muted-foreground">Tudo pronto! Revise e crie sua proposta:</p>
          </div>

          <div className="space-y-3">
            {/* Client */}
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setStep(1)}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="text-sm font-medium">{clientName || '—'} · {projectName || '—'}</p>
                  {clientResponsible && <p className="text-xs text-muted-foreground">Resp: {clientResponsible}</p>}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Objetivo */}
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setStep(2)}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Objetivo</p>
                  <p className="text-sm line-clamp-2">{objetivo || '—'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Dores */}
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setStep(3)}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Dores ({dores.length})</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {dores.map((d, i) => (
                      <Badge key={i} variant="outline" className="text-xs whitespace-nowrap">{d.label} {d.title}</Badge>
                    ))}
                    {dores.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma dor selecionada</p>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Cases */}
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setStep(4)}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Cases ({selectedCaseIds.length})</p>
                  <p className="text-sm">{selectedCaseIds.length > 0 ? `${selectedCaseIds.length} case(s) selecionado(s)` : 'Nenhum case selecionado'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Entregáveis */}
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setStep(5)}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Entregáveis ({entregaveis.length})</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {entregaveis.map((e, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{e.icone} {e.titulo || 'Sem nome'}</Badge>
                    ))}
                    {entregaveis.length === 0 && <p className="text-sm text-muted-foreground">Nenhum entregável</p>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Serviços Inclusos */}
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setStep(6)}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Serviços Inclusos</p>
                  <p className="text-sm">{countActiveInclusos()}/{totalInclusoItems()} serviços selecionados</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Depoimento */}
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setStep(7)}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Depoimento</p>
                  <p className="text-sm">{testimonialName ? `${testimonialName} — ${testimonialRole}` : 'Nenhum depoimento'}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>

            {/* Investimento */}
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setStep(8)}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Investimento</p>
                  <p className="text-sm font-bold">{fmt(finalValue)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
            <Button
              size="lg"
              onClick={handleCreateProposal}
              disabled={createProposal.isPending || !clientName.trim() || !projectName.trim() || !validityDate}
              className="gap-2"
            >
              {createProposal.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Criar Proposta
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
