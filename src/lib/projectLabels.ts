import { ProjectStatus, ProjectStep } from '@/types/project';

export const statusLabels: Record<ProjectStatus, string> = {
  active: 'Ativo',
  completed: 'Finalizado',
  archived: 'Arquivado'
};

export const stepLabels: Record<ProjectStep, string> = {
  pending_separation: 'Pendente Separação',
  separated: 'Separado',
  ready_for_pickup: 'Retirar',
  in_use: 'Em Uso',
  pending_verification: 'Pendente Verificação',
  verified: 'Verificado'
};

export const getStatusLabel = (status: ProjectStatus): string => {
  return statusLabels[status] || status;
};

export const getStepLabel = (step: ProjectStep): string => {
  return stepLabels[step] || step;
};