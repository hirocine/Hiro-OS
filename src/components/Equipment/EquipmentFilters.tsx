import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { X, Search, Filter, SlidersHorizontal } from 'lucide-react';
import { EquipmentFilters, DashboardStats } from '@/types/equipment';
import { useState } from 'react';

interface EquipmentFiltersProps {
  filters: EquipmentFilters;
  onFiltersChange: (filters: EquipmentFilters) => void;
  stats?: DashboardStats;
}

export function EquipmentFiltersComponent({ filters, onFiltersChange, stats }: EquipmentFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const updateFilter = (key: keyof EquipmentFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;
  const hasSearch = filters.search && filters.search.length > 0;

  const categoryLabels = {
    camera: 'Câmeras',
    audio: 'Áudio', 
    lighting: 'Iluminação',
    accessories: 'Acessórios',
    storage: 'Armazenamento'
  };

  const statusLabels = {
    available: 'Disponível',
    maintenance: 'Manutenção'
  };

  const itemTypeLabels = {
    main: 'Principal',
    accessory: 'Acessório'
  };

  return (
    <Card className="mb-6 animate-fade-in">
      <CardContent className="p-4">
        {/* Header with toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-base font-medium">Filtros</h3>
            </div>
            
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} ativo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick search - always visible */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, marca, série, patrimônio..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          {hasSearch && (
            <p className="text-xs text-muted-foreground mt-1">
              Buscando por: "{filters.search}"
            </p>
          )}
        </div>

        {/* Advanced filters - collapsible on mobile */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${!isExpanded ? 'hidden md:grid' : ''}`}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Categoria</label>
            <Select value={filters.category || ''} onValueChange={(value) => updateFilter('category', value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status</label>
            <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo</label>
            <Select value={filters.itemType || ''} onValueChange={(value) => updateFilter('itemType', value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {Object.entries(itemTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filters display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
            {filters.category && (
              <Badge variant="secondary" className="text-xs">
                {categoryLabels[filters.category as keyof typeof categoryLabels]}
                <button 
                  onClick={() => updateFilter('category', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="text-xs">
                {statusLabels[filters.status as keyof typeof statusLabels]}
                <button 
                  onClick={() => updateFilter('status', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.itemType && (
              <Badge variant="secondary" className="text-xs">
                {itemTypeLabels[filters.itemType as keyof typeof itemTypeLabels]}
                <button 
                  onClick={() => updateFilter('itemType', undefined)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}