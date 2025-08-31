import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

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
  options,
  value,
  onValueChange,
  placeholder = "Digite ou selecione...",
  className,
  allowCustomValue = true,
  onInputChange
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  // Debug logs
  console.log('Autocomplete render:', { 
    options: options, 
    optionsLength: options?.length,
    optionsType: typeof options,
    isArray: Array.isArray(options)
  });

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onInputChange?.(newValue);
    
    if (allowCustomValue) {
      onValueChange(newValue);
    }
  };

  const handleSelect = (selectedValue: string) => {
    if (!selectedValue) return;
    
    const option = options?.find(opt => opt?.value === selectedValue);
    const finalValue = option ? option.value : selectedValue;
    
    setInputValue(finalValue);
    onValueChange(finalValue);
    setOpen(false);
  };

  const filteredOptions = React.useMemo(() => {
    console.log('Computing filteredOptions:', { options, inputValue });
    
    if (!options || !Array.isArray(options)) {
      console.log('Options invalid, returning empty array');
      return [];
    }
    
    const filtered = options.filter(option => {
      if (!option || !option.label || !option.value) {
        console.log('Invalid option filtered out:', option);
        return false;
      }
      return (
        option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
        option.value.toLowerCase().includes(inputValue.toLowerCase())
      );
    });
    
    console.log('Filtered options result:', filtered);
    return filtered;
  }, [options, inputValue]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className={cn("pr-8", className)}
            onFocus={() => setOpen(true)}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-2"
            onClick={() => setOpen(!open)}
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandEmpty>
            {allowCustomValue ? "Nenhuma sugestão encontrada." : "Nenhuma opção encontrada."}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredOptions && filteredOptions.length > 0 && filteredOptions.map((option) => (
              option && option.value && option.label && (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div>{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    )}
                  </div>
                </CommandItem>
              )
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}