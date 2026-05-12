import type { PaymentOption } from '../types';
import { formatMoney } from '@/ds/lib/money';

export type PaymentPreset =
  | 'faturamento'
  | 'entrada_entrega'
  | 'avista_desconto'
  | 'parcelado'
  | 'custom';

export const PRESET_LABELS: Record<PaymentPreset, string> = {
  faturamento: 'Faturamento Nd',
  entrada_entrega: 'Parcelado entrada/entrega',
  avista_desconto: 'À Vista c/ desconto',
  parcelado: 'Parcelado em N x',
  custom: 'Personalizado (legado)',
};

export const PRESET_OPTIONS: { value: PaymentPreset; label: string }[] = [
  { value: 'faturamento', label: PRESET_LABELS.faturamento },
  { value: 'entrada_entrega', label: PRESET_LABELS.entrada_entrega },
  { value: 'avista_desconto', label: PRESET_LABELS.avista_desconto },
  { value: 'parcelado', label: PRESET_LABELS.parcelado },
];

export const DEFAULT_PRESET_PARAMS: Record<PaymentPreset, Record<string, any>> = {
  faturamento: { dias: 30 },
  entrada_entrega: { pctEntrada: 50, pctEntrega: 50 },
  avista_desconto: { descontoPct: 5 },
  parcelado: { parcelas: 5 },
  custom: {},
};

const fmt = (v: number) => formatMoney(Number.isFinite(v) ? v : 0);

export function buildPaymentOption(
  preset: PaymentPreset,
  params: Record<string, any>,
  finalValue: number,
  overrides?: Partial<PaymentOption>,
): PaymentOption {
  let titulo = '';
  let valor = '';
  let descricao = '';

  switch (preset) {
    case 'faturamento': {
      const dias = Number(params.dias) || 30;
      titulo = `Faturamento ${dias}d`;
      valor = fmt(finalValue);
      descricao = `Pagamento único em até ${dias} dias após o faturamento.`;
      break;
    }
    case 'entrada_entrega': {
      const pctE = Number(params.pctEntrada) || 0;
      const pctF = Number(params.pctEntrega) || 0;
      titulo = 'Parcelado';
      valor = `2x ${fmt(finalValue / 2)}`;
      descricao = `${pctE}% no fechamento do contrato + ${pctF}% na entrega do projeto.`;
      break;
    }
    case 'avista_desconto': {
      const desc = Number(params.descontoPct) || 0;
      const valorComDesc = finalValue * (1 - desc / 100);
      titulo = 'À Vista';
      valor = fmt(valorComDesc);
      descricao = `${desc}% de desconto para pagamento único antecipado.`;
      break;
    }
    case 'parcelado': {
      const parcelas = Math.max(1, Number(params.parcelas) || 1);
      titulo = `${parcelas}x sem juros`;
      valor = `${parcelas}x ${fmt(finalValue / parcelas)}`;
      descricao = `Pagamento parcelado em ${parcelas} vezes, sem juros.`;
      break;
    }
    case 'custom': {
      titulo = overrides?.titulo ?? '';
      valor = overrides?.valor ?? '';
      descricao = overrides?.descricao ?? '';
      break;
    }
  }

  return {
    titulo: overrides?.titulo ?? titulo,
    valor: overrides?.valor ?? valor,
    descricao: overrides?.descricao ?? descricao,
    destaque: overrides?.destaque ?? '',
    recomendado: overrides?.recomendado ?? false,
    preset,
    params: { ...params },
  };
}

/** Detect preset for legacy options without `preset` field. */
export function detectPreset(opt: PaymentOption): PaymentPreset {
  if (opt.preset) return opt.preset as PaymentPreset;
  return 'custom';
}

/** Recalculate `valor`/`descricao` of every option preserving `recomendado` and `destaque`. */
export function recalcPaymentOptions(
  options: PaymentOption[],
  finalValue: number,
): PaymentOption[] {
  return options.map(opt => {
    const preset = detectPreset(opt);
    if (preset === 'custom') return opt;
    return buildPaymentOption(preset, opt.params || DEFAULT_PRESET_PARAMS[preset], finalValue, {
      destaque: opt.destaque,
      recomendado: opt.recomendado,
    });
  });
}
