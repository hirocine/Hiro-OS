export type PlatformCategory = 
  | 'cloud'
  | 'ai'
  | 'references'
  | 'social_media'
  | 'site'
  | 'software'
  | 'music'
  | 'stock'
  | 'other';

export interface PlatformAccess {
  id: string;
  user_id: string;
  platform_name: string;
  platform_icon_url?: string;
  platform_url?: string;
  username: string;
  encrypted_password: string;
  notes?: string;
  category: PlatformCategory;
  is_favorite: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Creator info from JOIN
  creator_name?: string;
  creator_email?: string;
}

export interface PlatformAccessForm {
  platformName: string;
  platformIconUrl?: string;
  platformUrl: string;
  username: string;
  password: string;
  notes?: string;
  category: PlatformCategory;
  isFavorite?: boolean;
  isActive?: boolean;
}

export interface PlatformAccessFilters {
  search?: string;
  category?: PlatformCategory | 'all';
  favorites?: boolean;
}


export const CATEGORY_LABELS: Record<PlatformCategory, string> = {
  cloud: 'Cloud',
  ai: 'IA',
  references: 'References',
  social_media: 'Social Media',
  site: 'Site',
  software: 'Software',
  music: 'Music',
  stock: 'Stock',
  other: 'Outras',
};

export const CATEGORY_COLORS: Record<PlatformCategory, string> = {
  cloud: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  ai: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  references: 'bg-green-500/10 text-green-700 dark:text-green-300',
  social_media: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
  site: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  software: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  music: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  stock: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  other: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
};
