import React from 'react';
import { ProjectStep, ProjectStatus } from '@/types/project';
import { stepLabels, stepIcons, stepOrder } from '@/lib/projectSteps';
import { Check } from 'lucide-react';

interface ProjectTimelineProps {
  currentStep: ProjectStep;
  stepHistory: Array<{ step: ProjectStep; timestamp: string; notes?: string }>;
  className?: string;
  projectStatus?: ProjectStatus;
}

type StepStatus = 'completed' | 'current' | 'pending';

function stepStyles(status: StepStatus) {
  switch (status) {
    case 'completed':
      return {
        background: 'hsl(var(--ds-success))',
        border: '1px solid hsl(var(--ds-success))',
        color: '#fff',
      };
    case 'current':
      return {
        background: 'hsl(var(--ds-surface))',
        border: '1px solid hsl(var(--ds-accent))',
        color: 'hsl(var(--ds-accent))',
        boxShadow: '0 0 0 2px hsl(var(--ds-accent) / 0.2)',
      };
    case 'pending':
      return {
        background: 'hsl(var(--ds-surface))',
        border: '1px solid hsl(var(--ds-line-1))',
        color: 'hsl(var(--ds-fg-3))',
      };
  }
}

export function ProjectTimeline({
  currentStep,
  stepHistory,
  className,
  projectStatus,
}: ProjectTimelineProps) {
  const currentStepIndex = stepOrder.indexOf(currentStep);

  const getStepStatus = (stepIndex: number): StepStatus => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) {
      if (projectStatus === 'completed' && stepIndex === stepOrder.length - 1) {
        return 'completed';
      }
      return 'current';
    }
    return 'pending';
  };

  const getStepDate = (step: ProjectStep) => {
    const historyItem = stepHistory.find((h) => h.step === step);
    return historyItem ? new Date(historyItem.timestamp).toLocaleDateString('pt-BR') : null;
  };

  const progressPct = Math.max(0, (currentStepIndex / (stepOrder.length - 1)) * 100);

  return (
    <div className={className} style={{ width: '100%' }}>
      {/* Desktop Timeline */}
      <div className="hidden md:block">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 24,
            position: 'relative',
            maxWidth: 960,
            margin: '0 auto',
            padding: '8px 0',
          }}
        >
          {/* Progress Line */}
          <div
            style={{
              position: 'absolute',
              top: 28,
              height: 2,
              background: 'hsl(var(--ds-line-1))',
              zIndex: 0,
              left: `calc(${100 / stepOrder.length / 2}% + 20px)`,
              right: `calc(${100 / stepOrder.length / 2}% + 20px)`,
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'hsl(var(--ds-success))',
                width: `${progressPct}%`,
                transition: 'width 0.7s ease-out',
              }}
            />
          </div>

          {/* Timeline Steps */}
          {stepOrder.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = status === 'completed' ? Check : stepIcons[step];
            const stepDate = getStepDate(step);
            const styles = stepStyles(status);

            return (
              <div
                key={step}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 10,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {/* Step Circle */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    display: 'grid',
                    placeItems: 'center',
                    position: 'relative',
                    transition: 'all 0.3s ease-out',
                    ...styles,
                  }}
                >
                  {status === 'current' && (
                    <span
                      aria-hidden
                      style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        inset: 3,
                        background: 'hsl(var(--ds-accent) / 0.08)',
                      }}
                    />
                  )}
                  <Icon size={18} strokeWidth={1.75} />
                </div>

                {/* Step Label */}
                <div style={{ marginTop: 12, textAlign: 'center', padding: '0 8px', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      lineHeight: 1.2,
                      wordBreak: 'break-word',
                      color:
                        status === 'pending' ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
                      transition: 'color 0.2s',
                    }}
                  >
                    {stepLabels[step]}
                  </div>

                  {stepDate && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--ds-fg-3))',
                        marginTop: 6,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {stepDate}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Timeline (Vertical) */}
      <div className="block md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {stepOrder.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = status === 'completed' ? Check : stepIcons[step];
          const stepDate = getStepDate(step);
          const styles = stepStyles(status);

          return (
            <div
              key={step}
              className="animate-fade-in"
              style={{ position: 'relative', animationDelay: `${index * 100}ms` }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Step Circle */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    position: 'relative',
                    transition: 'all 0.3s',
                    ...styles,
                  }}
                >
                  {status === 'current' && (
                    <span
                      aria-hidden
                      style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        inset: 3,
                        background: 'hsl(var(--ds-accent) / 0.08)',
                      }}
                    />
                  )}
                  <Icon size={18} strokeWidth={1.75} />
                </div>

                {/* Step Info */}
                <div style={{ flex: 1, paddingBottom: 4 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 15,
                      lineHeight: 1.2,
                      color:
                        status === 'pending' ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
                      transition: 'color 0.2s',
                    }}
                  >
                    {stepLabels[step]}
                  </div>
                  {stepDate && (
                    <div
                      style={{
                        fontSize: 13,
                        color: 'hsl(var(--ds-fg-3))',
                        marginTop: 4,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {stepDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Line for Mobile */}
              {index < stepOrder.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 20,
                    top: 40,
                    width: 2,
                    height: 32,
                    background: status === 'completed' ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-line-1))',
                    transition: 'background 0.5s',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
