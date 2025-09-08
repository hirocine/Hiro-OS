import { Button } from '@/components/ui/button';
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
  className 
}: SortableHeaderProps) {
  const isActive = currentSortBy === field;
  
  const handleClick = () => {
    if (!isActive) {
      // Primeira vez clicando - ordenação crescente
      onSort(field, 'asc');
    } else if (currentSortOrder === 'asc') {
      // Segunda vez clicando - ordenação decrescente
      onSort(field, 'desc');
    } else {
      // Terceira vez clicando - resetar para crescente
      onSort(field, 'asc');
    }
  };

  const getIcon = () => {
    if (!isActive) {
      return <ChevronsUpDown className="h-3 w-3 opacity-50 transition-opacity hover:opacity-70" />;
    }
    
    return currentSortOrder === 'asc' ? 
      <ChevronUp className="h-3 w-3 text-primary transition-colors" /> : 
      <ChevronDown className="h-3 w-3 text-primary transition-colors" />;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`h-7 px-2 py-1 w-full font-medium justify-between hover:bg-accent/20 transition-colors min-w-0 ${
        isActive 
          ? 'text-primary bg-accent/10' 
          : 'text-muted-foreground hover:text-foreground'
      } ${className}`}
    >
      <span className="truncate mr-1 text-xs lg:text-sm font-semibold uppercase tracking-wider">{label}</span>
      {getIcon()}
    </Button>
  );
}