/**
 * ════════════════════════════════════════════════════════════════
 * MONEY — canonical currency formatter
 * ════════════════════════════════════════════════════════════════
 *
 * Single source of truth for currency formatting in the platform.
 * All call sites — string output for toasts/PDFs/CSV and JSX output
 * via <Money> — funnel through here.
 *
 * Use `formatMoney(value, options?)` when you need the string.
 * Use `<Money value={...} />` from `@/ds/components/Money` when
 * you're rendering JSX (it adds `tabular-nums` automatically).
 */

export interface FormatMoneyOptions {
  /** ISO 4217 currency code. Default `'BRL'`. */
  currency?: 'BRL';
  /** BCP 47 locale tag. Default `'pt-BR'`. */
  locale?: string;
  /**
   * Whether to render the fraction digits.
   * `true`  → `R$ 1.234,56` (default)
   * `false` → `R$ 1.234`     (rounded, used in proposal totals/PDFs)
   */
  fraction?: boolean;
  /** Text to return when `value` is null/undefined. Default `'R$ 0'`. */
  fallback?: string;
}

/**
 * Format a numeric value as a localized currency string. Null/undefined
 * returns `fallback` so callers don't have to guard.
 *
 * Examples:
 *   formatMoney(1234.5)               → 'R$ 1.234,50'
 *   formatMoney(1234.5, { fraction: false }) → 'R$ 1.235'
 *   formatMoney(null)                  → 'R$ 0'
 *   formatMoney(null, { fallback: '—' }) → '—'
 */
export function formatMoney(
  value: number | null | undefined,
  options?: FormatMoneyOptions,
): string {
  const {
    currency = 'BRL',
    locale = 'pt-BR',
    fraction = true,
    fallback = 'R$ 0',
  } = options ?? {};

  if (value == null || Number.isNaN(value)) return fallback;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fraction ? 2 : 0,
    maximumFractionDigits: fraction ? 2 : 0,
  }).format(value);
}
