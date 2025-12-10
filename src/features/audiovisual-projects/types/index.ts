export type AVProjectStatus = 'active' | 'completed' | 'archived';
export type AVStepStatus = 'pendente' | 'em_progresso' | 'concluido' | 'bloqueado';

export interface AVProject {
  id: string;
  name: string;
  company: string | null;
  logo_url: string | null;
  description: string | null;
  status: AVProjectStatus;
  deadline: string | null;
  actual_end_date: string | null;
  responsible_user_id: string | null;
  responsible_user_name: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AVProjectSection {
  id: string;
  name: string;
  display_order: number;
  icon: string | null;
  created_at: string;
}

export interface AVProjectStep {
  id: string;
  project_id: string;
  section_id: string;
  title: string;
  responsible_user_id: string | null;
  responsible_user_name: string | null;
  deadline: string | null;
  status: AVStepStatus;
  display_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  substeps?: AVProjectSubstep[];
}

export interface AVProjectSubstep {
  id: string;
  step_id: string;
  title: string;
  is_completed: boolean;
  responsible_user_id: string | null;
  responsible_user_name: string | null;
  deadline: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AVProjectWithSteps extends AVProject {
  steps: AVProjectStep[];
}

export interface AVProjectStats {
  active: number;
  overdue: number;
  completed: number;
}

// Status configuration for UI
export const AV_STATUS_CONFIG: Record<AVProjectStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Ativo', color: 'text-primary', bgColor: 'bg-primary/10' },
  completed: { label: 'Finalizado', color: 'text-success', bgColor: 'bg-success/10' },
  archived: { label: 'Arquivado', color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

export const AV_STEP_STATUS_CONFIG: Record<AVStepStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  pendente: { label: 'Pendente', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: 'Clock' },
  em_progresso: { label: 'Em Progresso', color: 'text-primary', bgColor: 'bg-primary/10', icon: 'Loader' },
  concluido: { label: 'Concluído', color: 'text-success', bgColor: 'bg-success/10', icon: 'CheckCircle' },
  bloqueado: { label: 'Bloqueado', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: 'XCircle' },
};

// Section icons mapping
export const SECTION_ICONS: Record<string, string> = {
  'Primeiro Contato': 'Phone',
  'Briefing': 'FileText',
  'Orçamento': 'Calculator',
  'Jurídico e Financeiro': 'Scale',
  'Pré-Produção': 'ClipboardList',
  'Produção': 'Video',
  'Pós Produção': 'Film',
};
