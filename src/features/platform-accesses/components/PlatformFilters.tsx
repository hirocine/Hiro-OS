import { PageToolbar, SearchField, FilterChip, FilterChipRow } from '@/ds/components/toolbar';
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
      <PageToolbar
        search={
          <SearchField
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Buscar plataformas, usuários ou categorias…"
          />
        }
      />

      <FilterChipRow>
        <FilterChip
          label="Favoritas"
          count={stats?.favorites}
          active={!!filters.favorites}
          onClick={handleFavoritesToggle}
        />
        {categories.map((category) => {
          const isActive = filters.category === category.value;
          const count =
            category.value === 'all' ? stats?.total : stats?.byCategory[category.value];

          return (
            <FilterChip
              key={category.value}
              label={category.label}
              count={count}
              active={isActive}
              onClick={() => handleCategoryChange(category.value)}
            />
          );
        })}
      </FilterChipRow>
    </div>
  );
}
