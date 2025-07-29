import { useState, useEffect } from 'react';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { categoryLabels, statusLabels } from '@/data/mockData';
import { useCategories } from '@/hooks/useCategories';
import { Loader2, Check, ChevronsUpDown, Search, Plus } from 'lucide-react';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { cn } from '@/lib/utils';

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (equipment: Omit<Equipment, 'id'>) => Promise<{ success: boolean } | undefined>;
  equipment?: Equipment;
  mainItems?: Equipment[];
}

export function AddEquipmentDialog({ open, onOpenChange, onSubmit, equipment, mainItems = [] }: AddEquipmentDialogProps) {
  const [formData, setFormData] = useState<Omit<Equipment, 'id'>>({
    name: '',
    brand: '',
    category: 'camera',
    subcategory: '',
    customCategory: '',
    status: 'available',
    itemType: 'main' as EquipmentItemType,
    parentId: '',
    serialNumber: '',
    purchaseDate: '',
    lastMaintenance: '',
    description: '',
    value: 0,
    patrimonyNumber: '',
    depreciatedValue: 0,
    receiveDate: '',
    store: '',
    invoice: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentSearchOpen, setParentSearchOpen] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const { getSubcategoriesForCategory, addCustomCategory } = useCategories();

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
    } else {
      setFormData({
        name: '',
        brand: '',
        category: 'camera',
        subcategory: '',
        customCategory: '',
        status: 'available',
        itemType: 'main' as EquipmentItemType,
        parentId: '',
        serialNumber: '',
        purchaseDate: '',
        lastMaintenance: '',
        description: '',
        value: 0,
        patrimonyNumber: '',
        depreciatedValue: 0,
        receiveDate: '',
        store: '',
        invoice: '',
      });
    }
  }, [equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim() || !formData.brand.trim()) {
      enhancedToast.error({
        title: 'Campos obrigatórios',
        description: 'Nome e marca são obrigatórios.'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Sanitize parentId - convert empty string to null for proper UUID handling
      const sanitizedData = {
        ...formData,
        parentId: formData.parentId && formData.parentId !== 'none' ? formData.parentId : undefined
      };
      
      const result = await onSubmit(sanitizedData);
      
      if (result?.success) {
        enhancedToast.success({
          title: equipment ? 'Equipamento atualizado' : 'Equipamento adicionado',
          description: equipment ? 
            'As informações do equipamento foram atualizadas com sucesso.' :
            'O novo equipamento foi adicionado ao inventário.'
        });
        onOpenChange(false);
        
        // Reset form if it's a new equipment
        if (!equipment) {
          setFormData({
            name: '',
            brand: '',
            category: 'camera',
            subcategory: '',
            customCategory: '',
            status: 'available',
            itemType: 'main' as EquipmentItemType,
            parentId: '',
            serialNumber: '',
            purchaseDate: '',
            lastMaintenance: '',
            description: '',
            value: 0,
            patrimonyNumber: '',
            depreciatedValue: 0,
            receiveDate: '',
            store: '',
            invoice: '',
          });
        }
      }
    } catch (error) {
      console.error('Error submitting equipment:', error);
      enhancedToast.error({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o equipamento. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const parseCurrencyInput = (value: string): number => {
    if (!value) return 0;
    const numStr = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
  };

  const getSelectedParentName = () => {
    if (!formData.parentId || formData.parentId === 'none') return 'Selecione um item principal';
    const selectedItem = mainItems.find(item => item.id === formData.parentId);
    return selectedItem ? `${selectedItem.patrimonyNumber || 'S/N'} - ${selectedItem.name}` : 'Item não encontrado';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {equipment ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => updateField('brand', e.target.value)}
                required
              />
            </div>
            
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => {
                  updateField('category', value as EquipmentCategory);
                  updateField('subcategory', ''); // Reset subcategory when category changes
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoria</Label>
              <Select 
                value={formData.subcategory || ''} 
                onValueChange={(value) => updateField('subcategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar subcategoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {getSubcategoriesForCategory(formData.category).map((subcategory) => (
                    <SelectItem key={subcategory} value={subcategory}>
                      {subcategory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Category Section */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label>Adicionar Nova Categoria/Subcategoria</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomCategory(!showCustomCategory)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {showCustomCategory ? 'Cancelar' : 'Nova Categoria'}
                </Button>
              </div>
              
              {showCustomCategory && (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="newCategory">Categoria</Label>
                      <Input
                        id="newCategory"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Ex: storage, camera..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newSubcategory">Subcategoria</Label>
                      <Input
                        id="newSubcategory"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        placeholder="Ex: SSD/HD, Filtro..."
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (newCategoryName && newSubcategoryName) {
                        try {
                          await addCustomCategory(newCategoryName, newSubcategoryName);
                          updateField('category', newCategoryName as EquipmentCategory);
                          updateField('subcategory', newSubcategoryName);
                          setNewCategoryName('');
                          setNewSubcategoryName('');
                          setShowCustomCategory(false);
                          enhancedToast.success({
                            title: 'Categoria adicionada',
                            description: 'Nova categoria/subcategoria criada com sucesso!'
                          });
                        } catch (error) {
                          enhancedToast.error({
                            title: 'Erro',
                            description: 'Erro ao criar nova categoria. Tente novamente.'
                          });
                        }
                      }
                    }}
                    disabled={!newCategoryName || !newSubcategoryName}
                  >
                    Adicionar e Usar
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => updateField('status', value as EquipmentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemType">Tipo de Item *</Label>
              <Select 
                value={formData.itemType} 
                onValueChange={(value: EquipmentItemType) => {
                  updateField('itemType', value);
                  if (value === 'main') {
                    updateField('parentId', '');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="font-medium">Item Principal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="accessory">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                      <span className="font-medium">Acessório</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {formData.itemType === 'main' && (
                <p className="text-sm text-muted-foreground">
                  Este item pode ter acessórios associados a ele
                </p>
              )}
              {formData.itemType === 'accessory' && (
                <p className="text-sm text-muted-foreground">
                  Este item será vinculado a um item principal
                </p>
              )}
            </div>

            {formData.itemType === 'accessory' && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="parentId">Item Principal</Label>
                {mainItems.length === 0 ? (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-muted-foreground">
                      Nenhum item principal disponível. Crie primeiro um item principal para poder associar acessórios.
                    </p>
                  </div>
                ) : (
                  <Popover open={parentSearchOpen} onOpenChange={setParentSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={parentSearchOpen}
                        className="w-full justify-between"
                      >
                        {getSelectedParentName()}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Pesquisar item principal..." 
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="none"
                              onSelect={() => {
                                updateField('parentId', '');
                                setParentSearchOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-muted-foreground/50 rounded-full"></div>
                                <span className="text-muted-foreground">Nenhum (acessório independente)</span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  (!formData.parentId || formData.parentId === 'none') ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                            {mainItems.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={`${item.patrimonyNumber || 'S/N'} ${item.name} ${item.brand}`}
                                onSelect={() => {
                                  updateField('parentId', item.id);
                                  setParentSearchOpen(false);
                                }}
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                                  <span className="font-medium">{item.patrimonyNumber || 'S/N'}</span>
                                  <span className="text-muted-foreground">-</span>
                                  <span className="truncate">{item.name}</span>
                                  <span className="text-muted-foreground text-sm">({item.brand})</span>
                                </div>
                                <Check
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    formData.parentId === item.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                {formData.parentId && formData.parentId !== 'none' && mainItems.length > 0 && (
                  <p className="text-sm text-green-600">
                    ✓ Este acessório será vinculado ao item selecionado
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Número de Série</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => updateField('serialNumber', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">Valor de Compra (R$)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  updateField('value', value === '' ? 0 : parseFloat(value) || 0);
                }}
                placeholder="0,00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="patrimonyNumber">Patrimônio</Label>
              <Input
                id="patrimonyNumber"
                value={formData.patrimonyNumber}
                onChange={(e) => updateField('patrimonyNumber', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Data de Compra</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => updateField('purchaseDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastMaintenance">Última Manutenção</Label>
              <Input
                id="lastMaintenance"
                type="date"
                value={formData.lastMaintenance}
                onChange={(e) => updateField('lastMaintenance', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>
          
          {/* Hidden fields for additional equipment data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <h3 className="md:col-span-2 text-lg font-semibold">Informações Adicionais</h3>
            
            <div className="space-y-2">
              <Label htmlFor="depreciatedValue">Valor com Depreciação (R$)</Label>
              <Input
                id="depreciatedValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.depreciatedValue || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  updateField('depreciatedValue', value === '' ? 0 : parseFloat(value) || 0);
                }}
                placeholder="0,00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="receiveDate">Data de Recebimento</Label>
              <Input
                id="receiveDate"
                type="date"
                value={formData.receiveDate}
                onChange={(e) => updateField('receiveDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="store">Loja</Label>
              <Input
                id="store"
                value={formData.store}
                onChange={(e) => updateField('store', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invoice">NFe ou Recibo (Link)</Label>
              <Input
                id="invoice"
                type="url"
                value={formData.invoice}
                onChange={(e) => updateField('invoice', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {equipment ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}