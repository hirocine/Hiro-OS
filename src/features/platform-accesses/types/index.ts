export type PlatformCategory = 
  | 'development' 
  | 'infrastructure' 
  | 'design' 
  | 'communication'
  | 'analytics'
  | 'storage'
  | 'other';

export interface PlatformAccess {
  id: string;
  user_id: string;
  platform_name: string;
  platform_icon_url?: string;
  platform_url: string;
  username: string;
  encrypted_password: string;
  notes?: string;
  category: PlatformCategory;
  is_favorite: boolean;
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
}

export interface PlatformAccessFilters {
  search?: string;
  category?: PlatformCategory | 'all';
  favorites?: boolean;
}

// Pre-defined platform icons from Simple Icons
export const PLATFORM_ICONS = {
  github: 'https://cdn.simpleicons.org/github',
  gitlab: 'https://cdn.simpleicons.org/gitlab',
  bitbucket: 'https://cdn.simpleicons.org/bitbucket',
  aws: 'https://cdn.simpleicons.org/amazonaws',
  azure: 'https://cdn.simpleicons.org/microsoftazure',
  googlecloud: 'https://cdn.simpleicons.org/googlecloud',
  figma: 'https://cdn.simpleicons.org/figma',
  adobexd: 'https://cdn.simpleicons.org/adobexd',
  sketch: 'https://cdn.simpleicons.org/sketch',
  slack: 'https://cdn.simpleicons.org/slack',
  discord: 'https://cdn.simpleicons.org/discord',
  teams: 'https://cdn.simpleicons.org/microsoftteams',
  notion: 'https://cdn.simpleicons.org/notion',
  vercel: 'https://cdn.simpleicons.org/vercel',
  netlify: 'https://cdn.simpleicons.org/netlify',
  supabase: 'https://cdn.simpleicons.org/supabase',
  mongodb: 'https://cdn.simpleicons.org/mongodb',
  postgresql: 'https://cdn.simpleicons.org/postgresql',
  mysql: 'https://cdn.simpleicons.org/mysql',
  redis: 'https://cdn.simpleicons.org/redis',
  docker: 'https://cdn.simpleicons.org/docker',
  kubernetes: 'https://cdn.simpleicons.org/kubernetes',
  jenkins: 'https://cdn.simpleicons.org/jenkins',
  jira: 'https://cdn.simpleicons.org/jira',
  confluence: 'https://cdn.simpleicons.org/confluence',
  trello: 'https://cdn.simpleicons.org/trello',
  asana: 'https://cdn.simpleicons.org/asana',
  linear: 'https://cdn.simpleicons.org/linear',
  digitalocean: 'https://cdn.simpleicons.org/digitalocean',
  heroku: 'https://cdn.simpleicons.org/heroku',
  cloudflare: 'https://cdn.simpleicons.org/cloudflare',
} as const;

export const CATEGORY_LABELS: Record<PlatformCategory, string> = {
  development: 'Desenvolvimento',
  infrastructure: 'Infraestrutura',
  design: 'Design',
  communication: 'Comunicação',
  analytics: 'Analytics',
  storage: 'Armazenamento',
  other: 'Outros',
};

export const CATEGORY_COLORS: Record<PlatformCategory, string> = {
  development: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  infrastructure: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  design: 'bg-pink-500/10 text-pink-700 dark:text-pink-300',
  communication: 'bg-green-500/10 text-green-700 dark:text-green-300',
  analytics: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  storage: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  other: 'bg-gray-500/10 text-gray-700 dark:text-gray-300',
};
