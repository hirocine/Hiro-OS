import { ProjectStep } from '@/types/project';
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