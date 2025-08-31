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
  // For active projects, use step color for better differentiation
  if (status === 'active') {
    return stepColors[step];
  }
  
  // For completed and archived, use status color
  return statusColors[status];
};

export const getProjectClasses = (status: ProjectStatus, step: ProjectStep): string => {
  const colorKey = getProjectColor(status, step);
  
  const classMap: Record<string, string> = {
    'step-pending': 'bg-step-pending text-step-pending-foreground border-step-pending/30',
    'step-separated': 'bg-step-separated text-step-separated-foreground border-step-separated/30',
    'step-in-use': 'bg-step-in-use text-step-in-use-foreground border-step-in-use/30',
    'step-verification': 'bg-step-verification text-step-verification-foreground border-step-verification/30',
    'step-verified': 'bg-step-verified text-step-verified-foreground border-step-verified/30',
    'status-active': 'bg-status-active text-status-active-foreground border-status-active/30',
    'status-completed': 'bg-status-completed text-status-completed-foreground border-status-completed/30',
    'status-archived': 'bg-status-archived text-status-archived-foreground border-status-archived/30',
  };
  
  return classMap[colorKey] || classMap['step-pending'];
};

export const getAccentClasses = (status: ProjectStatus, step: ProjectStep): string => {
  const colorKey = getProjectColor(status, step);
  
  const accentMap: Record<string, string> = {
    'step-pending': 'bg-step-pending-foreground/30',
    'step-separated': 'bg-step-separated-foreground/30',
    'step-in-use': 'bg-step-in-use-foreground/30',
    'step-verification': 'bg-step-verification-foreground/30',
    'step-verified': 'bg-step-verified-foreground/30',
    'status-active': 'bg-status-active-foreground/30',
    'status-completed': 'bg-status-completed-foreground/30',
    'status-archived': 'bg-status-archived-foreground/30',
  };
  
  return accentMap[colorKey] || accentMap['step-pending'];
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