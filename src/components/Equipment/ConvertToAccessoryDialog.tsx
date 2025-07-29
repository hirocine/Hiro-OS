import { useState } from 'react';
import { Equipment } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Loader2, Package2, Package, Search, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { enhancedToast } from '@/components/ui/enhanced-toast';

interface ConvertToAccessoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment;
  mainItems: Equipment[];
  onConvert: (equipmentId: string, parentId: string) => Promise<{ success: boolean } | undefined>;
}

export function ConvertToAccessoryDialog({ 
  open, 
  onOpenChange, 
  equipment, 
  mainItems, 
  onConvert 
}: ConvertToAccessoryDialogProps) {
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleConvert = async () => {
    if (!selectedParentId) {
      enhancedToast.error({
        title: 'Item principal necessário',
        description: 'Selecione um item principal para associar este acessório.'
      });
      return;
    }

    setIsConverting(true);
    
    try {
      const result = await onConvert(equipment.id, selectedParentId);
      
      if (result?.success) {
        enhancedToast.success({
          title: 'Item convertido',
          description: `"${equipment.name}" agora é um acessório do item principal selecionado.`
        });
        onOpenChange(false);
        setSelectedParentId('');
      }
    } catch (error) {
      console.error('Error converting to accessory:', error);
      enhancedToast.error({
        title: 'Erro na conversão',
        description: 'Ocorreu um erro ao converter o item. Tente novamente.'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const availableMainItems = mainItems.filter(item => item.id !== equipment.id);
  const selectedItem = availableMainItems.find(item => item.id === selectedParentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Converter para Acessório
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Item a ser convertido:</span>
            </div>
            <div className="text-sm">
              <p className="font-medium">{equipment.patrimonyNumber || 'S/N'} - {equipment.name}</p>
              <p className="text-muted-foreground">{equipment.brand}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentId">Selecionar Item Principal *</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between"
                  disabled={availableMainItems.length === 0}
                >
                  {selectedItem ? (
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                      <span className="font-medium">{selectedItem.patrimonyNumber || 'S/N'}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="truncate">{selectedItem.name}</span>
                    </div>
                  ) : (
                    "Selecione um item principal..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Pesquisar itens principais..." />
                  <CommandList>
                    <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                    {availableMainItems.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={`${item.patrimonyNumber || ''} ${item.name} ${item.brand}`}
                        onSelect={() => {
                          setSelectedParentId(item.id === selectedParentId ? '' : item.id);
                          setPopoverOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedParentId === item.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0"></div>
                          <span className="font-medium">{item.patrimonyNumber || 'S/N'}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="truncate">{item.name}</span>
                          <span className="text-muted-foreground text-sm">({item.brand})</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {availableMainItems.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Não há itens principais disponíveis para associação.
              </p>
            )}
          </div>

          {selectedParentId && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                ✓ Este item será convertido em acessório e aparecerá agrupado com o item principal selecionado.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConvert} 
            disabled={isConverting || !selectedParentId || availableMainItems.length === 0}
          >
            {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Converter em Acessório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}