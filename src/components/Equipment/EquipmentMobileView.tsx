import { Equipment } from '@/types/equipment';
import { EquipmentMobileCard } from './EquipmentMobileCard';
import { Plus, Package } from 'lucide-react';

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
  isLoading = false,
}: EquipmentMobileViewProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <span className="sk line lg" style={{ width: '70%' }} />
            <span className="sk line lg" style={{ width: '40%', height: 24 }} />
            <span className="sk line" style={{ width: '100%' }} />
            <span className="sk line" style={{ width: '60%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="empties">
        <div className="empty" style={{ borderRight: 0 }}>
          <div className="glyph">
            <Package strokeWidth={1.25} />
          </div>
          <h5>Nenhum equipamento encontrado</h5>
          <p>Adicione equipamentos para começar a gerenciar seu inventário.</p>
          <div className="actions">
            <button className="btn primary" onClick={onAddEquipment} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Adicionar Equipamento</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
