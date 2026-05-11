import { memo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, Edit, Trash2, MoreVertical, Package, Link as LinkIcon, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEquipmentCard } from '@/hooks/useEquipmentCard';
import type { Equipment } from '@/types/equipment';
import { StatusPill } from '@/ds/components/StatusPill';

interface EquipmentMobileCardProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
  onImageUpload: (equipment: Equipment, file: File) => void;
  onConvertToAccessory?: (equipment: Equipment) => void;
  accessoryCount?: number;
  selected?: boolean;
  onToggleSelection?: (id: string) => void;
}

const TONE_BY_STATUS: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  available: 'success',
  in_use: 'info',
  maintenance: 'warning',
  loaned: 'warning',
  damaged: 'danger',
};

export const EquipmentMobileCard = memo(function EquipmentMobileCard({
  equipment,
  onEdit,
  onDelete,
  onImageUpload,
  onConvertToAccessory,
  accessoryCount = 0,
  selected = false,
  onToggleSelection,
}: EquipmentMobileCardProps) {
  const {
    getStatusLabel,
    formatCurrency,
    handleImageUpload,
    isUploading,
    getHierarchyIndicator,
  } = useEquipmentCard();

  const hierarchyInfo = getHierarchyIndicator(equipment || ({} as Equipment), accessoryCount);
  const uploading = isUploading(equipment?.id || '');

  const handleImageClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) await handleImageUpload(equipment, file, onImageUpload);
    };
    fileInput.click();
  };

  return (
    <div
      style={{
        border: selected ? '1px solid hsl(var(--ds-accent))' : '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        boxShadow: selected ? 'inset 0 0 0 1px hsl(var(--ds-accent))' : undefined,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
        {onToggleSelection && (
          <div style={{ paddingTop: 2 }}>
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelection(equipment.id)}
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleImageClick}
          disabled={uploading}
          style={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            border: '1px dashed hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-line-2) / 0.3)',
            color: 'hsl(var(--ds-fg-3))',
            cursor: 'pointer',
            flexShrink: 0,
            overflow: 'hidden',
          }}
          aria-label="Fazer upload de imagem"
        >
          {uploading ? (
            <Upload size={16} strokeWidth={1.5} className="animate-pulse" style={{ color: 'hsl(var(--ds-accent))' }} />
          ) : equipment.image ? (
            <img
              src={equipment.image}
              alt={equipment.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Camera size={16} strokeWidth={1.5} />
          )}
        </button>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <h3
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 14,
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-1))',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {equipment?.name || 'Nome não disponível'}
          </h3>
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--ds-fg-3))',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {equipment?.brand || 'Marca não disponível'}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              style={{
                width: 28,
                height: 28,
                display: 'grid',
                placeItems: 'center',
                color: 'hsl(var(--ds-fg-3))',
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                flexShrink: 0,
              }}
              aria-label="Ações"
            >
              <MoreVertical size={16} strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(equipment)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            {equipment.itemType === 'main' && onConvertToAccessory && (
              <DropdownMenuItem onClick={() => onConvertToAccessory(equipment)}>
                Converter para Acessório
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(equipment)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <StatusPill
          label={getStatusLabel(equipment?.status || 'available')}
          tone={TONE_BY_STATUS[equipment?.status || 'available'] ?? 'success'}
        />
        <span className="pill muted">{equipment?.category || 'Sem categoria'}</span>
        <span className="pill muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {hierarchyInfo.icon === 'package' && <Package size={11} strokeWidth={1.5} />}
          {hierarchyInfo.icon === 'link' && <LinkIcon size={11} strokeWidth={1.5} />}
          {hierarchyInfo.label}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
        {equipment.patrimonyNumber && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Patrimônio</span>
            <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums' }}>
              {equipment.patrimonyNumber}
            </span>
          </div>
        )}
        {equipment.subcategory && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Subcategoria</span>
            <span style={{ color: 'hsl(var(--ds-fg-2))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {equipment.subcategory}
            </span>
          </div>
        )}
        {equipment.serialNumber && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Série</span>
            <span style={{ color: 'hsl(var(--ds-fg-2))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
              {equipment.serialNumber}
            </span>
          </div>
        )}
        {equipment.value && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Valor</span>
            <span style={{ fontWeight: 500, color: 'hsl(var(--ds-success))', fontVariantNumeric: 'tabular-nums' }}>
              {formatCurrency(equipment.value)}
            </span>
          </div>
        )}
      </div>

      {equipment.currentBorrower && (
        <div
          style={{
            padding: 8,
            background: 'hsl(var(--ds-warning) / 0.1)',
            border: '1px solid hsl(var(--ds-warning) / 0.2)',
            fontSize: 11,
            color: 'hsl(var(--ds-warning))',
          }}
        >
          <strong style={{ fontWeight: 600 }}>Emprestado para:</strong> {equipment.currentBorrower}
        </div>
      )}
    </div>
  );
});
