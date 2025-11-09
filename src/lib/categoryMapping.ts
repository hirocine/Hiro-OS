import { Camera, Monitor, Mic, Lightbulb, Zap, HardDrive, Laptop, Package, Wrench, Aperture, Box, Filter, Battery, Cable, Briefcase, Tv, Radio, Speaker, Sun, Grip, Settings } from 'lucide-react';

export interface SubcategoryConfig {
  key: string;
  name: string;
  order: number;
}

export interface ParentCategoryConfig {
  key: string;
  title: string;
  icon: any;
  order: number;
  subcategories: SubcategoryConfig[];
}

/**
 * Mapeamento de categorias mães com suas respectivas subcategorias
 * Este mapeamento define a estrutura hierárquica do wizard de equipamentos
 */
export const PARENT_CATEGORIES: ParentCategoryConfig[] = [
  {
    key: 'camera',
    title: 'Câmera',
    icon: Camera,
    order: 1,
    subcategories: [
      { key: 'câmera', name: 'Câmera', order: 0 },
      { key: 'cage', name: 'Cage', order: 1 },
      { key: 'lente', name: 'Lente', order: 2 },
      { key: 'filtro', name: 'Filtro', order: 3 },
      { key: 'bateria', name: 'Bateria', order: 4 },
      { key: 'carregador', name: 'Carregador', order: 5 },
      { key: 'acessórios', name: 'Acessórios', order: 6 },
      { key: 'cabo', name: 'Cabo', order: 7 },
      { key: 'case', name: 'Case', order: 8 },
    ]
  },
  {
    key: 'monitoring',
    title: 'Monitoração',
    icon: Monitor,
    order: 2,
    subcategories: [
      { key: 'monitor', name: 'Monitor', order: 1 },
      { key: 'transmissor', name: 'Transmissor', order: 2 },
      { key: 'bateria', name: 'Bateria', order: 3 },
      { key: 'carregador', name: 'Carregador', order: 4 },
      { key: 'cabo', name: 'Cabo', order: 5 },
      { key: 'case', name: 'Case', order: 6 },
    ]
  },
  {
    key: 'audio',
    title: 'Áudio',
    icon: Mic,
    order: 3,
    subcategories: [
      { key: 'microfone', name: 'Microfone', order: 1 },
      { key: 'transmissor', name: 'Transmissor', order: 2 },
      { key: 'gravador', name: 'Gravador', order: 3 },
      { key: 'bateria', name: 'Bateria', order: 4 },
      { key: 'carregador', name: 'Carregador', order: 5 },
      { key: 'cabo', name: 'Cabo', order: 6 },
      { key: 'case', name: 'Case', order: 7 },
    ]
  },
  {
    key: 'lighting',
    title: 'Iluminação',
    icon: Lightbulb,
    order: 4,
    subcategories: [
      { key: 'luz', name: 'Luz', order: 1 },
      { key: 'led', name: 'LED', order: 2 },
      { key: 'modificador', name: 'Modificador', order: 3 },
      { key: 'bateria', name: 'Bateria', order: 4 },
      { key: 'carregador', name: 'Carregador', order: 5 },
      { key: 'cabo', name: 'Cabo', order: 6 },
      { key: 'case', name: 'Case', order: 7 },
    ]
  },
  {
    key: 'grip',
    title: 'Grip',
    icon: Wrench,
    order: 5,
    subcategories: [
      { key: 'tripé', name: 'Tripé', order: 1 },
      { key: 'cabeça', name: 'Cabeça', order: 2 },
      { key: 'slider', name: 'Slider', order: 3 },
      { key: 'gimbal', name: 'Gimbal', order: 4 },
      { key: 'estabilizador', name: 'Estabilizador', order: 5 },
      { key: 'bateria', name: 'Bateria', order: 6 },
      { key: 'carregador', name: 'Carregador', order: 7 },
      { key: 'cabo', name: 'Cabo', order: 8 },
      { key: 'case', name: 'Case', order: 9 },
    ]
  },
  {
    key: 'electrical',
    title: 'Elétrica',
    icon: Zap,
    order: 6,
    subcategories: [
      { key: 'gerador', name: 'Gerador', order: 1 },
      { key: 'extensão', name: 'Extensão', order: 2 },
      { key: 'distribuidor', name: 'Distribuidor', order: 3 },
      { key: 'bateria', name: 'Bateria', order: 4 },
      { key: 'carregador', name: 'Carregador', order: 5 },
      { key: 'cabo', name: 'Cabo', order: 6 },
    ]
  },
  {
    key: 'storage',
    title: 'Armazenamento',
    icon: HardDrive,
    order: 7,
    subcategories: [
      { key: 'hd', name: 'HD', order: 1 },
      { key: 'ssd', name: 'SSD', order: 2 },
      { key: 'cartão', name: 'Cartão de Memória', order: 3 },
      { key: 'leitor', name: 'Leitor', order: 4 },
      { key: 'case', name: 'Case', order: 5 },
    ]
  },
  {
    key: 'computers',
    title: 'Computadores',
    icon: Laptop,
    order: 8,
    subcategories: [
      { key: 'laptop', name: 'Laptop', order: 1 },
      { key: 'desktop', name: 'Desktop', order: 2 },
      { key: 'periférico', name: 'Periférico', order: 3 },
      { key: 'cabo', name: 'Cabo', order: 4 },
      { key: 'case', name: 'Case', order: 5 },
    ]
  },
  {
    key: 'miscellaneous',
    title: 'Diversos',
    icon: Package,
    order: 9,
    subcategories: [
      { key: 'acessório', name: 'Acessório', order: 1 },
      { key: 'ferramenta', name: 'Ferramenta', order: 2 },
      { key: 'consumível', name: 'Consumível', order: 3 },
      { key: 'outros', name: 'Outros', order: 4 },
    ]
  },
];

/**
 * Normaliza strings para comparação (remove acentos, espaços e converte para minúsculas)
 */
export const normalizeString = (str: string | undefined | null): string => {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '') // Remove espaços
    .trim();
};

/**
 * Encontra a categoria mãe correspondente baseado na categoria do equipamento
 */
export const findParentCategory = (category: string | undefined | null): ParentCategoryConfig | undefined => {
  if (!category) return undefined;
  
  const normalized = normalizeString(category);
  
  return PARENT_CATEGORIES.find(parentCat => {
    const normalizedParentKey = normalizeString(parentCat.key);
    const normalizedParentTitle = normalizeString(parentCat.title);
    
    return normalized.includes(normalizedParentKey) || 
           normalized.includes(normalizedParentTitle) ||
           normalizedParentKey.includes(normalized) ||
           normalizedParentTitle.includes(normalized);
  });
};

/**
 * Encontra a subcategoria correspondente dentro de uma categoria mãe
 */
export const findSubcategory = (
  parentCategory: ParentCategoryConfig,
  subcategory: string | undefined | null
): SubcategoryConfig | undefined => {
  if (!subcategory) return undefined;
  
  const normalized = normalizeString(subcategory);
  
  // PASSO 1: Tentar match exato primeiro (mais preciso)
  const exactMatch = parentCategory.subcategories.find(sub => {
    const normalizedSubKey = normalizeString(sub.key);
    const normalizedSubName = normalizeString(sub.name);
    
    return normalized === normalizedSubKey || normalized === normalizedSubName;
  });
  
  if (exactMatch) return exactMatch;
  
  // PASSO 2: Se não houver match exato, tentar match parcial
  // Ordenar por comprimento (matches maiores primeiro para evitar falsos positivos)
  const sortedSubcategories = [...parentCategory.subcategories].sort(
    (a, b) => normalizeString(b.name).length - normalizeString(a.name).length
  );
  
  return sortedSubcategories.find(sub => {
    const normalizedSubKey = normalizeString(sub.key);
    const normalizedSubName = normalizeString(sub.name);
    
    // Match parcial: a string normalizada contém ou está contida
    return normalized.includes(normalizedSubKey) || 
           normalized.includes(normalizedSubName) ||
           normalizedSubKey.includes(normalized) ||
           normalizedSubName.includes(normalized);
  });
};
