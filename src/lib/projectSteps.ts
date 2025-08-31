import { ProjectStep, ProjectStatus } from '@/types/project';
import { ClipboardList, Package, Truck, Play, Clock, Building2, CheckCircle } from 'lucide-react';

export const stepLabels: Record<ProjectStep, string> = {
  pending_separation: 'Pendente Separação',
  separated: 'Separado',
  ready_for_pickup: 'Retirar',
  in_use: 'Gravação',
  pending_verification: 'Check Desmontagem',
  office_receipt: 'Confirmar Recebimento no Escritório',
  verified: 'Verificado'
};

export const stepColors: Record<ProjectStep, string> = {
  pending_separation: 'step-pending',
  separated: 'step-separated',
  ready_for_pickup: 'step-pickup',
  in_use: 'step-in-use',
  pending_verification: 'step-verification',
  office_receipt: 'step-office-receipt',
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
    'step-pending': 'bg-step-pending text-step-pending-foreground',
    'step-separated': 'bg-step-separated text-step-separated-foreground',
    'step-pickup': 'bg-step-pickup text-step-pickup-foreground',
    'step-in-use': 'bg-step-in-use text-step-in-use-foreground',
    'step-verification': 'bg-step-verification text-step-verification-foreground',
    'step-office-receipt': 'bg-step-office-receipt text-step-office-receipt-foreground',
    'step-verified': 'bg-step-verified text-step-verified-foreground',
    'status-active': 'bg-status-active text-status-active-foreground',
    'status-completed': 'bg-status-completed text-status-completed-foreground',
    'status-archived': 'bg-status-archived text-status-archived-foreground',
  };
  
  return classMap[colorKey] || classMap['step-pending'];
};

export const stepIcons: Record<ProjectStep, any> = {
  pending_separation: ClipboardList,
  separated: Package,
  ready_for_pickup: Truck,
  in_use: Play,
  pending_verification: Clock,
  office_receipt: Building2,
  verified: CheckCircle
};

export const stepOrder: ProjectStep[] = [
  'pending_separation',
  'separated',
  'ready_for_pickup',
  'in_use',
  'pending_verification',
  'office_receipt',
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