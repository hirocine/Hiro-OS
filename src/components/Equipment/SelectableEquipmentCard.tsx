import { Edit, Trash2, Upload, MoreVertical, Paperclip, Camera, Package, Link as LinkIcon } from 'lucide-react';
import { Equipment } from '@/types/equipment';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEquipmentCard } from '@/hooks/useEquipmentCard';

interface SelectableEquipmentCardProps {
  equipment: Equipment;
  isSelected: boolean;
  onToggleSelect: (equipmentId: string) => void;
  onEdit: (equipment: Equipment) => void;
  onDelete: (equipment: Equipment) => void;
  onImageUpload: (equipment: Equipment, file: File) => void;
  onConvertToAccessory?: (equipment: Equipment) => void;
  isLoading?: boolean;
  accessoryCount?: number;
}

const statusToneStyle: Record<string, React.CSSProperties> = {
  available:   { color: 'hsl(var(--ds-success))', borderColor: 'hsl(var(--ds-success) / 0.3)' },
  in_use:      { color: 'hsl(var(--ds-info))',    borderColor: 'hsl(var(--ds-info) / 0.3)' },
  maintenance: { color: 'hsl(var(--ds-warning))', borderColor: 'hsl(var(--ds-warning) / 0.3)' },
  loaned:      { color: 'hsl(var(--ds-warning))', borderColor: 'hsl(var(--ds-warning) / 0.3)' },
  damaged:     { color: 'hsl(var(--ds-danger))',  borderColor: 'hsl(var(--ds-danger) / 0.3)' },
};

export function SelectableEquipmentCard({
  equipment,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onImageUpload,
  onConvertToAccessory,
  isLoading = false,
  accessoryCount = 0,
}: SelectableEquipmentCardProps) {
  const { getStatusLabel, formatCurrency, handleImageUpload, isUploading, getHierarchyIndicator } =
    useEquipmentCard();

  const hierarchyInfo = getHierarchyIndicator(equipment, accessoryCount);
  const uploading = isUploading(equipment.id);
  const statusTone = statusToneStyle[equipment.status] || statusToneStyle.available;

  const handleImageUploadWrapper = async (file: File) => {
    await handleImageUpload(equipment, file, onImageUpload);
  };

  return (
    <div
      style={{
        position: 'relative',
        border: isSelected ? '1px solid hsl(var(--ds-success))' : '1px solid hsl(var(--ds-line-1))',
        background: isSelected ? 'hsl(var(--ds-success) / 0.05)' : 'hsl(var(--ds-surface))',
        boxShadow: isSelected ? 'inset 0 0 0 1px hsl(var(--ds-success))' : undefined,
        opacity: isLoading ? 0.5 : 1,
        pointerEvents: isLoading ? 'none' : undefined,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(equipment.id)}
          style={{ background: 'hsl(var(--ds-surface))', boxShadow: '0 1px 2px hsl(0 0% 0% / 0.06)' }}
        />
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => document.getElementById(`file-input-${equipment.id}`)?.click()}
            style={{
              height: 180,
              width: '100%',
              border: '2px dashed hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-line-2) / 0.3)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
            }}
          >
            {equipment.image ? (
              <img
                src={equipment.image}
                alt={equipment.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ textAlign: 'center', color: 'hsl(var(--ds-fg-4))' }}>
                <Camera size={36} strokeWidth={1.25} style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 12, fontWeight: 500 }}>Adicionar foto</p>
              </div>
            )}

            {uploading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <Upload
                    size={28}
                    strokeWidth={1.5}
                    className="animate-pulse"
                    style={{ margin: '0 auto 8px', display: 'block' }}
                  />
                  <p style={{ fontSize: 12 }}>Enviando…</p>
                </div>
              </div>
            )}

            <input
              id={`file-input-${equipment.id}`}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUploadWrapper(file);
              }}
            />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: 'hsl(var(--ds-fg-1))',
                  fontFamily: '"HN Display", sans-serif',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={equipment.name}
              >
                {equipment.name}
              </h3>
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                {equipment.brand} • {equipment.category}
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
                    background: 'transparent',
                    border: 0,
                    color: 'hsl(var(--ds-fg-3))',
                    cursor: 'pointer',
                  }}
                  aria-label="Menu de ações"
                >
                  <MoreVertical size={14} strokeWidth={1.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem onClick={() => onEdit(equipment)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {equipment.itemType === 'main' && onConvertToAccessory && (
                  <DropdownMenuItem onClick={() => onConvertToAccessory(equipment)}>
                    <Paperclip className="h-4 w-4 mr-2" />
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Patrimônio</span>
              <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-2))', fontVariantNumeric: 'tabular-nums' }}>
                {equipment.patrimonyNumber || 'N/A'}
              </span>
            </div>

            {equipment.value && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Valor</span>
                <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
                  {formatCurrency(equipment.value)}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Status</span>
              <span
                className="pill"
                style={{ ...statusTone, fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <span className="dot" style={{ background: 'currentColor' }} />
                {getStatusLabel(equipment.status)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Tipo</span>
              <span className="pill muted" style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {hierarchyInfo.icon === 'package' && <Package size={10} strokeWidth={1.5} />}
                {hierarchyInfo.icon === 'link' && <LinkIcon size={10} strokeWidth={1.5} />}
                {hierarchyInfo.label}
              </span>
            </div>

            {equipment.subcategory && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Subcategoria</span>
                <span
                  style={{
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-2))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 96,
                  }}
                  title={equipment.subcategory}
                >
                  {equipment.subcategory}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
