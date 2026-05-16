import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  CalendarIcon, Plus, Trash2, ArrowLeft, ArrowRight, Loader2, Check,
  Building2, Target, Video, DollarSign, Package, ListChecks,
  Phone, Sparkles, Camera, Upload, X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const extractVimeoId = (raw: string): string => {
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return raw;
  const match = raw.match(/(\d{6,})/);
  return match ? match[1] : raw;
};
import { useProposals } from '../hooks/useProposals';
import { usePainPoints } from '../hooks/usePainPoints';
import { useProposalCases } from '../hooks/useProposalCases';
import { useProposalAI } from '../hooks/useProposalAI';
import { formatMoney } from '@/ds/lib/money';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  defaultFormData,
  ICON_OPTIONS,
  CASE_TAG_OPTIONS,
  type ProposalFormData,
  type EntregavelItem,
  type DiagnosticoDor,
  type InclusoItem,
} from '../types';

const STEPS = [
  { label: 'Cliente', icon: Building2 },
  { label: 'Diagnóstico', icon: Target },
  { label: 'Portfólio', icon: Video },
  { label: 'Entregáveis', icon: Package },
  { label: 'Incluso', icon: ListChecks },
  { label: 'Investimento', icon: DollarSign },
];

const eyebrowLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const displayTitle: React.CSSProperties = {
  fontFamily: '"HN Display", sans-serif',
};

export function ProposalWizard() {
  const navigate = useNavigate();
  const { createProposal } = useProposals();
  const { data: painPoints = [], createPainPoint } = usePainPoints();
  const { data: casesBank = [], createCase } = useProposalCases();
  const { enrichClient, parseTranscript, suggestPainPoints, isEnriching, isParsing, isSuggesting } = useProposalAI();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProposalFormData>({ ...defaultFormData });
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // New pain point inline form
  const [showNewPain, setShowNewPain] = useState(false);
  const [newPain, setNewPain] = useState<DiagnosticoDor>({ label: '', title: '', desc: '' });

  // Transcript modal
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');

  const [showNewCase, setShowNewCase] = useState(false);
  const [newCase, setNewCase] = useState({ tags: [] as string[], client_name: '', campaign_name: '', vimeo_url: '', destaque: false });

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
      updateField('client_logo', urlData.publicUrl);
    } catch (err) {
      console.error('Logo upload error:', err);
      import('sonner').then(m => m.toast.error('Erro ao enviar logo'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const parseVimeoUrl = (url: string): { id: string; hash: string } => {
    const match = url.match(/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/);
    const hashMatch = url.match(/[?&]h=([a-zA-Z0-9]+)/);
    return {
      id: match?.[1] || '',
      hash: hashMatch?.[1] || match?.[2] || '',
    };
  };

  const updateField = <K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const result = await createProposal.mutateAsync(form);
    setGeneratedSlug(result.slug);
  };

  const canGoNext = () => {
    if (step === 0) return form.client_name.trim() && form.project_name.trim() && form.validity_date;
    return true;
  };

  const listPrice = form.list_price || 0;
  const finalValue = listPrice * (1 - (form.discount_pct || 0) / 100);
  const fmt = (v: number) => formatMoney(v);

  // Pain point selection helpers
  const selectedDores = form.diagnostico_dores;
  const togglePainPoint = (pp: { label: string; title: string; description: string }) => {
    const exists = selectedDores.find(d => d.title === pp.title);
    if (exists) {
      updateField('diagnostico_dores', selectedDores.filter(d => d.title !== pp.title));
    } else if (selectedDores.length < 3) {
      updateField('diagnostico_dores', [...selectedDores, { label: pp.label, title: pp.title, desc: pp.description }]);
    }
  };

  // Case selection helpers
  const toggleCase = (id: string) => {
    const ids = form.selected_case_ids;
    if (ids.includes(id)) {
      updateField('selected_case_ids', ids.filter(x => x !== id));
    } else {
      updateField('selected_case_ids', [...ids, id]);
    }
  };

  // Entregavel helpers
  const addEntregavel = () => updateField('entregaveis', [...form.entregaveis, { titulo: '', descricao: '', quantidade: '1', icone: '🎬' }]);
  const removeEntregavel = (idx: number) => updateField('entregaveis', form.entregaveis.filter((_, i) => i !== idx));
  const updateEntregavel = (idx: number, field: keyof EntregavelItem, value: string) => {
    const u = [...form.entregaveis]; u[idx] = { ...u[idx], [field]: value }; updateField('entregaveis', u);
  };

  // Incluso helpers
  const toggleInclusoItem = (catIdx: number, itemIdx: number, subIdx?: number) => {
    const cats = JSON.parse(JSON.stringify(form.incluso_categories));
    if (subIdx !== undefined) {
      const item = cats[catIdx].subcategorias![subIdx].itens[itemIdx];
      item.ativo = !item.ativo;
    } else {
      const item = cats[catIdx].itens![itemIdx];
      item.ativo = !item.ativo;
    }
    updateField('incluso_categories', cats);
  };

  const updateInclusoQuantidade = (catIdx: number, itemIdx: number, value: string, subIdx?: number) => {
    const cats = JSON.parse(JSON.stringify(form.incluso_categories));
    if (subIdx !== undefined) {
      cats[catIdx].subcategorias![subIdx].itens[itemIdx].quantidade = value;
    } else {
      cats[catIdx].itens![itemIdx].quantidade = value;
    }
    updateField('incluso_categories', cats);
  };

  const addCustomInclusoItem = (catIdx: number, nome: string, subIdx?: number) => {
    const cats = JSON.parse(JSON.stringify(form.incluso_categories));
    const newItem: InclusoItem = { nome, ativo: true, custom: true };
    if (subIdx !== undefined) {
      cats[catIdx].subcategorias![subIdx].itens.push(newItem);
    } else {
      cats[catIdx].itens!.push(newItem);
    }
    updateField('incluso_categories', cats);
  };

  // Custom item inline state
  const [customItemInput, setCustomItemInput] = useState<{ catIdx: number; subIdx?: number; value: string } | null>(null);

  // ── Success screen ──
  if (generatedSlug) {
    const publicUrl = `${window.location.origin}/orcamento/${generatedSlug}`;
    return (
      <div className="max-w-lg mx-auto py-16 text-center" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            height: 64,
            width: 64,
            borderRadius: '50%',
            background: 'hsl(var(--ds-success) / 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <Check size={32} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-success))' }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'hsl(var(--ds-fg-1))', ...displayTitle }}>
          Proposta Gerada!
        </h2>
        <p style={{ color: 'hsl(var(--ds-fg-3))' }}>
          O link público está pronto para ser compartilhado com o cliente.
        </p>
        <div
          style={{
            background: 'hsl(var(--ds-line-2) / 0.3)',
            border: '1px solid hsl(var(--ds-line-1))',
            padding: 16,
          }}
        >
          <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginBottom: 4 }}>
            Link da proposta:
          </p>
          <p
            style={{
              fontSize: 13,
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              color: 'hsl(var(--ds-fg-1))',
            }}
          >
            {publicUrl}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={() => navigator.clipboard.writeText(publicUrl).then(() => import('sonner').then(m => m.toast.success('Link copiado!')))}
          >
            Copiar Link
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => window.open(`/orcamento/${generatedSlug}?v=${Date.now()}`, '_blank')}
          >
            Ver Proposta
          </button>
          <button type="button" className="btn" onClick={() => navigate('/orcamentos')}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <button
              key={s.label}
              onClick={() => i < step && setStep(i)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '8px 4px',
                background: isActive ? 'hsl(var(--ds-accent) / 0.1)' : 'transparent',
                border: 'none',
                cursor: i < step ? 'pointer' : 'default',
                opacity: i > step ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
              disabled={i > step}
            >
              <div
                style={{
                  height: 32,
                  width: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: i <= step ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-line-2) / 0.3)',
                  color: i <= step ? 'hsl(var(--ds-bg))' : 'hsl(var(--ds-fg-3))',
                }}
              >
                {isDone ? <Check size={16} strokeWidth={1.5} /> : <Icon size={16} strokeWidth={1.5} />}
              </div>
              <span
                className="hidden sm:block"
                style={{
                  fontSize: 10,
                  fontWeight: i <= step ? 500 : 400,
                  color: i <= step ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          border: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface))',
        }}
      >
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ══ STEP 0 — CLIENTE E PROJETO ══ */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', ...displayTitle }}>
                  Cliente e Projeto
                </h3>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  Informações que aparecem no topo da proposta.
                </p>
              </div>
              {/* Logo Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                  <Avatar className="h-20 w-20" style={{ border: '1px solid hsl(var(--ds-line-1))' }}>
                    <AvatarImage src={form.client_logo || undefined} />
                    <AvatarFallback style={{ background: 'hsl(var(--ds-line-2) / 0.3)', color: 'hsl(var(--ds-fg-3))' }}>
                      <Building2 size={32} strokeWidth={1.5} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingLogo ? (
                      <Loader2 size={20} strokeWidth={1.5} className="text-white animate-spin" />
                    ) : (
                      <Camera size={20} strokeWidth={1.5} className="text-white" />
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>Logo do Cliente</p>
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>Aparece no card de gerenciamento</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                      <Upload size={13} strokeWidth={1.5} />
                      <span>{form.client_logo ? 'Alterar' : 'Enviar'}</span>
                    </button>
                    {form.client_logo && (
                      <button type="button" className="btn" onClick={() => updateField('client_logo', '')} disabled={uploadingLogo}>
                        <X size={13} strokeWidth={1.5} />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={eyebrowLabel}>Nome do Cliente *</label>
                  <Input value={form.client_name} onChange={e => updateField('client_name', e.target.value)} placeholder="Ex: Burger King" />
                </div>
                <div>
                  <label style={eyebrowLabel}>Nome do Projeto *</label>
                  <Input value={form.project_name} onChange={e => updateField('project_name', e.target.value)} placeholder="Ex: Campanha Verão 2026" />
                </div>
                <div>
                  <label style={eyebrowLabel}>Responsável</label>
                  <Input value={form.client_responsible} onChange={e => updateField('client_responsible', e.target.value)} placeholder="Nome do contato" />
                </div>
                <div>
                  <label style={eyebrowLabel}>WhatsApp</label>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={13}
                      strokeWidth={1.5}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'hsl(var(--ds-fg-3))',
                        pointerEvents: 'none',
                      }}
                    />
                    <Input
                      value={form.whatsapp_number}
                      onChange={e => updateField('whatsapp_number', e.target.value)}
                      placeholder="5511999999999"
                      style={{ paddingLeft: 32, fontVariantNumeric: 'tabular-nums' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={eyebrowLabel}>Data de Envio</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="btn"
                        style={{ width: '100%', justifyContent: 'flex-start', height: 40, fontVariantNumeric: 'tabular-nums' }}
                      >
                        <CalendarIcon size={14} strokeWidth={1.5} />
                        <span>{format(form.sent_date, "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.sent_date} onSelect={d => d && updateField('sent_date', d)} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                    Data da geração da proposta
                  </p>
                </div>
                <div>
                  <label style={eyebrowLabel}>Data de Validade *</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          height: 40,
                          fontVariantNumeric: 'tabular-nums',
                          color: !form.validity_date ? 'hsl(var(--ds-fg-3))' : undefined,
                        }}
                      >
                        <CalendarIcon size={14} strokeWidth={1.5} />
                        <span>
                          {form.validity_date ? format(form.validity_date, "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Selecione a data'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.validity_date} onSelect={d => updateField('validity_date', d)} disabled={date => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                    Aparece no countdown da proposta
                  </p>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ ...eyebrowLabel, marginBottom: 0 }}>Descrição da Empresa</label>
                  <button
                    type="button"
                    className="btn"
                    disabled={isEnriching || !form.client_name.trim()}
                    onClick={async () => {
                      try {
                        const desc = await enrichClient(form.client_name);
                        if (desc) {
                          updateField('company_description', desc);
                          toast.success('Descrição preenchida com IA!');
                        }
                      } catch (err) {
                        toast.error('Erro ao buscar descrição: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
                      }
                    }}
                  >
                    {isEnriching ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" /> : <Sparkles size={13} strokeWidth={1.5} />}
                    <span>Buscar com IA</span>
                  </button>
                </div>
                <Textarea
                  value={form.company_description}
                  onChange={e => updateField('company_description', e.target.value)}
                  rows={3}
                  placeholder="Ex: Produtora audiovisual especializada em criar narrativas visuais..."
                  className="text-sm"
                />
                <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                  Aparece como subtítulo no hero da proposta
                </p>
              </div>

              <Separator />

              <button
                type="button"
                className="btn"
                onClick={() => setShowTranscriptModal(true)}
                disabled={isParsing}
                style={{ alignSelf: 'flex-start' }}
              >
                {isParsing ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" /> : <Sparkles size={13} strokeWidth={1.5} />}
                <span>Importar Transcrição</span>
              </button>

              {/* Transcript Modal */}
              <Dialog open={showTranscriptModal} onOpenChange={setShowTranscriptModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] ds-shell">
                  <DialogHeader>
                    <DialogTitle>
                      <span style={displayTitle}>Importar Transcrição de Reunião</span>
                    </DialogTitle>
                  </DialogHeader>
                  <Textarea
                    value={transcriptText}
                    onChange={e => setTranscriptText(e.target.value)}
                    rows={12}
                    placeholder="Cole aqui a transcrição da reunião de briefing..."
                    className="text-sm"
                  />
                  <DialogFooter>
                    <button type="button" className="btn" onClick={() => setShowTranscriptModal(false)}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn primary"
                      disabled={isParsing || !transcriptText.trim()}
                      onClick={async () => {
                        try {
                          const result = await parseTranscript(transcriptText);
                          if (result.client_name) updateField('client_name', result.client_name);
                          if (result.project_name) updateField('project_name', result.project_name);
                          if (result.client_responsible) updateField('client_responsible', result.client_responsible);
                          if (result.objetivo) updateField('objetivo', result.objetivo);
                          if (result.diagnostico_dores && result.diagnostico_dores.length > 0) {
                            updateField('diagnostico_dores', result.diagnostico_dores.slice(0, 3));
                          }
                          if (result.entregaveis && result.entregaveis.length > 0) {
                            updateField('entregaveis', result.entregaveis);
                          }
                          setShowTranscriptModal(false);
                          setTranscriptText('');
                          toast.success('Transcrição processada! Campos preenchidos com sucesso.');
                        } catch (err) {
                          toast.error('Erro ao processar transcrição: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
                        }
                      }}
                    >
                      {isParsing ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : <Sparkles size={14} strokeWidth={1.5} />}
                      <span>Processar</span>
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ══ STEP 1 — DIAGNÓSTICO ══ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', ...displayTitle }}>
                  Diagnóstico
                </h3>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  O que o cliente precisa resolver? Esta seção gera a conexão emocional.
                </p>
              </div>

              <div>
                <label style={eyebrowLabel}>Objetivo Estratégico</label>
                <Textarea
                  value={form.objetivo}
                  onChange={e => updateField('objetivo', e.target.value)}
                  rows={6}
                  className="text-sm leading-relaxed"
                />
                <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                  Texto de abertura na seção "Sobre" da proposta
                </p>
              </div>

              <Separator />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
                      Dores do Cliente
                    </span>
                    <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                      ({selectedDores.length}/3)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    disabled={isSuggesting}
                    onClick={async () => {
                      try {
                        const dores = await suggestPainPoints(form.client_name, form.project_name, form.objetivo);
                        if (dores && dores.length > 0) {
                          updateField('diagnostico_dores', dores.slice(0, 3));
                          toast.success(`${dores.length} dores sugeridas pela IA!`);
                        }
                      } catch (err) {
                        toast.error('Erro ao sugerir dores: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
                      }
                    }}
                  >
                    {isSuggesting ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" /> : <Sparkles size={13} strokeWidth={1.5} />}
                    <span>Sugerir com IA</span>
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: -8 }}>
                  Selecione até 3 dores do banco ou adicione uma personalizada.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  {painPoints.map(pp => {
                    const isSelected = selectedDores.some(d => d.title === pp.title);
                    return (
                      <div
                        key={pp.id}
                        onClick={() => togglePainPoint(pp)}
                        style={{
                          border: isSelected
                            ? '1px solid hsl(var(--ds-accent) / 0.5)'
                            : '1px solid hsl(var(--ds-line-1))',
                          background: isSelected ? 'hsl(var(--ds-accent) / 0.05)' : 'transparent',
                          padding: 16,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <Checkbox checked={isSelected} className="mt-0.5" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span
                                className="pill"
                                style={{
                                  fontSize: 10,
                                  color: 'hsl(var(--ds-accent))',
                                  borderColor: 'hsl(var(--ds-accent) / 0.3)',
                                  background: 'hsl(var(--ds-accent) / 0.08)',
                                  letterSpacing: '0.14em',
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                }}
                              >
                                {pp.label}
                              </span>
                            </div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
                              {pp.title}
                            </p>
                            <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                              {pp.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add custom pain point */}
                {!showNewPain ? (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowNewPain(true)}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Plus size={14} strokeWidth={1.5} />
                    <span>Adicionar Personalizada</span>
                  </button>
                ) : (
                  <div
                    style={{
                      border: '1px dashed hsl(var(--ds-accent) / 0.5)',
                      padding: 16,
                      background: 'hsl(var(--ds-accent) / 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label style={eyebrowLabel}>Label</label>
                        <Input value={newPain.label} onChange={e => setNewPain(p => ({ ...p, label: e.target.value }))} placeholder="Ex: Prioridade" className="h-9" />
                      </div>
                      <div>
                        <label style={eyebrowLabel}>Título</label>
                        <Input value={newPain.title} onChange={e => setNewPain(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Qualidade visual" className="h-9" />
                      </div>
                    </div>
                    <div>
                      <label style={eyebrowLabel}>Descrição</label>
                      <Textarea value={newPain.desc} onChange={e => setNewPain(p => ({ ...p, desc: e.target.value }))} rows={2} placeholder="Descreva a dor..." />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn primary"
                        onClick={async () => {
                          if (newPain.title.trim()) {
                            await createPainPoint.mutateAsync({ label: newPain.label, title: newPain.title, description: newPain.desc });
                            setNewPain({ label: '', title: '', desc: '' });
                            setShowNewPain(false);
                          }
                        }}
                        disabled={!newPain.title.trim() || createPainPoint.isPending}
                      >
                        <Check size={14} strokeWidth={1.5} />
                        <span>Salvar</span>
                      </button>
                      <button type="button" className="btn" onClick={() => setShowNewPain(false)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ STEP 2 — PORTFÓLIO (CASES) ══ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', ...displayTitle }}>
                  Portfólio
                </h3>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  Selecione cases do banco para incluir na proposta.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {casesBank.map(c => {
                  const isSelected = form.selected_case_ids.includes(c.id);
                  const tags = Array.isArray(c.tags) && c.tags.length > 0 ? c.tags : (c.tipo ? [c.tipo] : []);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleCase(c.id)}
                      style={{
                        border: isSelected
                          ? '1px solid hsl(var(--ds-accent) / 0.5)'
                          : '1px solid hsl(var(--ds-line-1))',
                        background: isSelected ? 'hsl(var(--ds-accent) / 0.05)' : 'transparent',
                        padding: 12,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Checkbox checked={isSelected} className="shrink-0" />
                        {c.vimeo_id && (
                          <img
                            src={`https://vumbnail.com/${extractVimeoId(c.vimeo_id)}.jpg`}
                            alt={c.campaign_name}
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: 96,
                              height: 56,
                              objectFit: 'cover',
                              flexShrink: 0,
                              background: 'hsl(var(--ds-line-2) / 0.3)',
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                            {tags.map((tag, i) => (
                              <span
                                key={i}
                                className="pill"
                                style={{
                                  fontSize: 10,
                                  color: 'hsl(var(--ds-accent))',
                                  borderColor: 'hsl(var(--ds-accent) / 0.3)',
                                  background: 'hsl(var(--ds-accent) / 0.08)',
                                  letterSpacing: '0.14em',
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            {c.destaque && (
                              <span
                                className="pill"
                                style={{
                                  fontSize: 10,
                                  color: 'hsl(var(--ds-warning))',
                                  borderColor: 'hsl(var(--ds-warning) / 0.3)',
                                  background: 'hsl(var(--ds-warning) / 0.08)',
                                  letterSpacing: '0.14em',
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                }}
                              >
                                Destaque
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
                            {c.client_name}
                          </p>
                          <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
                            {c.campaign_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {casesBank.length === 0 && !showNewCase && (
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', textAlign: 'center', padding: '16px 0' }}>
                  Nenhum case no banco. Adicione o primeiro abaixo.
                </p>
              )}

              {!showNewCase ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowNewCase(true)}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Plus size={14} strokeWidth={1.5} />
                  <span>Adicionar Novo Case</span>
                </button>
              ) : (
                <div
                  style={{
                    border: '1px dashed hsl(var(--ds-accent) / 0.5)',
                    padding: 16,
                    background: 'hsl(var(--ds-accent) / 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label style={eyebrowLabel}>Tags do Projeto</label>
                      <MultiSelect
                        options={CASE_TAG_OPTIONS.map(t => ({ value: t, label: t }))}
                        value={newCase.tags}
                        onValueChange={v => setNewCase(p => ({ ...p, tags: v }))}
                        placeholder="Selecione as categorias..."
                      />
                    </div>
                    <div>
                      <label style={eyebrowLabel}>Nome do Cliente</label>
                      <Input value={newCase.client_name} onChange={e => setNewCase(p => ({ ...p, client_name: e.target.value }))} placeholder="Burger King" className="h-9" />
                    </div>
                    <div>
                      <label style={eyebrowLabel}>Nome da Campanha</label>
                      <Input value={newCase.campaign_name} onChange={e => setNewCase(p => ({ ...p, campaign_name: e.target.value }))} placeholder="Whopper Day 2026" className="h-9" />
                    </div>
                    <div className="col-span-2">
                      <label style={eyebrowLabel}>Link do Vimeo</label>
                      <Input value={newCase.vimeo_url} onChange={e => setNewCase(p => ({ ...p, vimeo_url: e.target.value }))} placeholder="https://vimeo.com/1234567890/abc123def" className="h-9" />
                      <p style={{ fontSize: 10, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                        Cole o link completo do vídeo no Vimeo
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                      <Switch checked={newCase.destaque} onCheckedChange={v => setNewCase(p => ({ ...p, destaque: v }))} />
                      <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-2))' }}>Destaque (showreel)</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={async () => {
                        const { id: vimeoId, hash: vimeoHash } = parseVimeoUrl(newCase.vimeo_url);
                        if (vimeoId.trim()) {
                          await createCase.mutateAsync({ tags: newCase.tags, client_name: newCase.client_name, campaign_name: newCase.campaign_name, vimeo_id: vimeoId, vimeo_hash: vimeoHash, destaque: newCase.destaque });
                          setNewCase({ tags: [], client_name: '', campaign_name: '', vimeo_url: '', destaque: false });
                          setShowNewCase(false);
                        }
                      }}
                      disabled={!newCase.vimeo_url.trim() || createCase.isPending}
                    >
                      <Check size={14} strokeWidth={1.5} />
                      <span>Salvar no Banco</span>
                    </button>
                    <button type="button" className="btn" onClick={() => setShowNewCase(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 3 — ENTREGÁVEIS ══ */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', ...displayTitle }}>
                  Entregáveis
                </h3>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  O que o cliente vai receber. Cada item vira um card na proposta.
                </p>
              </div>

              {form.entregaveis.map((ent, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid hsl(var(--ds-line-1))',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
                      Entregável {idx + 1}
                    </span>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => removeEntregavel(idx)}
                      style={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        justifyContent: 'center',
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr] gap-3 items-end">
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="btn"
                            style={{ height: 36, width: 36, padding: 0, justifyContent: 'center', fontSize: 18 }}
                          >
                            {ent.icone || '🎬'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" align="start">
                          <div className="grid grid-cols-8 gap-1">
                            {ICON_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateEntregavel(idx, 'icone', opt.value)}
                                style={{
                                  height: 32,
                                  width: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 16,
                                  border: ent.icone === opt.value
                                    ? '1px solid hsl(var(--ds-accent))'
                                    : '1px solid transparent',
                                  background: ent.icone === opt.value ? 'hsl(var(--ds-accent) / 0.1)' : 'transparent',
                                  cursor: 'pointer',
                                }}
                              >
                                {opt.value}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label style={eyebrowLabel}>Título</label>
                      <Input value={ent.titulo} onChange={e => updateEntregavel(idx, 'titulo', e.target.value)} placeholder="Vídeo principal" className="h-9" />
                    </div>
                    <div>
                      <label style={eyebrowLabel}>Quantidade</label>
                      <Input value={ent.quantidade} onChange={e => updateEntregavel(idx, 'quantidade', e.target.value)} placeholder="1" className="h-9" style={{ fontVariantNumeric: 'tabular-nums' }} />
                    </div>
                  </div>
                  <div>
                    <label style={eyebrowLabel}>Descrição</label>
                    <Input value={ent.descricao} onChange={e => updateEntregavel(idx, 'descricao', e.target.value)} placeholder="Peça hero com até 60 segundos, formato 16:9" className="h-9" />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn"
                onClick={addEntregavel}
                style={{ alignSelf: 'flex-start' }}
              >
                <Plus size={14} strokeWidth={1.5} />
                <span>Adicionar Entregável</span>
              </button>
            </div>
          )}

          {/* ══ STEP 4 — O QUE ESTÁ INCLUSO ══ */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', ...displayTitle }}>
                  O que está incluso
                </h3>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  Marque os serviços inclusos no projeto. Os desmarcados aparecem como "Add-on".
                </p>
              </div>

              {form.incluso_categories.map((cat, catIdx) => (
                <div key={cat.categoria} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', ...displayTitle }}>
                    {cat.categoria}
                  </h4>

                  {cat.itens && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {cat.itens.map((item, itemIdx) => (
                        <div
                          key={item.nome}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            border: item.ativo
                              ? '1px solid hsl(var(--ds-accent) / 0.5)'
                              : '1px solid hsl(var(--ds-line-1))',
                            background: item.ativo ? 'hsl(var(--ds-accent) / 0.05)' : 'transparent',
                            padding: 12,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Switch checked={item.ativo} onCheckedChange={() => toggleInclusoItem(catIdx, itemIdx)} />
                          <span style={{ fontSize: 13, flex: 1, color: 'hsl(var(--ds-fg-1))' }}>{item.nome}</span>
                          {item.ativo && item.quantidade !== undefined && (
                            <Input
                              value={item.quantidade}
                              onChange={e => updateInclusoQuantidade(catIdx, itemIdx, e.target.value)}
                              className="h-7 w-14 text-xs text-center"
                              placeholder="Qtd"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {cat.subcategorias && cat.subcategorias.map((sub, subIdx) => (
                    <div key={sub.nome} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'hsl(var(--ds-fg-3))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                        }}
                      >
                        {sub.nome}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {sub.itens.map((item, itemIdx) => (
                          <div
                            key={item.nome}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              border: item.ativo
                                ? '1px solid hsl(var(--ds-accent) / 0.5)'
                                : '1px solid hsl(var(--ds-line-1))',
                              background: item.ativo ? 'hsl(var(--ds-accent) / 0.05)' : 'transparent',
                              padding: 12,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Switch checked={item.ativo} onCheckedChange={() => toggleInclusoItem(catIdx, itemIdx, subIdx)} />
                            <span style={{ fontSize: 13, flex: 1, color: 'hsl(var(--ds-fg-1))' }}>{item.nome}</span>
                            {item.ativo && item.quantidade !== undefined && (
                              <Input
                                value={item.quantidade}
                                onChange={e => updateInclusoQuantidade(catIdx, itemIdx, e.target.value, subIdx)}
                                className="h-7 w-14 text-xs text-center"
                                placeholder="Qtd"
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Add custom to subcategory */}
                      {customItemInput?.catIdx === catIdx && customItemInput?.subIdx === subIdx ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <Input
                            value={customItemInput.value}
                            onChange={e => setCustomItemInput({ ...customItemInput, value: e.target.value })}
                            placeholder="Nome do item"
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn"
                            style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                            onClick={() => {
                              if (customItemInput.value.trim()) {
                                addCustomInclusoItem(catIdx, customItemInput.value.trim(), subIdx);
                              }
                              setCustomItemInput(null);
                            }}
                          >
                            <Check size={14} strokeWidth={1.5} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn"
                          style={{ alignSelf: 'flex-start', fontSize: 12 }}
                          onClick={() => setCustomItemInput({ catIdx, subIdx, value: '' })}
                        >
                          <Plus size={12} strokeWidth={1.5} />
                          <span>Personalizado</span>
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add custom to top-level category */}
                  {cat.itens && !cat.subcategorias && (
                    customItemInput?.catIdx === catIdx && customItemInput?.subIdx === undefined ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Input
                          value={customItemInput.value}
                          onChange={e => setCustomItemInput({ ...customItemInput, value: e.target.value })}
                          placeholder="Nome do item"
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn"
                          style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                          onClick={() => {
                            if (customItemInput.value.trim()) {
                              addCustomInclusoItem(catIdx, customItemInput.value.trim());
                            }
                            setCustomItemInput(null);
                          }}
                        >
                          <Check size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn"
                        style={{ alignSelf: 'flex-start', fontSize: 12 }}
                        onClick={() => setCustomItemInput({ catIdx, value: '' })}
                      >
                        <Plus size={12} strokeWidth={1.5} />
                        <span>Personalizado</span>
                      </button>
                    )
                  )}

                  {catIdx < form.incluso_categories.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}

          {/* ══ STEP 5 — INVESTIMENTO ══ */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', ...displayTitle }}>
                  Investimento
                </h3>
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  Valores e condições de pagamento.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={eyebrowLabel}>Valor de Tabela (R$) *</label>
                  <Input type="number" min={0} step={0.01} value={form.list_price || ''} onChange={e => updateField('list_price', parseFloat(e.target.value) || 0)} placeholder="20000" className="h-10" style={{ fontVariantNumeric: 'tabular-nums' }} />
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                    Valor cheio — aparece riscado na proposta
                  </p>
                </div>
                <div>
                  <label style={eyebrowLabel}>Desconto (%)</label>
                  <Input type="number" min={0} max={100} value={form.discount_pct || ''} onChange={e => updateField('discount_pct', parseFloat(e.target.value) || 0)} placeholder="50" className="h-10" style={{ fontVariantNumeric: 'tabular-nums' }} />
                </div>
              </div>

              {listPrice > 0 && (
                <div
                  style={{
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                    border: '1px solid hsl(var(--ds-line-1))',
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--ds-fg-3))',
                      textDecoration: 'line-through',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    Tabela: {fmt(listPrice)}
                  </p>
                  {form.discount_pct > 0 && (
                    <p style={{ fontSize: 13, color: 'hsl(var(--ds-success))', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                      Desconto: {form.discount_pct}%
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: 'hsl(var(--ds-fg-1))',
                      fontVariantNumeric: 'tabular-nums',
                      ...displayTitle,
                    }}
                  >
                    {fmt(finalValue)}
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
                  Opções de Pagamento
                </span>
                <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                  Geradas automaticamente com base no valor final
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginTop: 12 }}>
                  <div
                    style={{
                      border: '1px solid hsl(var(--ds-line-1))',
                      padding: 16,
                      background: 'hsl(var(--ds-line-2) / 0.3)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      Opção 1
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: 'hsl(var(--ds-fg-1))' }}>
                      À Vista
                    </p>
                    <p
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'hsl(var(--ds-fg-1))',
                        marginTop: 4,
                        fontVariantNumeric: 'tabular-nums',
                        ...displayTitle,
                      }}
                    >
                      {fmt(finalValue * 0.95)}
                    </p>
                    <p style={{ fontSize: 12, color: 'hsl(var(--ds-success))', marginTop: 4 }}>
                      5% de desconto para pagamento único
                    </p>
                  </div>
                  <div
                    style={{
                      border: '1px solid hsl(var(--ds-accent) / 0.5)',
                      padding: 16,
                      background: 'hsl(var(--ds-accent) / 0.05)',
                      position: 'relative',
                    }}
                  >
                    <span
                      className="pill"
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        fontSize: 9,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        color: 'hsl(var(--ds-accent))',
                        background: 'hsl(var(--ds-accent) / 0.1)',
                        borderColor: 'hsl(var(--ds-accent) / 0.3)',
                      }}
                    >
                      Recomendado
                    </span>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      Opção 2
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: 'hsl(var(--ds-fg-1))' }}>
                      2x sem juros
                    </p>
                    <p
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'hsl(var(--ds-fg-1))',
                        marginTop: 4,
                        fontVariantNumeric: 'tabular-nums',
                        ...displayTitle,
                      }}
                    >
                      2x {fmt(finalValue / 2)}
                    </p>
                    <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                      50% no fechamento + 50% na entrega
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <label style={eyebrowLabel}>Condições gerais</label>
                <Textarea value={form.payment_terms} onChange={e => updateField('payment_terms', e.target.value)} rows={2} className="text-sm" />
              </div>

              <Separator />

              <div>
                <h4
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'hsl(var(--ds-fg-1))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    ...displayTitle,
                  }}
                >
                  <Sparkles size={14} strokeWidth={1.5} /> Depoimento
                </h4>
                <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                  Prova social fixa (padrão)
                </p>
                <div
                  style={{
                    border: '1px solid hsl(var(--ds-line-1))',
                    padding: 16,
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                    marginTop: 12,
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--ds-fg-1))' }}>
                    {form.testimonial_name}
                  </p>
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
                    {form.testimonial_role}
                  </p>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 8, fontStyle: 'italic' }}>
                    "{form.testimonial_text}"
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="btn"
          onClick={() => step > 0 ? setStep(step - 1) : navigate('/orcamentos')}
          disabled={createProposal.isPending}
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span>{step === 0 ? 'Voltar' : 'Anterior'}</span>
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="btn primary"
            onClick={() => setStep(step + 1)}
            disabled={!canGoNext()}
          >
            <span>Próximo</span>
            <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        ) : (
          <button
            type="button"
            className="btn primary"
            onClick={handleSubmit}
            disabled={createProposal.isPending || !canGoNext()}
          >
            {createProposal.isPending ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : null}
            <span>Gerar Proposta</span>
          </button>
        )}
      </div>
    </div>
  );
}
