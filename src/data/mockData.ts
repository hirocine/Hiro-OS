import { Equipment } from '@/types/equipment';

export const mockEquipment: Equipment[] = [
  {
    id: '1',
    name: 'Câmera Sony FX6',
    brand: 'Sony',
    model: 'FX6',
    category: 'camera',
    status: 'available',
    serialNumber: 'SN-FX6-001',
    purchaseDate: '2023-01-15',
    description: 'Câmera cinema full-frame com sensor de 10.2MP',
    value: 25000,
    patrimonyNumber: 'PAT-001'
  },
  {
    id: '2',
    name: 'Microfone Shotgun Sennheiser MKE 600',
    brand: 'Sennheiser',
    model: 'MKE 600',
    category: 'audio',
    status: 'in-use',
    serialNumber: 'SN-MKE-002',
    purchaseDate: '2022-08-20',
    description: 'Microfone direcional profissional para captação de áudio',
    value: 1200,
    patrimonyNumber: 'PAT-002'
  },
  {
    id: '3',
    name: 'Kit de Iluminação LED Aputure 300D',
    brand: 'Aputure',
    model: '300D Mark II',
    category: 'lighting',
    status: 'maintenance',
    serialNumber: 'SN-AP-003',
    purchaseDate: '2023-03-10',
    lastMaintenance: '2024-01-15',
    description: 'Painel LED profissional de 300W com controle remoto',
    value: 3500,
    patrimonyNumber: 'PAT-003'
  },
  {
    id: '4',
    name: 'Steadicam Ronin-S',
    brand: 'DJI',
    model: 'Ronin-S',
    category: 'accessories',
    status: 'available',
    serialNumber: 'SN-RON-004',
    purchaseDate: '2022-11-05',
    description: 'Estabilizador profissional para câmeras DSLR',
    value: 2800,
    patrimonyNumber: 'PAT-004'
  },
  {
    id: '5',
    name: 'Gravador de Campo Zoom H6',
    brand: 'Zoom',
    model: 'H6',
    category: 'audio',
    status: 'available',
    serialNumber: 'SN-ZH6-005',
    purchaseDate: '2023-06-12',
    description: 'Gravador portátil de 6 canais para captação de áudio',
    value: 1800,
    patrimonyNumber: 'PAT-005'
  },
  {
    id: '6',
    name: 'Câmera RED Komodo 6K',
    brand: 'RED',
    model: 'Komodo',
    category: 'camera',
    status: 'in-use',
    serialNumber: 'SN-RED-006',
    purchaseDate: '2023-09-01',
    description: 'Câmera cinema 6K super compacta',
    value: 45000,
    patrimonyNumber: 'PAT-006'
  }
];

export const categoryLabels = {
  camera: 'Câmeras',
  audio: 'Áudio',
  lighting: 'Iluminação',
  accessories: 'Acessórios'
};

export const statusLabels = {
  available: 'Disponível',
  'in-use': 'Em Uso',
  maintenance: 'Manutenção'
};