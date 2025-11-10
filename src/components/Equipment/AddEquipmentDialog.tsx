import { useState, useEffect } from 'react';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle, 
  ResponsiveDialogFooter 
} from '@/components/ui/responsive-dialog';
import { 
  MobileFriendlyForm, 
  MobileFriendlyFormSection, 
  MobileFriendlyFormGrid, 
  MobileFriendlyFormField,
  MobileFriendlyFormActions
} from '@/components/ui/mobile-friendly-form';
import { MobileStepperForm } from '@/components/ui/mobile-stepper-form';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { statusLabels } from '@/data/mockData';
import { useCategoriesContext } from '@/contexts/CategoriesContext';
import { useCategories } from '@/hooks/useCategories';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Check, ChevronsUpDown, Search, Plus } from 'lucide-react';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (equipment: Omit<Equipment, 'id'>) => Promise<{ success: boolean } | undefined>;
  equipment?: Equipment;
  mainItems?: Equipment[];
}

export function AddEquipmentDialog({ open, onOpenChange, onSubmit, equipment, mainItems = [] }: AddEquipmentDialogProps) {
  const { categories: dbCategories } = useCategoriesContext();
  const { categories: categoryManagement } = useCategories();
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
    capacity: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentSearchOpen, setParentSearchOpen] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const { getSubcategoriesForCategory, addCustomCategory } = useCategories();
  const isMobile = useIsMobile();

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
        capacity: undefined,
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
      // Sanitize data - convert empty strings and zero values to undefined for proper DB handling
      const sanitizedData = {
        ...formData,
        parentId: formData.parentId && formData.parentId !== 'none' ? formData.parentId : undefined,
        subcategory: formData.subcategory?.trim() || undefined,
        capacity: formData.capacity && formData.capacity > 0 ? formData.capacity : undefined,
        value: formData.value && formData.value > 0 ? formData.value : undefined,
        depreciatedValue: formData.depreciatedValue && formData.depreciatedValue > 0 ? formData.depreciatedValue : undefined
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
            capacity: undefined,
          });
        }
      }
    } catch (error) {
      logger.error('Error submitting equipment', {
        module: 'equipment',
        action: 'submit_equipment',
        error,
        data: { equipmentName: formData.name, isEdit: !!equipment }
      });
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

  // Componente para renderizar campos de informações básicas
  const renderBasicInfo = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Ex: Canon EOS R5, Microfone Shure..."
          required
          className="h-12"
        />
      </MobileFriendlyFormField>
      
      <MobileFriendlyFormField>
        <Label htmlFor="brand">Marca *</Label>
        <Input
          id="brand"
          value={formData.brand}
          onChange={(e) => updateField('brand', e.target.value)}
          placeholder="Ex: Canon, Sony, Shure..."
          required
          className="h-12"
        />
      </MobileFriendlyFormField>

      <MobileFriendlyFormField span={2}>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Descrição detalhada do equipamento, características especiais, etc."
          rows={3}
          className="resize-none"
        />
      </MobileFriendlyFormField>
    </MobileFriendlyFormGrid>
  );

  // Componente para renderizar classificação
  const renderClassification = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <Label htmlFor="category">Categoria *</Label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => {
            updateField('category', value as EquipmentCategory);
          }}
        >
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from(new Set(dbCategories.filter(c => !c.subcategory).map(c => c.category))).map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <Label htmlFor="subcategory">Subcategoria</Label>
        <Select 
          value={formData.subcategory || ''} 
          onValueChange={(value) => updateField('subcategory', value === 'none' ? '' : value)}
        >
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Selecionar subcategoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            {getSubcategoriesForCategory(formData.category).map((subcategory) => (
              <SelectItem key={subcategory} value={subcategory}>
                {subcategory}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <Label htmlFor="status">Status *</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => updateField('status', value as EquipmentStatus)}
        >
          <SelectTrigger className="h-12">
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
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
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
          <SelectTrigger className="h-12">
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
          <p className="text-sm text-muted-foreground mt-1">
            Este item pode ter acessórios associados a ele
          </p>
        )}
        {formData.itemType === 'accessory' && (
          <p className="text-sm text-muted-foreground mt-1">
            Este item será vinculado a um item principal
          </p>
        )}
      </MobileFriendlyFormField>

      {/* Associação de Item Principal (apenas para acessórios) */}
      {formData.itemType === 'accessory' && (
        <MobileFriendlyFormField span={2}>
          <Label htmlFor="parentId">Item Principal</Label>
          {mainItems.length === 0 ? (
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-muted-foreground text-sm">
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
                  className="w-full justify-between h-12"
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
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              ✓ Este acessório será vinculado ao item selecionado
            </p>
          )}
        </MobileFriendlyFormField>
      )}

      {/* Nova Categoria/Subcategoria */}
      <MobileFriendlyFormField span={2}>
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
          <div className="p-4 bg-muted/50 rounded-lg space-y-3 mt-2">
            <MobileFriendlyFormGrid>
              <MobileFriendlyFormField>
                <Label htmlFor="newCategory">Categoria</Label>
                <Input
                  id="newCategory"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: storage, camera..."
                  className="h-12"
                />
              </MobileFriendlyFormField>
              <MobileFriendlyFormField>
                <Label htmlFor="newSubcategory">Subcategoria</Label>
                <Input
                  id="newSubcategory"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  placeholder="Ex: SSD/HD, Filtro..."
                  className="h-12"
                />
              </MobileFriendlyFormField>
            </MobileFriendlyFormGrid>
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
              className="h-11"
            >
              Adicionar e Usar
            </Button>
          </div>
        )}
      </MobileFriendlyFormField>
    </MobileFriendlyFormGrid>
  );

  // Componente para renderizar identificação
  const renderIdentification = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <Label htmlFor="serialNumber">Número de Série</Label>
        <Input
          id="serialNumber"
          value={formData.serialNumber}
          onChange={(e) => updateField('serialNumber', e.target.value)}
          placeholder="Número de série do fabricante"
          className="h-12"
        />
      </MobileFriendlyFormField>
      
      <MobileFriendlyFormField>
        <Label htmlFor="patrimonyNumber">Número do Patrimônio</Label>
        <Input
          id="patrimonyNumber"
          value={formData.patrimonyNumber}
          onChange={(e) => updateField('patrimonyNumber', e.target.value)}
          placeholder="Código interno de patrimônio"
          className="h-12"
        />
      </MobileFriendlyFormField>

      {/* Campo de Capacidade - para dispositivos de armazenamento */}
      {formData.category === 'storage' && (
        <MobileFriendlyFormField>
          <Label htmlFor="capacity">Capacidade (GB)</Label>
          <Input
            id="capacity"
            type="number"
            step="1"
            min="0"
            value={formData.capacity || ''}
            onChange={(e) => updateField('capacity', parseFloat(e.target.value) || 0)}
            placeholder="Ex: 256, 500, 1000..."
            className="h-12"
          />
        </MobileFriendlyFormField>
      )}
    </MobileFriendlyFormGrid>
  );

  // Componente para renderizar informações financeiras
  const renderFinancialInfo = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <Label htmlFor="value">Valor de Compra</Label>
        <Input
          id="value"
          value={formData.value > 0 ? formatCurrency(formData.value) : ''}
          onChange={(e) => updateField('value', parseCurrencyInput(e.target.value))}
          placeholder="R$ 0,00"
          className="h-12"
        />
      </MobileFriendlyFormField>
      
      <MobileFriendlyFormField>
        <Label htmlFor="depreciatedValue">Valor Depreciado</Label>
        <Input
          id="depreciatedValue"
          value={formData.depreciatedValue > 0 ? formatCurrency(formData.depreciatedValue) : ''}
          onChange={(e) => updateField('depreciatedValue', parseCurrencyInput(e.target.value))}
          placeholder="R$ 0,00"
          className="h-12"
        />
      </MobileFriendlyFormField>
      
      <MobileFriendlyFormField>
        <Label htmlFor="store">Loja/Fornecedor</Label>
        <Input
          id="store"
          value={formData.store}
          onChange={(e) => updateField('store', e.target.value)}
          placeholder="Nome da loja ou fornecedor"
          className="h-12"
        />
      </MobileFriendlyFormField>
      
      <MobileFriendlyFormField>
        <Label htmlFor="invoice">Nota Fiscal</Label>
        <Input
          id="invoice"
          value={formData.invoice}
          onChange={(e) => updateField('invoice', e.target.value)}
          placeholder="Número da nota fiscal"
          className="h-12"
        />
      </MobileFriendlyFormField>
    </MobileFriendlyFormGrid>
  );

  // Componente para renderizar datas
  const renderDates = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <Label htmlFor="purchaseDate">Data de Compra</Label>
        <Input
          id="purchaseDate"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => updateField('purchaseDate', e.target.value)}
          className="h-12"
        />
      </MobileFriendlyFormField>
      
      <MobileFriendlyFormField>
        <Label htmlFor="receiveDate">Data de Recebimento</Label>
        <Input
          id="receiveDate"
          type="date"
          value={formData.receiveDate}
          onChange={(e) => updateField('receiveDate', e.target.value)}
          className="h-12"
        />
      </MobileFriendlyFormField>
      
      <MobileFriendlyFormField>
        <Label htmlFor="lastMaintenance">Última Manutenção</Label>
        <Input
          id="lastMaintenance"
          type="date"
          value={formData.lastMaintenance}
          onChange={(e) => updateField('lastMaintenance', e.target.value)}
          className="h-12"
        />
      </MobileFriendlyFormField>
    </MobileFriendlyFormGrid>
  );

  // Steps para mobile
  const steps = [
    { title: "Informações Básicas", content: renderBasicInfo() },
    { title: "Classificação", content: renderClassification() },
    { title: "Identificação", content: renderIdentification() },
    { title: "Informações Financeiras", content: renderFinancialInfo() },
    { title: "Datas", content: renderDates() }
  ];

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="w-full max-w-4xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {equipment ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        
        {isMobile ? (
          <MobileStepperForm
            steps={steps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitText={equipment ? 'Atualizar' : 'Adicionar'}
          />
        ) : (
          <MobileFriendlyForm onSubmit={handleSubmit}>
            <MobileFriendlyFormSection title="Informações Básicas">
              {renderBasicInfo()}
            </MobileFriendlyFormSection>

            <MobileFriendlyFormSection title="Classificação">
              {renderClassification()}
            </MobileFriendlyFormSection>

            <MobileFriendlyFormSection title="Identificação">
              {renderIdentification()}
            </MobileFriendlyFormSection>

            <MobileFriendlyFormSection title="Informações Financeiras">
              {renderFinancialInfo()}
            </MobileFriendlyFormSection>

            <MobileFriendlyFormSection title="Datas">
              {renderDates()}
            </MobileFriendlyFormSection>

            <MobileFriendlyFormActions>
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
            </MobileFriendlyFormActions>
          </MobileFriendlyForm>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}