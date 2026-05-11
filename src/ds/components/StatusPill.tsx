import type { CSSProperties, ReactNode } from 'react';

type ToneToken = 'success' | 'info' | 'warning' | 'danger' | 'muted' | 'accent';

interface CustomTone {
  /** Full hsl(...) string for the pill text color. */
  color: string;
  /** Optional override for the border color. Defaults to `color` with /0.3 alpha. */
  borderColor?: string;
  /** Optional override for the fill background. Defaults to `color` with /0.08 alpha. */
  background?: string;
}

type Tone = ToneToken | CustomTone;

interface StatusPillProps {
  /** Visible label (e.g. "Urgente"). */
  label: string;
  /** Tone — either a DS token or a custom color object. */
  tone: Tone;
  /**
   * Optional leading node — can be an emoji string ("🔥") or a JSX node
   * (e.g. `<Flame size={11} strokeWidth={1.75} />`).
   */
  icon?: ReactNode;
  /** Visual style. Default `filled` (color + /0.08 bg + /0.3 border). */
  variant?: 'filled' | 'outlined';
  /** Adds `cursor: pointer`. Default `false`. */
  interactive?: boolean;
  /** No text wrap. Default `true`. */
  noWrap?: boolean;
}

const TONE_TOKENS: Record<ToneToken, { color: string; bg: string; border: string }> = {
  success: {
    color: 'hsl(var(--ds-success))',
    bg: 'hsl(var(--ds-success) / 0.08)',
    border: 'hsl(var(--ds-success) / 0.3)',
  },
  info: {
    color: 'hsl(var(--ds-info))',
    bg: 'hsl(var(--ds-info) / 0.08)',
    border: 'hsl(var(--ds-info) / 0.3)',
  },
  warning: {
    color: 'hsl(var(--ds-warning))',
    bg: 'hsl(var(--ds-warning) / 0.08)',
    border: 'hsl(var(--ds-warning) / 0.3)',
  },
  danger: {
    color: 'hsl(var(--ds-danger))',
    bg: 'hsl(var(--ds-danger) / 0.08)',
    border: 'hsl(var(--ds-danger) / 0.3)',
  },
  muted: {
    color: 'hsl(var(--ds-fg-3))',
    bg: 'hsl(var(--ds-line-2) / 0.4)',
    border: 'hsl(var(--ds-line-1))',
  },
  accent: {
    color: 'hsl(var(--ds-accent))',
    bg: 'hsl(var(--ds-accent) / 0.08)',
    border: 'hsl(var(--ds-accent) / 0.3)',
  },
};

/** Convert `hsl(280 70% 60%)` → `hsl(280 70% 60% / 0.3)`. Works with `var()` too. */
function withAlpha(color: string, alpha: number): string {
  // If the string already has an alpha (`/ 0.X`), pass it through unchanged.
  if (color.includes(' / ')) return color;
  return color.replace(/\)\s*$/, ` / ${alpha})`);
}

function resolveTone(tone: Tone, variant: 'filled' | 'outlined'): CSSProperties {
  if (typeof tone === 'string') {
    const t = TONE_TOKENS[tone];
    return {
      color: t.color,
      borderColor: t.border,
      background: variant === 'filled' ? t.bg : 'transparent',
    };
  }
  return {
    color: tone.color,
    borderColor: tone.borderColor ?? withAlpha(tone.color, 0.3),
    background:
      variant === 'filled' ? (tone.background ?? withAlpha(tone.color, 0.08)) : 'transparent',
  };
}

/**
 * Canonical tonal status / priority pill.
 *
 * Unifies the 5 separate Badge components (PriorityBadge, StatusBadge,
 * PPPriorityBadge, PPStatusBadge, ExpertiseBadge) and the ~25 inline
 * tonal-pill patterns scattered across the codebase.
 *
 * Tone is either a DS token or a custom color object — supports
 * non-DS hues (e.g. PP "color grading" purple) without polluting the
 * token set.
 *
 * Examples:
 *   <StatusPill label="Urgente" tone="danger" icon="🔥" />
 *   <StatusPill label="Entregue" tone="success" />
 *   <StatusPill label="Color Grading" tone={{ color: 'hsl(280 70% 60%)' }} />
 *   <StatusPill label="Em produção" tone="info" interactive />
 */
export function StatusPill({
  label,
  tone,
  icon,
  variant = 'filled',
  interactive = false,
  noWrap = true,
}: StatusPillProps) {
  return (
    <span
      className="pill"
      style={{
        ...resolveTone(tone, variant),
        cursor: interactive ? 'pointer' : 'default',
        whiteSpace: noWrap ? 'nowrap' : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {icon !== undefined && icon !== null && (
        <span style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}
      {label}
    </span>
  );
}
