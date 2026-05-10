import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { PlatformAccessFilters, PlatformCategory } from '../types';
import { CATEGORY_LABELS } from '../types';

interface PlatformFiltersProps {
  filters: PlatformAccessFilters;
  onFiltersChange: (filters: PlatformAccessFilters) => void;
  stats?: {
    total: number;
    favorites: number;
    byCategory: Record<string, number>;
  };
}

export function PlatformFilters({ filters, onFiltersChange, stats }: PlatformFiltersProps) {
  const categories: Array<{ value: PlatformCategory | 'all'; label: string }> = [
    { value: 'all', label: 'Todas' },
    ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
      value: value as PlatformCategory,
      label,
    })),
  ];

  const handleCategoryChange = (category: PlatformCategory | 'all') => {
    onFiltersChange({ ...filters, category });
  };

  const handleFavoritesToggle = () => {
    onFiltersChange({ ...filters, favorites: !filters.favorites });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={14}
          strokeWidth={1.5}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'hsl(var(--ds-fg-4))',
            pointerEvents: 'none',
          }}
        />
        <Input
          placeholder="Buscar plataformas, usuários ou categorias…"
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{ paddingLeft: 34 }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleFavoritesToggle}
          className={'pill' + (filters.favorites ? ' acc' : '')}
          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Favoritas
          {stats && stats.favorites > 0 && (
            <span
              style={{
                fontVariantNumeric: 'tabular-nums',
                color: 'hsl(var(--ds-fg-4))',
                fontSize: 11,
              }}
            >
              {stats.favorites}
            </span>
          )}
        </button>

        {categories.map((category) => {
          const isActive = filters.category === category.value;
          const count =
            category.value === 'all' ? stats?.total : stats?.byCategory[category.value];

          return (
            <button
              key={category.value}
              type="button"
              onClick={() => handleCategoryChange(category.value)}
              className={'pill' + (isActive ? ' acc' : '')}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {category.label}
              {count !== undefined && count > 0 && (
                <span
                  style={{
                    fontVariantNumeric: 'tabular-nums',
                    color: isActive ? 'currentColor' : 'hsl(var(--ds-fg-4))',
                    opacity: isActive ? 0.7 : 1,
                    fontSize: 11,
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
  );
}
