import React, { useRef, memo, useCallback } from 'react';
import { Equipment } from '@/types/equipment';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronRight, ChevronDown, Edit, Trash2, Camera, Package, ArrowUpRight, Upload } from 'lucide-react';
import { AdminOnly } from '@/components/RoleGuard';
import { useEquipmentCard } from '@/hooks/useEquipmentCard';
import { useCategories } from '@/hooks/useCategories';

interface EquipmentTableRowProps {
  equipment: Equipment;
  accessories?: Equipment[];
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
  onToggleExpansion: (id: string) => void;
  onImageUpload?: (equipmentId: string, file: File) => void;
  onConvertToAccessory?: (equipment: Equipment) => void;
  level?: number;
  className?: string;
  selected?: boolean;
  onToggleSelection?: (id: string) => void;
}

const COLS = '40px 40px 60px minmax(250px, 1fr) minmax(140px, 200px) minmax(120px, 160px) 100px 120px 120px';

const statusToneStyle: Record<string, React.CSSProperties> = {
  available:   { color: 'hsl(var(--ds-success))', borderColor: 'hsl(var(--ds-success) / 0.3)' },
  in_use:      { color: 'hsl(var(--ds-info))',    borderColor: 'hsl(var(--ds-info) / 0.3)' },
  maintenance: { color: 'hsl(var(--ds-warning))', borderColor: 'hsl(var(--ds-warning) / 0.3)' },
  loaned:      { color: 'hsl(var(--ds-warning))', borderColor: 'hsl(var(--ds-warning) / 0.3)' },
  damaged:     { color: 'hsl(var(--ds-danger))',  borderColor: 'hsl(var(--ds-danger) / 0.3)' },
};

const iconBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'grid',
  placeItems: 'center',
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  color: 'hsl(var(--ds-fg-3))',
};

export const EquipmentTableRow = memo(function EquipmentTableRow({
  equipment,
  accessories = [],
  onEdit,
  onDelete,
  onToggleExpansion,
  onImageUpload,
  onConvertToAccessory,
  level = 0,
  selected = false,
  onToggleSelection,
}: EquipmentTableRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getCategoryTitle } = useCategories();
  const {
    getStatusLabel,
    formatCurrency,
    handleImageUpload,
    isUploading,
  } = useEquipmentCard();

  const uploading = isUploading(equipment.id);

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && onImageUpload) {
        await handleImageUpload(equipment, file, (eq, f) => onImageUpload(eq.id, f));
      }
    },
    [equipment, onImageUpload, handleImageUpload]
  );

  const isMainItem = equipment.itemType === 'main';
  const hasAccessories = accessories.length > 0;
  const isExpanded = equipment.isExpanded;
  const tone = statusToneStyle[equipment.status] || statusToneStyle.available;

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: COLS,
          gap: 12,
          padding: '12px 16px',
          alignItems: 'center',
          borderBottom: '1px solid hsl(var(--ds-line-2))',
          background: selected
            ? 'hsl(var(--ds-accent) / 0.05)'
            : level > 0
              ? 'hsl(var(--ds-line-2) / 0.2)'
              : 'transparent',
          marginLeft: level > 0 ? 24 : 0,
          borderLeft: level > 0 ? '2px solid hsl(var(--ds-accent) / 0.2)' : undefined,
          transition: 'background 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {onToggleSelection && level === 0 && (
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelection(equipment.id)}
            />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isMainItem && hasAccessories ? (
            <button
              type="button"
              onClick={() => onToggleExpansion(equipment.id)}
              style={{ ...iconBtnStyle, color: 'hsl(var(--ds-accent))' }}
              aria-label={isExpanded ? 'Recolher acessórios' : 'Expandir acessórios'}
            >
              {isExpanded ? <ChevronDown size={14} strokeWidth={1.5} /> : <ChevronRight size={14} strokeWidth={1.5} />}
            </button>
          ) : (
            <div style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', color: isMainItem ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-4))' }}>
              <Package size={isMainItem ? 14 : 12} strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleImageClick}
                  style={{
                    width: 44,
                    height: 44,
                    border: '1px dashed hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                    color: 'hsl(var(--ds-fg-3))',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  {uploading ? (
                    <Upload size={14} strokeWidth={1.5} className="animate-pulse" style={{ color: 'hsl(var(--ds-accent))' }} />
                  ) : equipment.image ? (
                    <img
                      src={equipment.image}
                      alt={equipment.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Camera size={14} strokeWidth={1.5} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{equipment.image ? 'Alterar imagem' : 'Adicionar imagem'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            className="t-title"
            title={equipment.name}
            style={{
              fontWeight: 500,
              fontSize: 13,
              lineHeight: 1.3,
              color: 'hsl(var(--ds-fg-1))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {equipment.name}
          </span>
          {equipment.serialNumber && (
            <span
              style={{
                fontSize: 11,
                color: 'hsl(var(--ds-fg-3))',
                fontVariantNumeric: 'tabular-nums',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={`SN: ${equipment.serialNumber}`}
            >
              SN: {equipment.serialNumber}
            </span>
          )}
          {isMainItem && hasAccessories && (
            <span className="pill muted" style={{ fontSize: 10, marginTop: 4, alignSelf: 'flex-start' }}>
              {accessories.length} acessório{accessories.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={equipment.brand}>
            {equipment.brand}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'center' }}>
          <span
            style={{
              fontSize: 13,
              color: 'hsl(var(--ds-fg-2))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getCategoryTitle(equipment.category)}
          </span>
          {equipment.subcategory && (
            <span
              style={{
                fontSize: 11,
                color: 'hsl(var(--ds-fg-3))',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {equipment.subcategory}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            className="pill"
            style={{ ...tone, display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <span className="dot" style={{ background: 'currentColor' }} />
            {getStatusLabel(equipment.status)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(equipment.value)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <button
            type="button"
            onClick={() => onEdit(equipment)}
            style={iconBtnStyle}
            aria-label="Editar"
            title="Editar equipamento"
          >
            <Edit size={14} strokeWidth={1.5} />
          </button>

          {isMainItem && onConvertToAccessory && (
            <button
              type="button"
              onClick={() => onConvertToAccessory(equipment)}
              style={iconBtnStyle}
              aria-label="Converter"
              title="Converter para acessório"
            >
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </button>
          )}

          <AdminOnly fallback={<div style={{ width: 28, height: 28 }} />}>
            <button
              type="button"
              onClick={() => onDelete(equipment.id)}
              style={{ ...iconBtnStyle, color: 'hsl(var(--ds-danger))' }}
              aria-label="Excluir"
              title="Excluir equipamento"
            >
              <Trash2 size={14} strokeWidth={1.5} />
            </button>
          </AdminOnly>
        </div>
      </div>

      {isMainItem && isExpanded && accessories.length > 0 && (
        <div>
          {accessories.map((accessory) => (
            <EquipmentTableRow
              key={accessory.id}
              equipment={accessory}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleExpansion={onToggleExpansion}
              onImageUpload={onImageUpload}
              onConvertToAccessory={onConvertToAccessory}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </>
  );
});
