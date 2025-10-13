import React from 'react';
import { cn } from '@/lib/utils';
import { ProjectStep, ProjectStatus } from '@/types/project';
import { stepLabels, stepIcons, stepOrder } from '@/lib/projectSteps';
import { Check } from 'lucide-react';

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
        <div className="flex items-start justify-center gap-6 lg:gap-8 relative max-w-5xl mx-auto py-2">
          {/* Progress Line */}
          <div className="absolute top-[28px] h-0.5 bg-border rounded-full z-0" style={{ 
            left: `calc(${100 / stepOrder.length / 2}% + 20px)`, 
            right: `calc(${100 / stepOrder.length / 2}% + 20px)` 
          }}>
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: `${Math.max(0, (currentStepIndex / (stepOrder.length - 1)) * 100)}%` 
              }}
            />
          </div>

          {/* Timeline Steps */}
          {stepOrder.map((step, index) => {
          const status = getStepStatus(index);
            const Icon = status === 'completed' ? Check : stepIcons[step];
          const stepDate = getStepDate(step);
          const clickable = isStepClickable(index);

          return (
            <div key={step} className="flex flex-col items-center relative z-10 animate-fade-in min-w-0 flex-1">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-out relative",
                  {
                    "bg-green-500 border-green-500 text-white": status === 'completed',
                    "bg-primary/10 border-primary text-primary ring-2 ring-primary/20": status === 'current',
                    "bg-background border-border text-muted-foreground": status === 'pending' && !clickable,
                    "bg-background border-primary border-dashed text-primary hover:bg-primary/5 cursor-pointer": status === 'pending' && clickable
                  }
                )}
                onClick={() => handleStepClick(step, index)}
                title={clickable ? `Clique para avançar para ${stepLabels[step]}` : undefined}
              >
                <Icon 
                  className="w-5 h-5" 
                  strokeWidth={2}
                />
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center px-2 min-w-0">
                <div
                  className={cn(
                    "text-sm font-medium transition-colors duration-200 break-words leading-tight",
                    {
                      "text-foreground": status === 'completed' || status === 'current',
                      "text-muted-foreground": status === 'pending' && !clickable,
                      "text-primary": status === 'pending' && clickable
                    }
                  )}
                >
                  {stepLabels[step]}
                  {clickable && (
                    <div className="text-xs text-primary/70 mt-1 font-normal">
                      Clique para avançar
                    </div>
                  )}
                </div>

                {/* Step Date */}
                {stepDate && (
                  <div className="text-xs text-muted-foreground mt-1.5 font-normal">
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
      <div className="block md:hidden space-y-4">
        {stepOrder.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = status === 'completed' ? Check : stepIcons[step];
          const stepDate = getStepDate(step);
          const clickable = isStepClickable(index);

          return (
            <div key={step} className="relative animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-start space-x-3">
                {/* Step Circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 relative",
                    {
                      "bg-green-500 border-green-500 text-white": status === 'completed',
                      "bg-primary/10 border-primary text-primary ring-2 ring-primary/20": status === 'current',
                      "bg-background border-border text-muted-foreground": status === 'pending' && !clickable,
                      "bg-background border-primary border-dashed text-primary hover:bg-primary/5 cursor-pointer": status === 'pending' && clickable
                    }
                  )}
                  onClick={() => handleStepClick(step, index)}
                  title={clickable ? `Clique para avançar para ${stepLabels[step]}` : undefined}
                >
                  <Icon 
                    className="w-5 h-5" 
                    strokeWidth={2}
                  />
                </div>

                {/* Step Info */}
                <div className="flex-1 pb-1">
                  <div
                    className={cn(
                      "font-medium transition-colors duration-200 text-base leading-tight",
                      {
                        "text-foreground": status === 'completed' || status === 'current',
                        "text-muted-foreground": status === 'pending' && !clickable,
                        "text-primary": status === 'pending' && clickable
                      }
                    )}
                  >
                    {stepLabels[step]}
                    {clickable && (
                      <div className="text-sm text-primary/70 mt-1 font-normal">
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
                    "absolute left-5 top-10 w-0.5 h-8 rounded-full transition-all duration-500",
                    status === 'completed' ? "bg-green-500" : "bg-border"
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