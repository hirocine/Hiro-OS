export type ExpertiseLevel = 'altissima' | 'alta' | 'media' | 'baixa' | 'muito_baixa';

export interface Supplier {
  id: string;
  full_name: string;
  primary_role: string;
  secondary_role?: string;
  whatsapp?: string;
  instagram?: string;
  portfolio_url?: string;
  expertise: ExpertiseLevel;
  daily_rate?: number;
  rating?: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierRole {
  id: string;
  name: string;
  display_order: number;
  is_custom: boolean;
  created_by?: string;
  created_at: string;
}

export interface SupplierNote {
  id: string;
  supplier_id: string;
  content: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierInsert {
  full_name: string;
  primary_role: string;
  secondary_role?: string;
  whatsapp?: string;
  instagram?: string;
  portfolio_url?: string;
  expertise: ExpertiseLevel;
  daily_rate?: number;
  rating?: number;
  is_active?: boolean;
}

export interface SupplierUpdate {
  full_name?: string;
  primary_role?: string;
  secondary_role?: string;
  whatsapp?: string;
  instagram?: string;
  portfolio_url?: string;
  expertise?: ExpertiseLevel;
  daily_rate?: number;
  rating?: number;
  is_active?: boolean;
}

export interface SupplierFilters {
  search?: string;
  role?: string;
  expertise?: ExpertiseLevel;
  minRating?: number;
  isActive?: boolean;
}

export const EXPERTISE_LABELS: Record<ExpertiseLevel, string> = {
  altissima: 'Altíssima',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
  muito_baixa: 'Muito Baixa',
};

export const EXPERTISE_COLORS: Record<ExpertiseLevel, string> = {
  altissima: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 dark:text-emerald-400',
  alta: 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400',
  media: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 dark:text-yellow-400',
  baixa: 'bg-orange-500/20 text-orange-700 border-orange-500/30 dark:text-orange-400',
  muito_baixa: 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400',
};
