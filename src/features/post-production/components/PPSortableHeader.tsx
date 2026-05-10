import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface PPSortableHeaderProps {
  field: string;
  label: string;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
  onSort: (field: string, order: 'asc' | 'desc') => void;
  className?: string;
}

export function PPSortableHeader({
  field,
  label,
  currentSortBy,
  currentSortOrder,
  onSort,
}: PPSortableHeaderProps) {
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
