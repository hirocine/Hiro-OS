import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { SortableField, SortOrder } from '@/types/equipment';

interface SortableHeaderProps {
  field: SortableField;
  label: string;
  currentSortBy?: SortableField;
  currentSortOrder?: SortOrder;
  onSort: (field: SortableField, order: SortOrder) => void;
  className?: string;
}

export function SortableHeader({
  field,
  label,
  currentSortBy,
  currentSortOrder,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentSortBy === field;

  const handleClick = () => {
    if (!isActive) onSort(field, 'asc');
    else if (currentSortOrder === 'asc') onSort(field, 'desc');
    else onSort(field, 'asc');
  };

  const Icon = !isActive ? ChevronsUpDown : currentSortOrder === 'asc' ? ChevronUp : ChevronDown;

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
        padding: 0,
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        color: isActive ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        fontWeight: 500,
        width: '100%',
        minWidth: 0,
      }}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <Icon
        size={11}
        strokeWidth={1.5}
        style={{
          color: isActive ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-4))',
          opacity: isActive ? 1 : 0.6,
          flexShrink: 0,
        }}
      />
    </button>
  );
}
