import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProjectStep, Project } from '@/types/project';
import { stepLabels, stepOrder, stepIcons } from '@/lib/projectSteps';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WithdrawalDialog, WithdrawalData } from './WithdrawalDialog';
import { OfficeReceiptDialog, OfficeReceiptData } from './OfficeReceiptDialog';
import { CompletionDialog } from './CompletionDialog';
import { logger } from '@/lib/logger';

interface ProjectNextStepButtonProps {
  project: Project;
  onStepUpdate: (newStep: ProjectStep, notes?: string, userData?: {
    userId: string;
    userName: string;
    timestamp: string;
  }) => void;
  onSeparationClick?: () => void;
  className?: string;
}

export function ProjectNextStepButton({ project, onStepUpdate, onSeparationClick, className }: ProjectNextStepButtonProps) {
  const navigate = useNavigate();
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [officeReceiptDialogOpen, setOfficeReceiptDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
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
  const isWithdrawing = project.step === 'ready_for_pickup' && nextStep === 'in_use';
  const isVerifying = project.step === 'in_use' && nextStep === 'pending_verification';
  const isOfficeReceipt = project.step === 'pending_verification' && nextStep === 'office_receipt';
  const isSeparating = project.step === 'pending_separation' && nextStep === 'ready_for_pickup';

  const handleClick = () => {
    logger.debug('Project next step button clicked', {
      module: 'project-step',
      action: 'button_clicked',
      data: {
        currentStep: project.step, 
        nextStep, 
        isWithdrawing,
        isOfficeReceipt,
        isSeparating,
        projectId: project.id
      }
    });
    
    if (isSeparating) {
      logger.debug('Navigating to separation page', {
        module: 'project-step',
        action: 'navigate_separation',
        data: { projectId: project.id }
      });
      navigate(`/projetos/${project.id}/separacao`);
    } else if (isWithdrawing) {
      logger.debug('Opening withdrawal dialog', {
        module: 'project-step',
        action: 'open_withdrawal_dialog',
        data: { projectId: project.id }
      });
      setWithdrawalDialogOpen(true);
    } else if (isVerifying) {
      logger.debug('Navigating to verification page', {
        module: 'project-step',
        action: 'navigate_verification',
        data: { projectId: project.id }
      });
      navigate(`/projetos/${project.id}/verificacao`);
    } else if (isOfficeReceipt) {
      logger.debug('Opening office receipt dialog', {
        module: 'project-step',
        action: 'open_office_receipt_dialog',
        data: { projectId: project.id }
      });
      setOfficeReceiptDialogOpen(true);
    } else if (isCompleting) {
      logger.debug('Opening completion dialog', {
        module: 'project-step',
        action: 'open_completion_dialog',
        data: { projectId: project.id }
      });
      setCompletionDialogOpen(true);
    } else {
      logger.debug('Normal step update', {
        module: 'project-step',
        action: 'normal_step_update',
        data: { currentStep: project.step, nextStep, projectId: project.id }
      });
      onStepUpdate(nextStep);
    }
  };

  const handleWithdrawalConfirm = async (withdrawalData: WithdrawalData) => {
    setLoading(true);
    try {
      await onStepUpdate(nextStep, undefined, {
        userId: withdrawalData.userId,
        userName: withdrawalData.userName,
        timestamp: withdrawalData.withdrawalTime
      });
      setWithdrawalDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficeReceiptConfirm = async (officeReceiptData: OfficeReceiptData) => {
    setLoading(true);
    try {
      await onStepUpdate(nextStep, undefined, {
        userId: officeReceiptData.userId,
        userName: officeReceiptData.userName,
        timestamp: officeReceiptData.receiptTime
      });
      setOfficeReceiptDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletionConfirm = async (data: { userId: string; userName: string; timestamp: string }) => {
    setLoading(true);
    try {
      await onStepUpdate(nextStep, undefined, data);
      setCompletionDialogOpen(false);
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
          "h-9 px-4 text-sm font-medium transition-all duration-200",
          isCompleting 
            ? "bg-foreground/90 text-background shadow-md" 
            : "bg-foreground text-background hover:bg-foreground/90 shadow-card",
          className
        )}
      >
        <NextStepIcon className="mr-2 h-4 w-4" />
        {loading ? 'Processando...' : 
         isSeparating ? 'Separar' :
         isWithdrawing ? 'Registrar Retirada' : 
         isOfficeReceipt ? 'Confirmar Retorno' :
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

      <OfficeReceiptDialog
        open={officeReceiptDialogOpen}
        onOpenChange={setOfficeReceiptDialogOpen}
        onConfirm={handleOfficeReceiptConfirm}
        loading={loading}
      />

      <CompletionDialog
        open={completionDialogOpen}
        onOpenChange={setCompletionDialogOpen}
        onConfirm={handleCompletionConfirm}
        loading={loading}
      />
    </>
  );
}
