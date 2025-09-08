import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { EquipmentFilters } from '@/types/equipment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter, ChevronDown, Search, Settings, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdvancedFilters } from './AdvancedFilters';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { Autocomplete } from '@/components/ui/autocomplete';

interface UnifiedEquipmentFiltersProps {
  filters: EquipmentFilters;
  onFiltersChange: (filters: EquipmentFilters) => void;
  allEquipment?: any[];
  stats?: {
    total: number;
    available: number;
    maintenance: number;
    inUse: number;
    mainItems: number;
    accessories: number;
    byCategory: Record<string, number>;
    byItemType: Record<string, number>;
    totalValue: number;
    valueByCategory: Record<string, number>;
  };
}

export function UnifiedEquipmentFilters({ filters, onFiltersChange, allEquipment = [], stats }: UnifiedEquipmentFiltersProps) {
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearch = useDebounce(searchInput, 300);
  
  const { 
    suggestions, 
    applyFiltersWithHistory 
  } = useAdvancedFilters(allEquipment, filters, onFiltersChange);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setIsSearching(true);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateFilter('search', debouncedSearch);
      setIsSearching(false);
    }
  }, [debouncedSearch]);

  const updateFilter = useCallback((key: keyof EquipmentFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    onFiltersChange({});
  }, [onFiltersChange]);

  const handleFiltersChange = useCallback((newFilters: EquipmentFilters) => {
    onFiltersChange(newFilters);
  }, [onFiltersChange]);

  const activeFiltersCount = useMemo(() => 
    Object.entries(filters).filter(([key, value]) => 
      !['sortBy', 'sortOrder', 'sortFields'].includes(key) &&
      value !== undefined && value !== '' && value !== null
    ).length
  , [filters]);

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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, marca, modelo..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>


        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-sm">Status</Label>
            <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
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
          
          <div className="space-y-2">
            <Label className="text-sm">Categoria</Label>
            <Select value={filters.category || 'all'} onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
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
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm">Tipo</Label>
            <Select value={filters.itemType || 'all'} onValueChange={(value) => updateFilter('itemType', value === 'all' ? undefined : value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(itemTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Marca</Label>
            <Autocomplete
              options={(suggestions?.brands || []).map(brand => ({ value: brand, label: brand }))}
              value={filters.brand || ''}
              onValueChange={(value) => updateFilter('brand', value || undefined)}
              placeholder="Digite para buscar marca..."
              allowCustomValue
              className="h-9"
            />
          </div>
        </div>

        {/* Advanced Filters (Collapsible) */}
        <Collapsible open={isAdvancedExpanded} onOpenChange={setIsAdvancedExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Filtros Avançados
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <AdvancedFilters 
              filters={filters}
              onFiltersChange={handleFiltersChange}
              suggestions={suggestions}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="pt-2 border-t">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground">Ativos:</span>
              
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  "{filters.search}"
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => {
                      setSearchInput('');
                      updateFilter('search', undefined);
                    }}
                  />
                </Badge>
              )}
              
              {filters.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {categoryLabels[filters.category as keyof typeof categoryLabels]}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilter('category', undefined)}
                  />
                </Badge>
              )}
              
              {filters.status && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {statusLabels[filters.status as keyof typeof statusLabels]}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilter('status', undefined)}
                  />
                </Badge>
              )}
              
              {filters.itemType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {itemTypeLabels[filters.itemType as keyof typeof itemTypeLabels]}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilter('itemType', undefined)}
                  />
                </Badge>
              )}
              
              {filters.brand && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.brand}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilter('brand', undefined)}
                  />
                </Badge>
              )}
              
              {(filters.minValue || filters.maxValue) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  R$ {filters.minValue || 0} - R$ {filters.maxValue || '∞'}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => {
                      updateFilter('minValue', undefined);
                      updateFilter('maxValue', undefined);
                    }}
                  />
                </Badge>
              )}
              
              {filters.loanStatus && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.loanStatus === 'available' ? 'Disponível' : 
                   filters.loanStatus === 'on_loan' ? 'Emprestado' : 'Atrasado'}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilter('loanStatus', undefined)}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}