import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PlatformAccessFilters, PlatformCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import { cn } from '@/lib/utils';

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
    onFiltersChange({
      ...filters,
      category,
    });
  };

  const handleFavoritesToggle = () => {
    onFiltersChange({
      ...filters,
      favorites: !filters.favorites,
    });
  };

  const handleSearchChange = (search: string) => {
    onFiltersChange({
      ...filters,
      search,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar plataformas, usuários ou categorias..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Favorites Filter */}
        <Button
          variant={filters.favorites ? 'default' : 'outline'}
          size="sm"
          onClick={handleFavoritesToggle}
        >
          Favoritas
          {stats && stats.favorites > 0 && (
            <Badge variant="secondary" className="ml-2">
              {stats.favorites}
            </Badge>
          )}
        </Button>

        {/* Category Filters */}
        {categories.map((category) => {
          const isActive = filters.category === category.value;
          const count = category.value === 'all'
            ? stats?.total
            : stats?.byCategory[category.value];

          return (
            <Button
              key={category.value}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange(category.value)}
            >
              {category.label}
              {count !== undefined && count > 0 && (
                <Badge
                  variant="secondary"
                  className={cn("ml-2", isActive && "bg-primary-foreground/20")}
                >
                  {count}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
