export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente' | 'standby';
export type TaskStatus = 'pendente' | 'em_progresso' | 'concluida' | 'arquivada';

// Sorting types
export type TaskSortableField = 'title' | 'priority' | 'status' | 'assignee_name' | 'due_date' | 'department';
export type TaskSortOrder = 'asc' | 'desc';

// Numeric order for priority sorting
export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  standby: 0,
  baixa: 1,
  media: 2,
  alta: 3,
  urgente: 4,
};

// Numeric order for status sorting
export const STATUS_ORDER: Record<TaskStatus, number> = {
  pendente: 0,
  em_progresso: 1,
  concluida: 2,
  arquivada: 3,
};

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  department: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_private: boolean;
  
  // Joined data
  assignee_name?: string;
  assignee_avatar?: string;
  creator_name?: string;
}

export interface TaskSubtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
}

export type TaskLinkType = 'google_drive' | 'dropbox' | 'notion' | 'onedrive' | 'other';

export interface TaskLink {
  id: string;
  task_id: string;
  url: string;
  title: string;
  link_type: TaskLinkType;
  created_by: string;
  created_at: string;
}

export interface TaskWithDetails extends Task {
  subtasks: TaskSubtask[];
  comments: TaskComment[];
  attachments: TaskAttachment[];
  links: TaskLink[];
}

export interface TaskStats {
  active: number;
  urgent: number;
  overdue: number;
}

// Configurações visuais
export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  standby: { 
    label: 'Stand-by', 
    color: 'text-gray-700 dark:text-gray-300', 
    bgColor: 'bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700' 
  },
  baixa: { 
    label: 'Baixa', 
    color: 'text-blue-700 dark:text-blue-300', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' 
  },
  media: { 
    label: 'Média', 
    color: 'text-yellow-700 dark:text-yellow-300', 
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' 
  },
  alta: { 
    label: 'Alta', 
    color: 'text-orange-700 dark:text-orange-300', 
    bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700' 
  },
  urgente: { 
    label: 'Urgente', 
    color: 'text-red-700 dark:text-red-300', 
    bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' 
  },
};

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  pendente: { 
    label: 'Pendente', 
    color: 'text-gray-700 dark:text-gray-300', 
    bgColor: 'bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700' 
  },
  em_progresso: { 
    label: 'Em Progresso', 
    color: 'text-blue-700 dark:text-blue-300', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' 
  },
  concluida: { 
    label: 'Concluída', 
    color: 'text-green-700 dark:text-green-300', 
    bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' 
  },
  arquivada: { 
    label: 'Arquivado', 
    color: 'text-red-700 dark:text-red-300', 
    bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' 
  },
};
