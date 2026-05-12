import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { StatusPill } from '@/ds/components/StatusPill';

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
  onChange,
}: ProjectAllocationListProps) => {
  const [localAllocations, setLocalAllocations] = useState<ProjectAllocation[]>(allocations);

  useEffect(() => {
    setLocalAllocations(allocations);
  }, [allocations]);

  const totalAllocated = localAllocations.reduce((sum, alloc) => sum + (alloc.allocated_gb || 0), 0);
  const freeSpace = totalCapacity - totalAllocated;
  const utilizationPercent = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;

  const getBadgeTone = (): 'danger' | 'warning' | 'success' => {
    if (utilizationPercent > 80) return 'danger';
    if (utilizationPercent > 50) return 'warning';
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
      [field]:
        field === 'allocated_gb'
          ? value === ''
            ? 0
            : parseFloat(value as string) || 0
          : value,
    };
    setLocalAllocations(newAllocations);
    onChange(newAllocations);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h3
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: 'hsl(var(--ds-fg-3))',
          }}
        >
          Projetos Alocados
        </h3>
        <StatusPill
          label={`${freeSpace.toFixed(0)} GB livres de ${totalCapacity} GB`}
          tone={getBadgeTone()}
        />
      </div>

      {localAllocations.length === 0 ? (
        <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', textAlign: 'center', padding: '16px 0' }}>
          Nenhum projeto alocado ainda
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {localAllocations.map((allocation, index) => (
            <div
              key={allocation.id || `temp-${index}`}
              style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-3))',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Nome do Projeto
                </label>
                <Input
                  value={allocation.project_name}
                  onChange={(e) => handleChange(index, 'project_name', e.target.value)}
                  placeholder="Ex: Projeto X"
                />
              </div>
              <div style={{ width: 110 }}>
                <label
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-3))',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  GB
                </label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={allocation.allocated_gb || ''}
                  onChange={(e) => handleChange(index, 'allocated_gb', e.target.value)}
                  placeholder="0"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                style={{
                  width: 38,
                  height: 38,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'transparent',
                  border: '1px solid hsl(var(--ds-line-1))',
                  color: 'hsl(var(--ds-fg-3))',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'hsl(var(--ds-danger))';
                  e.currentTarget.style.borderColor = 'hsl(var(--ds-danger) / 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'hsl(var(--ds-fg-3))';
                  e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                }}
                aria-label="Remover alocação"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalAllocated > totalCapacity && (
        <p style={{ fontSize: 12, color: 'hsl(var(--ds-danger))' }}>
          ⚠️ A capacidade total foi ultrapassada em {(totalAllocated - totalCapacity).toFixed(0)} GB
        </p>
      )}

      <button
        type="button"
        className="btn"
        onClick={handleAdd}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        <Plus size={14} strokeWidth={1.5} />
        <span>Adicionar Projeto</span>
      </button>
    </div>
  );
};
