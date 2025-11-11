export interface CompanyPolicy {
  id: string;
  title: string;
  icon_url?: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  display_order: number;
  category?: string;
  
  // JOIN data
  creator_name?: string;
}

export interface PolicyForm {
  title: string;
  icon: string;
  content: string;
  category: string;
}

export const POLICY_CATEGORIES = [
  { value: 'Recursos Humanos', label: 'Recursos Humanos', icon: '📝' },
  { value: 'Segurança da Informação', label: 'Segurança da Informação', icon: '🔒' },
  { value: 'Compliance e Ética', label: 'Compliance e Ética', icon: '💼' },
  { value: 'Operacional', label: 'Operacional', icon: '🏢' },
  { value: 'Sustentabilidade', label: 'Sustentabilidade', icon: '🌍' },
  { value: 'Treinamento', label: 'Treinamento', icon: '📚' },
  { value: 'Inovação', label: 'Inovação', icon: '💡' },
  { value: 'Geral', label: 'Geral', icon: '📋' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  'Recursos Humanos': 'border-t-blue-500',
  'Segurança da Informação': 'border-t-red-500',
  'Compliance e Ética': 'border-t-purple-500',
  'Operacional': 'border-t-green-500',
  'Sustentabilidade': 'border-t-emerald-500',
  'Treinamento': 'border-t-yellow-500',
  'Inovação': 'border-t-pink-500',
  'Geral': 'border-t-primary',
};
