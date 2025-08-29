import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Camera, Mic, Zap, Package, HardDrive, Wrench, User, Clock, ImageIcon, DollarSign } from 'lucide-react';
import type { EquipmentFilters, EquipmentCategory } from '@/types/equipment';
import { cn } from '@/lib/utils';

interface QuickFiltersProps {
  filters: EquipmentFilters;
  onFiltersChange: (filters: EquipmentFilters) => void;
  stats?: {
    available: number;
    maintenance: number;
    onLoan: number;
    withoutImage: number;
    highValue: number;
    byCategory: Record<EquipmentCategory, number>;
  };
}

const quickFilterConfigs = [
  {
    key: 'available',
    label: 'Disponível',
    icon: Check,
    filter: { status: 'available' as const, loanStatus: 'available' as const },
    variant: 'default' as const
  },
  {
    key: 'maintenance',
    label: 'Manutenção',
    icon: Wrench,
    filter: { status: 'maintenance' as const },
    variant: 'secondary' as const
  },
  {
    key: 'onLoan',
    label: 'Emprestado',
    icon: User,
    filter: { loanStatus: 'on_loan' as const },
    variant: 'outline' as const
  },
  {
    key: 'overdue',
    label: 'Atrasado',
    icon: Clock,
    filter: { loanStatus: 'overdue' as const },
    variant: 'destructive' as const
  },
  {
    key: 'withoutImage',
    label: 'Sem Imagem',
    icon: ImageIcon,
    filter: { hasImage: false },
    variant: 'outline' as const
  },
  {
    key: 'highValue',
    label: 'Alto Valor',
    icon: DollarSign,
    filter: { minValue: 5000 },
    variant: 'outline' as const
  }
];

const categoryConfigs = [
  { key: 'camera', label: 'Câmeras', icon: Camera },
  { key: 'audio', label: 'Áudio', icon: Mic },
  { key: 'lighting', label: 'Iluminação', icon: Zap },
  { key: 'accessories', label: 'Acessórios', icon: Package },
  { key: 'storage', label: 'Armazenamento', icon: HardDrive }
];

export function QuickFilters({ filters, onFiltersChange, stats }: QuickFiltersProps) {
  const applyQuickFilter = (quickFilter: Partial<EquipmentFilters>) => {
    // Se o filtro já está ativo, remove ele
    const isActive = Object.entries(quickFilter).every(([key, value]) => 
      filters[key as keyof EquipmentFilters] === value
    );

    if (isActive) {
      const newFilters = { ...filters };
      Object.keys(quickFilter).forEach(key => {
        delete newFilters[key as keyof EquipmentFilters];
      });
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({ ...filters, ...quickFilter });
    }
  };

  const applyCategoryFilter = (category: EquipmentCategory) => {
    if (filters.category === category) {
      const newFilters = { ...filters };
      delete newFilters.category;
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({ ...filters, category });
    }
  };

  const isQuickFilterActive = (quickFilter: Partial<EquipmentFilters>) => {
    return Object.entries(quickFilter).every(([key, value]) => 
      filters[key as keyof EquipmentFilters] === value
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros de Status */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Status Rápido</h4>
        <div className="flex flex-wrap gap-2">
          {quickFilterConfigs.map((config) => {
            const Icon = config.icon;
            const isActive = isQuickFilterActive(config.filter);
            const count = stats?.[config.key as keyof typeof stats] as number;

            return (
              <Button
                key={config.key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyQuickFilter(config.filter)}
                className={cn(
                  "flex items-center gap-2 h-8",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{config.label}</span>
                {count !== undefined && (
                  <Badge 
                    variant={isActive ? 'secondary' : 'outline'} 
                    className="ml-1 text-xs h-4 px-1"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Filtros de Categoria */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Categorias</h4>
        <div className="flex flex-wrap gap-2">
          {categoryConfigs.map((config) => {
            const Icon = config.icon;
            const isActive = filters.category === config.key;
            const count = stats?.byCategory?.[config.key as EquipmentCategory];

            return (
              <Button
                key={config.key}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyCategoryFilter(config.key as EquipmentCategory)}
                className={cn(
                  "flex items-center gap-2 h-8",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                <span>{config.label}</span>
                {count !== undefined && (
                  <Badge 
                    variant={isActive ? 'secondary' : 'outline'} 
                    className="ml-1 text-xs h-4 px-1"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Componente otimizado com React.memo
export default React.memo(QuickFilters);