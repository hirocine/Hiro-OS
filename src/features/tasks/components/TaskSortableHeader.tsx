import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { TaskSortableField, TaskSortOrder } from '../types';

interface TaskSortableHeaderProps {
  field: TaskSortableField;
  label: string;
  currentSortBy?: TaskSortableField;
  currentSortOrder?: TaskSortOrder;
  onSort: (field: TaskSortableField, order: TaskSortOrder) => void;
  className?: string;
}

export function TaskSortableHeader({
  field,
  label,
  currentSortBy,
  currentSortOrder,
  onSort,
}: TaskSortableHeaderProps) {
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
        transition: 'color 0.15s',
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
        }}
      />
    </button>
  );
}
