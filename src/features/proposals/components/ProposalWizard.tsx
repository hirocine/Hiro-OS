import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  CalendarIcon, Plus, Trash2, ArrowLeft, ArrowRight, Loader2, Check, Upload, X,
  Building2, Target, FileText, Video, DollarSign, MessageSquare, Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProposals } from '../hooks/useProposals';
import { defaultFormData, type ProposalFormData, type CaseItem } from '../types';

const STEPS = [
  'Dados Básicos',
  'Objetivo e Diagnóstico',
  'Entregáveis e Cases',
  'Investimento e Pagamento',
  'Depoimento e WhatsApp',
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

  // --- Entregáveis helpers ---
  const addEntregavel = () => {
    updateField('entregaveis', [...form.entregaveis, { output: '', items: [''] }]);
  };
  const removeEntregavel = (idx: number) => {
    updateField('entregaveis', form.entregaveis.filter((_: any, i: number) => i !== idx));
  };
  const updateEntregavelOutput = (idx: number, value: string) => {
    const updated = [...form.entregaveis];
    updated[idx] = { ...updated[idx], output: value };
    updateField('entregaveis', updated);
  };
  const addEntregavelItem = (idx: number) => {
    const updated = [...form.entregaveis];
    updated[idx] = { ...updated[idx], items: [...(updated[idx].items || []), ''] };
    updateField('entregaveis', updated);
  };
  const updateEntregavelItem = (eIdx: number, iIdx: number, value: string) => {
    const updated = [...form.entregaveis];
    const items = [...(updated[eIdx].items || [])];
    items[iIdx] = value;
    updated[eIdx] = { ...updated[eIdx], items };
    updateField('entregaveis', updated);
  };
  const removeEntregavelItem = (eIdx: number, iIdx: number) => {
    const updated = [...form.entregaveis];
    updated[eIdx] = { ...updated[eIdx], items: updated[eIdx].items.filter((_: any, i: number) => i !== iIdx) };
    updateField('entregaveis', updated);
  };

  // --- Cases helpers ---
  const addCase = () => {
    updateField('cases', [...form.cases, { tipo: '', titulo: '', descricao: '', vimeoId: '', vimeoHash: '', destaque: false }]);
  };
  const removeCase = (idx: number) => {
    updateField('cases', form.cases.filter((_: CaseItem, i: number) => i !== idx));
  };
  const updateCase = (idx: number, field: keyof CaseItem, value: any) => {
    const updated = [...form.cases];
    updated[idx] = { ...updated[idx], [field]: value };
    updateField('cases', updated);
  };

  // --- Payment options helpers ---
  const addPaymentOption = () => {
    updateField('payment_options', [...form.payment_options, { titulo: '', valor: '', descricao: '', destaque: '', recomendado: false }]);
  };
  const removePaymentOption = (idx: number) => {
    updateField('payment_options', form.payment_options.filter((_, i) => i !== idx));
  };

  if (generatedSlug) {
    const publicUrl = `${window.location.origin}/orcamento/${generatedSlug}`;
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Proposta Gerada!</h2>
        <p className="text-muted-foreground">O link público da proposta está pronto para ser compartilhado.</p>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Link da proposta:</p>
          <p className="text-sm font-mono break-all text-foreground">{publicUrl}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(publicUrl).then(() => import('sonner').then(m => m.toast.success('Link copiado!')))}>
            Copiar Link
          </Button>
          <Button onClick={() => window.open(`/orcamento/${generatedSlug}`, '_blank')}>
            Ver Proposta
          </Button>
          <Button variant="secondary" onClick={() => navigate('/orcamentos')}>
            Voltar à Listagem
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 w-full">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div className={cn(
              "h-2 w-full rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-muted"
            )} />
            <span className={cn(
              "text-xs transition-colors hidden sm:block",
              i <= step ? "text-foreground font-medium" : "text-muted-foreground"
            )}>{s}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* ─── Step 0: Dados Básicos ─── */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Dados Básicos
              </h3>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo do Cliente</Label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-16 w-16">
                      {form.client_logo_preview ? <AvatarImage src={form.client_logo_preview} alt="Logo" /> : null}
                      <AvatarFallback className="bg-muted"><Building2 className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                    {form.client_logo_preview && (
                      <button onClick={removeLogo} className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
                    <label htmlFor="logo-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span className="cursor-pointer"><Upload className="h-4 w-4 mr-1" />{form.client_logo_preview ? 'Trocar' : 'Enviar Logo'}</span>
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">Opcional. PNG, JPG até 2MB</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Cliente *</Label>
                  <Input value={form.client_name} onChange={e => updateField('client_name', e.target.value)} placeholder="Ex: Burger King" />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Projeto *</Label>
                  <Input value={form.project_name} onChange={e => updateField('project_name', e.target.value)} placeholder="Ex: Campanha Verão 2026" />
                </div>
                <div className="space-y-2">
                  <Label>Número do Projeto</Label>
                  <Input value={form.project_number} onChange={e => updateField('project_number', e.target.value)} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label>Responsável (Cliente)</Label>
                  <Input value={form.client_responsible} onChange={e => updateField('client_responsible', e.target.value)} placeholder="Nome do contato" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data de Validade *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !form.validity_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.validity_date ? format(form.validity_date, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={form.validity_date} onSelect={d => updateField('validity_date', d)} disabled={date => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Briefing</Label>
                <Textarea value={form.briefing} onChange={e => updateField('briefing', e.target.value)} placeholder="Descreva o briefing do projeto..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label>URL do Vídeo Reel (YouTube/Vimeo)</Label>
                <Input value={form.video_url} onChange={e => updateField('video_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </div>
            </div>
          )}

          {/* ─── Step 1: Objetivo e Diagnóstico ─── */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Target className="h-5 w-5" /> Objetivo e Diagnóstico
              </h3>

              <div className="space-y-2">
                <Label>Objetivo do Projeto</Label>
                <Textarea
                  value={form.objetivo}
                  onChange={e => updateField('objetivo', e.target.value)}
                  placeholder="Descreva o objetivo estratégico deste projeto para o cliente..."
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold">Diagnóstico — 3 Dores do Cliente</Label>
                <p className="text-xs text-muted-foreground">Identifique os 3 principais problemas/desafios que este projeto resolve.</p>
                {form.diagnostico_dores.map((dor, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{dor.label}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={dor.label}
                            onChange={e => {
                              const updated = [...form.diagnostico_dores];
                              updated[i] = { ...updated[i], label: e.target.value };
                              updateField('diagnostico_dores', updated);
                            }}
                            placeholder="Ex: Prioridade"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Título</Label>
                          <Input
                            value={dor.title}
                            onChange={e => {
                              const updated = [...form.diagnostico_dores];
                              updated[i] = { ...updated[i], title: e.target.value };
                              updateField('diagnostico_dores', updated);
                            }}
                            placeholder="Ex: Ausência de conteúdo estratégico"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrição</Label>
                        <Textarea
                          value={dor.desc}
                          onChange={e => {
                            const updated = [...form.diagnostico_dores];
                            updated[i] = { ...updated[i], desc: e.target.value };
                            updateField('diagnostico_dores', updated);
                          }}
                          placeholder="Descrição do problema..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ─── Step 2: Entregáveis e Cases ─── */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5" /> Entregáveis
              </h3>

              {form.entregaveis.map((ent: any, eIdx: number) => (
                <Card key={eIdx} className="border-border">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Entregável {eIdx + 1}</Label>
                      <Button variant="ghost" size="icon" onClick={() => removeEntregavel(eIdx)} className="h-7 w-7">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Output (ex: "1 vídeo institucional de 2min")</Label>
                      <Input value={ent.output || ''} onChange={e => updateEntregavelOutput(eIdx, e.target.value)} placeholder="Descrição do entregável" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Serviços inclusos</Label>
                      {(ent.items || []).map((item: string, iIdx: number) => (
                        <div key={iIdx} className="flex gap-2">
                          <Input value={item} onChange={e => updateEntregavelItem(eIdx, iIdx, e.target.value)} placeholder="Ex: Roteirização" />
                          <Button variant="ghost" size="icon" onClick={() => removeEntregavelItem(eIdx, iIdx)} disabled={(ent.items || []).length <= 1} className="h-10 w-10 shrink-0">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addEntregavelItem(eIdx)}>
                        <Plus className="h-3 w-3 mr-1" /> Serviço
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" onClick={addEntregavel}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar Entregável
              </Button>

              {/* Cases */}
              <div className="pt-6 border-t border-border space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Video className="h-5 w-5" /> Cases Similares
                </h3>
                <p className="text-xs text-muted-foreground">Adicione projetos similares para referência. O Vimeo ID e Hash são usados para embed automático.</p>

                {form.cases.map((c, idx) => (
                  <Card key={idx} className="border-border">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Case {idx + 1}</Label>
                        <Button variant="ghost" size="icon" onClick={() => removeCase(idx)} className="h-7 w-7">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo (ex: "Vídeo Institucional")</Label>
                          <Input value={c.tipo || ''} onChange={e => updateCase(idx, 'tipo', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Título</Label>
                          <Input value={c.titulo || ''} onChange={e => updateCase(idx, 'titulo', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Vimeo ID</Label>
                          <Input value={c.vimeoId || ''} onChange={e => updateCase(idx, 'vimeoId', e.target.value)} placeholder="Ex: 1234567890" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Vimeo Hash</Label>
                          <Input value={c.vimeoHash || ''} onChange={e => updateCase(idx, 'vimeoHash', e.target.value)} placeholder="Ex: abc123def" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrição</Label>
                        <Textarea value={c.descricao || ''} onChange={e => updateCase(idx, 'descricao', e.target.value)} rows={2} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={!!c.destaque} onCheckedChange={v => updateCase(idx, 'destaque', v)} />
                        <Label className="text-xs">Destaque (aparece maior)</Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" onClick={addCase}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Case
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Investimento e Pagamento ─── */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5" /> Investimento
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor de Tabela (R$)</Label>
                  <Input
                    type="number" min={0} step={0.01}
                    value={form.list_price || ''}
                    onChange={e => updateField('list_price', parseFloat(e.target.value) || 0)}
                    placeholder="Valor riscado (opcional)"
                  />
                  <p className="text-xs text-muted-foreground">Aparece riscado na proposta</p>
                </div>
                <div className="space-y-2">
                  <Label>Valor Base (R$) *</Label>
                  <Input
                    type="number" min={0} step={0.01}
                    value={form.base_value || ''}
                    onChange={e => updateField('base_value', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number" min={0} max={100}
                    value={form.discount_pct || ''}
                    onChange={e => updateField('discount_pct', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              {form.base_value > 0 && (
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <p className="text-sm text-muted-foreground">Preview:</p>
                  {form.list_price > 0 && (
                    <p className="text-sm text-muted-foreground line-through">
                      Tabela: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(form.list_price)}
                    </p>
                  )}
                  {form.discount_pct > 0 && (
                    <p className="text-sm text-green-600 font-medium">Desconto: {form.discount_pct}%</p>
                  )}
                  <p className="text-xl font-bold text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalValue)}
                  </p>
                </div>
              )}

              {/* Payment Options */}
              <div className="pt-4 border-t border-border space-y-4">
                <Label className="text-sm font-semibold">Opções de Pagamento</Label>
                <div className="space-y-2">
                  <Label className="text-xs">Condições gerais</Label>
                  <Textarea value={form.payment_terms} onChange={e => updateField('payment_terms', e.target.value)} rows={2} />
                </div>

                {form.payment_options.map((opt, idx) => (
                  <Card key={idx} className="border-border">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Opção {idx + 1}</Label>
                        <Button variant="ghost" size="icon" onClick={() => removePaymentOption(idx)} className="h-7 w-7">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Título</Label>
                          <Input
                            value={opt.titulo}
                            onChange={e => {
                              const updated = [...form.payment_options];
                              updated[idx] = { ...updated[idx], titulo: e.target.value };
                              updateField('payment_options', updated);
                            }}
                            placeholder="Ex: À Vista"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor</Label>
                          <Input
                            value={opt.valor}
                            onChange={e => {
                              const updated = [...form.payment_options];
                              updated[idx] = { ...updated[idx], valor: e.target.value };
                              updateField('payment_options', updated);
                            }}
                            placeholder="Ex: R$ 25.000"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descrição</Label>
                        <Input
                          value={opt.descricao}
                          onChange={e => {
                            const updated = [...form.payment_options];
                            updated[idx] = { ...updated[idx], descricao: e.target.value };
                            updateField('payment_options', updated);
                          }}
                          placeholder="Ex: Pagamento único com 5% de desconto"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Destaque (badge)</Label>
                          <Input
                            value={opt.destaque || ''}
                            onChange={e => {
                              const updated = [...form.payment_options];
                              updated[idx] = { ...updated[idx], destaque: e.target.value };
                              updateField('payment_options', updated);
                            }}
                            placeholder="Ex: Melhor custo-benefício"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                          <Switch
                            checked={!!opt.recomendado}
                            onCheckedChange={v => {
                              const updated = [...form.payment_options];
                              updated[idx] = { ...updated[idx], recomendado: v };
                              updateField('payment_options', updated);
                            }}
                          />
                          <Label className="text-xs">Recomendado</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" onClick={addPaymentOption}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Opção de Pagamento
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 4: Depoimento e WhatsApp ─── */}
          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Depoimento
              </h3>
              <p className="text-xs text-muted-foreground">Opcional. Aparece na seção de investimento como prova social.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.testimonial_name} onChange={e => updateField('testimonial_name', e.target.value)} placeholder="Ex: João Silva" />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input value={form.testimonial_role} onChange={e => updateField('testimonial_role', e.target.value)} placeholder="Ex: CEO, Empresa X" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Texto do Depoimento</Label>
                <Textarea value={form.testimonial_text} onChange={e => updateField('testimonial_text', e.target.value)} rows={3} placeholder="O que o cliente disse sobre o trabalho..." />
              </div>
              <div className="space-y-2">
                <Label>URL da Foto</Label>
                <Input value={form.testimonial_image} onChange={e => updateField('testimonial_image', e.target.value)} placeholder="https://..." />
                <p className="text-xs text-muted-foreground">URL da foto do depoente. Se vazio, usa imagem padrão.</p>
              </div>

              <div className="pt-6 border-t border-border space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Phone className="h-5 w-5" /> WhatsApp
                </h3>
                <div className="space-y-2">
                  <Label>Número do WhatsApp</Label>
                  <Input value={form.whatsapp_number} onChange={e => updateField('whatsapp_number', e.target.value)} placeholder="5511999999999" />
                  <p className="text-xs text-muted-foreground">Número completo com DDI+DDD. Usado no botão flutuante de aprovação.</p>
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
