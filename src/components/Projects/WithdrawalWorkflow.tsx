import React from 'react';
import { cn } from '@/lib/utils';
import { ProjectStep, ProjectStatus, StepChange } from '@/types/project';
import { stepLabels, stepOrder } from '@/lib/projectSteps';
import { Check, Play, Circle } from 'lucide-react';

interface WithdrawalWorkflowProps {
  currentStep: ProjectStep;
  stepHistory: StepChange[];
  projectStatus?: ProjectStatus;
  className?: string;
  // Step user tracking from project
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
  createdByUser
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
    // First check step history
    const historyItem = stepHistory.find(h => h.step === step);
    if (historyItem) {
      return {
        date: new Date(historyItem.timestamp).toLocaleDateString('pt-BR'),
        userName: historyItem.userName
      };
    }

    // Fallback to user tracking props based on step
    switch (step) {
      case 'pending_separation':
        return {
          date: createdByUser?.time ? new Date(createdByUser.time).toLocaleDateString('pt-BR') : undefined,
          userName: createdByUser?.name
        };
      case 'ready_for_pickup':
        return {
          date: separationUser?.time ? new Date(separationUser.time).toLocaleDateString('pt-BR') : undefined,
          userName: separationUser?.name
        };
      case 'in_use':
        return {
          date: withdrawalUser?.time ? new Date(withdrawalUser.time).toLocaleDateString('pt-BR') : undefined,
          userName: withdrawalUser?.name
        };
      case 'pending_verification':
        return {
          date: verificationUser?.time ? new Date(verificationUser.time).toLocaleDateString('pt-BR') : undefined,
          userName: verificationUser?.name
        };
      case 'office_receipt':
        return {
          date: officeReceiptUser?.time ? new Date(officeReceiptUser.time).toLocaleDateString('pt-BR') : undefined,
          userName: officeReceiptUser?.name
        };
      case 'verified':
        return {
          date: completedByUser?.time ? new Date(completedByUser.time).toLocaleDateString('pt-BR') : undefined,
          userName: completedByUser?.name
        };
      default:
        return {};
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {stepOrder.map((step, index) => {
        const status = getStepStatus(index);
        const stepData = getStepData(step);
        const hasData = stepData.userName || stepData.date;

        return (
          <div
            key={step}
            className={cn(
              "flex items-center gap-3 py-2 px-3 rounded-md transition-colors",
              status === 'current' && "bg-primary/5"
            )}
          >
            {/* Icon */}
            {status === 'completed' && (
              <Check className="w-4 h-4 text-success flex-shrink-0" />
            )}
            {status === 'current' && (
              <Play className="w-4 h-4 text-primary flex-shrink-0" />
            )}
            {status === 'pending' && (
              <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
            )}

            {/* Step name */}
            <span className={cn(
              "text-sm flex-1",
              status === 'completed' && "text-foreground",
              status === 'current' && "font-medium text-foreground",
              status === 'pending' && "text-muted-foreground"
            )}>
              {stepLabels[step]}
            </span>

            {/* User and date info - only show if data exists */}
            {hasData && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {stepData.userName && (
                  <span className="hidden sm:inline">{stepData.userName}</span>
                )}
                {stepData.date && (
                  <span className="tabular-nums">{stepData.date}</span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
