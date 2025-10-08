import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { categoryLabels, statusLabels } from '@/data/mockData';
import { useCategories } from '@/hooks/useCategories';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { cn } from '@/lib/utils';

interface EquipmentFormProps {
  formData: Omit<Equipment, 'id'>;
  updateField: (field: keyof Omit<Equipment, 'id'>, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditMode: boolean;
  mainItems: Equipment[];
  parentSearchOpen: boolean;
  setParentSearchOpen: (open: boolean) => void;
  showCustomCategory: boolean;
  setShowCustomCategory: (show: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  newSubcategoryName: string;
  setNewSubcategoryName: (name: string) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  formatCurrency: (value: number | string) => string;
  parseCurrencyInput: (value: string) => number;
  getSelectedParentName: () => string;
}

export function EquipmentForm({
  formData,
  updateField,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditMode,
  mainItems,
  parentSearchOpen,
  setParentSearchOpen,
  showCustomCategory,
  setShowCustomCategory,
  newCategoryName,
  setNewCategoryName,
  newSubcategoryName,
  setNewSubcategoryName,
  currentStep,
  setCurrentStep,
  formatCurrency,
  parseCurrencyInput,
  getSelectedParentName
}: EquipmentFormProps) {
  const { getSubcategoriesForCategory, addCustomCategory } = useCategories();
  const isMobile = useIsMobile();

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
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
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

  const steps = [
    { title: "Informações Básicas", content: renderBasicInfo() },
    { title: "Classificação", content: renderClassification() },
    { title: "Identificação", content: renderIdentification() },
    { title: "Informações Financeiras", content: renderFinancialInfo() },
    { title: "Datas", content: renderDates() }
  ];

  if (isMobile) {
    return (
      <MobileStepperForm
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitText={isEditMode ? 'Atualizar' : 'Adicionar'}
      />
    );
  }

  return (
    <MobileFriendlyForm onSubmit={onSubmit}>
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
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Atualizar' : 'Adicionar'}
        </Button>
      </MobileFriendlyFormActions>
    </MobileFriendlyForm>
  );
}
