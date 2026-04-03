import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  CalendarIcon, Plus, Trash2, ArrowLeft, ArrowRight, Loader2, Check,
  Building2, Target, Video, DollarSign, Package, ListChecks,
  Phone, Sparkles, Smartphone, Camera, ClipboardList, Clapperboard,
  Palette, Image, Music, Monitor, Mic
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProposals } from '../hooks/useProposals';
import { usePainPoints } from '../hooks/usePainPoints';
import { useProposalCases } from '../hooks/useProposalCases';
import {
  defaultFormData,
  ICON_OPTIONS,
  CASE_TAG_OPTIONS,
  type ProposalFormData,
  type EntregavelItem,
  type DiagnosticoDor,
  type InclusoItem,
} from '../types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Video, Smartphone, Camera, ClipboardList, Clapperboard, Palette, Image, Music, Monitor, Mic,
};

const STEPS = [
  { label: 'Cliente', icon: Building2 },
  { label: 'Diagnóstico', icon: Target },
  { label: 'Portfólio', icon: Video },
  { label: 'Entregáveis', icon: Package },
  { label: 'Incluso', icon: ListChecks },
  { label: 'Investimento', icon: DollarSign },
];

export function ProposalWizard() {
  const navigate = useNavigate();
  const { createProposal } = useProposals();
  const { data: painPoints = [], createPainPoint } = usePainPoints();
  const { data: casesBank = [], createCase } = useProposalCases();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProposalFormData>({ ...defaultFormData });
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);

  // New pain point inline form
  const [showNewPain, setShowNewPain] = useState(false);
  const [newPain, setNewPain] = useState<DiagnosticoDor>({ label: '', title: '', desc: '' });

  // New case inline form
  const [showNewCase, setShowNewCase] = useState(false);
  const [newCase, setNewCase] = useState({ tags: [] as string[], client_name: '', campaign_name: '', vimeo_url: '', destaque: false });

  const parseVimeoUrl = (url: string): { id: string; hash: string } => {
    // Supports: https://vimeo.com/1234567890/abc123def or https://vimeo.com/1234567890?h=abc123def
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
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

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
  const addEntregavel = () => updateField('entregaveis', [...form.entregaveis, { titulo: '', descricao: '', quantidade: '1', icone: 'Video' }]);
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
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Proposta Gerada!</h2>
        <p className="text-muted-foreground">O link público está pronto para ser compartilhado com o cliente.</p>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Link da proposta:</p>
          <p className="text-sm font-mono break-all text-foreground">{publicUrl}</p>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(publicUrl).then(() => import('sonner').then(m => m.toast.success('Link copiado!')))}>
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 py-2 rounded-lg transition-all",
                i === step ? "bg-primary/10" : i < step ? "cursor-pointer hover:bg-muted" : "opacity-50"
              )}
              disabled={i > step}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {i < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn(
                "text-[10px] transition-colors hidden sm:block",
                i <= step ? "text-foreground font-medium" : "text-muted-foreground"
              )}>{s.label}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">

          {/* ══ STEP 0 — CLIENTE E PROJETO ══ */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Cliente e Projeto</h3>
                <p className="text-sm text-muted-foreground">Informações que aparecem no topo da proposta.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nome do Cliente *</Label>
                  <Input value={form.client_name} onChange={e => updateField('client_name', e.target.value)} placeholder="Ex: Burger King" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Nome do Projeto *</Label>
                  <Input value={form.project_name} onChange={e => updateField('project_name', e.target.value)} placeholder="Ex: Campanha Verão 2026" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Responsável (Nome de quem vai receber)</Label>
                  <Input value={form.client_responsible} onChange={e => updateField('client_responsible', e.target.value)} placeholder="Nome do contato" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">WhatsApp</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input value={form.whatsapp_number} onChange={e => updateField('whatsapp_number', e.target.value)} placeholder="5511999999999" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data de Envio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(form.sent_date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.sent_date} onSelect={d => d && updateField('sent_date', d)} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">Data da geração da proposta</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data de Validade *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !form.validity_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.validity_date ? format(form.validity_date, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.validity_date} onSelect={d => updateField('validity_date', d)} disabled={date => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">Aparece no countdown da proposta</p>
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 1 — DIAGNÓSTICO ══ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Diagnóstico</h3>
                <p className="text-sm text-muted-foreground">O que o cliente precisa resolver? Esta seção gera a conexão emocional.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Objetivo Estratégico</Label>
                <Textarea
                  value={form.objetivo}
                  onChange={e => updateField('objetivo', e.target.value)}
                  rows={6}
                  className="text-sm leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">Texto de abertura na seção "Sobre" da proposta</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <Label className="text-sm font-semibold">Dores do Cliente</Label>
                    <span className="text-xs text-muted-foreground">({selectedDores.length}/3)</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">Selecione até 3 dores do banco ou adicione uma personalizada.</p>

                <div className="grid grid-cols-1 gap-3">
                  {painPoints.map(pp => {
                    const isSelected = selectedDores.some(d => d.title === pp.title);
                    return (
                      <div
                        key={pp.id}
                        onClick={() => togglePainPoint(pp)}
                        className={cn(
                          "rounded-lg border p-4 cursor-pointer transition-all",
                          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox checked={isSelected} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {pp.label}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-foreground">{pp.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{pp.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add custom pain point */}
                {!showNewPain ? (
                  <Button variant="outline" size="sm" onClick={() => setShowNewPain(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Personalizada
                  </Button>
                ) : (
                  <div className="rounded-lg border border-dashed border-primary/50 p-4 space-y-3 bg-primary/5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Label</Label>
                        <Input value={newPain.label} onChange={e => setNewPain(p => ({ ...p, label: e.target.value }))} placeholder="Ex: Prioridade" className="h-9" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Título</Label>
                        <Input value={newPain.title} onChange={e => setNewPain(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Qualidade visual" className="h-9" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Descrição</Label>
                      <Textarea value={newPain.desc} onChange={e => setNewPain(p => ({ ...p, desc: e.target.value }))} rows={2} placeholder="Descreva a dor..." />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (newPain.title.trim()) {
                            await createPainPoint.mutateAsync({ label: newPain.label, title: newPain.title, description: newPain.desc });
                            setNewPain({ label: '', title: '', desc: '' });
                            setShowNewPain(false);
                          }
                        }}
                        disabled={!newPain.title.trim() || createPainPoint.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" /> Salvar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowNewPain(false)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ STEP 2 — PORTFÓLIO (CASES) ══ */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Portfólio</h3>
                <p className="text-sm text-muted-foreground">Selecione cases do banco para incluir na proposta.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {casesBank.map(c => {
                  const isSelected = form.selected_case_ids.includes(c.id);
                  const tags = Array.isArray(c.tags) && c.tags.length > 0 ? c.tags : (c.tipo ? [c.tipo] : []);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleCase(c.id)}
                      className={cn(
                        "rounded-lg border p-3 cursor-pointer transition-all",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} className="shrink-0" />
                        {c.vimeo_id && (
                          <img
                            src={`https://vumbnail.com/${c.vimeo_id}.jpg`}
                            alt={c.campaign_name}
                            className="w-24 h-14 object-cover rounded shrink-0 bg-muted"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            {tags.map((tag, i) => (
                              <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                            {c.destaque && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                                Destaque
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-foreground">{c.client_name}</p>
                          <p className="text-xs text-muted-foreground">{c.campaign_name}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {casesBank.length === 0 && !showNewCase && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum case no banco. Adicione o primeiro abaixo.</p>
              )}

              {!showNewCase ? (
                <Button variant="outline" size="sm" onClick={() => setShowNewCase(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Novo Case
                </Button>
              ) : (
                <div className="rounded-lg border border-dashed border-primary/50 p-4 space-y-3 bg-primary/5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Tags do Projeto</Label>
                      <MultiSelect
                        options={CASE_TAG_OPTIONS.map(t => ({ value: t, label: t }))}
                        value={newCase.tags}
                        onValueChange={v => setNewCase(p => ({ ...p, tags: v }))}
                        placeholder="Selecione as categorias..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Nome do Cliente</Label>
                      <Input value={newCase.client_name} onChange={e => setNewCase(p => ({ ...p, client_name: e.target.value }))} placeholder="Burger King" className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Nome da Campanha</Label>
                      <Input value={newCase.campaign_name} onChange={e => setNewCase(p => ({ ...p, campaign_name: e.target.value }))} placeholder="Whopper Day 2026" className="h-9" />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs text-muted-foreground">Link do Vimeo</Label>
                      <Input value={newCase.vimeo_url} onChange={e => setNewCase(p => ({ ...p, vimeo_url: e.target.value }))} placeholder="https://vimeo.com/1234567890/abc123def" className="h-9" />
                      <p className="text-[10px] text-muted-foreground">Cole o link completo do vídeo no Vimeo</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch checked={newCase.destaque} onCheckedChange={v => setNewCase(p => ({ ...p, destaque: v }))} />
                      <Label className="text-xs">Destaque (showreel)</Label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
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
                      <Check className="h-4 w-4 mr-1" /> Salvar no Banco
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowNewCase(false)}>Cancelar</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 3 — ENTREGÁVEIS ══ */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Entregáveis</h3>
                <p className="text-sm text-muted-foreground">O que o cliente vai receber. Cada item vira um card na proposta.</p>
              </div>

              {form.entregaveis.map((ent, idx) => (
                <div key={idx} className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Entregável {idx + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeEntregavel(idx)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Título</Label>
                      <Input value={ent.titulo} onChange={e => updateEntregavel(idx, 'titulo', e.target.value)} placeholder="Vídeo principal" className="h-9" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Quantidade</Label>
                        <Input value={ent.quantidade} onChange={e => updateEntregavel(idx, 'quantidade', e.target.value)} placeholder="1" className="h-9" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Ícone</Label>
                        <Select value={ent.icone} onValueChange={v => updateEntregavel(idx, 'icone', v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue>
                              {(() => { const IC = ICON_MAP[ent.icone]; return IC ? <span className="flex items-center gap-1.5"><IC className="h-3.5 w-3.5" />{ICON_OPTIONS.find(o => o.value === ent.icone)?.label}</span> : ent.icone; })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map(opt => {
                              const IC = ICON_MAP[opt.value];
                              return (
                                <SelectItem key={opt.value} value={opt.value}>
                                  <span className="flex items-center gap-2">
                                    {IC && <IC className="h-4 w-4 text-muted-foreground" />}
                                    {opt.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <Input value={ent.descricao} onChange={e => updateEntregavel(idx, 'descricao', e.target.value)} placeholder="Peça hero com até 60 segundos, formato 16:9" className="h-9" />
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" onClick={addEntregavel}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Entregável
              </Button>
            </div>
          )}

          {/* ══ STEP 4 — O QUE ESTÁ INCLUSO ══ */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">O que está incluso</h3>
                <p className="text-sm text-muted-foreground">Marque os serviços inclusos no projeto. Os desmarcados aparecem como "Add-on".</p>
              </div>

              {form.incluso_categories.map((cat, catIdx) => (
                <div key={cat.categoria} className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">{cat.categoria}</h4>

                  {cat.itens && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {cat.itens.map((item, itemIdx) => (
                        <div key={item.nome} className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                          item.ativo ? "border-primary/50 bg-primary/5" : "border-border"
                        )}>
                          <Switch checked={item.ativo} onCheckedChange={() => toggleInclusoItem(catIdx, itemIdx)} />
                          <span className="text-sm flex-1">{item.nome}</span>
                          {item.ativo && item.quantidade !== undefined && (
                            <Input
                              value={item.quantidade}
                              onChange={e => updateInclusoQuantidade(catIdx, itemIdx, e.target.value)}
                              className="h-7 w-14 text-xs text-center"
                              placeholder="Qtd"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {cat.subcategorias && cat.subcategorias.map((sub, subIdx) => (
                    <div key={sub.nome} className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{sub.nome}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {sub.itens.map((item, itemIdx) => (
                          <div key={item.nome} className={cn(
                            "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                            item.ativo ? "border-primary/50 bg-primary/5" : "border-border"
                          )}>
                            <Switch checked={item.ativo} onCheckedChange={() => toggleInclusoItem(catIdx, itemIdx, subIdx)} />
                            <span className="text-sm flex-1">{item.nome}</span>
                            {item.ativo && item.quantidade !== undefined && (
                              <Input
                                value={item.quantidade}
                                onChange={e => updateInclusoQuantidade(catIdx, itemIdx, e.target.value, subIdx)}
                                className="h-7 w-14 text-xs text-center"
                                placeholder="Qtd"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Add custom to subcategory */}
                      {customItemInput?.catIdx === catIdx && customItemInput?.subIdx === subIdx ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={customItemInput.value}
                            onChange={e => setCustomItemInput({ ...customItemInput, value: e.target.value })}
                            placeholder="Nome do item"
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                            if (customItemInput.value.trim()) {
                              addCustomInclusoItem(catIdx, customItemInput.value.trim(), subIdx);
                            }
                            setCustomItemInput(null);
                          }}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setCustomItemInput({ catIdx, subIdx, value: '' })}>
                          <Plus className="h-3 w-3 mr-1" /> Personalizado
                        </Button>
                      )}
                    </div>
                  ))}

                  {/* Add custom to top-level category */}
                  {cat.itens && !cat.subcategorias && (
                    customItemInput?.catIdx === catIdx && customItemInput?.subIdx === undefined ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          value={customItemInput.value}
                          onChange={e => setCustomItemInput({ ...customItemInput, value: e.target.value })}
                          placeholder="Nome do item"
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                          if (customItemInput.value.trim()) {
                            addCustomInclusoItem(catIdx, customItemInput.value.trim());
                          }
                          setCustomItemInput(null);
                        }}>
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setCustomItemInput({ catIdx, value: '' })}>
                        <Plus className="h-3 w-3 mr-1" /> Personalizado
                      </Button>
                    )
                  )}

                  {catIdx < form.incluso_categories.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}

          {/* ══ STEP 5 — INVESTIMENTO ══ */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Investimento</h3>
                <p className="text-sm text-muted-foreground">Valores e condições de pagamento.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Valor de Tabela (R$) *</Label>
                  <Input type="number" min={0} step={0.01} value={form.list_price || ''} onChange={e => updateField('list_price', parseFloat(e.target.value) || 0)} placeholder="20000" className="h-10" />
                  <p className="text-xs text-muted-foreground">Valor cheio — aparece riscado na proposta</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Desconto (%)</Label>
                  <Input type="number" min={0} max={100} value={form.discount_pct || ''} onChange={e => updateField('discount_pct', parseFloat(e.target.value) || 0)} placeholder="50" className="h-10" />
                </div>
              </div>

              {listPrice > 0 && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="text-sm text-muted-foreground line-through">Tabela: {fmt(listPrice)}</p>
                  {form.discount_pct > 0 && (
                    <p className="text-sm text-success font-medium">Desconto: {form.discount_pct}%</p>
                  )}
                  <p className="text-2xl font-bold text-foreground">{fmt(finalValue)}</p>
                </div>
              )}

              <Separator />

              <div>
                <Label className="text-sm font-semibold">Opções de Pagamento</Label>
                <p className="text-xs text-muted-foreground mt-1">Geradas automaticamente com base no valor final</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="rounded-lg border border-border p-4 bg-muted/30">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Opção 1</p>
                    <p className="text-sm font-semibold mt-1">À Vista</p>
                    <p className="text-lg font-bold text-foreground mt-1">{fmt(finalValue * 0.95)}</p>
                    <p className="text-xs text-success mt-1">5% de desconto para pagamento único</p>
                  </div>
                  <div className="rounded-lg border border-primary/50 p-4 bg-primary/5 relative">
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">Recomendado</span>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Opção 2</p>
                    <p className="text-sm font-semibold mt-1">2x sem juros</p>
                    <p className="text-lg font-bold text-foreground mt-1">2x {fmt(finalValue / 2)}</p>
                    <p className="text-xs text-muted-foreground mt-1">50% no fechamento + 50% na entrega</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Condições gerais</Label>
                <Textarea value={form.payment_terms} onChange={e => updateField('payment_terms', e.target.value)} rows={2} className="text-sm" />
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Depoimento
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Prova social fixa (padrão)</p>
                <div className="rounded-lg border border-border p-4 bg-muted/30 mt-3">
                  <p className="text-sm font-semibold">{form.testimonial_name}</p>
                  <p className="text-xs text-muted-foreground">{form.testimonial_role}</p>
                  <p className="text-sm text-muted-foreground mt-2 italic">"{form.testimonial_text}"</p>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step > 0 ? setStep(step - 1) : navigate('/orcamentos')} disabled={createProposal.isPending}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {step === 0 ? 'Voltar' : 'Anterior'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canGoNext()}>
            Próximo
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={createProposal.isPending || !canGoNext()}>
            {createProposal.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Gerar Proposta
          </Button>
        )}
      </div>
    </div>
  );
}
