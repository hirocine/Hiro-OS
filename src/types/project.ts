export type ProjectStatus = 'active' | 'completed' | 'archived';

export type ProjectStep = 
  | 'pending_separation'   // Pendente Separação (Padrão)
  | 'separated'           // Separado
  | 'ready_for_pickup'    // Retirar
  | 'in_use'              // Em uso
  | 'pending_verification' // Pendente Verificação de Retorno
  | 'verified';           // Verificado

export interface StepChange {
  step: ProjectStep;
  timestamp: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  status: ProjectStatus;
  step: ProjectStep;
  stepHistory: StepChange[];
  responsibleName: string;
  responsibleEmail?: string;
  department?: string;
  equipmentCount: number;
  loanIds: string[]; // IDs dos empréstimos associados
  notes?: string;
  // New fields for structured project creation
  projectNumber?: string;
  company?: string;
  projectName?: string;
  responsibleUserId?: string;
  withdrawalDate?: string;
  separationDate?: string;
  recordingType?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  step?: ProjectStep;
  responsible?: string;
  name?: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  archived: number;
  totalEquipmentOut: number;
  byStep: {
    pending_separation: number;
    separated: number;
    ready_for_pickup: number;
    in_use: number;
    pending_verification: number;
    verified: number;
  };
}