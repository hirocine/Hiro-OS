import type { Database } from '@/integrations/supabase/types';

// DB row types
export type Contact = Database['public']['Tables']['crm_contacts']['Row'];
export type ContactInsert = Database['public']['Tables']['crm_contacts']['Insert'];
export type ContactUpdate = Database['public']['Tables']['crm_contacts']['Update'];

export type Deal = Database['public']['Tables']['crm_deals']['Row'];
export type DealInsert = Database['public']['Tables']['crm_deals']['Insert'];
export type DealUpdate = Database['public']['Tables']['crm_deals']['Update'];

export type PipelineStage = Database['public']['Tables']['crm_pipeline_stages']['Row'];

export type Activity = Database['public']['Tables']['crm_activities']['Row'];
export type ActivityInsert = Database['public']['Tables']['crm_activities']['Insert'];
export type ActivityUpdate = Database['public']['Tables']['crm_activities']['Update'];

// Extended types with joins
export interface DealWithRelations extends Deal {
  contact_name?: string;
  stage_name?: string;
  stage_color?: string;
  stage_is_won?: boolean;
  stage_is_lost?: boolean;
}

// Stats
export interface CRMStats {
  totalContacts: number;
  activeDeals: number;
  pipelineValue: number;
  conversionRate: number;
}

// Enums for UI
export const CONTACT_TYPES = [
  { value: 'lead', label: 'Lead' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'parceiro', label: 'Parceiro' },
  { value: 'fornecedor', label: 'Fornecedor' },
] as const;

export const LEAD_SOURCES = [
  { value: 'indicacao', label: 'Indicação' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google', label: 'Google' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'evento', label: 'Evento' },
  { value: 'outro', label: 'Outro' },
] as const;

export const ACTIVITY_TYPES = [
  { value: 'ligacao', label: 'Ligação', icon: 'Phone' },
  { value: 'email', label: 'E-mail', icon: 'Mail' },
  { value: 'reuniao', label: 'Reunião', icon: 'Calendar' },
  { value: 'nota', label: 'Nota', icon: 'StickyNote' },
  { value: 'tarefa', label: 'Tarefa', icon: 'CheckSquare' },
] as const;

export const SERVICE_TYPES = [
  { value: 'video_institucional', label: 'Vídeo Institucional' },
  { value: 'campanha', label: 'Campanha' },
  { value: 'evento', label: 'Evento' },
  { value: 'conteudo_digital', label: 'Conteúdo Digital' },
  { value: 'outro', label: 'Outro' },
] as const;

export const formatBRL = (value: number | null | undefined): string => {
  if (value == null) return 'R$ 0';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};
