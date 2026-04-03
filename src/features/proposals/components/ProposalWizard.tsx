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
import { Separator } from '@/components/ui/separator';
import {
  CalendarIcon, Plus, Trash2, ArrowLeft, ArrowRight, Loader2, Check, Upload, X,
  Building2, Target, Video, FileText, DollarSign, Phone, MessageSquare, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProposals } from '../hooks/useProposals';
import { defaultFormData, type ProposalFormData, type CaseItem } from '../types';

const STEPS = [
  { label: 'Cliente', icon: Building2 },
  { label: 'Diagnóstico', icon: Target },
  { label: 'Portfólio', icon: Video },
  { label: 'Investimento', icon: DollarSign },
];

export function ProposalWizard() {
  const navigate = useNavigate();
  const { createProposal } = useProposals();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProposalFormData>({ ...defaultFormData });
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);

  const updateField = <K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateField('client_logo_file', file);
      updateField('client_logo_preview', URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    updateField('client_logo_file', null);
    updateField('client_logo_preview', '');
  };

  const handleSubmit = async () => {
    const result = await createProposal.mutateAsync(form);
    setGeneratedSlug(result.slug);
  };

  const canGoNext = () => {
    if (step === 0) return form.client_name.trim() && form.project_name.trim() && form.validity_date;
    return true;
  };

  const finalValue = form.base_value * (1 - (form.discount_pct || 0) / 100);
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // ── Entregáveis helpers ──
  const addEntregavel = () => updateField('entregaveis', [...form.entregaveis, { output: '', items: [''] }]);
  const removeEntregavel = (idx: number) => updateField('entregaveis', form.entregaveis.filter((_: any, i: number) => i !== idx));
  const updateEntregavelOutput = (idx: number, v: string) => {
    const u = [...form.entregaveis]; u[idx] = { ...u[idx], output: v }; updateField('entregaveis', u);
  };
  const addEntregavelItem = (idx: number) => {
    const u = [...form.entregaveis]; u[idx] = { ...u[idx], items: [...(u[idx].items || []), ''] }; updateField('entregaveis', u);
  };
  const updateEntregavelItem = (eIdx: number, iIdx: number, v: string) => {
    const u = [...form.entregaveis]; const items = [...(u[eIdx].items || [])]; items[iIdx] = v; u[eIdx] = { ...u[eIdx], items }; updateField('entregaveis', u);
  };
  const removeEntregavelItem = (eIdx: number, iIdx: number) => {
    const u = [...form.entregaveis]; u[eIdx] = { ...u[eIdx], items: u[eIdx].items.filter((_: any, i: number) => i !== iIdx) }; updateField('entregaveis', u);
  };

  // ── Cases helpers ──
  const addCase = () => updateField('cases', [...form.cases, { tipo: '', titulo: '', descricao: '', vimeoId: '', vimeoHash: '', destaque: false }]);
  const removeCase = (idx: number) => updateField('cases', form.cases.filter((_: CaseItem, i: number) => i !== idx));
  const updateCase = (idx: number, field: keyof CaseItem, value: any) => {
    const u = [...form.cases]; u[idx] = { ...u[idx], [field]: value }; updateField('cases', u);
  };

  // ── Payment helpers ──
  const addPaymentOption = () => updateField('payment_options', [...form.payment_options, { titulo: '', valor: '', descricao: '', destaque: '', recomendado: false }]);
  const removePaymentOption = (idx: number) => updateField('payment_options', form.payment_options.filter((_, i) => i !== idx));
  const updatePaymentOption = (idx: number, field: string, value: any) => {
    const u = [...form.payment_options]; u[idx] = { ...u[idx], [field]: value }; updateField('payment_options', u);
  };

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
      {/* ── Step indicator ── */}
      <div className="flex items-center gap-1 sm:gap-2">
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
                "text-xs transition-colors hidden sm:block",
                i <= step ? "text-foreground font-medium" : "text-muted-foreground"
              )}>{s.label}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">

          {/* ════════════════════════════════════════════════
              STEP 0 — CLIENTE E PROJETO
              Corresponde à seção Hero da proposta
             ════════════════════════════════════════════════ */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Cliente e Projeto</h3>
                <p className="text-sm text-muted-foreground">Informações que aparecem no topo da proposta.</p>
              </div>

              {/* Logo + campos principais lado a lado */}
              <div className="flex items-start gap-5">
                <div className="shrink-0 space-y-2">
                  <div className="relative group">
                    <Avatar className="h-20 w-20 rounded-xl">
                      {form.client_logo_preview ? <AvatarImage src={form.client_logo_preview} alt="Logo" className="object-contain" /> : null}
                      <AvatarFallback className="bg-muted rounded-xl"><Building2 className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                    {form.client_logo_preview && (
                      <button onClick={removeLogo} className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload">
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <span className="cursor-pointer text-xs"><Upload className="h-3 w-3 mr-1" />{form.client_logo_preview ? 'Trocar' : 'Logo'}</span>
                    </Button>
                  </label>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nome do Cliente *</Label>
                    <Input value={form.client_name} onChange={e => updateField('client_name', e.target.value)} placeholder="Ex: Burger King" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Nome do Projeto *</Label>
                    <Input value={form.project_name} onChange={e => updateField('project_name', e.target.value)} placeholder="Ex: Campanha Verão 2026" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Responsável (Cliente)</Label>
                    <Input value={form.client_responsible} onChange={e => updateField('client_responsible', e.target.value)} placeholder="Nome do contato" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input value={form.whatsapp_number} onChange={e => updateField('whatsapp_number', e.target.value)} placeholder="5511999999999" className="pl-9" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Data de Validade *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full sm:w-[260px] justify-start text-left font-normal h-10", !form.validity_date && "text-muted-foreground")}>
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
          )}

          {/* ════════════════════════════════════════════════
              STEP 1 — DIAGNÓSTICO
              Corresponde à seção Objetivo da proposta
             ════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Diagnóstico do Projeto</h3>
                <p className="text-sm text-muted-foreground">O que o cliente precisa resolver? Esta seção gera a conexão emocional.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Objetivo Estratégico</Label>
                <Textarea
                  value={form.objetivo}
                  onChange={e => updateField('objetivo', e.target.value)}
                  placeholder="Ex: Posicionar a marca como referência no segmento através de conteúdo audiovisual estratégico que conecte com o público-alvo..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Texto de abertura da seção de diagnóstico na proposta</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">3 Dores do Cliente</Label>
                </div>
                <p className="text-xs text-muted-foreground -mt-2">Cada card aparece na proposta com destaque visual. Preencha de forma objetiva.</p>

                {form.diagnostico_dores.map((dor, i) => (
                  <div key={i} className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {dor.label || `Dor ${i + 1}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Label (tag)</Label>
                        <Input
                          value={dor.label}
                          onChange={e => {
                            const u = [...form.diagnostico_dores]; u[i] = { ...u[i], label: e.target.value }; updateField('diagnostico_dores', u);
                          }}
                          placeholder="Ex: Prioridade"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Título</Label>
                        <Input
                          value={dor.title}
                          onChange={e => {
                            const u = [...form.diagnostico_dores]; u[i] = { ...u[i], title: e.target.value }; updateField('diagnostico_dores', u);
                          }}
                          placeholder="Ex: Ausência de conteúdo estratégico"
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Descrição</Label>
                      <Textarea
                        value={dor.desc}
                        onChange={e => {
                          const u = [...form.diagnostico_dores]; u[i] = { ...u[i], desc: e.target.value }; updateField('diagnostico_dores', u);
                        }}
                        placeholder="Descreva brevemente o problema..."
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              STEP 2 — PORTFÓLIO (Cases + Entregáveis)
              Corresponde às seções Cases e Entregáveis
             ════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Cases Similares</h3>
                <p className="text-sm text-muted-foreground">Projetos relevantes que demonstram capacidade. Usam embed do Vimeo.</p>
              </div>

              {form.cases.map((c, idx) => (
                <div key={idx} className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Case {idx + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeCase(idx)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <Input value={c.tipo || ''} onChange={e => updateCase(idx, 'tipo', e.target.value)} placeholder="Vídeo Institucional" className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Título</Label>
                      <Input value={c.titulo || ''} onChange={e => updateCase(idx, 'titulo', e.target.value)} placeholder="Nome do case" className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Vimeo ID</Label>
                      <Input value={c.vimeoId || ''} onChange={e => updateCase(idx, 'vimeoId', e.target.value)} placeholder="1234567890" className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Vimeo Hash</Label>
                      <Input value={c.vimeoHash || ''} onChange={e => updateCase(idx, 'vimeoHash', e.target.value)} placeholder="abc123def" className="h-9" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!c.destaque} onCheckedChange={v => updateCase(idx, 'destaque', v)} />
                    <Label className="text-xs text-muted-foreground">Destaque (aparece maior)</Label>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCase}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Case
              </Button>

              <Separator />

              {/* Entregáveis */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">Entregáveis</h3>
                <p className="text-sm text-muted-foreground">O que o cliente vai receber. Cada entregável tem um output e serviços inclusos.</p>
              </div>

              {form.entregaveis.map((ent: any, eIdx: number) => (
                <div key={eIdx} className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Entregável {eIdx + 1}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeEntregavel(eIdx)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Output</Label>
                    <Input value={ent.output || ''} onChange={e => updateEntregavelOutput(eIdx, e.target.value)} placeholder='Ex: "1 vídeo institucional de 2min"' className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Serviços inclusos</Label>
                    {(ent.items || []).map((item: string, iIdx: number) => (
                      <div key={iIdx} className="flex gap-2">
                        <Input value={item} onChange={e => updateEntregavelItem(eIdx, iIdx, e.target.value)} placeholder="Ex: Roteirização" className="h-9" />
                        <Button variant="ghost" size="icon" onClick={() => removeEntregavelItem(eIdx, iIdx)} disabled={(ent.items || []).length <= 1} className="h-9 w-9 shrink-0 text-muted-foreground">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => addEntregavelItem(eIdx)} className="text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Serviço
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addEntregavel}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Entregável
              </Button>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              STEP 3 — INVESTIMENTO
              Corresponde à seção Investimento da proposta
             ════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Investimento</h3>
                <p className="text-sm text-muted-foreground">Valores, condições de pagamento e prova social.</p>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Valor de Tabela (R$)</Label>
                  <Input type="number" min={0} step={0.01} value={form.list_price || ''} onChange={e => updateField('list_price', parseFloat(e.target.value) || 0)} placeholder="Opcional — riscado" className="h-10" />
                  <p className="text-xs text-muted-foreground">Aparece riscado</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Valor Final (R$) *</Label>
                  <Input type="number" min={0} step={0.01} value={form.base_value || ''} onChange={e => updateField('base_value', parseFloat(e.target.value) || 0)} placeholder="0,00" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Desconto (%)</Label>
                  <Input type="number" min={0} max={100} value={form.discount_pct || ''} onChange={e => updateField('discount_pct', parseFloat(e.target.value) || 0)} placeholder="0" className="h-10" />
                </div>
              </div>

              {form.base_value > 0 && (
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  {form.list_price > 0 && (
                    <p className="text-sm text-muted-foreground line-through">Tabela: {fmt(form.list_price)}</p>
                  )}
                  {form.discount_pct > 0 && (
                    <p className="text-sm text-success font-medium">Desconto: {form.discount_pct}%</p>
                  )}
                  <p className="text-2xl font-bold text-foreground">{fmt(finalValue)}</p>
                </div>
              )}

              <Separator />

              {/* Opções de pagamento */}
              <div>
                <Label className="text-sm font-semibold">Opções de Pagamento</Label>
                <p className="text-xs text-muted-foreground mt-1">Cards de pagamento que aparecem na proposta</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Condições gerais</Label>
                <Textarea value={form.payment_terms} onChange={e => updateField('payment_terms', e.target.value)} rows={2} className="text-sm" />
              </div>

              {form.payment_options.map((opt, idx) => (
                <div key={idx} className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Opção {idx + 1}</span>
                    <Button variant="ghost" size="icon" onClick={() => removePaymentOption(idx)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Título</Label>
                      <Input value={opt.titulo} onChange={e => updatePaymentOption(idx, 'titulo', e.target.value)} placeholder="Ex: À Vista" className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Valor</Label>
                      <Input value={opt.valor} onChange={e => updatePaymentOption(idx, 'valor', e.target.value)} placeholder="Ex: R$ 25.000" className="h-9" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <Input value={opt.descricao} onChange={e => updatePaymentOption(idx, 'descricao', e.target.value)} placeholder="Ex: Pagamento único com 5% off" className="h-9" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Badge destaque</Label>
                      <Input value={opt.destaque || ''} onChange={e => updatePaymentOption(idx, 'destaque', e.target.value)} placeholder="Ex: Melhor custo" className="h-9" />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <Switch checked={!!opt.recomendado} onCheckedChange={v => updatePaymentOption(idx, 'recomendado', v)} />
                      <Label className="text-xs">Recomendado</Label>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addPaymentOption}>
                <Plus className="h-4 w-4 mr-1" /> Opção de Pagamento
              </Button>

              <Separator />

              {/* Depoimento */}
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Depoimento (opcional)
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Prova social que aparece ao lado do investimento</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <Input value={form.testimonial_name} onChange={e => updateField('testimonial_name', e.target.value)} placeholder="João Silva" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cargo</Label>
                  <Input value={form.testimonial_role} onChange={e => updateField('testimonial_role', e.target.value)} placeholder="CEO, Empresa X" className="h-9" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Texto</Label>
                <Textarea value={form.testimonial_text} onChange={e => updateField('testimonial_text', e.target.value)} rows={2} placeholder="O que o cliente disse..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">URL da Foto</Label>
                <Input value={form.testimonial_image} onChange={e => updateField('testimonial_image', e.target.value)} placeholder="https://..." className="h-9" />
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* ── Navigation ── */}
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
