import { Loan } from '@/types/loan';

export const mockLoans: Loan[] = [
  {
    id: 'loan-001',
    equipmentId: '2',
    equipmentName: 'Microfone Shotgun Sennheiser MKE 600',
    borrowerName: 'João Silva',
    borrowerEmail: 'joao.silva@produtora.com',
    borrowerPhone: '(11) 99999-1234',
    department: 'Produção',
    project: 'Documentário Natureza',
    loanDate: '2024-01-10',
    expectedReturnDate: '2024-01-20',
    status: 'active',
    notes: 'Equipamento para gravação externa'
  },
  {
    id: 'loan-002',
    equipmentId: '6',
    equipmentName: 'Câmera RED Komodo 6K',
    borrowerName: 'Maria Santos',
    borrowerEmail: 'maria.santos@produtora.com',
    borrowerPhone: '(11) 88888-5678',
    department: 'Direção',
    project: 'Filme Independente',
    loanDate: '2024-01-05',
    expectedReturnDate: '2024-01-15',
    status: 'overdue',
    notes: 'Câmera principal para filmagem'
  },
  {
    id: 'loan-003',
    equipmentId: '1',
    equipmentName: 'Câmera Sony FX6',
    borrowerName: 'Pedro Costa',
    borrowerEmail: 'pedro.costa@produtora.com',
    department: 'Produção',
    project: 'Comercial TV',
    loanDate: '2023-12-20',
    expectedReturnDate: '2023-12-30',
    actualReturnDate: '2023-12-29',
    status: 'returned',
    returnCondition: 'excellent',
    returnNotes: 'Equipamento devolvido em perfeitas condições'
  },
  {
    id: 'loan-004',
    equipmentId: '3',
    equipmentName: 'Kit de Iluminação LED Aputure 300D',
    borrowerName: 'Ana Oliveira',
    borrowerEmail: 'ana.oliveira@produtora.com',
    department: 'Iluminação',
    project: 'Sessão de Fotos',
    loanDate: '2023-12-15',
    expectedReturnDate: '2023-12-25',
    actualReturnDate: '2023-12-24',
    status: 'returned',
    returnCondition: 'good',
    returnNotes: 'Pequeno arranhão no case, mas funcionamento perfeito'
  }
];

export const statusLabels = {
  active: 'Ativo',
  returned: 'Devolvido',
  overdue: 'Atrasado'
};

export const conditionLabels = {
  excellent: 'Excelente',
  good: 'Bom',
  fair: 'Regular',
  damaged: 'Danificado'
};