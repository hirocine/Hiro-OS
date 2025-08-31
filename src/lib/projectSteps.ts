import { ProjectStep, ProjectStatus } from '@/types/project';
import { ClipboardList, Package, Play, Clock, CheckCircle } from 'lucide-react';

export const stepLabels: Record<ProjectStep, string> = {
  pending_separation: 'Pendente Separação',
  separated: 'Separado',
  in_use: 'Em Uso',
  pending_verification: 'Pendente Verificação',
  verified: 'Verificado'
};

export const stepColors: Record<ProjectStep, string> = {
  pending_separation: 'step-pending',
  separated: 'step-separated',
  in_use: 'step-in-use',
  pending_verification: 'step-verification',
  verified: 'step-verified'
};

export const statusColors: Record<ProjectStatus, string> = {
  active: 'status-active',
  completed: 'status-completed',
  archived: 'status-archived'
};

export const getProjectColor = (status: ProjectStatus, step: ProjectStep): string => {
  // Use status color as primary, with step as fallback for more granular control
  const statusColorClass = statusColors[status];
  const stepColorClass = stepColors[step];
  
  // For active projects, use step color for better differentiation
  if (status === 'active') {
    return `bg-${stepColorClass} text-${stepColorClass}-foreground border-${stepColorClass}/20`;
  }
  
  // For completed and archived, use status color
  return `bg-${statusColorClass} text-${statusColorClass}-foreground border-${statusColorClass}/20`;
};

export const stepIcons: Record<ProjectStep, any> = {
  pending_separation: ClipboardList,
  separated: Package,
  in_use: Play,
  pending_verification: Clock,
  verified: CheckCircle
};

export const stepOrder: ProjectStep[] = [
  'pending_separation',
  'separated',
  'in_use',
  'pending_verification',
  'verified'
];

export function getStepProgress(step: ProjectStep): number {
  return (stepOrder.indexOf(step) + 1) / stepOrder.length * 100;
}

export function canTransitionTo(currentStep: ProjectStep, nextStep: ProjectStep): boolean {
  const currentIndex = stepOrder.indexOf(currentStep);
  const nextIndex = stepOrder.indexOf(nextStep);
  
  // Can go to any previous step or the immediate next step
  return nextIndex <= currentIndex + 1;
}

export function shouldAutoUpdateToInUse(startDate: string, step: ProjectStep): boolean {
  if (step !== 'separated') return false;
  
  const today = new Date().toISOString().split('T')[0];
  return startDate <= today;
}