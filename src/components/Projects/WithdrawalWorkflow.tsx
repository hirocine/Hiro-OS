import React from 'react';
import { cn } from '@/lib/utils';
import { ProjectStep, ProjectStatus, StepChange } from '@/types/project';
import { stepLabels, stepOrder, getStepProgress } from '@/lib/projectSteps';
import { Check, Play } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
  const progress = getStepProgress(currentStep);

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Compact Progress Bar */}
      <div className="flex items-center gap-3">
        <Progress value={progress} className="h-1.5 flex-1" />
        <span className="text-xs font-medium text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Workflow List */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
          <div className="col-span-6 sm:col-span-5">Etapa</div>
          <div className="col-span-3 sm:col-span-4 hidden sm:block">Executado por</div>
          <div className="col-span-6 sm:col-span-3 text-right sm:text-left">Data</div>
        </div>

        {/* Steps */}
        {stepOrder.map((step, index) => {
          const status = getStepStatus(index);
          const stepData = getStepData(step);

          return (
            <div
              key={step}
              className={cn(
                "grid grid-cols-12 gap-2 px-3 py-2 border-b last:border-b-0 transition-colors",
                status === 'current' && "bg-primary/5"
              )}
            >
              {/* Etapa com status inline */}
              <div className="col-span-6 sm:col-span-5 flex items-center gap-2">
                {status === 'completed' && (
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                )}
                {status === 'current' && (
                  <Play className="w-4 h-4 text-primary flex-shrink-0" />
                )}
                {status === 'pending' && (
                  <div className="w-4 h-4 flex-shrink-0" /> 
                )}
                <span className={cn(
                  "text-sm truncate",
                  status === 'completed' && "text-foreground",
                  status === 'current' && "font-medium text-foreground",
                  status === 'pending' && "text-muted-foreground"
                )}>
                  {stepLabels[step]}
                </span>
                {status === 'current' && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                    Atual
                  </Badge>
                )}
              </div>

              {/* Executado por */}
              <div className="col-span-3 sm:col-span-4 hidden sm:flex items-center gap-1.5">
                {stepData.userName ? (
                  <>
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {getInitials(stepData.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{stepData.userName}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>

              {/* Data */}
              <div className="col-span-6 sm:col-span-3 flex items-center justify-end sm:justify-start">
                <span className={cn(
                  "text-sm",
                  !stepData.date && "text-muted-foreground"
                )}>
                  {stepData.date || '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
