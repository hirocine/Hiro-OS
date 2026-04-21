import { useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PaymentOption } from '../types';
import {
  buildPaymentOption,
  detectPreset,
  DEFAULT_PRESET_PARAMS,
  PRESET_OPTIONS,
  PRESET_LABELS,
  recalcPaymentOptions,
  type PaymentPreset,
} from '../lib/paymentPresets';

interface Props {
  value: PaymentOption[];
  onChange: (next: PaymentOption[]) => void;
  finalValue: number;
}

const MAX_OPTIONS = 2;
const MIN_OPTIONS = 1;

export function PaymentOptionsEditor({ value, onChange, finalValue }: Props) {
  const lastFinalValue = useRef<number>(finalValue);

  // Auto-recalculate when finalValue changes (skip first render).
  useEffect(() => {
    if (lastFinalValue.current === finalValue) return;
    lastFinalValue.current = finalValue;
    if (!value.length) return;
    const recalculated = recalcPaymentOptions(value, finalValue);
    // Only push if something actually changed
    const changed = recalculated.some(
      (o, i) => o.valor !== value[i]?.valor || o.descricao !== value[i]?.descricao,
    );
    if (changed) onChange(recalculated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalValue]);

  const updateAt = (i: number, patch: Partial<PaymentOption>) => {
    onChange(value.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  };

  const updateParams = (i: number, paramPatch: Record<string, any>) => {
    const opt = value[i];
    const preset = detectPreset(opt);
    if (preset === 'custom') {
      updateAt(i, { params: { ...(opt.params || {}), ...paramPatch } });
      return;
    }
    const nextParams = { ...(opt.params || DEFAULT_PRESET_PARAMS[preset]), ...paramPatch };
    const rebuilt = buildPaymentOption(preset, nextParams, finalValue, {
      destaque: opt.destaque,
      recomendado: opt.recomendado,
    });
    onChange(value.map((o, idx) => (idx === i ? rebuilt : o)));
  };

  const changePreset = (i: number, nextPreset: PaymentPreset) => {
    const opt = value[i];
    const params = DEFAULT_PRESET_PARAMS[nextPreset];
    const rebuilt = buildPaymentOption(nextPreset, params, finalValue, {
      destaque: opt.destaque,
      recomendado: opt.recomendado,
    });
    onChange(value.map((o, idx) => (idx === i ? rebuilt : o)));
  };

  const addOption = () => {
    if (value.length >= MAX_OPTIONS) return;
    // Choose a preset not yet used; default to entrada_entrega
    const used = new Set(value.map(detectPreset));
    const candidates: PaymentPreset[] = ['entrada_entrega', 'avista_desconto', 'parcelado', 'faturamento'];
    const next = candidates.find(p => !used.has(p)) || 'entrada_entrega';
    const opt = buildPaymentOption(next, DEFAULT_PRESET_PARAMS[next], finalValue);
    onChange([...value, opt]);
  };

  const removeOption = (i: number) => {
    if (value.length <= MIN_OPTIONS) return;
    const next = value.filter((_, idx) => idx !== i);
    // Ensure at least one is "recomendado"
    if (!next.some(o => o.recomendado) && next.length) {
      next[0] = { ...next[0], recomendado: true };
    }
    onChange(next);
  };

  const setRecomendado = (i: number) => {
    onChange(value.map((o, idx) => ({ ...o, recomendado: idx === i })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Condições de Pagamento</Label>
        <span className="text-[11px] text-muted-foreground">
          {value.length}/{MAX_OPTIONS} • mínimo {MIN_OPTIONS}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {value.map((opt, i) => {
          const preset = detectPreset(opt);
          const params = opt.params || DEFAULT_PRESET_PARAMS[preset] || {};
          return (
            <Card
              key={i}
              className={cn(
                'transition-all',
                opt.recomendado && 'border-primary ring-1 ring-primary/20',
              )}
            >
              <CardContent className="pt-4 pb-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={preset} onValueChange={v => changePreset(i, v as PaymentPreset)}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_OPTIONS.map(p => (
                        <SelectItem key={p.value} value={p.value} className="text-xs">
                          {p.label}
                        </SelectItem>
                      ))}
                      {preset === 'custom' && (
                        <SelectItem value="custom" disabled className="text-xs">
                          {PRESET_LABELS.custom}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeOption(i)}
                    disabled={value.length <= MIN_OPTIONS}
                    title={value.length <= MIN_OPTIONS ? 'Mínimo 1 condição' : 'Remover'}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="p-3 rounded-lg bg-muted text-center">
                  <p className="text-[11px] text-muted-foreground mb-0.5">Valor calculado</p>
                  <p className="text-lg font-bold">{opt.valor || '—'}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    {opt.descricao}
                  </p>
                </div>

                {preset === 'faturamento' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dias para faturamento</Label>
                    <Input
                      type="number"
                      min={1}
                      value={params.dias ?? 30}
                      onChange={e => updateParams(i, { dias: Number(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </div>
                )}

                {preset === 'entrada_entrega' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">% Entrada</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={params.pctEntrada ?? 50}
                        onChange={e => {
                          const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                          updateParams(i, { pctEntrada: v, pctEntrega: 100 - v });
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">% Entrega</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={params.pctEntrega ?? 50}
                        onChange={e => {
                          const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                          updateParams(i, { pctEntrega: v, pctEntrada: 100 - v });
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}

                {preset === 'avista_desconto' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">% de desconto</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={params.descontoPct ?? 5}
                      onChange={e => updateParams(i, { descontoPct: Number(e.target.value) || 0 })}
                      className="h-8 text-sm"
                    />
                  </div>
                )}

                {preset === 'parcelado' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nº de parcelas</Label>
                    <Input
                      type="number"
                      min={2}
                      value={params.parcelas ?? 5}
                      onChange={e => updateParams(i, { parcelas: Math.max(2, Number(e.target.value) || 2) })}
                      className="h-8 text-sm"
                    />
                  </div>
                )}

                {preset === 'custom' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">
                      Condição legada — selecione um preset acima para padronizar.
                    </p>
                    <Input
                      value={opt.titulo}
                      onChange={e => updateAt(i, { titulo: e.target.value })}
                      placeholder="Título"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={opt.valor}
                      onChange={e => updateAt(i, { valor: e.target.value })}
                      placeholder="Valor"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={opt.descricao}
                      onChange={e => updateAt(i, { descricao: e.target.value })}
                      placeholder="Descrição"
                      className="h-8 text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Badge / Destaque (opcional)</Label>
                  <Input
                    value={opt.destaque || ''}
                    onChange={e => updateAt(i, { destaque: e.target.value })}
                    placeholder="Ex: Mais comum"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Label className="text-xs text-muted-foreground">Recomendado</Label>
                  <div className="flex items-center gap-2">
                    {opt.recomendado && (
                      <Badge className="text-[10px] px-1.5 py-0">RECOMENDADO</Badge>
                    )}
                    <Switch
                      checked={!!opt.recomendado}
                      onCheckedChange={() => setRecomendado(i)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addOption}
        disabled={value.length >= MAX_OPTIONS}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Adicionar condição
      </Button>
    </div>
  );
}
