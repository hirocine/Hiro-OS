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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { categoryLabels, statusLabels } from '@/data/mockData';
import { useCategories } from '@/hooks/useCategories';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Check, ChevronsUpDown, Plus, Image, X, ChevronDown } from 'lucide-react';
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
  imageUrl?: string;
  isUploadingImage: boolean;
  onImageUpload: (file: File) => Promise<void>;
  onImageRemove: () => void;
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
  getSelectedParentName,
  imageUrl,
  isUploadingImage,
  onImageUpload,
  onImageRemove
}: EquipmentFormProps) {
  const { getSubcategoriesForCategory, addCustomCategory } = useCategories();
  const isMobile = useIsMobile();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  // Seção 1: Identificação Rápida
  const renderQuickIdentification = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <Label htmlFor="name" className="text-sm font-medium">
          Nome do Equipamento *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Ex: Canon EOS R5"
          required
          className="h-10 mt-1"
        />
      </MobileFriendlyFormField>
      
      <MobileFriendlyFormField>
        <Label htmlFor="brand" className="text-sm font-medium">
          Marca *
        </Label>
        <Input
          id="brand"
          value={formData.brand}
          onChange={(e) => updateField('brand', e.target.value)}
          placeholder="Ex: Canon, Sony"
          required
          className="h-10 mt-1"
        />
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <Label htmlFor="category" className="text-sm font-medium">Categoria *</Label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => {
            updateField('category', value as EquipmentCategory);
          }}
        >
          <SelectTrigger className="h-10 mt-1">
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
        <Label htmlFor="serialNumber" className="text-sm font-medium">Número de Série</Label>
        <Input
          id="serialNumber"
          value={formData.serialNumber}
          onChange={(e) => updateField('serialNumber', e.target.value)}
          placeholder="SN do fabricante"
          className="h-10 mt-1"
        />
      </MobileFriendlyFormField>
    </MobileFriendlyFormGrid>
  );

  // Seção 2: Status e Classificação
  const renderStatusAndType = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
        <Select 
          value={formData.status} 
          onValueChange={(value) => updateField('status', value as EquipmentStatus)}
        >
          <SelectTrigger className="h-10 mt-1">
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
        <Label htmlFor="itemType" className="text-sm font-medium">Tipo de Item *</Label>
        <Select 
          value={formData.itemType} 
          onValueChange={(value: EquipmentItemType) => {
            updateField('itemType', value);
            if (value === 'main') {
              updateField('parentId', '');
            }
          }}
        >
          <SelectTrigger className="h-10 mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Item Principal</span>
              </div>
            </SelectItem>
            <SelectItem value="accessory">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                <span>Acessório</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <Label htmlFor="subcategory" className="text-sm font-medium">Subcategoria</Label>
        <Select 
          value={formData.subcategory || ''} 
          onValueChange={(value) => updateField('subcategory', value === 'none' ? '' : value)}
        >
          <SelectTrigger className="h-10 mt-1">
            <SelectValue placeholder="Selecionar" />
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

      {formData.itemType === 'accessory' && mainItems.length > 0 && (
        <MobileFriendlyFormField>
          <Label htmlFor="parentId" className="text-sm font-medium">Item Principal</Label>
          <Popover open={parentSearchOpen} onOpenChange={setParentSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={parentSearchOpen}
                className="w-full justify-between h-10 mt-1"
              >
                <span className="truncate">{getSelectedParentName()}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Pesquisar..." 
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
                      <span className="text-muted-foreground text-sm">Nenhum</span>
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
                        value={`${item.patrimonyNumber || 'S/N'} ${item.name}`}
                        onSelect={() => {
                          updateField('parentId', item.id);
                          setParentSearchOpen(false);
                        }}
                      >
                        <span className="text-sm font-medium">{item.patrimonyNumber || 'S/N'}</span>
                        <span className="text-muted-foreground mx-1">-</span>
                        <span className="truncate text-sm">{item.name}</span>
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
        </MobileFriendlyFormField>
      )}

      {formData.category === 'storage' && (
        <MobileFriendlyFormField>
          <Label htmlFor="capacity" className="text-sm font-medium">Capacidade (GB)</Label>
          <Input
            id="capacity"
            type="number"
            step="1"
            min="0"
            value={formData.capacity || ''}
            onChange={(e) => updateField('capacity', parseFloat(e.target.value) || 0)}
            placeholder="Ex: 256, 500..."
            className="h-10 mt-1"
          />
        </MobileFriendlyFormField>
      )}
    </MobileFriendlyFormGrid>
  );

  // Seção 3: Detalhes Opcionais
  const renderOptionalDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            Descrição
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Características principais, modelo, ano..."
            rows={2}
            className="resize-none mt-1"
          />
        </div>
        
        <div className="flex justify-center md:justify-start">
          <div className="relative">
            {imageUrl ? (
              <div className="relative group">
                <img 
                  src={imageUrl} 
                  alt="Foto"
                  className="w-20 h-20 object-cover rounded-lg border-2 border-border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={onImageRemove}
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </Button>
                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label htmlFor="equipment-image-edit" className="cursor-pointer">
                    <Image className="h-5 w-5 text-white" />
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="equipment-image-edit"
                      disabled={isUploadingImage}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="equipment-image"
                  disabled={isUploadingImage}
                />
                <label 
                  htmlFor="equipment-image" 
                  className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <Image className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-[10px] font-medium">Foto</span>
                </label>
              </div>
            )}
            
            {isUploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Seção 4: Informações Administrativas (Collapsible)
  const renderAdministrativeInfo = () => (
    <Collapsible defaultOpen={isMobile}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between h-10 mb-4"
        >
          <span className="text-sm font-medium">Informações Financeiras e Datas</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4">
        <MobileFriendlyFormGrid>
          <MobileFriendlyFormField>
            <Label htmlFor="patrimonyNumber" className="text-sm font-medium">Nº Patrimônio</Label>
            <Input
              id="patrimonyNumber"
              value={formData.patrimonyNumber}
              onChange={(e) => updateField('patrimonyNumber', e.target.value)}
              placeholder="Código interno"
              className="h-10"
            />
          </MobileFriendlyFormField>

          <MobileFriendlyFormField>
            <Label htmlFor="value" className="text-sm font-medium">Valor de Compra</Label>
            <Input
              id="value"
              value={formData.value > 0 ? formatCurrency(formData.value) : ''}
              onChange={(e) => updateField('value', parseCurrencyInput(e.target.value))}
              placeholder="R$ 0,00"
              className="h-10"
            />
          </MobileFriendlyFormField>
          
          <MobileFriendlyFormField>
            <Label htmlFor="depreciatedValue" className="text-sm font-medium">Valor Depreciado</Label>
            <Input
              id="depreciatedValue"
              value={formData.depreciatedValue > 0 ? formatCurrency(formData.depreciatedValue) : ''}
              onChange={(e) => updateField('depreciatedValue', parseCurrencyInput(e.target.value))}
              placeholder="R$ 0,00"
              className="h-10"
            />
          </MobileFriendlyFormField>
          
          <MobileFriendlyFormField>
            <Label htmlFor="store" className="text-sm font-medium">Loja/Fornecedor</Label>
            <Input
              id="store"
              value={formData.store}
              onChange={(e) => updateField('store', e.target.value)}
              placeholder="Nome da loja"
              className="h-10"
            />
          </MobileFriendlyFormField>
          
          <MobileFriendlyFormField>
            <Label htmlFor="invoice" className="text-sm font-medium">Nota Fiscal</Label>
            <Input
              id="invoice"
              value={formData.invoice}
              onChange={(e) => updateField('invoice', e.target.value)}
              placeholder="Número da NF"
              className="h-10"
            />
          </MobileFriendlyFormField>

          <MobileFriendlyFormField>
            <Label htmlFor="purchaseDate" className="text-sm font-medium">Data de Compra</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => updateField('purchaseDate', e.target.value)}
              className="h-10"
            />
          </MobileFriendlyFormField>
          
          <MobileFriendlyFormField>
            <Label htmlFor="receiveDate" className="text-sm font-medium">Data de Recebimento</Label>
            <Input
              id="receiveDate"
              type="date"
              value={formData.receiveDate}
              onChange={(e) => updateField('receiveDate', e.target.value)}
              className="h-10"
            />
          </MobileFriendlyFormField>
          
          <MobileFriendlyFormField>
            <Label htmlFor="lastMaintenance" className="text-sm font-medium">Última Manutenção</Label>
            <Input
              id="lastMaintenance"
              type="date"
              value={formData.lastMaintenance}
              onChange={(e) => updateField('lastMaintenance', e.target.value)}
              className="h-10"
            />
          </MobileFriendlyFormField>
        </MobileFriendlyFormGrid>
      </CollapsibleContent>
    </Collapsible>
  );

  const steps = [
    { title: "Identificação", content: renderQuickIdentification() },
    { title: "Status e Tipo", content: renderStatusAndType() },
    { title: "Detalhes", content: renderOptionalDetails() },
    { title: "Informações Financeiras", content: renderAdministrativeInfo() }
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
      <MobileFriendlyFormSection title="Identificação Rápida">
        {renderQuickIdentification()}
      </MobileFriendlyFormSection>

      <MobileFriendlyFormSection title="Status e Classificação">
        {renderStatusAndType()}
      </MobileFriendlyFormSection>

      <MobileFriendlyFormSection title="Detalhes Opcionais">
        {renderOptionalDetails()}
      </MobileFriendlyFormSection>

      <MobileFriendlyFormSection title="Informações Administrativas">
        {renderAdministrativeInfo()}
      </MobileFriendlyFormSection>

      <MobileFriendlyFormActions>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-10"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="h-10">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Atualizar' : 'Adicionar'}
        </Button>
      </MobileFriendlyFormActions>
    </MobileFriendlyForm>
  );
}
