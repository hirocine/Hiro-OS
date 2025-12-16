import React from 'react';
import { cn } from '@/lib/utils';
import { ProjectStep, ProjectStatus, StepChange } from '@/types/project';
import { stepLabels, stepIcons, stepOrder, getStepProgress } from '@/lib/projectSteps';
import { Check, Circle, Play } from 'lucide-react';
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

  const getStatusBadge = (status: 'completed' | 'current' | 'pending') => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="text-xs">Concluído</Badge>;
      case 'current':
        return <Badge variant="default" className="text-xs">Atual</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-xs text-muted-foreground">Pendente</Badge>;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Workflow List */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-5 md:col-span-4">Etapa</div>
          <div className="col-span-4 md:col-span-3 hidden sm:block">Executado por</div>
          <div className="col-span-3 md:col-span-3 hidden md:block">Data</div>
          <div className="col-span-7 sm:col-span-3 md:col-span-2 text-right sm:text-left">Status</div>
        </div>

        {/* Steps */}
        {stepOrder.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = stepIcons[step];
          const stepData = getStepData(step);

          return (
            <div
              key={step}
              className={cn(
                "grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-b-0 transition-colors",
                status === 'current' && "bg-primary/5",
                status === 'completed' && "bg-success/5"
              )}
            >
              {/* Etapa */}
              <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    status === 'completed' && "bg-success text-success-foreground",
                    status === 'current' && "bg-primary text-primary-foreground",
                    status === 'pending' && "bg-muted text-muted-foreground"
                  )}
                >
                  {status === 'completed' ? (
                    <Check className="w-4 h-4" />
                  ) : status === 'current' ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={cn(
                    "w-4 h-4 flex-shrink-0",
                    status === 'completed' && "text-success",
                    status === 'current' && "text-primary",
                    status === 'pending' && "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium truncate",
                    status === 'pending' && "text-muted-foreground"
                  )}>
                    {stepLabels[step]}
                  </span>
                </div>
              </div>

              {/* Executado por */}
              <div className="col-span-4 md:col-span-3 hidden sm:flex items-center gap-2">
                {stepData.userName ? (
                  <>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
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
              <div className="col-span-3 md:col-span-3 hidden md:flex items-center">
                <span className={cn(
                  "text-sm",
                  !stepData.date && "text-muted-foreground"
                )}>
                  {stepData.date || '—'}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-7 sm:col-span-3 md:col-span-2 flex items-center justify-end sm:justify-start">
                {getStatusBadge(status)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
