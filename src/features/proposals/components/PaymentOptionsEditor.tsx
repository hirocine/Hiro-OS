import { useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const eyebrowLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

export function PaymentOptionsEditor({ value, onChange, finalValue }: Props) {
  const lastFinalValue = useRef<number>(finalValue);

  // Auto-recalculate when finalValue changes (skip first render).
  useEffect(() => {
    if (finalValue <= 0) return;
    if (lastFinalValue.current === finalValue) return;
    lastFinalValue.current = finalValue;
    if (!value.length) return;
    const recalculated = recalcPaymentOptions(value, finalValue);
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
    const used = new Set(value.map(detectPreset));
    const candidates: PaymentPreset[] = ['entrada_entrega', 'avista_desconto', 'parcelado', 'faturamento'];
    const next = candidates.find(p => !used.has(p)) || 'entrada_entrega';
    const opt = buildPaymentOption(next, DEFAULT_PRESET_PARAMS[next], finalValue);
    onChange([...value, opt]);
  };

  const removeOption = (i: number) => {
    if (value.length <= MIN_OPTIONS) return;
    const next = value.filter((_, idx) => idx !== i);
    if (!next.some(o => o.recomendado) && next.length) {
      next[0] = { ...next[0], recomendado: true };
    }
    onChange(next);
  };

  const setRecomendado = (i: number) => {
    onChange(value.map((o, idx) => ({ ...o, recomendado: idx === i })));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={eyebrowLabel}>Condições de Pagamento</label>
        <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
          {value.length}/{MAX_OPTIONS} • mínimo {MIN_OPTIONS}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {value.map((opt, i) => {
          const preset = detectPreset(opt);
          const params = opt.params || DEFAULT_PRESET_PARAMS[preset] || {};
          return (
            <div
              key={i}
              style={{
                border: opt.recomendado
                  ? '1px solid hsl(var(--ds-accent) / 0.4)'
                  : '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-surface))',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Select value={preset} onValueChange={v => changePreset(i, v as PaymentPreset)}>
                      <SelectTrigger className="h-8 text-xs">
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
                  </div>
                  <button
                    type="button"
                    className="btn"
                    style={{ width: 28, height: 28, padding: 0, justifyContent: 'center', flexShrink: 0 }}
                    onClick={() => removeOption(i)}
                    disabled={value.length <= MIN_OPTIONS}
                    title={value.length <= MIN_OPTIONS ? 'Mínimo 1 condição' : 'Remover'}
                  >
                    <X size={13} strokeWidth={1.5} />
                  </button>
                </div>

                <div
                  style={{
                    padding: 12,
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                    border: '1px solid hsl(var(--ds-line-1))',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginBottom: 2 }}>
                    Valor calculado
                  </p>
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'hsl(var(--ds-fg-1))',
                      fontVariantNumeric: 'tabular-nums',
                      fontFamily: '"HN Display", sans-serif',
                    }}
                  >
                    {opt.valor || '—'}
                  </p>
                  <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4, lineHeight: 1.4 }}>
                    {opt.descricao}
                  </p>
                </div>

                {preset === 'faturamento' && (
                  <div>
                    <label style={eyebrowLabel}>Dias para faturamento</label>
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
                    <div>
                      <label style={eyebrowLabel}>% Entrada</label>
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
                    <div>
                      <label style={eyebrowLabel}>% Entrega</label>
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
                  <div>
                    <label style={eyebrowLabel}>% de desconto</label>
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
                  <div>
                    <label style={eyebrowLabel}>Nº de parcelas</label>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
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

                <div>
                  <label style={eyebrowLabel}>Badge / Destaque (opcional)</label>
                  <Input
                    value={opt.destaque || ''}
                    onChange={e => updateAt(i, { destaque: e.target.value })}
                    placeholder="Ex: Mais comum"
                    className="h-8 text-sm"
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 4,
                  }}
                >
                  <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>Recomendado</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {opt.recomendado && (
                      <span
                        className="pill"
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          color: 'hsl(var(--ds-accent))',
                          borderColor: 'hsl(var(--ds-accent) / 0.3)',
                          background: 'hsl(var(--ds-accent) / 0.08)',
                          letterSpacing: '0.1em',
                        }}
                      >
                        RECOMENDADO
                      </span>
                    )}
                    <Switch
                      checked={!!opt.recomendado}
                      onCheckedChange={() => setRecomendado(i)}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="btn"
        onClick={addOption}
        disabled={value.length >= MAX_OPTIONS}
        style={{ alignSelf: 'flex-start' }}
      >
        <Plus size={13} strokeWidth={1.5} />
        <span>Adicionar condição</span>
      </button>
    </div>
  );
}
