export type ProjectStatus = 'active' | 'completed' | 'archived';

export type ProjectStep = 
  | 'pending_separation'   // Separação (Padrão)
  | 'separated'           // Separado
  | 'ready_for_pickup'    // Retirar
  | 'in_use'              // Gravação
  | 'pending_verification' // Check Desmontagem
  | 'office_receipt'      // Confirmar Recebimento no Escritório
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
  withdrawalUserId?: string;
  withdrawalUserName?: string;
  withdrawalTime?: string;
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
    pending_separation: number; // Separação
    separated: number; // Separado
    ready_for_pickup: number; // Retirar
    in_use: number; // Gravação
    pending_verification: number; // Check Desmontagem
    office_receipt: number; // Retorno
    verified: number; // Verificado
  };
}