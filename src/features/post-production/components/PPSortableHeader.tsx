import { Button } from '@/components/ui/button';
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
  field, label, currentSortBy, currentSortOrder, onSort, className 
}: PPSortableHeaderProps) {
  const isActive = currentSortBy === field;
  
  const handleClick = () => {
    if (!isActive) onSort(field, 'asc');
    else if (currentSortOrder === 'asc') onSort(field, 'desc');
    else onSort(field, 'asc');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`h-7 px-0 py-1 w-full font-medium justify-start gap-1 hover:bg-white/10 transition-colors min-w-0 ${
        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      } ${className}`}
    >
      <span className="truncate mr-1 text-xs lg:text-sm font-semibold uppercase tracking-wider">{label}</span>
      {!isActive ? (
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      ) : currentSortOrder === 'asc' ? (
        <ChevronUp className="h-3 w-3 text-primary" />
      ) : (
        <ChevronDown className="h-3 w-3 text-primary" />
      )}
    </Button>
  );
}
