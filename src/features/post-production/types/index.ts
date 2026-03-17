export type PPStatus = 'fila' | 'edicao' | 'color_grading' | 'finalizacao' | 'revisao' | 'entregue';
export type PPPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type PPSortableField = 'title' | 'priority' | 'status' | 'editor_name' | 'due_date' | 'project_name';
export type PPSortOrder = 'asc' | 'desc';

export const PP_PRIORITY_ORDER: Record<PPPriority, number> = {
  baixa: 1,
  media: 2,
  alta: 3,
  urgente: 4,
};

export const PP_STATUS_ORDER: Record<PPStatus, number> = {
  fila: 0,
  edicao: 1,
  color_grading: 2,
  finalizacao: 3,
  revisao: 4,
  entregue: 5,
};

export interface PostProductionItem {
  id: string;
  title: string;
  project_id: string | null;
  project_name: string | null;
  client_name: string | null;
  editor_id: string | null;
  editor_name: string | null;
  status: PPStatus;
  priority: PPPriority;
  due_date: string | null;
  start_date: string | null;
  delivered_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const PP_PRIORITY_CONFIG: Record<PPPriority, { label: string; color: string; bgColor: string }> = {
  baixa: {
    label: 'Baixa',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  },
  media: {
    label: 'Média',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
  },
  alta: {
    label: 'Alta',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
  },
  urgente: {
    label: 'Urgente',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  },
};

export const PP_STATUS_CONFIG: Record<PPStatus, { label: string; color: string; bgColor: string }> = {
  fila: {
    label: 'Na Fila',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30 border-gray-300 dark:border-gray-700',
  },
  edicao: {
    label: 'Edição',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  },
  color_grading: {
    label: 'Color Grading',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
  },
  finalizacao: {
    label: 'Finalização',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
  },
  revisao: {
    label: 'Revisão',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
  },
  entregue: {
    label: 'Entregue',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  },
};

export const PP_STATUS_COLUMNS: PPStatus[] = ['fila', 'edicao', 'color_grading', 'finalizacao', 'revisao', 'entregue'];
