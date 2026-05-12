import type { CSSProperties } from 'react';
import { formatMoney, type FormatMoneyOptions } from '../lib/money';

type MoneyTone = 'default' | 'positive' | 'negative' | 'muted';

interface MoneyProps extends FormatMoneyOptions {
  /** Numeric value to render. `null`/`undefined` renders the `fallback`. */
  value: number | null | undefined;
  /**
   * Color tone. `default` inherits, `positive` = success green,
   * `negative` = danger red, `muted` = secondary text.
   */
  tone?: MoneyTone;
  /** Optional class for typography overrides at the call site. */
  className?: string;
  /** Optional inline style for one-off layout tweaks. */
  style?: CSSProperties;
}

const TONE_COLOR: Record<Exclude<MoneyTone, 'default'>, string> = {
  positive: 'hsl(var(--ds-success))',
  negative: 'hsl(var(--ds-danger))',
  muted: 'hsl(var(--ds-fg-3))',
};

/**
 * Canonical currency display. Always uses `tabular-nums` so figures
 * line up in tables. Pass typography via `className` or `style` at the
 * call site (headlines, table cells, etc.).
 *
 * Examples:
 *   <Money value={proposal.total} />
 *   <Money value={deal.estimated_value} tone="positive" />
 *   <Money value={null} fallback="—" />
 *   <Money value={total} fraction={false} className="text-lg font-semibold" />
 */
export function Money({
  value,
  tone = 'default',
  className,
  style,
  ...formatOpts
}: MoneyProps) {
  return (
    <span
      className={className}
      style={{
        fontVariantNumeric: 'tabular-nums',
        color: tone === 'default' ? undefined : TONE_COLOR[tone],
        ...style,
      }}
    >
      {formatMoney(value, formatOpts)}
    </span>
  );
}
