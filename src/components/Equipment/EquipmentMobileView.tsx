import React from 'react';
import { Equipment } from '@/types/equipment';
import { EquipmentMobileCard } from './EquipmentMobileCard';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus } from 'lucide-react';

interface EquipmentMobileViewProps {
  equipment: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
  onImageUpload: (equipment: Equipment, file: File) => void;
  onConvertToAccessory?: (equipment: Equipment) => void;
  onAddEquipment: () => void;
  isLoading?: boolean;
}

export function EquipmentMobileView({
  equipment,
  onEdit,
  onDelete,
  onImageUpload,
  onConvertToAccessory,
  onAddEquipment,
  isLoading = false
}: EquipmentMobileViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <EmptyState
        icon={Plus}
        title="Nenhum equipamento encontrado"
        description="Adicione equipamentos para começar a gerenciar seu inventário."
        action={{
          label: "Adicionar Equipamento",
          onClick: onAddEquipment
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {equipment.map((item) => (
        <EquipmentMobileCard
          key={item.id}
          equipment={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onImageUpload={onImageUpload}
          onConvertToAccessory={onConvertToAccessory}
        />
      ))}
    </div>
  );
}