import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Plus, Trash2, ArrowLeft, ArrowRight, Loader2, Check, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProposals } from '../hooks/useProposals';
import { defaultFormData, type ProposalFormData } from '../types';

const STEPS = ['Dados Básicos', 'Mídia e Contexto', 'Escopo e Cronograma', 'Investimento'];

export function ProposalWizard() {
  const navigate = useNavigate();
  const { createProposal } = useProposals();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ProposalFormData>({ ...defaultFormData });
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);

  const updateField = <K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const previews = files.map(f => URL.createObjectURL(f));
    updateField('moodboard_files', [...form.moodboard_files, ...files]);
    updateField('moodboard_previews', [...form.moodboard_previews, ...previews]);
  };

  const removeMoodboardImage = (index: number) => {
    updateField('moodboard_files', form.moodboard_files.filter((_, i) => i !== index));
    updateField('moodboard_previews', form.moodboard_previews.filter((_, i) => i !== index));
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
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Dados Básicos</h3>
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
                    <Calendar
                      mode="single"
                      selected={form.validity_date}
                      onSelect={d => updateField('validity_date', d)}
                      disabled={date => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Mídia e Contexto</h3>
              <div className="space-y-2">
                <Label>Briefing</Label>
                <Textarea value={form.briefing} onChange={e => updateField('briefing', e.target.value)} placeholder="Descreva o briefing do projeto..." rows={6} />
              </div>
              <div className="space-y-2">
                <Label>URL do Vídeo Reel (YouTube/Vimeo)</Label>
                <Input value={form.video_url} onChange={e => updateField('video_url', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className="space-y-2">
                <Label>Moodboard (imagens)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" id="moodboard-upload" />
                  <label htmlFor="moodboard-upload" className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Upload className="h-8 w-8" />
                    <span className="text-sm">Clique para adicionar imagens</span>
                  </label>
                </div>
                {form.moodboard_previews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                    {form.moodboard_previews.map((url, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeMoodboardImage(i)} className="absolute top-1 right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Escopo e Cronograma</h3>
              {/* Scope sections */}
              {([
                { key: 'scope_pre_production' as const, label: 'Pré-Produção' },
                { key: 'scope_production' as const, label: 'Produção' },
                { key: 'scope_post_production' as const, label: 'Pós-Produção' },
              ]).map(({ key, label }) => (
                <div key={key} className="space-y-3">
                  <Label className="text-sm font-semibold">{label}</Label>
                  {form[key].map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={item.item}
                        onChange={e => {
                          const updated = [...form[key]];
                          updated[i] = { item: e.target.value };
                          updateField(key, updated);
                        }}
                        placeholder={`Item de ${label.toLowerCase()}`}
                      />
                      <Button variant="ghost" size="icon" onClick={() => updateField(key, form[key].filter((_, idx) => idx !== i))} disabled={form[key].length <= 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => updateField(key, [...form[key], { item: '' }])}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
              ))}

              {/* Timeline */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Label className="text-sm font-semibold">Cronograma</Label>
                {form.timeline.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={item.week}
                      onChange={e => {
                        const updated = [...form.timeline];
                        updated[i] = { ...updated[i], week: e.target.value };
                        updateField('timeline', updated);
                      }}
                      placeholder="Semana / Data"
                      className="w-1/3"
                    />
                    <Input
                      value={item.description}
                      onChange={e => {
                        const updated = [...form.timeline];
                        updated[i] = { ...updated[i], description: e.target.value };
                        updateField('timeline', updated);
                      }}
                      placeholder="Descrição da etapa"
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => updateField('timeline', form.timeline.filter((_, idx) => idx !== i))} disabled={form.timeline.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => updateField('timeline', [...form.timeline, { week: '', description: '' }])}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Etapa
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Investimento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Base (R$)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.base_value || ''}
                    onChange={e => updateField('base_value', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desconto (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.discount_pct || ''}
                    onChange={e => updateField('discount_pct', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Condições de Pagamento</Label>
                <Textarea value={form.payment_terms} onChange={e => updateField('payment_terms', e.target.value)} rows={3} />
              </div>

              {/* Preview */}
              {form.base_value > 0 && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Preview do Investimento:</p>
                  {form.discount_pct > 0 && (
                    <p className="text-sm text-muted-foreground line-through">
                      Subtotal: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(form.base_value)}
                    </p>
                  )}
                  {form.discount_pct > 0 && (
                    <p className="text-sm text-success font-medium">Desconto: {form.discount_pct}%</p>
                  )}
                  <p className="text-xl font-bold text-foreground">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalValue)}
                  </p>
                </div>
              )}
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
