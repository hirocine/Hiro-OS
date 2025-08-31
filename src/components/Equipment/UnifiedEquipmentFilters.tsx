import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { EquipmentFilters } from '@/types/equipment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter, ChevronDown, Search, Settings, History, Save, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdvancedFilters } from './AdvancedFilters';
import { SavedFilters } from './SavedFilters';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useFilterHistory } from '@/hooks/useFilterHistory';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    valueRange, 
    quickFilterStats, 
    applyFiltersWithHistory 
  } = useAdvancedFilters(allEquipment, filters, onFiltersChange);

  const { history, getFilterDisplayName } = useFilterHistory();

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

  // Quick filter configurations
  const quickFilterConfigs = [
    {
      key: 'available',
      label: 'Disponível',
      filters: { status: 'available' },
      count: quickFilterStats?.available
    },
    {
      key: 'maintenance', 
      label: 'Manutenção',
      filters: { status: 'maintenance' },
      count: quickFilterStats?.maintenance
    }
  ];

  const categoryFilterConfigs = [
    { key: 'camera', label: 'Câmeras', count: quickFilterStats?.byCategory?.camera },
    { key: 'audio', label: 'Áudio', count: quickFilterStats?.byCategory?.audio },
    { key: 'lighting', label: 'Iluminação', count: quickFilterStats?.byCategory?.lighting },
    { key: 'accessories', label: 'Acessórios', count: quickFilterStats?.byCategory?.accessories }
  ];

  const isQuickFilterActive = (config: any) => {
    return Object.entries(config.filters).every(([key, value]) => 
      filters[key as keyof EquipmentFilters] === value
    );
  };

  const applyQuickFilter = (config: any) => {
    const isActive = isQuickFilterActive(config);
    if (isActive) {
      // Remove filter
      const newFilters = { ...filters };
      Object.keys(config.filters).forEach(key => {
        delete newFilters[key as keyof EquipmentFilters];
      });
      onFiltersChange(newFilters);
    } else {
      // Apply filter
      onFiltersChange({ ...filters, ...config.filters });
    }
  };

  const applyCategoryFilter = (category: string) => {
    if (filters.category === category) {
      updateFilter('category', undefined);
    } else {
      updateFilter('category', category);
    }
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
            {/* History Popover */}
            {history.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <History className="h-4 w-4 mr-1" />
                    Histórico
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Filtros Recentes</h4>
                    <Separator />
                    {history.slice(0, 5).map((item) => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFiltersChange(item.filters)}
                        className="w-full justify-start text-left h-auto py-2"
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium truncate max-w-full">
                            {item.name || getFilterDisplayName(item.filters)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.timestamp).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            
            {/* Saved Filters */}
            <SavedFilters 
              currentFilters={filters} 
              onFiltersChange={handleFiltersChange}
            />
            
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

        {/* Quick Status Filters */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Filtros Rápidos</Label>
          <div className="flex flex-wrap gap-2">
            {quickFilterConfigs.map((config) => (
              <Button
                key={config.key}
                variant={isQuickFilterActive(config) ? "default" : "outline"}
                size="sm"
                onClick={() => applyQuickFilter(config)}
                className="h-8"
              >
                {config.label}
                {config.count !== undefined && (
                  <Badge 
                    variant={isQuickFilterActive(config) ? "secondary" : "outline"} 
                    className="ml-2 text-xs"
                  >
                    {config.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Categorias</Label>
          <div className="flex flex-wrap gap-2">
            {categoryFilterConfigs.map((config) => (
              <Button
                key={config.key}
                variant={filters.category === config.key ? "default" : "outline"}
                size="sm"
                onClick={() => applyCategoryFilter(config.key)}
                className="h-8"
              >
                {config.label}
                {config.count !== undefined && (
                  <Badge 
                    variant={filters.category === config.key ? "secondary" : "outline"} 
                    className="ml-2 text-xs"
                  >
                    {config.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              valueRange={valueRange}
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