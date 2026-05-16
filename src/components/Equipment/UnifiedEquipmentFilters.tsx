import { useState, useEffect, useCallback, useMemo } from 'react';
import type { EquipmentFilters } from '@/types/equipment';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Filter, ChevronDown, Search, Settings, RotateCcw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AdvancedFilters } from './AdvancedFilters';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useDebounce } from '@/hooks/useDebounce';
import { Autocomplete } from '@/components/ui/autocomplete';
import { useCategories } from '@/hooks/useCategories';

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

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
};

export function UnifiedEquipmentFilters({ filters, onFiltersChange, allEquipment = [] }: UnifiedEquipmentFiltersProps) {
  const { categories: dbCategories } = useCategories();
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 300);

  const { suggestions } = useAdvancedFilters(allEquipment, filters, onFiltersChange);

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

  const updateFilter = useCallback(
    (key: keyof EquipmentFilters, value: string | undefined) => {
      onFiltersChange({ ...filters, [key]: value || undefined });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    setSearchInput('');
    onFiltersChange({});
  }, [onFiltersChange]);

  const handleFiltersChange = useCallback(
    (newFilters: EquipmentFilters) => onFiltersChange(newFilters),
    [onFiltersChange]
  );

  const activeFiltersCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([key, value]) =>
          !['sortBy', 'sortOrder', 'sortFields'].includes(key) &&
          value !== undefined &&
          value !== '' &&
          value !== null
      ).length,
    [filters]
  );

  const categoryLabels = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(dbCategories.filter((c) => !c.subcategory).map((c) => c.category))
    );
    return uniqueCategories.reduce((acc, cat) => {
      acc[cat] = cat;
      return acc;
    }, {} as Record<string, string>);
  }, [dbCategories]);

  const statusLabels = { available: 'Disponível', maintenance: 'Manutenção' };
  const itemTypeLabels = { main: 'Principal', accessory: 'Acessório' };

  const ChipRemove = ({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) => (
    <span className="pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {children}
      <button
        type="button"
        onClick={onRemove}
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: 14,
          height: 14,
          color: 'hsl(var(--ds-fg-3))',
          background: 'transparent',
          border: 0,
          cursor: 'pointer',
        }}
        aria-label="Remover filtro"
      >
        <X size={10} strokeWidth={1.5} />
      </button>
    </span>
  );

  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <span
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: 'hsl(var(--ds-fg-1))',
            }}
          >
            Filtros
          </span>
          {activeFiltersCount > 0 && (
            <span
              style={{
                fontSize: 11,
                color: 'hsl(var(--ds-fg-3))',
                fontVariantNumeric: 'tabular-nums',
                marginLeft: 2,
              }}
            >
              ({activeFiltersCount})
            </span>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="btn"
            style={{ height: 28, padding: '0 10px', fontSize: 11, gap: 4 }}
          >
            <RotateCcw size={12} strokeWidth={1.5} />
            <span>Limpar</span>
          </button>
        )}
      </div>

      <div
        style={{
          padding: '16px 18px',
          borderTop: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
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
            placeholder="Buscar por nome, marca, modelo…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
          {isSearching && (
            <div
              className="animate-spin"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 14,
                height: 14,
                border: '2px solid hsl(var(--ds-fg-4))',
                borderTopColor: 'transparent',
                borderRadius: '50%',
              }}
            />
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={fieldLabel}>Status</span>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={fieldLabel}>Categoria</span>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={fieldLabel}>Tipo</span>
            <Select
              value={filters.itemType || 'all'}
              onValueChange={(value) => updateFilter('itemType', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={fieldLabel}>Marca</span>
            <Autocomplete
              options={(suggestions?.brands || []).map((brand) => ({ value: brand, label: brand }))}
              value={filters.brand || ''}
              onValueChange={(value) => updateFilter('brand', value || undefined)}
              placeholder="Digite para buscar…"
              allowCustomValue
            />
          </div>
        </div>

        <Collapsible open={isAdvancedExpanded} onOpenChange={setIsAdvancedExpanded}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                fontSize: 12,
                color: 'hsl(var(--ds-fg-2))',
                fontWeight: 500,
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Settings size={13} strokeWidth={1.5} />
                <span>Filtros Avançados</span>
              </span>
              <ChevronDown
                size={13}
                strokeWidth={1.5}
                style={{ transition: 'transform 0.15s', transform: isAdvancedExpanded ? 'rotate(180deg)' : 'none' }}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent style={{ marginTop: 12 }}>
            <AdvancedFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              suggestions={suggestions}
            />
          </CollapsibleContent>
        </Collapsible>

        {activeFiltersCount > 0 && (
          <div
            style={{
              paddingTop: 12,
              borderTop: '1px solid hsl(var(--ds-line-2))',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-3))',
                marginRight: 4,
              }}
            >
              Ativos
            </span>

            {filters.search && (
              <ChipRemove
                onRemove={() => {
                  setSearchInput('');
                  updateFilter('search', undefined);
                }}
              >
"{filters.search}"
              </ChipRemove>
            )}

            {filters.category && (
              <ChipRemove onRemove={() => updateFilter('category', undefined)}>
                {filters.category}
              </ChipRemove>
            )}

            {filters.status && (
              <ChipRemove onRemove={() => updateFilter('status', undefined)}>
                {statusLabels[filters.status as keyof typeof statusLabels]}
              </ChipRemove>
            )}

            {filters.itemType && (
              <ChipRemove onRemove={() => updateFilter('itemType', undefined)}>
                {itemTypeLabels[filters.itemType as keyof typeof itemTypeLabels]}
              </ChipRemove>
            )}

            {filters.brand && (
              <ChipRemove onRemove={() => updateFilter('brand', undefined)}>
                {filters.brand}
              </ChipRemove>
            )}

            {(filters.minValue || filters.maxValue) && (
              <ChipRemove
                onRemove={() => {
                  updateFilter('minValue', undefined);
                  updateFilter('maxValue', undefined);
                }}
              >
                R$ {filters.minValue || 0} – R$ {filters.maxValue || '∞'}
              </ChipRemove>
            )}

            {filters.loanStatus && (
              <ChipRemove onRemove={() => updateFilter('loanStatus', undefined)}>
                {filters.loanStatus === 'available'
                  ? 'Disponível'
                  : filters.loanStatus === 'on_loan'
                    ? 'Emprestado'
                    : 'Atrasado'}
              </ChipRemove>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
