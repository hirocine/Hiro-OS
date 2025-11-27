import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InlineDepartmentCellProps {
  value: string | null;
  departments: Array<{ id: string; name: string }>;
  onSave: (newValue: string | null) => void;
  className?: string;
}

export function InlineDepartmentCell({ 
  value, 
  departments,
  onSave, 
  className = '' 
}: InlineDepartmentCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    if (newValue === 'none') {
      onSave(null);
    } else if (newValue !== value) {
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
        value={value || 'none'} 
        onValueChange={handleValueChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger 
          className="h-auto min-h-0 w-auto border-0 bg-transparent p-0 shadow-none rounded transition-colors focus:ring-0 focus:ring-offset-0 [&>svg]:hidden text-left justify-start"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <SelectValue>
            <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
              <span className="text-sm">{value || 'Sem departamento'}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent onClick={(e) => e.stopPropagation()}>
          <SelectItem 
            value="none"
            className="focus:bg-transparent focus:text-inherit pl-2 pr-8 [&>span:first-child]:left-auto [&>span:first-child]:right-2"
          >
            Sem departamento
          </SelectItem>
          {departments.map((dept) => (
            <SelectItem 
              key={dept.id} 
              value={dept.name}
              className="focus:bg-transparent focus:text-inherit pl-2 pr-8 [&>span:first-child]:left-auto [&>span:first-child]:right-2"
            >
              {dept.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
