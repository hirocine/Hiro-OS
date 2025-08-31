import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";

interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  allowCustomValue?: boolean;
  onInputChange?: (value: string) => void;
}

export function Autocomplete({
  options = [],
  value,
  onValueChange,
  placeholder = "Digite ou selecione...",
  className,
  allowCustomValue = true,
  onInputChange
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const [isFocused, setIsFocused] = React.useState(false);
  const debouncedInput = useDebounce(inputValue, 150);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = React.useCallback((newValue: string) => {
    setInputValue(newValue);
    onInputChange?.(newValue);
    
    if (allowCustomValue) {
      onValueChange(newValue);
    }

    // Auto-open dropdown when typing if focused
    if (isFocused && newValue.length >= 0) {
      setOpen(true);
    }
  }, [allowCustomValue, onValueChange, onInputChange, isFocused]);

  const handleSelect = React.useCallback((selectedValue: string) => {
    setInputValue(selectedValue);
    onValueChange(selectedValue);
    setOpen(false);
    // Clear focus after selection
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [onValueChange]);

  const handleInputFocus = React.useCallback(() => {
    setIsFocused(true);
    setOpen(true);
  }, []);

  const handleInputBlur = React.useCallback(() => {
    setIsFocused(false);
    // Delay closing to allow for option selection
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  }, []);

  const handleOptionMouseDown = React.useCallback((e: React.MouseEvent) => {
    // Prevent blur event when clicking on option
    e.preventDefault();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-accent text-accent-foreground font-medium">
          {part}
        </mark>
      ) : part
    );
  };

  const filteredOptions = React.useMemo(() => {
    if (!Array.isArray(options)) return [];
    
    const searchTerm = debouncedInput.toLowerCase().trim();
    if (!searchTerm) return options.slice(0, 10); // Show first 10 when empty
    
    return options
      .filter(option => {
        if (!option || !option.label || !option.value) return false;
        
        const label = option.label.toLowerCase();
        const value = option.value.toLowerCase();
        
        // Smart search: starts with, contains word, or contains substring
        return label.startsWith(searchTerm) || 
               value.startsWith(searchTerm) ||
               label.includes(searchTerm) || 
               value.includes(searchTerm) ||
               label.split(' ').some(word => word.startsWith(searchTerm));
      })
      .sort((a, b) => {
        const aLabel = a.label.toLowerCase();
        const bLabel = b.label.toLowerCase();
        
        // Prioritize exact matches, then starts with, then contains
        if (aLabel === searchTerm) return -1;
        if (bLabel === searchTerm) return 1;
        if (aLabel.startsWith(searchTerm) && !bLabel.startsWith(searchTerm)) return -1;
        if (!aLabel.startsWith(searchTerm) && bLabel.startsWith(searchTerm)) return 1;
        
        return aLabel.localeCompare(bLabel);
      })
      .slice(0, 8); // Limit to 8 results for better UX
  }, [options, debouncedInput]);

  const hasResults = filteredOptions.length > 0;

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className={cn("pr-8", hasResults && inputValue ? "ring-1 ring-accent" : "", className)}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      />
      <div className="absolute right-0 top-0 h-full flex items-center px-2 pointer-events-none">
        {inputValue && hasResults ? (
          <Search className="h-4 w-4 text-accent animate-pulse" />
        ) : (
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverContent 
          className="w-full p-0 z-[100]" 
          align="start"
          side="bottom"
          style={{ 
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            boxShadow: 'var(--shadow-elegant)'
          }}
        >
        <div className="max-h-64 overflow-auto bg-popover">
          {!hasResults ? (
            <div className="p-4 text-sm text-muted-foreground bg-popover">
              {inputValue.trim() ? (
                <>
                  {allowCustomValue ? (
                    <div className="space-y-2">
                      <div>Nenhuma marca encontrada.</div>
                      <div className="text-xs">Você pode digitar uma nova marca.</div>
                    </div>
                  ) : (
                    "Nenhuma opção encontrada."
                  )}
                </>
              ) : (
                "Digite para buscar marcas..."
              )}
            </div>
          ) : (
            <div className="bg-popover">
              {inputValue.trim() && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30">
                  {filteredOptions.length} marca{filteredOptions.length !== 1 ? 's' : ''} encontrada{filteredOptions.length !== 1 ? 's' : ''}
                </div>
              )}
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-150 bg-popover"
                  onClick={() => handleSelect(option.value)}
                  onMouseDown={handleOptionMouseDown}
                >
                  <Check
                    className={cn(
                      "mr-3 h-4 w-4 flex-shrink-0",
                      value === option.value ? "opacity-100 text-accent" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {highlightMatch(option.label, debouncedInput)}
                    </div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}