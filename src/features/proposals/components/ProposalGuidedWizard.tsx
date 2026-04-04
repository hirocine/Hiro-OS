import { useState, useEffect, useMemo } from 'react';
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
import {
  Sparkles, Loader2, ArrowRight, ArrowLeft, Check,
  Building2, Target, FileText, Package, DollarSign,
  CalendarIcon, Plus, Trash2, MessageSquare, Video,
  ListChecks, MessageSquareQuote
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { DiagnosticoDor, EntregavelItem, InclusoCategory, InclusoItem } from '../types';
import { ICON_OPTIONS, DEFAULT_INCLUSO_CATEGORIES } from '../types';

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
  const { data: casesBank = [] } = useProposalCases();
  const { data: testimonialsBank = [] } = useTestimonials();

  // ── State ──
  const [step, setStep] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [skippedBriefing, setSkippedBriefing] = useState(false);

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
    if (!transcript.trim()) return;

    try {
      const result = await analyzeTranscript(transcript);
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

  const addEntregavel = () => setEntregaveis([...entregaveis, { titulo: '', descricao: '', quantidade: '1', icone: '🎬' }]);
  const removeEntregavel = (idx: number) => setEntregaveis(entregaveis.filter((_, i) => i !== idx));
  const updateEntregavel = (idx: number, field: keyof EntregavelItem, value: string) => {
    const u = [...entregaveis]; u[idx] = { ...u[idx], [field]: value }; setEntregaveis(u);
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
        incluso_categories: JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES)),
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
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
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
                <Icon className="h-3.5 w-3.5" />
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 py-12">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Vamos criar sua proposta</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Cole o resumo da reunião gerado pelo Google Meet e deixe a IA fazer o trabalho pesado.
            </p>
          </div>

          <div className="w-full max-w-2xl space-y-3">
            <Textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Cole aqui o resumo da reunião do Google Meet..."
              className="min-h-[240px] text-sm"
            />
            <p className="text-xs text-muted-foreground text-center">
              No Google Meet, vá em Transcrições → Resumo e copie o conteúdo completo
            </p>
          </div>

          {isLoadingAI ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">
                {activeLoadingMessages[loadingMsg % activeLoadingMessages.length]}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                onClick={handleAnalyzeBriefing}
                disabled={!transcript.trim()}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Analisar Briefing
              </Button>
              <button
                onClick={() => { setSkippedBriefing(true); setStep(1); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Quero preencher manualmente →
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <Sparkles className="h-3 w-3" />
            <span>Powered by Claude · Anthropic</span>
          </div>
        </div>
      )}

      {/* ── Sub-step: Questions (within step 0) ── */}
      {step === 0 && showQuestions && analyzeResultState && (
        <div className="flex flex-col items-center min-h-[60vh] space-y-8 py-12">
          {isLoadingAI ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">
                {activeLoadingMessages[loadingMsg % activeLoadingMessages.length]}
              </p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-3 max-w-lg">
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
                    style={{ animationDelay: `${i * 200}ms`, animationFillMode: 'backwards' }}
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
                <Textarea value={objetivo} onChange={e => setObjetivo(e.target.value)} rows={10} placeholder="O objetivo deste projeto é desenvolver..." />
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
                          <span className="text-lg">{dor.label}</span>
                          <Input value={dor.title} onChange={e => {
                            const u = [...dores]; u[i] = { ...u[i], title: e.target.value }; setDores(u);
                          }} className="text-sm font-medium h-8" />
                        </div>
                        <Textarea value={dor.desc} onChange={e => {
                          const u = [...dores]; u[i] = { ...u[i], desc: e.target.value }; setDores(u);
                        }} rows={2} className="text-sm" />
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
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
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
                      'flex items-start gap-3 p-4 rounded-lg border transition-all text-left',
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <Checkbox checked={isSelected} className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.client_name}</p>
                      <p className="text-xs text-muted-foreground">{c.campaign_name}</p>
                      {c.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {c.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
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
                      <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
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
          STEP 6 — INVESTIMENTO
         ══════════════════════════════════════════════════════════════ */}
      {step === 6 && (
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
                <Textarea value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} rows={3} />
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
          STEP 7 — REVISÃO FINAL
         ══════════════════════════════════════════════════════════════ */}
      {step === 7 && (
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
                <div>
                  <p className="text-xs text-muted-foreground">Dores ({dores.length})</p>
                  <div className="flex gap-1 mt-1">
                    {dores.map((d, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{d.label} {d.title}</Badge>
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

            {/* Investimento */}
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setStep(6)}>
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
