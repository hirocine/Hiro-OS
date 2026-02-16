import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
      gcTime: 10 * 60 * 1000, // 10 minutos - tempo no cache após inatividade
      refetchOnWindowFocus: false, // Não refetch automático ao focar janela
      retry: 1, // Tentar apenas 1 vez em caso de erro
      refetchOnMount: true, // Refetch ao montar se dados estão stale
    },
    mutations: {
      retry: 0, // Não retry em mutations
    },
  },
});

// Query Keys - centralizadas para consistência
export const queryKeys = {
  equipment: {
    all: ['equipment'] as const,
    detail: (id: string) => ['equipment', id] as const,
  },
  projects: {
    all: ['projects'] as const,
    detail: (id: string) => ['projects', id] as const,
    equipment: (id: string) => ['projects', id, 'equipment'] as const,
  },
  ssds: {
    all: ['ssds'] as const,
    allocations: ['ssds', 'allocations'] as const,
    detail: (id: string) => ['ssds', id] as const,
  },
  loans: {
    all: ['loans'] as const,
    byEquipment: (equipmentId: string) => ['loans', 'equipment', equipmentId] as const,
    detail: (id: string) => ['loans', id] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  financial: {
    dashboard: (year: number) => ['financial', 'dashboard', year] as const,
    cashFlow: (year: number) => ['financial', 'cash-flow', year] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: ['tasks', 'list'] as const,
    mine: ['tasks', 'mine'] as const,
    detail: (id: string) => ['tasks', id] as const,
    stats: ['tasks', 'stats'] as const,
  },
};
