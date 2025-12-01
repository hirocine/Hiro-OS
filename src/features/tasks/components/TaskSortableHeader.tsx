import { Button } from '@/components/ui/button';
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
  className 
}: TaskSortableHeaderProps) {
  const isActive = currentSortBy === field;
  
  const handleClick = () => {
    if (!isActive) {
      onSort(field, 'asc');
    } else if (currentSortOrder === 'asc') {
      onSort(field, 'desc');
    } else {
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
      className={`h-7 px-0 py-1 w-full font-medium justify-start gap-1 hover:bg-accent/20 transition-colors min-w-0 ${
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
