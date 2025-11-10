import { Equipment } from '@/types/equipment';

export const mockEquipment: Equipment[] = [];

// Labels de categorias - agora importadas do categoryMapping
export const categoryLabels = {
  camera: 'Câmera',
  monitoring: 'Monitoração',
  audio: 'Áudio',
  lighting: 'Iluminação',
  grip: 'Grip',
  electrical: 'Elétrica',
  storage: 'Armazenamento',
  computers: 'Computadores',
  miscellaneous: 'Diversos'
};

export const statusLabels = {
  available: 'Disponível',
  maintenance: 'Manutenção'
};

export const itemTypeLabels = {
  main: 'Item Principal',
  accessory: 'Acessório'
};