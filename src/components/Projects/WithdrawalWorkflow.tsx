import React from 'react';
import { ProjectStep, ProjectStatus, StepChange } from '@/types/project';
import { stepLabels, stepOrder } from '@/lib/projectSteps';
import { Check, Play, Circle } from 'lucide-react';

interface WithdrawalWorkflowProps {
  currentStep: ProjectStep;
  stepHistory: StepChange[];
  projectStatus?: ProjectStatus;
  className?: string;
  separationUser?: { name?: string; time?: string };
  withdrawalUser?: { name?: string; time?: string };
  verificationUser?: { name?: string; time?: string };
  officeReceiptUser?: { name?: string; time?: string };
  completedByUser?: { name?: string; time?: string };
  createdByUser?: { name?: string; time?: string };
}

export function WithdrawalWorkflow({
  currentStep,
  stepHistory,
  projectStatus,
  className,
  separationUser,
  withdrawalUser,
  verificationUser,
  officeReceiptUser,
  completedByUser,
  createdByUser,
}: WithdrawalWorkflowProps) {
  const currentStepIndex = stepOrder.indexOf(currentStep);

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'pending' => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) {
      if (projectStatus === 'completed' && stepIndex === stepOrder.length - 1) {
        return 'completed';
      }
      return 'current';
    }
    return 'pending';
  };

  const getStepData = (step: ProjectStep): { date?: string; userName?: string } => {
    const historyItem = stepHistory.find((h) => h.step === step);
    if (historyItem) {
      return {
        date: new Date(historyItem.timestamp).toLocaleDateString('pt-BR'),
        userName: historyItem.userName,
      };
    }

    switch (step) {
      case 'pending_separation':
        return {
          date: createdByUser?.time ? new Date(createdByUser.time).toLocaleDateString('pt-BR') : undefined,
          userName: createdByUser?.name,
        };
      case 'ready_for_pickup':
        return {
          date: separationUser?.time ? new Date(separationUser.time).toLocaleDateString('pt-BR') : undefined,
          userName: separationUser?.name,
        };
      case 'in_use':
        return {
          date: withdrawalUser?.time ? new Date(withdrawalUser.time).toLocaleDateString('pt-BR') : undefined,
          userName: withdrawalUser?.name,
        };
      case 'pending_verification':
        return {
          date: verificationUser?.time
            ? new Date(verificationUser.time).toLocaleDateString('pt-BR')
            : undefined,
          userName: verificationUser?.name,
        };
      case 'office_receipt':
        return {
          date: officeReceiptUser?.time
            ? new Date(officeReceiptUser.time).toLocaleDateString('pt-BR')
            : undefined,
          userName: officeReceiptUser?.name,
        };
      case 'verified':
        return {
          date: completedByUser?.time ? new Date(completedByUser.time).toLocaleDateString('pt-BR') : undefined,
          userName: completedByUser?.name,
        };
      default:
        return {};
    }
  };

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {stepOrder.map((step, index) => {
        const status = getStepStatus(index);
        const stepData = getStepData(step);
        const hasData = stepData.userName || stepData.date;

        return (
          <div
            key={step}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              background: status === 'current' ? 'hsl(var(--ds-accent) / 0.05)' : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            {/* Icon */}
            {status === 'completed' && (
              <Check
                size={14}
                strokeWidth={1.75}
                style={{ color: 'hsl(var(--ds-success))', flexShrink: 0 }}
              />
            )}
            {status === 'current' && (
              <Play
                size={14}
                strokeWidth={1.75}
                style={{ color: 'hsl(var(--ds-accent))', flexShrink: 0 }}
              />
            )}
            {status === 'pending' && (
              <Circle
                size={14}
                strokeWidth={1.5}
                style={{ color: 'hsl(var(--ds-fg-4) / 0.5)', flexShrink: 0 }}
              />
            )}

            {/* Step name */}
            <span
              style={{
                fontSize: 13,
                flex: 1,
                fontWeight: status === 'current' ? 500 : 400,
                color:
                  status === 'pending' ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
              }}
            >
              {stepLabels[step]}
            </span>

            {/* User and date info */}
            {hasData && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 13,
                  color: 'hsl(var(--ds-fg-3))',
                }}
              >
                {stepData.userName && (
                  <span className="hidden sm:inline">{stepData.userName}</span>
                )}
                {stepData.date && (
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{stepData.date}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
