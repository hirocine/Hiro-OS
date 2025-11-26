import { useState, useRef, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InlineSelectCellProps {
  value: string;
  options: Array<{ value: string; label: string }>;
  onSave: (newValue: string) => void;
  renderValue: (value: string) => React.ReactNode;
  className?: string;
}

export function InlineSelectCell({ 
  value, 
  options, 
  onSave, 
  renderValue,
  className = '' 
}: InlineSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    if (newValue !== value) {
      onSave(newValue);
    }
    setIsOpen(false);
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger 
          className="h-auto border-0 p-0 hover:bg-muted/50 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <SelectValue>
            {renderValue(value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent onClick={(e) => e.stopPropagation()}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
