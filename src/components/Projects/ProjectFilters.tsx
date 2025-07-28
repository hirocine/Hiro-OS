import type { ProjectFilters } from '@/types/project';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { statusLabels } from '@/data/mockProjects';

interface ProjectFiltersProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
}

export function ProjectFilters({ filters, onFiltersChange }: ProjectFiltersProps) {
  const updateFilter = (key: keyof ProjectFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

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
          <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
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
          <Input
            id="projectName"
            placeholder="Buscar por nome..."
            value={filters.name || ''}
            onChange={(e) => updateFilter('name', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="responsible">Responsável</Label>
          <Input
            id="responsible"
            placeholder="Buscar por responsável..."
            value={filters.responsible || ''}
            onChange={(e) => updateFilter('responsible', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}