import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto min-h-0 w-full justify-start text-left p-0 font-normal bg-transparent hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
              {renderValue(value)}
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[180px] p-0" 
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandList>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem 
                    key={option.value} 
                    onSelect={() => handleValueChange(option.value)}
                    className="cursor-pointer"
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                    {renderOption ? renderOption(option.value) : option.label}
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
