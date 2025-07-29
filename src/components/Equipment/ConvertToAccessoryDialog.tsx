import { useState } from 'react';
import { Equipment } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Package2, Package, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

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
  
  const filteredMainItems = availableMainItems.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.brand.toLowerCase().includes(searchLower) ||
      (item.patrimonyNumber && item.patrimonyNumber.toLowerCase().includes(searchLower))
    );
  });

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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Pesquisar itens principais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedParentId} onValueChange={setSelectedParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um item principal" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {filteredMainItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="font-medium">{item.patrimonyNumber || 'S/N'}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{item.name}</span>
                      <span className="text-muted-foreground text-sm">({item.brand})</span>
                    </div>
                  </SelectItem>
                ))}
                {filteredMainItems.length === 0 && searchTerm && (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Nenhum item encontrado para "{searchTerm}"
                  </div>
                )}
              </SelectContent>
            </Select>
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