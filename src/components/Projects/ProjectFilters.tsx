import { useState, useEffect, useMemo } from 'react';
import type { ProjectFilters } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Search } from 'lucide-react';
import { statusLabels } from '@/lib/projectLabels';
import { useDebounce } from '@/hooks/useDebounce';

interface ProjectFiltersProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
}

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

export function ProjectFilters({ filters, onFiltersChange }: ProjectFiltersProps) {
  const [nameInput, setNameInput] = useState(filters.name || '');
  const [responsibleInput, setResponsibleInput] = useState(filters.responsible || '');

  const debouncedName = useDebounce(nameInput, 300);
  const debouncedResponsible = useDebounce(responsibleInput, 300);

  useEffect(() => {
    if (debouncedName !== filters.name) {
      updateFilter('name', debouncedName);
    }
  }, [debouncedName]);

  useEffect(() => {
    if (debouncedResponsible !== filters.responsible) {
      updateFilter('responsible', debouncedResponsible);
    }
  }, [debouncedResponsible]);

  const updateFilter = (key: keyof ProjectFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const clearFilters = () => {
    setNameInput('');
    setResponsibleInput('');
    onFiltersChange({});
  };

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => value !== undefined && value !== ''),
    [filters],
  );

  return (
    <div
      style={{
        background: 'hsl(var(--ds-surface))',
        border: '1px solid hsl(var(--ds-line-1))',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: 'hsl(var(--ds-fg-2))',
          }}
        >
          Filtros
        </h3>
        {hasActiveFilters && (
          <button type="button" className="btn" onClick={clearFilters} style={{ fontSize: 12 }}>
            <X size={12} strokeWidth={1.5} />
            <span>Limpar</span>
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
        }}
      >
        <div>
          <label style={fieldLabel}>Status</label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}
          >
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

        <div>
          <label htmlFor="projectName" style={fieldLabel}>
            Nome do Projeto
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              strokeWidth={1.5}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--ds-fg-3))',
                pointerEvents: 'none',
              }}
            />
            <Input
              id="projectName"
              placeholder="Buscar por nome..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="responsible" style={fieldLabel}>
            Responsável
          </label>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              strokeWidth={1.5}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--ds-fg-3))',
                pointerEvents: 'none',
              }}
            />
            <Input
              id="responsible"
              placeholder="Buscar por responsável..."
              value={responsibleInput}
              onChange={(e) => setResponsibleInput(e.target.value)}
              style={{ paddingLeft: 32 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
