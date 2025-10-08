import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ProjectAllocation {
  id?: string;
  ssd_id?: string;
  project_name: string;
  allocated_gb: number;
}

interface ProjectAllocationListProps {
  allocations: ProjectAllocation[];
  totalCapacity: number;
  onChange: (allocations: ProjectAllocation[]) => void;
}

export const ProjectAllocationList = ({
  allocations,
  totalCapacity,
  onChange
}: ProjectAllocationListProps) => {
  const [localAllocations, setLocalAllocations] = useState<ProjectAllocation[]>(allocations);

  const totalAllocated = localAllocations.reduce((sum, alloc) => sum + (alloc.allocated_gb || 0), 0);
  const freeSpace = totalCapacity - totalAllocated;
  const utilizationPercent = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

  const getBadgeVariant = () => {
    if (utilizationPercent > 80) return 'destructive';
    if (utilizationPercent > 50) return 'default';
    return 'success';
  };

  const handleAdd = () => {
    const newAllocations = [...localAllocations, { project_name: '', allocated_gb: 0 }];
    setLocalAllocations(newAllocations);
    onChange(newAllocations);
  };

  const handleRemove = (index: number) => {
    const newAllocations = localAllocations.filter((_, i) => i !== index);
    setLocalAllocations(newAllocations);
    onChange(newAllocations);
  };

  const handleChange = (index: number, field: keyof ProjectAllocation, value: string | number) => {
    const newAllocations = [...localAllocations];
    newAllocations[index] = {
      ...newAllocations[index],
      [field]: field === 'allocated_gb' ? parseFloat(value as string) || 0 : value
    };
    setLocalAllocations(newAllocations);
    onChange(newAllocations);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Projetos Alocados</h3>
        <Badge variant={getBadgeVariant()}>
          {freeSpace.toFixed(0)} GB livres de {totalCapacity} GB
        </Badge>
      </div>

      {localAllocations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum projeto alocado ainda
        </p>
      ) : (
        <div className="space-y-3">
          {localAllocations.map((allocation, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor={`project-name-${index}`} className="text-xs">
                  Nome do Projeto
                </Label>
                <Input
                  id={`project-name-${index}`}
                  value={allocation.project_name}
                  onChange={(e) => handleChange(index, 'project_name', e.target.value)}
                  placeholder="Ex: Projeto X"
                  className="h-10"
                />
              </div>
              <div className="w-32">
                <Label htmlFor={`project-gb-${index}`} className="text-xs">
                  GB
                </Label>
                <Input
                  id={`project-gb-${index}`}
                  type="number"
                  step="1"
                  min="0"
                  value={allocation.allocated_gb || ''}
                  onChange={(e) => handleChange(index, 'allocated_gb', e.target.value)}
                  placeholder="0"
                  className="h-10"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="h-10 w-10 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {totalAllocated > totalCapacity && (
        <p className="text-sm text-destructive">
          ⚠️ A capacidade total foi ultrapassada em {(totalAllocated - totalCapacity).toFixed(0)} GB
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Projeto
      </Button>
    </div>
  );
};
