import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { EquipmentFilters } from '@/types/equipment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter, ChevronDown, Search, Settings, History, Save } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { QuickFilters } from './QuickFilters';
import { AdvancedFilters } from './AdvancedFilters';
import { SavedFilters } from './SavedFilters';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useFilterHistory } from '@/hooks/useFilterHistory';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import { Separator } from '@/components/ui/separator';
import { useCategoriesContext } from '@/contexts/CategoriesContext';

interface EquipmentFiltersProps {
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

export function EquipmentFiltersComponent({ filters, onFiltersChange, allEquipment = [], stats }: EquipmentFiltersProps) {
  const { categories: dbCategories } = useCategoriesContext();
  const [isBasicExpanded, setIsBasicExpanded] = useState(true);
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [isQuickFiltersExpanded, setIsQuickFiltersExpanded] = useState(true);
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
      // Excluir campos de ordenação da contagem de filtros ativos
      !['sortBy', 'sortOrder', 'sortFields'].includes(key) &&
      value !== undefined && value !== '' && value !== null
    ).length
  , [filters]);

  // Criar mapa de labels a partir das categorias do banco
  const categoryLabels = useMemo(() => {
    const uniqueCategories = Array.from(new Set(dbCategories.filter(c => !c.subcategory).map(c => c.category)));
    return uniqueCategories.reduce((acc, cat) => {
      acc[cat] = cat;
      return acc;
    }, {} as Record<string, string>);
  }, [dbCategories]);

  const statusLabels = {
    available: 'Disponível',
    maintenance: 'Manutenção'
  };

  const itemTypeLabels = {
    main: 'Principal',
    accessory: 'Acessório'
  };

  return (
    <div className="space-y-4">
      {/* Header com Search e Ações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <SavedFilters 
                currentFilters={filters} 
                onFiltersChange={handleFiltersChange}
              />
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Filtros Rápidos */}
      <Card>
        <Collapsible open={isQuickFiltersExpanded} onOpenChange={setIsQuickFiltersExpanded}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="text-base font-medium">Filtros Rápidos</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${isQuickFiltersExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <QuickFilters 
                filters={filters}
                onFiltersChange={handleFiltersChange}
                stats={quickFilterStats}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Filtros Básicos */}
      <Card>
        <Collapsible open={isBasicExpanded} onOpenChange={setIsBasicExpanded}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="text-base font-medium">Filtros Básicos</CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${isBasicExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={filters.category || 'all'} onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                          {stats?.byCategory[key] && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {stats.byCategory[key]}
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
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
                  <Label>Tipo</Label>
                  <Select value={filters.itemType || 'all'} onValueChange={(value) => updateFilter('itemType', value === 'all' ? undefined : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {Object.entries(itemTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                          {stats?.byItemType[key] && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {stats.byItemType[key]}
                            </Badge>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Filtros Avançados */}
      <Card>
        <Collapsible open={isAdvancedExpanded} onOpenChange={setIsAdvancedExpanded}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Filtros Avançados
                </CardTitle>
                <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedExpanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <AdvancedFilters 
                filters={filters}
                onFiltersChange={handleFiltersChange}
                suggestions={suggestions}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground">Filtros ativos:</span>
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Busca: "{filters.search}"
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
                  {filters.category}
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
                  Marca: {filters.brand}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                   onClick={() => updateFilter('brand', undefined)}
                 />
                </Badge>
              )}
              {(filters.minValue || filters.maxValue) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Valor: R$ {filters.minValue || 0} - R$ {filters.maxValue || '∞'}
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
                  Status: {filters.loanStatus === 'available' ? 'Disponível' : 
                          filters.loanStatus === 'on_loan' ? 'Emprestado' : 'Atrasado'}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilter('loanStatus', undefined)}
                  />
                </Badge>
              )}
              {filters.hasImage === true && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Com imagem
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilter('hasImage', undefined)}
                  />
                </Badge>
              )}
              {filters.patrimonySeries && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Série: {filters.patrimonySeries}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => updateFilter('patrimonySeries', undefined)}
                  />
                </Badge>
              )}
              {(filters.purchaseDateFrom || filters.purchaseDateTo) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Período: {filters.purchaseDateFrom || '...'} - {filters.purchaseDateTo || '...'}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => {
                      updateFilter('purchaseDateFrom', undefined);
                      updateFilter('purchaseDateTo', undefined);
                    }}
                  />
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Filtros */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 3).map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange(item.filters)}
                  className="w-full justify-start text-left h-auto py-2 px-3"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {item.name || getFilterDisplayName(item.filters)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente com React.memo para otimização
export default React.memo(EquipmentFiltersComponent);