import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProjectStep, Project } from '@/types/project';
import { stepLabels, stepOrder, stepIcons } from '@/lib/projectSteps';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectNextStepButtonProps {
  project: Project;
  onStepUpdate: (newStep: ProjectStep, notes?: string) => void;
  onSeparationClick?: () => void;
  className?: string;
}

export function ProjectNextStepButton({ project, onStepUpdate, onSeparationClick, className }: ProjectNextStepButtonProps) {
  const navigate = useNavigate();
  
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
  const isSeparating = project.step === 'pending_separation' && nextStep === 'separated';

  const handleClick = () => {
    if (isSeparating) {
      navigate(`/projects/${project.id}/separation`);
    } else {
      onStepUpdate(nextStep);
    }
  };

  return (
    <Button
      onClick={handleClick}
      size="sm"
      className={cn(
        "h-9 px-4 text-sm font-medium transition-all duration-300 hover:scale-105",
        isCompleting 
          ? "bg-gradient-to-r from-step-verified to-step-verified-foreground text-background shadow-lg hover:shadow-xl" 
          : "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-elegant hover:shadow-xl",
        className
      )}
    >
      <NextStepIcon className="mr-2 h-4 w-4" />
      {isSeparating ? 'Separar' : isCompleting ? 'Finalizar' : `${stepLabels[nextStep]}`}
      {!isCompleting && <ArrowRight className="ml-2 h-3 w-3" />}
      {isCompleting && <CheckCircle className="ml-2 h-3 w-3" />}
    </Button>
  );
}