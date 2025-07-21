import { EquipmentFilters } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { categoryLabels, statusLabels } from '@/data/mockData';

interface EquipmentFiltersProps {
  filters: EquipmentFilters;
  onFiltersChange: (filters: EquipmentFilters) => void;
}

export function EquipmentFiltersComponent({ filters, onFiltersChange }: EquipmentFiltersProps) {
  const updateFilter = (key: keyof EquipmentFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.category || filters.status || filters.search;

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg shadow-card border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipamento..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}