export interface Proposal {
  id: string;
  slug: string;
  client_name: string;
  project_name: string;
  project_number: string | null;
  client_responsible: string | null;
  client_logo: string | null;
  validity_date: string;
  briefing: string | null;
  video_url: string | null;
  moodboard_images: string[];
  scope_pre_production: ScopeItem[];
  scope_production: ScopeItem[];
  scope_post_production: ScopeItem[];
  timeline: TimelineItem[];
  base_value: number;
  discount_pct: number;
  final_value: number;
  payment_terms: string;
  status: 'draft' | 'sent' | 'approved' | 'expired';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScopeItem {
  item: string;
}

export interface TimelineItem {
  week: string;
  description: string;
}

export interface ProposalFormData {
  client_name: string;
  project_name: string;
  project_number: string;
  client_responsible: string;
  client_logo_file: File | null;
  client_logo_preview: string;
  validity_date: Date | undefined;
  briefing: string;
  video_url: string;
  moodboard_files: File[];
  moodboard_previews: string[];
  scope_pre_production: ScopeItem[];
  scope_production: ScopeItem[];
  scope_post_production: ScopeItem[];
  timeline: TimelineItem[];
  base_value: number;
  discount_pct: number;
  payment_terms: string;
}

export const defaultFormData: ProposalFormData = {
  client_name: '',
  project_name: '',
  project_number: '',
  client_responsible: '',
  client_logo_file: null,
  client_logo_preview: '',
  validity_date: undefined,
  briefing: '',
  video_url: '',
  moodboard_files: [],
  moodboard_previews: [],
  scope_pre_production: [{ item: '' }],
  scope_production: [{ item: '' }],
  scope_post_production: [{ item: '' }],
  timeline: [{ week: '', description: '' }],
  base_value: 0,
  discount_pct: 0,
  payment_terms: '50% no fechamento do projeto mediante contrato e os outros 50% na entrega do material final',
};
