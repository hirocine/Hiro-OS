import { useState, useEffect, useMemo } from 'react';
import type { ProjectFilters } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import { statusLabels } from '@/lib/projectLabels';
import { useDebounce } from '@/hooks/useDebounce';

interface ProjectFiltersProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
}

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

  const hasActiveFilters = useMemo(() => 
    Object.values(filters).some(value => value !== undefined && value !== ''),
    [filters]
  );

  return (
    <div className="bg-card p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtros</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Label htmlFor="projectName">Nome do Projeto</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="projectName"
              placeholder="Buscar por nome..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="responsible">Responsável</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="responsible"
              placeholder="Buscar por responsável..."
              value={responsibleInput}
              onChange={(e) => setResponsibleInput(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}