import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ChipTone = 'muted' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

interface FilterChipProps {
  label: string;
  active?: boolean;
  /** Tone of the leading dot. If omitted no dot is shown. */
  dot?: ChipTone;
  /** Optional avatar/icon node (rendered before label). */
  prefix?: ReactNode;
  /** Optional count rendered inside the chip (e.g. category counts). */
  count?: number;
  onClick?: () => void;
  ariaLabel?: string;
}

const TONE_COLORS: Record<ChipTone, string> = {
  muted: 'hsl(var(--ds-fg-4))',
  accent: 'hsl(var(--ds-accent))',
  success: 'hsl(var(--ds-success))',
  warning: 'hsl(var(--ds-warning))',
  danger: 'hsl(var(--ds-danger))',
  info: 'hsl(var(--ds-info))',
};

/**
 * Canonical filter chip — extends the `.pill` primitive with optional
 * tonal dot, prefix slot (for avatars), and counter.
 *
 * Replaces:
 *   - `.chip-pick` button (used only in Policies)
 *   - PP's untoned priority pills (dots were grey for all priorities)
 *   - inline-styled chips in various pages
 */
export function FilterChip({
  label,
  active,
  dot,
  prefix,
  count,
  onClick,
  ariaLabel,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('pill', active && 'acc')}
      aria-label={ariaLabel ?? label}
      aria-pressed={!!active}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
      }}
    >
      {dot && (
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: TONE_COLORS[dot],
            flexShrink: 0,
          }}
        />
      )}
      {prefix && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{prefix}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          style={{
            fontSize: 10,
            fontVariantNumeric: 'tabular-nums',
            color: active ? 'currentColor' : 'hsl(var(--ds-fg-4))',
            opacity: active ? 0.7 : 1,
            marginLeft: 2,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface FilterChipRowProps {
  children: ReactNode;
}

/**
 * Container for a row of `<FilterChip>` — wraps to next line as needed.
 *
 * Position rule (PageToolbar): linha 04, sempre alinhada à esquerda.
 */
export function FilterChipRow({ children }: FilterChipRowProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      {children}
    </div>
  );
}
