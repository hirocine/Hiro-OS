import React from 'react';
import { cn } from '@/lib/utils';
import { ProjectStep } from '@/types/project';
import { stepLabels, stepIcons, stepOrder } from '@/lib/projectSteps';

interface ProjectTimelineProps {
  currentStep: ProjectStep;
  stepHistory: Array<{ step: ProjectStep; timestamp: string; notes?: string }>;
  className?: string;
}

export function ProjectTimeline({ currentStep, stepHistory, className }: ProjectTimelineProps) {
  const getCurrentStepIndex = () => stepOrder.indexOf(currentStep);
  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const getStepDate = (step: ProjectStep) => {
    const historyItem = stepHistory.find(h => h.step === step);
    return historyItem ? new Date(historyItem.timestamp).toLocaleDateString('pt-BR') : null;
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-border z-0">
          <div 
            className="h-full bg-gradient-to-r from-step-separated to-step-verified transition-all duration-500 ease-out"
            style={{ 
              width: `${(currentStepIndex / (stepOrder.length - 1)) * 100}%` 
            }}
          />
        </div>

        {/* Timeline Steps */}
        {stepOrder.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = stepIcons[step];
          const stepDate = getStepDate(step);

          return (
            <div key={step} className="flex flex-col items-center relative z-10 animate-fade-in">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 ease-out",
                  {
                    "bg-step-verified border-step-verified text-step-verified-foreground shadow-lg scale-105": status === 'completed',
                    "bg-warning border-warning text-warning-foreground shadow-elegant animate-pulse": status === 'current',
                    "bg-muted border-border text-muted-foreground hover:bg-muted/80": status === 'pending'
                  }
                )}
              >
                <Icon className={cn(
                  "transition-all duration-300",
                  status === 'current' ? "w-6 h-6" : "w-5 h-5"
                )} />
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center">
                <div
                  className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    {
                      "text-foreground": status === 'completed' || status === 'current',
                      "text-muted-foreground": status === 'pending'
                    }
                  )}
                >
                  {stepLabels[step]}
                </div>

                {/* Step Date */}
                {stepDate && (
                  <div className="text-xs text-muted-foreground mt-1 animate-fade-in">
                    {stepDate}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Timeline (Vertical) - Hidden on desktop */}
      <div className="block md:hidden mt-8 space-y-4">
        {stepOrder.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = stepIcons[step];
          const stepDate = getStepDate(step);

          return (
            <div key={step} className="relative">
              <div className="flex items-center space-x-4">
                {/* Step Circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
                    {
                      "bg-step-verified border-step-verified text-step-verified-foreground": status === 'completed',
                      "bg-warning border-warning text-warning-foreground": status === 'current',
                      "bg-muted border-border text-muted-foreground": status === 'pending'
                    }
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Step Info */}
                <div className="flex-1">
                  <div
                    className={cn(
                      "font-medium transition-colors duration-300",
                      {
                        "text-foreground": status === 'completed' || status === 'current',
                        "text-muted-foreground": status === 'pending'
                      }
                    )}
                  >
                    {stepLabels[step]}
                  </div>
                  {stepDate && (
                    <div className="text-sm text-muted-foreground">
                      {stepDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Line for Mobile */}
              {index < stepOrder.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-5 top-10 w-0.5 h-8 transition-colors duration-300",
                    status === 'completed' ? "bg-step-verified" : "bg-border"
                  )} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}