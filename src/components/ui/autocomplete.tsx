import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const debouncedSearch = useDebounce(searchValue, 150);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Get the display text for the selected value
  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption?.label || value || placeholder;

  const handleSearchChange = React.useCallback((newValue: string) => {
    setSearchValue(newValue);
    onInputChange?.(newValue);
    
    if (allowCustomValue) {
      onValueChange(newValue);
    }
  }, [allowCustomValue, onValueChange, onInputChange]);

  const handleSelect = React.useCallback((selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
    setSearchValue("");
  }, [onValueChange]);

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setSearchValue("");
      // Focus the search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, []);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && allowCustomValue && searchValue.trim()) {
      handleSelect(searchValue.trim());
    }
  }, [allowCustomValue, searchValue, handleSelect]);

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
    
    const searchTerm = debouncedSearch.toLowerCase().trim();
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
  }, [options, debouncedSearch]);

  const hasResults = filteredOptions.length > 0;
  const showCustomValueOption = allowCustomValue && searchValue.trim() && 
    !options.some(option => option.value.toLowerCase() === searchValue.toLowerCase());

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            "justify-between h-9 px-3 py-2 text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedOption?.label || (value && allowCustomValue ? value : placeholder)}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="p-0 z-[100]" 
        align="start"
        style={{ 
          width: 'var(--radix-dropdown-menu-trigger-width)',
          backgroundColor: 'hsl(var(--popover))',
          border: '1px solid hsl(var(--border))',
          boxShadow: 'var(--shadow-elegant)'
        }}
      >
        <div className="bg-popover">
          {/* Search input inside dropdown */}
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite para buscar..."
                className="pl-8 h-8 bg-background"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-auto">
            {/* Show custom value option if applicable */}
            {showCustomValueOption && (
              <div
                className="flex items-center p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-150 bg-popover border-b border-border"
                onClick={() => handleSelect(searchValue.trim())}
              >
                <Check className="mr-3 h-4 w-4 flex-shrink-0 opacity-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    Usar "{searchValue.trim()}"
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Criar nova marca
                  </div>
                </div>
              </div>
            )}

            {!hasResults && !showCustomValueOption ? (
              <div className="p-4 text-sm text-muted-foreground bg-popover">
                {searchValue.trim() ? (
                  "Nenhuma opção encontrada."
                ) : (
                  "Digite para buscar marcas..."
                )}
              </div>
            ) : (
              <>
                {searchValue.trim() && hasResults && (
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30">
                    {filteredOptions.length} marca{filteredOptions.length !== 1 ? 's' : ''} encontrada{filteredOptions.length !== 1 ? 's' : ''}
                  </div>
                )}
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-150 bg-popover"
                    onClick={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-3 h-4 w-4 flex-shrink-0",
                        value === option.value ? "opacity-100 text-accent" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {highlightMatch(option.label, debouncedSearch)}
                      </div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}