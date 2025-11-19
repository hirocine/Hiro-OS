import { Camera, Monitor, Mic, Lightbulb, Zap, HardDrive, Wrench, Package, MoreHorizontal } from 'lucide-react';

/**
 * Mapeamento simples de ícones por nome de categoria
 * Usado para manter os ícones visuais sem dependência de estrutura hardcoded
 */
export const CATEGORY_ICON_MAP: Record<string, any> = {
  'Câmera': Camera,
  'Monitoração': Monitor,
  'Áudio': Mic,
  'Iluminação': Lightbulb,
  'Elétrica': Zap,
  'Armazenamento': HardDrive,
  'Grip': Wrench,
  'Acessório': Package,
  'Diversos': MoreHorizontal,
};

/**
 * Retorna o ícone para uma categoria específica
 * @param categoryName - Nome da categoria principal
 * @returns Componente de ícone do lucide-react
 */
export function getCategoryIcon(categoryName: string) {
  return CATEGORY_ICON_MAP[categoryName] || Package; // Package como fallback
}
