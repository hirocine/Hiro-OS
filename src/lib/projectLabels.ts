import { ProjectStatus, ProjectStep } from '@/types/project';

export const statusLabels: Record<ProjectStatus, string> = {
  active: 'Ativo',
  completed: 'Finalizado',
  archived: 'Arquivado'
};

export const stepLabels: Record<ProjectStep, string> = {
  pending_separation: 'Separação',
  ready_for_pickup: 'Retirar',
  in_use: 'Gravação',
  pending_verification: 'Check Desmontagem',
  office_receipt: 'Retorno',
  verified: 'Finalizado'
};

export const getStatusLabel = (status: ProjectStatus): string => {
  return statusLabels[status] || status;
};

export const getStepLabel = (step: ProjectStep): string => {
  return stepLabels[step] || step;
};