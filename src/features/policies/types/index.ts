export interface CompanyPolicy {
  id: string;
  title: string;
  icon_url?: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  display_order: number;
  
  // JOIN data
  creator_name?: string;
}

export interface PolicyForm {
  title: string;
  icon: string;
  content: string;
}
