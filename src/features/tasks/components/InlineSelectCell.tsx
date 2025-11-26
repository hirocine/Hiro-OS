import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InlineSelectCellProps {
  value: string;
  options: Array<{ value: string; label: string }>;
  onSave: (newValue: string) => void;
  renderValue: (value: string) => React.ReactNode;
  renderOption?: (value: string) => React.ReactNode;
  className?: string;
}

export function InlineSelectCell({ 
  value, 
  options, 
  onSave, 
  renderValue,
  renderOption,
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
          className="h-auto min-h-0 w-auto border-0 bg-transparent p-0 shadow-none hover:bg-muted/50 rounded transition-colors focus:ring-0 focus:ring-offset-0 [&>svg]:hidden"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <SelectValue>
            <div className="flex items-center gap-1.5">
              {renderValue(value)}
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent onClick={(e) => e.stopPropagation()}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {renderOption ? renderOption(option.value) : option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
