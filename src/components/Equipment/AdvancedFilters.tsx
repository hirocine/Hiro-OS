import React, { useState, useCallback } from 'react';
import { Calendar, DollarSign, Hash, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RangeSlider } from '@/components/ui/range-slider';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { EquipmentFilters } from '@/types/equipment';
import { cn } from '@/lib/utils';

interface AdvancedFiltersProps {
  filters: EquipmentFilters;
  onFiltersChange: (filters: EquipmentFilters) => void;
  suggestions?: {
    brands: string[];
    patrimonySeries: string[];
  };
  valueRange?: { min: number; max: number };
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  suggestions,
  valueRange = { min: 0, max: 50000 }
}: AdvancedFiltersProps) {
  const [purchaseDateFromOpen, setPurchaseDateFromOpen] = useState(false);
  const [purchaseDateToOpen, setPurchaseDateToOpen] = useState(false);

  const updateFilter = useCallback((key: keyof EquipmentFilters, value: any) => {
    if (value === undefined || value === null || value === '') {
      const newFilters = { ...filters };
      delete newFilters[key];
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  }, [filters, onFiltersChange]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  const handleValueRangeChange = useCallback((value: [number, number]) => {
    const [min, max] = value;
    
    // Se os valores são iguais ao range completo, remove os filtros
    if (min === valueRange.min && max === valueRange.max) {
      updateFilter('minValue', undefined);
      updateFilter('maxValue', undefined);
    } else {
      updateFilter('minValue', min === valueRange.min ? undefined : min);
      updateFilter('maxValue', max === valueRange.max ? undefined : max);
    }
  }, [valueRange, updateFilter]);

  return (
    <div className="space-y-6">
      {/* Filtros de Valor */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Faixa de Valor</Label>
        </div>
        <RangeSlider
          label=""
          min={valueRange.min}
          max={valueRange.max}
          step={100}
          value={[
            filters.minValue ?? valueRange.min,
            filters.maxValue ?? valueRange.max
          ]}
          onValueChange={handleValueRangeChange}
          formatValue={formatCurrency}
          className="pl-4"
        />
      </div>

      {/* Filtros de Data */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Período de Compra</Label>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Data Inicial</Label>
            <Popover open={purchaseDateFromOpen} onOpenChange={setPurchaseDateFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 min-w-0",
                    !filters.purchaseDateFrom && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {filters.purchaseDateFrom 
                      ? format(new Date(filters.purchaseDateFrom), "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar"
                    }
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.purchaseDateFrom ? new Date(filters.purchaseDateFrom) : undefined}
                  onSelect={(date) => {
                    updateFilter('purchaseDateFrom', date ? format(date, 'yyyy-MM-dd') : undefined);
                    setPurchaseDateFromOpen(false);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Data Final</Label>
            <Popover open={purchaseDateToOpen} onOpenChange={setPurchaseDateToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 min-w-0",
                    !filters.purchaseDateTo && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {filters.purchaseDateTo 
                      ? format(new Date(filters.purchaseDateTo), "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar"
                    }
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.purchaseDateTo ? new Date(filters.purchaseDateTo) : undefined}
                  onSelect={(date) => {
                    updateFilter('purchaseDateTo', date ? format(date, 'yyyy-MM-dd') : undefined);
                    setPurchaseDateToOpen(false);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Filtro de Marca */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Marca</Label>
        <div className="pl-4">
          <Autocomplete
            options={(suggestions?.brands || []).map(brand => ({ value: brand, label: brand }))}
            value={filters.brand || ''}
            onValueChange={(value) => updateFilter('brand', value)}
            placeholder="Digite ou selecione uma marca..."
            allowCustomValue={true}
          />
        </div>
      </div>

      {/* Filtro de Série do Patrimônio */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Série do Patrimônio</Label>
        </div>
        <div className="pl-4">
          <Autocomplete
            options={(suggestions?.patrimonySeries || []).map(series => ({ 
              value: series, 
              label: series,
              description: `Itens que começam com "${series}"`
            }))}
            value={filters.patrimonySeries || ''}
            onValueChange={(value) => updateFilter('patrimonySeries', value)}
            placeholder="Ex: 2024-, EQUIP-..."
            allowCustomValue={true}
          />
        </div>
      </div>

      {/* Filtro de Status de Empréstimo */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Status de Empréstimo</Label>
        </div>
        <div className="pl-4">
          <Select 
            value={filters.loanStatus || 'all'} 
            onValueChange={(value) => updateFilter('loanStatus', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="on_loan">Em Empréstimo</SelectItem>
              <SelectItem value="overdue">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtro de Imagem */}
      <div className="space-y-3 pl-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Apenas itens com imagem</Label>
          <Switch
            checked={filters.hasImage === true}
            onCheckedChange={(checked) => updateFilter('hasImage', checked ? true : undefined)}
          />
        </div>
      </div>
    </div>
  );
}

// Componente otimizado com React.memo
export default React.memo(AdvancedFilters);