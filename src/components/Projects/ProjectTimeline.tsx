import React from 'react';
import { cn } from '@/lib/utils';
import { ProjectStep, ProjectStatus } from '@/types/project';
import { stepLabels, stepIcons, stepOrder } from '@/lib/projectSteps';

interface ProjectTimelineProps {
  currentStep: ProjectStep;
  stepHistory: Array<{ step: ProjectStep; timestamp: string; notes?: string }>;
  className?: string;
  onStepClick?: (step: ProjectStep) => void;
  isProjectActive?: boolean;
  projectStatus?: ProjectStatus;
}

export function ProjectTimeline({ currentStep, stepHistory, className, onStepClick, isProjectActive = false, projectStatus }: ProjectTimelineProps) {
  const getCurrentStepIndex = () => stepOrder.indexOf(currentStep);
  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) {
      // If project is completed and we're at the final step, show as completed (green)
      if (projectStatus === 'completed' && stepIndex === stepOrder.length - 1) {
        return 'completed';
      }
      return 'current';
    }
    return 'pending';
  };

  const getStepDate = (step: ProjectStep) => {
    const historyItem = stepHistory.find(h => h.step === step);
    return historyItem ? new Date(historyItem.timestamp).toLocaleDateString('pt-BR') : null;
  };

  const isStepClickable = (stepIndex: number) => {
    if (!isProjectActive || !onStepClick) return false;
    // Only allow clicking on the immediate next step
    return stepIndex === currentStepIndex + 1;
  };

  const handleStepClick = (step: ProjectStep, stepIndex: number) => {
    if (isStepClickable(stepIndex)) {
      onStepClick(step);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Timeline */}
      <div className="hidden md:block">
        <div className="flex items-start justify-center gap-4 lg:gap-8 relative max-w-5xl mx-auto">
          {/* Progress Line */}
          <div className="absolute top-6 h-1 bg-muted rounded-full z-0" style={{ 
            left: `calc(${100 / stepOrder.length / 2}% + 28px)`, 
            right: `calc(${100 / stepOrder.length / 2}% + 28px)` 
          }}>
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out shadow-sm",
                currentStepIndex === 0 ? "bg-muted" : "bg-gradient-to-r from-step-verified to-step-verified"
              )}
              style={{ 
                width: `${Math.max(0, (currentStepIndex / (stepOrder.length - 1)) * 100)}%` 
              }}
            />
          </div>

          {/* Timeline Steps */}
          {stepOrder.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = stepIcons[step];
          const stepDate = getStepDate(step);
          const clickable = isStepClickable(index);

          return (
            <div key={step} className="flex flex-col items-center relative z-20 animate-fade-in min-w-0 flex-1">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-14 h-14 rounded-full border-3 flex items-center justify-center transition-all duration-500 ease-out relative z-20",
                  {
                    "bg-step-verified border-step-verified text-step-verified-foreground shadow-lg shadow-step-verified/20 scale-105": status === 'completed',
                    "bg-warning border-warning text-warning-foreground shadow-elegant shadow-warning/30 scale-110": status === 'current',
                    "bg-background border-border text-muted-foreground hover:bg-muted hover:border-muted-foreground/50": status === 'pending' && !clickable,
                    "bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer shadow-md hover:shadow-lg hover:shadow-primary/20 hover:scale-110 ring-2 ring-primary/20 hover:ring-primary/40": status === 'pending' && clickable
                  }
                )}
                onClick={() => handleStepClick(step, index)}
                title={clickable ? `Clique para avançar para ${stepLabels[step]}` : undefined}
              >
                <Icon 
                  className={cn(
                    "transition-all duration-300 z-10",
                    status === 'current' ? "w-7 h-7" : "w-6 h-6"
                  )} 
                  strokeWidth={1.5}
                />
                
                {/* Glow effect for current step */}
                {status === 'current' && (
                  <div className="absolute inset-0 rounded-full bg-warning/20 animate-ping z-0" />
                )}
              </div>

              {/* Step Label */}
              <div className="mt-4 text-center px-2 min-w-0">
                <div
                  className={cn(
                    "text-sm font-medium transition-colors duration-300 break-words leading-tight",
                    {
                      "text-foreground font-semibold": status === 'completed' || status === 'current',
                      "text-muted-foreground": status === 'pending' && !clickable,
                      "text-primary font-semibold": status === 'pending' && clickable
                    }
                  )}
                >
                  {stepLabels[step]}
                  {clickable && (
                    <div className="text-xs text-primary/70 mt-1 animate-pulse font-normal">
                      Clique para avançar
                    </div>
                  )}
                </div>

                {/* Step Date */}
                {stepDate && (
                  <div className="text-xs text-muted-foreground mt-2 animate-fade-in font-normal">
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
      <div className="block md:hidden space-y-6">
        {stepOrder.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = stepIcons[step];
          const stepDate = getStepDate(step);
          const clickable = isStepClickable(index);

          return (
            <div key={step} className="relative animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-start space-x-4">
                {/* Step Circle */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full border-3 flex items-center justify-center flex-shrink-0 transition-all duration-300 relative z-20",
                    {
                      "bg-step-verified border-step-verified text-step-verified-foreground shadow-lg shadow-step-verified/20": status === 'completed',
                      "bg-warning border-warning text-warning-foreground shadow-lg shadow-warning/30": status === 'current',
                      "bg-background border-border text-muted-foreground": status === 'pending' && !clickable,
                      "bg-background border-primary text-primary hover:bg-primary hover:text-primary-foreground cursor-pointer shadow-md hover:shadow-lg ring-2 ring-primary/20": status === 'pending' && clickable
                    }
                  )}
                  onClick={() => handleStepClick(step, index)}
                  title={clickable ? `Clique para avançar para ${stepLabels[step]}` : undefined}
                >
                  <Icon 
                    className={cn(
                      "transition-all duration-300 z-10",
                      status === 'current' ? "w-6 h-6" : "w-5 h-5"
                    )} 
                    strokeWidth={1.5}
                  />
                  
                  {/* Glow effect for current step */}
                  {status === 'current' && (
                    <div className="absolute inset-0 rounded-full bg-warning/20 animate-ping z-0" />
                  )}
                </div>

                {/* Step Info */}
                <div className="flex-1 pb-2">
                  <div
                    className={cn(
                      "font-medium transition-colors duration-300 text-base leading-tight",
                      {
                        "text-foreground font-semibold": status === 'completed' || status === 'current',
                        "text-muted-foreground": status === 'pending' && !clickable,
                        "text-primary font-semibold": status === 'pending' && clickable
                      }
                    )}
                  >
                    {stepLabels[step]}
                    {clickable && (
                      <div className="text-sm text-primary/70 mt-1 animate-pulse font-normal">
                        Toque para avançar
                      </div>
                    )}
                  </div>
                  {stepDate && (
                    <div className="text-sm text-muted-foreground mt-1 font-normal">
                      {stepDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Line for Mobile */}
              {index < stepOrder.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-6 top-12 w-1 h-10 rounded-full transition-all duration-500 z-0",
                    status === 'completed' ? "bg-step-verified shadow-sm" : "bg-muted"
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