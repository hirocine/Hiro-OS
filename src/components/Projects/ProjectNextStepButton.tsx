import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProjectStep, Project } from '@/types/project';
import { stepLabels, stepOrder, stepIcons } from '@/lib/projectSteps';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WithdrawalDialog, WithdrawalData } from './WithdrawalDialog';

interface ProjectNextStepButtonProps {
  project: Project;
  onStepUpdate: (newStep: ProjectStep, notes?: string, withdrawalData?: {
    userId: string;
    userName: string;
    withdrawalTime: string;
  }) => void;
  onSeparationClick?: () => void;
  className?: string;
}

export function ProjectNextStepButton({ project, onStepUpdate, onSeparationClick, className }: ProjectNextStepButtonProps) {
  const navigate = useNavigate();
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
  const isWithdrawing = project.step === 'ready_for_pickup' && nextStep === 'in_use';

  const handleClick = () => {
    console.log('🔄 Button clicked', { 
      currentStep: project.step, 
      nextStep, 
      isSeparating, 
      isWithdrawing 
    });
    
    if (isSeparating) {
      navigate(`/projects/${project.id}/separation`);
    } else if (isWithdrawing) {
      console.log('🔓 Opening withdrawal dialog');
      setWithdrawalDialogOpen(true);
    } else {
      console.log('⏭️ Normal step update to:', nextStep);
      onStepUpdate(nextStep);
    }
  };

  const handleWithdrawalConfirm = async (withdrawalData: WithdrawalData) => {
    setLoading(true);
    try {
      await onStepUpdate(nextStep, undefined, {
        userId: withdrawalData.userId,
        userName: withdrawalData.userName,
        withdrawalTime: withdrawalData.withdrawalTime
      });
      setWithdrawalDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size="sm"
        disabled={loading}
        className={cn(
          "h-9 px-4 text-sm font-medium transition-all duration-300 hover:scale-105",
          isCompleting 
            ? "bg-gradient-to-r from-step-verified to-step-verified-foreground text-background shadow-lg hover:shadow-xl" 
            : "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-elegant hover:shadow-xl",
          className
        )}
      >
        <NextStepIcon className="mr-2 h-4 w-4" />
        {loading ? 'Processando...' : 
         isSeparating ? 'Separar' : 
         isWithdrawing ? 'Registrar Retirada' : 
         isCompleting ? 'Finalizar' : 
         `${stepLabels[nextStep]}`}
        {!isCompleting && !loading && <ArrowRight className="ml-2 h-3 w-3" />}
        {isCompleting && <CheckCircle className="ml-2 h-3 w-3" />}
      </Button>

      <WithdrawalDialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        onConfirm={handleWithdrawalConfirm}
        loading={loading}
      />
    </>
  );
}