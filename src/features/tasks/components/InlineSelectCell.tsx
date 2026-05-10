import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

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
  className = '',
}: InlineSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    if (newValue !== value) onSave(newValue);
    setIsOpen(false);
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {renderValue(value)}
            <ChevronDown size={11} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))' }} />
          </button>
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
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    {renderOption ? renderOption(option.value) : option.label}
                    <Check
                      size={14}
                      strokeWidth={1.5}
                      style={{
                        marginLeft: 'auto',
                        flexShrink: 0,
                        opacity: value === option.value ? 1 : 0,
                        color: 'hsl(var(--ds-accent))',
                      }}
                    />
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
