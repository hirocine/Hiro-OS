import { Equipment } from '@/types/equipment';

export const mockEquipment: Equipment[] = [];

// DEPRECATED: categoryLabels não é mais necessário
// As categorias agora são armazenadas e exibidas em português diretamente
// Mantido aqui apenas para referência histórica
export const categoryLabels = {
  camera: 'Câmeras',
  audio: 'Áudio',
  lighting: 'Iluminação',
  accessories: 'Acessórios',
  storage: 'Armazenamento'
};

export const statusLabels = {
  available: 'Disponível',
  maintenance: 'Manutenção'
};

export const itemTypeLabels = {
  main: 'Item Principal',
  accessory: 'Acessório'
};