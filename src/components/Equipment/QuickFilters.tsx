import React from 'react';
import { Check, Camera, Mic, Zap, Package, HardDrive, Wrench, User, Clock, Image as ImageIcon, DollarSign } from 'lucide-react';
import type { EquipmentFilters, EquipmentCategory } from '@/types/equipment';

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
  { key: 'available',    label: 'Disponível', Icon: Check,     filter: { status: 'available' as const, loanStatus: 'available' as const } },
  { key: 'maintenance',  label: 'Manutenção', Icon: Wrench,    filter: { status: 'maintenance' as const } },
  { key: 'onLoan',       label: 'Emprestado', Icon: User,      filter: { loanStatus: 'on_loan' as const } },
  { key: 'overdue',      label: 'Atrasado',   Icon: Clock,     filter: { loanStatus: 'overdue' as const } },
  { key: 'withoutImage', label: 'Sem Imagem', Icon: ImageIcon, filter: { hasImage: false } },
  { key: 'highValue',    label: 'Alto Valor', Icon: DollarSign,filter: { minValue: 5000 } },
];

const categoryConfigs = [
  { key: 'camera',      label: 'Câmeras',       Icon: Camera },
  { key: 'audio',       label: 'Áudio',         Icon: Mic },
  { key: 'lighting',    label: 'Iluminação',    Icon: Zap },
  { key: 'accessories', label: 'Acessórios',    Icon: Package },
  { key: 'storage',     label: 'Armazenamento', Icon: HardDrive },
];

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 10,
};

function QuickFiltersBase({ filters, onFiltersChange, stats }: QuickFiltersProps) {
  const applyQuickFilter = (quickFilter: Partial<EquipmentFilters>) => {
    const isActive = Object.entries(quickFilter).every(
      ([key, value]) => filters[key as keyof EquipmentFilters] === value
    );

    if (isActive) {
      const newFilters = { ...filters };
      Object.keys(quickFilter).forEach((key) => {
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
    return Object.entries(quickFilter).every(
      ([key, value]) => filters[key as keyof EquipmentFilters] === value
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <span style={sectionLabel}>Status Rápido</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {quickFilterConfigs.map((config) => {
            const isActive = isQuickFilterActive(config.filter);
            const count = stats?.[config.key as keyof typeof stats] as number;
            return (
              <button
                key={config.key}
                type="button"
                onClick={() => applyQuickFilter(config.filter)}
                className={'pill' + (isActive ? ' acc' : '')}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <config.Icon size={11} strokeWidth={1.5} />
                <span>{config.label}</span>
                {count !== undefined && (
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: isActive ? 'currentColor' : 'hsl(var(--ds-fg-4))',
                      opacity: isActive ? 0.7 : 1,
                      fontSize: 10,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span style={sectionLabel}>Categorias</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categoryConfigs.map((config) => {
            const isActive = filters.category === config.key;
            const count = stats?.byCategory?.[config.key as EquipmentCategory];
            return (
              <button
                key={config.key}
                type="button"
                onClick={() => applyCategoryFilter(config.key as EquipmentCategory)}
                className={'pill' + (isActive ? ' acc' : '')}
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <config.Icon size={11} strokeWidth={1.5} />
                <span>{config.label}</span>
                {count !== undefined && (
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: isActive ? 'currentColor' : 'hsl(var(--ds-fg-4))',
                      opacity: isActive ? 0.7 : 1,
                      fontSize: 10,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const QuickFilters = React.memo(QuickFiltersBase);
export default QuickFilters;
