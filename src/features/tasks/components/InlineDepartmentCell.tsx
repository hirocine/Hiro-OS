import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InlineDepartmentCellProps {
  value: string | null;
  departments: Array<{ id: string; name: string }>;
  onSave: (newValue: string | null) => void;
  className?: string;
  isActive?: boolean;
}

export function InlineDepartmentCell({ 
  value, 
  departments,
  onSave, 
  className = '',
  isActive = true
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
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto min-h-0 w-auto p-0 font-normal bg-transparent hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
              {!isActive ? (
                <span className="text-sm text-muted-foreground/60 italic">Selecionar</span>
              ) : (
                <span className="text-sm">{value || 'Sem departamento'}</span>
              )}
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[200px] p-0" 
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem 
                  onSelect={() => handleValueChange('none')}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                  Sem departamento
                </CommandItem>
                {departments.map((dept) => (
                  <CommandItem 
                    key={dept.id} 
                    onSelect={() => handleValueChange(dept.name)}
                    className="cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === dept.name ? "opacity-100" : "opacity-0")} />
                    {dept.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
