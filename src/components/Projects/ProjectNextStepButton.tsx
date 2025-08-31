import React from 'react';
import { Button } from '@/components/ui/button';
import { ProjectStep, Project } from '@/types/project';
import { stepLabels, stepOrder, stepIcons } from '@/lib/projectSteps';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectNextStepButtonProps {
  project: Project;
  onStepUpdate: (newStep: ProjectStep, notes?: string) => void;
  className?: string;
}

export function ProjectNextStepButton({ project, onStepUpdate, className }: ProjectNextStepButtonProps) {
  if (project.status !== 'active') {
    return null;
  }

  const currentStepIndex = stepOrder.indexOf(project.step);
  const nextStep = stepOrder[currentStepIndex + 1];
  
  // If we're at the final step, return null
  if (!nextStep) {
    return null;
  }

  const NextStepIcon = stepIcons[nextStep];
  const isCompleting = nextStep === 'verified';

  const handleClick = () => {
    onStepUpdate(nextStep);
  };

  return (
    <div className={cn("flex justify-center pt-6 border-t border-border", className)}>
      <Button
        onClick={handleClick}
        size="lg"
        className={cn(
          "h-12 px-8 text-base font-medium transition-all duration-300 hover:scale-105",
          isCompleting 
            ? "bg-gradient-to-r from-step-verified to-step-verified-foreground text-background shadow-lg hover:shadow-xl" 
            : "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-elegant hover:shadow-xl"
        )}
      >
        <NextStepIcon className="mr-3 h-5 w-5" />
        {isCompleting ? 'Finalizar Projeto' : `Avançar para ${stepLabels[nextStep]}`}
        {!isCompleting && <ArrowRight className="ml-3 h-4 w-4" />}
        {isCompleting && <CheckCircle className="ml-3 h-4 w-4" />}
      </Button>
    </div>
  );
}