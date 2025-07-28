import { Project } from '@/types/project';

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'Documentário Natureza',
    description: 'Produção de documentário sobre vida selvagem brasileira',
    startDate: '2024-01-10',
    expectedEndDate: '2024-01-25',
    status: 'active',
    responsibleName: 'João Silva',
    responsibleEmail: 'joao.silva@produtora.com',
    department: 'Produção',
    equipmentCount: 3,
    loanIds: ['loan-001'], // Microfone Shotgun
    notes: 'Projeto prioritário com deadline apertado'
  },
  {
    id: 'proj-002',
    name: 'Filme Independente',
    description: 'Longa-metragem de ficção independente',
    startDate: '2024-01-05',
    expectedEndDate: '2024-02-15',
    status: 'active',
    responsibleName: 'Maria Santos',
    responsibleEmail: 'maria.santos@produtora.com',
    department: 'Direção',
    equipmentCount: 5,
    loanIds: ['loan-002'], // Câmera RED Komodo
    notes: 'Orçamento limitado, cuidado especial com equipamentos'
  },
  {
    id: 'proj-003',
    name: 'Comercial TV',
    description: 'Campanha publicitária para cliente nacional',
    startDate: '2023-12-20',
    expectedEndDate: '2023-12-30',
    actualEndDate: '2023-12-29',
    status: 'completed',
    responsibleName: 'Pedro Costa',
    responsibleEmail: 'pedro.costa@produtora.com',
    department: 'Produção',
    equipmentCount: 2,
    loanIds: ['loan-003'], // Câmera Sony FX6
    notes: 'Projeto concluído com sucesso'
  },
  {
    id: 'proj-004',
    name: 'Sessão de Fotos',
    description: 'Book profissional para modelo',
    startDate: '2023-12-15',
    expectedEndDate: '2023-12-25',
    actualEndDate: '2023-12-24',
    status: 'completed',
    responsibleName: 'Ana Oliveira',
    responsibleEmail: 'ana.oliveira@produtora.com',
    department: 'Iluminação',
    equipmentCount: 4,
    loanIds: ['loan-004'], // Kit de Iluminação
    notes: 'Cliente satisfeito, possível contrato futuro'
  },
  {
    id: 'proj-005',
    name: 'Projeto Experimental',
    description: 'Teste de novas técnicas de filmagem',
    startDate: '2023-11-01',
    expectedEndDate: '2023-11-30',
    actualEndDate: '2023-11-28',
    status: 'archived',
    responsibleName: 'Carlos Mendes',
    responsibleEmail: 'carlos.mendes@produtora.com',
    department: 'P&D',
    equipmentCount: 1,
    loanIds: [],
    notes: 'Projeto arquivado para referência futura'
  }
];

export const statusLabels = {
  active: 'Ativo',
  completed: 'Finalizado',
  archived: 'Arquivado'
};