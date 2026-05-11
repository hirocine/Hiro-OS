import { Equipment } from '@/types/equipment';
import { Edit, Trash2, Camera } from 'lucide-react';
import { useRef } from 'react';
import { StatusPill } from '@/ds/components/StatusPill';

interface EquipmentRowProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onImageUpload: (id: string, file: File) => void;
}

const toneFor = (status: Equipment['status']): 'success' | 'warning' | 'muted' => {
  switch (status) {
    case 'available': return 'success';
    case 'maintenance': return 'warning';
    default: return 'muted';
  }
};

const getStatusLabel = (status: Equipment['status']) => {
  switch (status) {
    case 'available': return 'Disponível';
    case 'maintenance': return 'Manutenção';
    default: return status;
  }
};

const formatCurrency = (value?: number) => {
  if (!value) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function EquipmentRow({ equipment, onEdit, onDelete, onImageUpload }: EquipmentRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImageUpload(equipment.id, file);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: 16,
        padding: '12px 16px',
        alignItems: 'center',
        borderBottom: '1px solid hsl(var(--ds-line-2))',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{ gridColumn: 'span 1' }}>
        <button
          type="button"
          onClick={handleImageClick}
          style={{
            width: 44,
            height: 44,
            border: '1px dashed hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-line-2) / 0.3)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            color: 'hsl(var(--ds-fg-3))',
          }}
          aria-label="Imagem"
        >
          {equipment.image ? (
            <img
              src={equipment.image}
              alt={equipment.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Camera size={14} strokeWidth={1.5} />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ gridColumn: 'span 1', fontSize: 13, color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums' }}>
        {equipment.patrimonyNumber || '—'}
      </div>

      <div style={{ gridColumn: 'span 2', fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
        {equipment.name}
      </div>

      <div style={{ gridColumn: 'span 1', fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
        {equipment.brand}
      </div>

      <div
        style={{
          gridColumn: 'span 1',
          fontSize: 13,
          color: 'hsl(var(--ds-fg-2))',
          textTransform: 'capitalize',
        }}
      >
        {equipment.category}
      </div>

      <div
        style={{
          gridColumn: 'span 1',
          fontSize: 12,
          color: 'hsl(var(--ds-fg-3))',
          fontFamily: 'monospace',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {equipment.serialNumber || '—'}
      </div>

      <div
        style={{
          gridColumn: 'span 1',
          fontSize: 13,
          color: 'hsl(var(--ds-fg-1))',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 500,
        }}
      >
        {formatCurrency(equipment.value)}
      </div>

      <div style={{ gridColumn: 'span 1' }}>
        <StatusPill
          label={getStatusLabel(equipment.status)}
          tone={toneFor(equipment.status)}
        />
      </div>

      <div style={{ gridColumn: 'span 2', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn"
          style={{ height: 28, padding: '0 10px', fontSize: 11 }}
          onClick={() => onEdit(equipment)}
        >
          <Edit size={12} strokeWidth={1.5} />
          <span>Editar</span>
        </button>
        <button
          type="button"
          className="btn"
          style={{
            height: 28,
            padding: '0 10px',
            fontSize: 11,
            color: 'hsl(var(--ds-danger))',
            borderColor: 'hsl(var(--ds-danger) / 0.3)',
          }}
          onClick={() => onDelete(equipment.id)}
        >
          <Trash2 size={12} strokeWidth={1.5} />
          <span>Excluir</span>
        </button>
      </div>
    </div>
  );
}
