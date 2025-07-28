export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  status: 'active' | 'completed' | 'archived';
  responsibleName: string;
  responsibleEmail?: string;
  department?: string;
  equipmentCount: number;
  loanIds: string[]; // IDs dos empréstimos associados
  notes?: string;
}

export interface ProjectFilters {
  status?: Project['status'];
  responsible?: string;
  name?: string;
}

export interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  archived: number;
  totalEquipmentOut: number;
}