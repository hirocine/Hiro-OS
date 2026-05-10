import React, { useState, useCallback } from 'react';
import { Calendar, Hash, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { EquipmentFilters } from '@/types/equipment';

interface AdvancedFiltersProps {
  filters: EquipmentFilters;
  onFiltersChange: (filters: EquipmentFilters) => void;
  suggestions?: {
    brands: string[];
    patrimonySeries: string[];
  };
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

function AdvancedFiltersBase({ filters, onFiltersChange, suggestions }: AdvancedFiltersProps) {
  const [purchaseDateFromOpen, setPurchaseDateFromOpen] = useState(false);
  const [purchaseDateToOpen, setPurchaseDateToOpen] = useState(false);

  const updateFilter = useCallback(
    (key: keyof EquipmentFilters, value: any) => {
      if (value === undefined || value === null || value === '') {
        const newFilters = { ...filters };
        delete newFilters[key];
        onFiltersChange(newFilters);
      } else {
        onFiltersChange({ ...filters, [key]: value });
      }
    },
    [filters, onFiltersChange]
  );

  const DateBtn = ({ value, placeholder }: { value: string | undefined; placeholder: string }) => (
    <button
      type="button"
      className="btn"
      style={{
        width: '100%',
        justifyContent: 'flex-start',
        gap: 8,
        height: 34,
        color: value ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-4))',
      }}
    >
      <Calendar size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : placeholder}
      </span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <span style={sectionLabel}>
          <Calendar size={13} strokeWidth={1.5} />
          Período de Compra
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, paddingLeft: 16, marginTop: 10 }}>
          <div>
            <label style={fieldLabel}>Data Inicial</label>
            <Popover open={purchaseDateFromOpen} onOpenChange={setPurchaseDateFromOpen}>
              <PopoverTrigger asChild>
                <div>
                  <DateBtn value={filters.purchaseDateFrom} placeholder="Selecionar" />
                </div>
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

          <div>
            <label style={fieldLabel}>Data Final</label>
            <Popover open={purchaseDateToOpen} onOpenChange={setPurchaseDateToOpen}>
              <PopoverTrigger asChild>
                <div>
                  <DateBtn value={filters.purchaseDateTo} placeholder="Selecionar" />
                </div>
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

      <div>
        <span style={sectionLabel}>Marca</span>
        <div style={{ paddingLeft: 16, marginTop: 10 }}>
          <Autocomplete
            options={(suggestions?.brands || []).map((brand) => ({ value: brand, label: brand }))}
            value={filters.brand || ''}
            onValueChange={(value) => updateFilter('brand', value)}
            placeholder="Digite ou selecione uma marca…"
            allowCustomValue={true}
          />
        </div>
      </div>

      <div>
        <span style={sectionLabel}>
          <Hash size={13} strokeWidth={1.5} />
          Série do Patrimônio
        </span>
        <div style={{ paddingLeft: 16, marginTop: 10 }}>
          <Autocomplete
            options={(suggestions?.patrimonySeries || []).map((series) => ({
              value: series,
              label: series,
              description: `Itens que começam com "${series}"`,
            }))}
            value={filters.patrimonySeries || ''}
            onValueChange={(value) => updateFilter('patrimonySeries', value)}
            placeholder="Ex: 2024-, EQUIP-…"
            allowCustomValue={true}
          />
        </div>
      </div>

      <div>
        <span style={sectionLabel}>
          <Clock size={13} strokeWidth={1.5} />
          Status de Empréstimo
        </span>
        <div style={{ paddingLeft: 16, marginTop: 10 }}>
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

      <div style={{ paddingLeft: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>
            Apenas itens com imagem
          </span>
          <Switch
            checked={filters.hasImage === true}
            onCheckedChange={(checked) => updateFilter('hasImage', checked ? true : undefined)}
          />
        </div>
      </div>
    </div>
  );
}

export const AdvancedFilters = React.memo(AdvancedFiltersBase);
export default AdvancedFilters;
