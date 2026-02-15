export interface Company {
  id: string;
  company_name: string;
  area: string;
  rating?: number;
  whatsapp?: string;
  instagram?: string;
  portfolio_url?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyNote {
  id: string;
  company_id: string;
  content: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyInsert {
  company_name: string;
  area: string;
  rating?: number;
  whatsapp?: string;
  instagram?: string;
  portfolio_url?: string;
  is_active?: boolean;
}

export interface CompanyUpdate {
  company_name?: string;
  area?: string;
  rating?: number;
  whatsapp?: string;
  instagram?: string;
  portfolio_url?: string;
  is_active?: boolean;
}

export interface CompanyFilters {
  search?: string;
  area?: string;
  minRating?: number;
}
