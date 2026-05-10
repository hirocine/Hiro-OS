import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';

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
  isActive = true,
}: InlineDepartmentCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    if (newValue === 'none') onSave(null);
    else if (newValue !== value) onSave(newValue);
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
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {!isActive ? (
              <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-4))', fontStyle: 'italic' }}>
                Selecionar
              </span>
            ) : (
              <span style={{ fontSize: 13, color: value ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))' }}>
                {value || 'Sem departamento'}
              </span>
            )}
            <ChevronDown size={11} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))' }} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[200px] p-0"
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem onSelect={() => handleValueChange('none')} style={{ cursor: 'pointer' }}>
                  <Check
                    size={14}
                    strokeWidth={1.5}
                    style={{
                      marginRight: 8,
                      opacity: !value ? 1 : 0,
                      color: 'hsl(var(--ds-accent))',
                    }}
                  />
                  Sem departamento
                </CommandItem>
                {departments.map((dept) => (
                  <CommandItem
                    key={dept.id}
                    onSelect={() => handleValueChange(dept.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Check
                      size={14}
                      strokeWidth={1.5}
                      style={{
                        marginRight: 8,
                        opacity: value === dept.name ? 1 : 0,
                        color: 'hsl(var(--ds-accent))',
                      }}
                    />
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
