import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

export const DS = {
  bg: 'hsl(var(--ds-background))',
  surface: 'hsl(var(--ds-surface))',
  surface2: 'hsl(var(--ds-surface-2))',
  surface3: 'hsl(var(--ds-surface-3))',
  fg1: 'hsl(var(--ds-fg-1))',
  fg2: 'hsl(var(--ds-fg-2))',
  fg3: 'hsl(var(--ds-fg-3))',
  fg4: 'hsl(var(--ds-fg-4))',
  line1: 'hsl(var(--ds-line-1))',
  line2: 'hsl(var(--ds-line-2))',
  line3: 'hsl(var(--ds-line-3))',
  accent: 'hsl(var(--ds-accent))',
  accentBright: 'hsl(var(--ds-accent-bright))',
  accentDeep: 'hsl(var(--ds-accent-deep))',
  accentSoft: 'hsl(var(--ds-accent-soft))',
  warn: 'hsl(var(--ds-warn))',
  warnSoft: 'hsl(43 89% 92%)',
  danger: 'hsl(var(--ds-danger))',
  dangerSoft: 'hsl(0 60% 95%)',
  info: 'hsl(var(--ds-info))',
  infoSoft: 'hsl(209 71% 95%)',
  mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
} as const;

export const TYPO = {
  display: '"HN Display", Helvetica, sans-serif',
  text: '"HN Text", Helvetica, sans-serif',
} as const;

export interface WizardStep {
  id: number;
  num: string;
  title: string;
}

interface StepStripProps {
  steps: WizardStep[];
  current: number;
  onJump?: (step: number) => void;
  canVisit?: (step: number) => boolean;
}

export function StepStrip({ steps, current, onJump, canVisit }: StepStripProps) {
  return (
    <nav
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${steps.length}, 1fr)`,
        borderBottom: `1px solid ${DS.line1}`,
        borderTop: `1px solid ${DS.line1}`,
        background: DS.surface,
      }}
    >
      {steps.map((step, i) => {
        const isDone = current > step.id;
        const isCurrent = current === step.id;
        const allowed = canVisit ? canVisit(step.id) : isDone || isCurrent;
        const isFutureBlocked = !isDone && !isCurrent && !allowed;
        const cursor = isFutureBlocked ? 'not-allowed' : allowed && onJump ? 'pointer' : 'default';
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => allowed && onJump?.(step.id)}
            disabled={!allowed}
            title={isFutureBlocked ? (step.id === 3 ? 'Processe a legenda antes de revisar' : 'Aprove a revisão antes de exportar') : undefined}
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              borderRight: i < steps.length - 1 ? `1px solid ${DS.line1}` : 'none',
              minWidth: 0,
              position: 'relative',
              cursor,
              background: isCurrent ? DS.bg : 'transparent',
              color: isDone || isCurrent ? DS.fg1 : DS.fg3,
              opacity: isFutureBlocked ? 0.5 : 1,
              textAlign: 'left',
              border: 'none',
              borderLeft: 0,
              borderTop: 0,
              borderBottom: 0,
              transition: 'background 120ms, opacity 120ms',
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1.5px solid ${isDone ? DS.accent : isCurrent ? DS.fg1 : DS.line3}`,
                background: isDone ? DS.accent : DS.bg,
                fontFamily: TYPO.display,
                fontWeight: 500,
                fontSize: 10,
                color: isDone ? '#0A0A0A' : isCurrent ? DS.fg1 : DS.fg3,
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}
            >
              {isDone ? <Check size={11} strokeWidth={2.5} /> : step.num}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: TYPO.display,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: isDone ? DS.accentDeep : isCurrent ? DS.fg1 : DS.fg4,
                }}
              >
                {isDone ? 'Concluído' : isCurrent ? 'Atual' : `Passo ${step.num}`}
              </span>
              <span
                style={{
                  fontFamily: TYPO.display,
                  fontWeight: 500,
                  fontSize: 13,
                  letterSpacing: '-0.005em',
                  color: isDone || isCurrent ? DS.fg1 : DS.fg3,
                }}
              >
                {step.title}
              </span>
            </div>
            {isCurrent && (
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 2,
                  background: DS.fg1,
                  pointerEvents: 'none',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

interface SectionProps {
  ix: string;
  title: string;
  right?: ReactNode;
  children: ReactNode;
  noBorder?: boolean;
}

export function Section({ ix, title, right, children, noBorder }: SectionProps) {
  return (
    <section
      style={{
        padding: '32px 40px',
        borderBottom: noBorder ? 'none' : `1px solid ${DS.line1}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
        <h2
          style={{
            fontFamily: TYPO.display,
            fontWeight: 500,
            fontSize: 18,
            letterSpacing: '-0.015em',
            color: DS.fg1,
            margin: 0,
          }}
        >
          <span style={{ color: DS.fg4, fontVariantNumeric: 'tabular-nums', marginRight: 10 }}>
            {ix}
          </span>
          {title}
        </h2>
        {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
      </div>
      {children}
    </section>
  );
}

interface PageHeaderProps {
  eyebrow: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        padding: '28px 40px 24px',
        borderBottom: `1px solid ${DS.line1}`,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontFamily: TYPO.display,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: DS.fg3,
            margin: '0 0 8px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {eyebrow}
        </p>
        <h1
          style={{
            fontFamily: TYPO.display,
            fontWeight: 500,
            fontSize: 40,
            letterSpacing: '-0.03em',
            lineHeight: 1.04,
            margin: '0 0 12px',
            color: DS.fg1,
            maxWidth: '18ch',
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              color: DS.fg3,
              lineHeight: 1.55,
              maxWidth: '62ch',
              fontFamily: TYPO.text,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            border: `1px solid ${DS.line2}`,
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

export function PageAction({
  icon,
  children,
  onClick,
  iconOnly,
}: {
  icon: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  iconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 34,
        padding: iconOnly ? 0 : '0 14px',
        width: iconOnly ? 34 : undefined,
        justifyContent: iconOnly ? 'center' : undefined,
        fontFamily: TYPO.display,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: DS.fg2,
        borderRight: `1px solid ${DS.line2}`,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'color 120ms, background 120ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = DS.fg1;
        e.currentTarget.style.background = DS.surface2;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = DS.fg2;
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ display: 'inline-flex' }}>{icon}</span>
      {children}
    </button>
  );
}

interface WizardFooterProps {
  hint?: ReactNode;
  children: ReactNode;
}

export function WizardFooter({ hint, children }: WizardFooterProps) {
  return (
    <footer
      style={{
        position: 'sticky',
        bottom: 0,
        background: DS.surface,
        borderTop: `1px solid ${DS.line1}`,
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        zIndex: 10,
      }}
    >
      {hint && (
        <span
          style={{
            fontSize: 12,
            color: DS.fg3,
            fontFamily: TYPO.text,
          }}
        >
          {hint}
        </span>
      )}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'stretch',
          gap: 8,
        }}
      >
        {children}
      </div>
    </footer>
  );
}

export function FooterButton({
  children,
  onClick,
  primary,
  disabled,
  icon,
  iconRight,
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 32,
        padding: '0 14px',
        fontFamily: TYPO.display,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: primary ? DS.bg : DS.fg2,
        background: primary ? DS.fg1 : DS.bg,
        border: `1px solid ${primary ? DS.fg1 : DS.line2}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'color 120ms, background 120ms, border-color 120ms',
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (primary) {
          e.currentTarget.style.background = DS.accent;
          e.currentTarget.style.color = '#0A0A0A';
          e.currentTarget.style.borderColor = DS.accent;
        } else {
          e.currentTarget.style.background = DS.surface2;
          e.currentTarget.style.color = DS.fg1;
          e.currentTarget.style.borderColor = DS.line3;
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (primary) {
          e.currentTarget.style.background = DS.fg1;
          e.currentTarget.style.color = DS.bg;
          e.currentTarget.style.borderColor = DS.fg1;
        } else {
          e.currentTarget.style.background = DS.bg;
          e.currentTarget.style.color = DS.fg2;
          e.currentTarget.style.borderColor = DS.line2;
        }
      }}
    >
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      {children}
      {iconRight && <span style={{ display: 'inline-flex' }}>{iconRight}</span>}
    </button>
  );
}

export function EyebrowDot({ children, color = 'accent' }: { children: ReactNode; color?: 'accent' | 'warn' | 'danger' | 'info' }) {
  const c = color === 'accent' ? DS.accent : color === 'warn' ? DS.warn : color === 'danger' ? DS.danger : DS.info;
  const deep = color === 'accent' ? DS.accentDeep : color === 'warn' ? DS.warn : color === 'danger' ? DS.danger : DS.info;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: deep,
      }}
    >
      <span style={{ width: 6, height: 6, background: c, display: 'inline-block' }} />
      {children}
    </span>
  );
}

interface StatItem {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  hintColor?: 'default' | 'warn' | 'ok' | 'danger';
  valueColor?: 'default' | 'warn' | 'danger';
}

export function StatsGrid({ items, columns = 4 }: { items: StatItem[]; columns?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        border: `1px solid ${DS.line1}`,
      }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            padding: '18px 18px 16px',
            borderRight: (i + 1) % columns !== 0 ? `1px solid ${DS.line1}` : 'none',
            borderBottom: i < items.length - columns ? `1px solid ${DS.line1}` : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: TYPO.display,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: DS.fg4,
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              fontFamily: TYPO.display,
              fontWeight: 500,
              fontSize: 22,
              color: item.valueColor === 'warn' ? DS.warn : item.valueColor === 'danger' ? DS.danger : DS.fg1,
              letterSpacing: '-0.015em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}
          >
            {item.value}
          </span>
          {item.hint && (
            <span
              style={{
                fontSize: 11,
                color:
                  item.hintColor === 'warn' ? DS.warn :
                  item.hintColor === 'ok' ? DS.accentDeep :
                  item.hintColor === 'danger' ? DS.danger :
                  DS.fg4,
                fontFamily: TYPO.display,
                letterSpacing: '0.04em',
              }}
            >
              {item.hint}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function StatValueSmall({ children }: { children: ReactNode }) {
  return (
    <small style={{ fontSize: 11, color: DS.fg3, fontWeight: 400, letterSpacing: 0, marginLeft: 6 }}>
      {children}
    </small>
  );
}
