import { Checkbox } from '@/components/ui/checkbox';
import { SortableHeader } from './SortableHeader';
import { SortableField, SortOrder } from '@/types/equipment';

interface EquipmentTableHeaderProps {
  onSort: (field: SortableField, order: SortOrder) => void;
  sortBy?: SortableField;
  sortOrder?: SortOrder;
  isAllSelected?: boolean;
  isPartialSelected?: boolean;
  onToggleAll?: () => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
};

export function EquipmentTableHeader({
  onSort,
  sortBy,
  sortOrder,
  isAllSelected = false,
  onToggleAll,
}: EquipmentTableHeaderProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 40px 60px minmax(250px, 1fr) minmax(140px, 200px) minmax(120px, 160px) 100px 120px 120px',
        gap: 12,
        padding: '12px 16px',
        alignItems: 'center',
        background: 'hsl(var(--ds-line-2) / 0.3)',
        borderBottom: '1px solid hsl(var(--ds-line-1))',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {onToggleAll && (
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onToggleAll}
            aria-label="Selecionar todos"
          />
        )}
      </div>

      <div style={{ ...labelStyle, textAlign: 'center' }}>Tipo</div>
      <div style={{ ...labelStyle, textAlign: 'center' }}>Img</div>

      <div style={{ minWidth: 0 }}>
        <SortableHeader field="name" label="Nome / Modelo" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={onSort} />
      </div>
      <div style={{ minWidth: 0 }}>
        <SortableHeader field="brand" label="Marca" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={onSort} />
      </div>
      <div style={{ minWidth: 0 }}>
        <SortableHeader field="category" label="Categoria" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={onSort} />
      </div>
      <div style={{ minWidth: 0 }}>
        <SortableHeader field="status" label="Status" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={onSort} />
      </div>
      <div style={{ minWidth: 0 }}>
        <SortableHeader field="value" label="Valor" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={onSort} />
      </div>

      <div style={{ ...labelStyle, textAlign: 'center' }}>Ações</div>
    </div>
  );
}
