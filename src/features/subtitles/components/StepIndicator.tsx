import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface Props {
  steps: Step[];
  current: number;
  onJump?: (step: number) => void;
}

export function StepIndicator({ steps, current, onJump }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: '14px 18px',
      }}
    >
      {steps.map((step, i) => {
        const isCurrent = current === step.id;
        const isDone = current > step.id;
        const isClickable = !!onJump && (isDone || isCurrent);

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i === steps.length - 1 ? '0 0 auto' : 1, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => isClickable && onJump?.(step.id)}
              disabled={!isClickable}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: isClickable ? 'pointer' : 'default',
                color: isCurrent || isDone ? 'hsl(var(--ds-text))' : 'hsl(var(--ds-fg-3))',
                minWidth: 0,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  border: '1px solid',
                  borderColor: isCurrent || isDone ? 'hsl(var(--ds-text))' : 'hsl(var(--ds-line-2))',
                  background: isDone ? 'hsl(var(--ds-text))' : 'transparent',
                  color: isDone ? 'hsl(var(--ds-surface))' : 'inherit',
                  fontSize: 11,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}
              >
                {isDone ? <Check size={12} strokeWidth={2.5} /> : step.id}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: '"HN Display", sans-serif',
                  fontWeight: 500,
                  letterSpacing: '-0.005em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {step.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'hsl(var(--ds-line-1))',
                  margin: '0 14px',
                  minWidth: 20,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
