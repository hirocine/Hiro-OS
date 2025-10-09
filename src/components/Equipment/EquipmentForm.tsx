import { useState } from 'react';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { MobileFriendlyFormActions } from '@/components/ui/mobile-friendly-form';
import { MobileStepperForm } from '@/components/ui/mobile-stepper-form';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { categoryLabels, statusLabels } from '@/data/mockData';
import { useCategories } from '@/hooks/useCategories';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Check, ChevronsUpDown, Image, X, ChevronDown, Package, Activity, Link2, DollarSign, CheckCircle2 } from 'lucide-react';
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
  const { getSubcategoriesForCategory } = useCategories();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("what");

  const labelClass = "text-sm font-medium";
  const inputClass = isMobile ? "h-10 mt-1" : "h-9 mt-1";
  const gridClass = "grid grid-cols-1 md:grid-cols-2 gap-3";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  // Step 1: O que é (What is it)
  const renderWhatIsIt = () => (
    <div className={gridClass}>
      <div>
        <Label htmlFor="name" className={labelClass}>Nome do Equipamento *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Ex: Canon EOS R5"
          required
          className={inputClass}
        />
      </div>
      
      <div>
        <Label htmlFor="brand" className={labelClass}>Marca *</Label>
        <Input
          id="brand"
          value={formData.brand}
          onChange={(e) => updateField('brand', e.target.value)}
          placeholder="Ex: Canon, Sony"
          required
          className={inputClass}
        />
      </div>

      <div>
        <Label htmlFor="category" className={labelClass}>Categoria *</Label>
        <Select 
          value={formData.category} 
          onValueChange={(value) => updateField('category', value as EquipmentCategory)}
        >
          <SelectTrigger className={inputClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subcategory" className={labelClass}>Subcategoria</Label>
        <Select 
          value={formData.subcategory || ''} 
          onValueChange={(value) => updateField('subcategory', value === 'none' ? '' : value)}
        >
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder="Selecionar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            {getSubcategoriesForCategory(formData.category).map((subcategory) => (
              <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Step 2: Como está (How it is)
  const renderHowItIs = () => (
    <div className="space-y-4">
      <div className={gridClass}>
        <div>
          <Label htmlFor="status" className={labelClass}>Status *</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => updateField('status', value as EquipmentStatus)}
          >
            <SelectTrigger className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="itemType" className={labelClass}>Tipo de Item *</Label>
          <Select 
            value={formData.itemType} 
            onValueChange={(value: EquipmentItemType) => {
              updateField('itemType', value);
              if (value === 'main') updateField('parentId', '');
            }}
          >
            <SelectTrigger className={inputClass}>
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
        </div>

        {formData.category === 'storage' && (
          <div>
            <Label htmlFor="capacity" className={labelClass}>Capacidade (GB)</Label>
            <Input
              id="capacity"
              type="number"
              step="1"
              min="0"
              value={formData.capacity || ''}
              onChange={(e) => updateField('capacity', parseFloat(e.target.value) || 0)}
              placeholder="Ex: 256, 500..."
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        <Label className={labelClass}>Foto do Equipamento</Label>
        <div className="relative">
          {imageUrl ? (
            <div className="relative group">
              <img 
                src={imageUrl} 
                alt="Foto"
                className="w-20 h-20 object-cover rounded-lg border-2 border-border hover:border-primary transition-colors"
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
                <span className="text-[10px] font-medium">Adicionar</span>
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
  );

  // Step 3: Vínculos (Links)
  const renderLinks = () => (
    <div className={gridClass}>
      <div>
        <Label htmlFor="serialNumber" className={labelClass}>Número de Série</Label>
        <Input
          id="serialNumber"
          value={formData.serialNumber}
          onChange={(e) => updateField('serialNumber', e.target.value)}
          placeholder="SN do fabricante"
          className={inputClass}
        />
      </div>

      <div>
        <Label htmlFor="patrimonyNumber" className={labelClass}>Nº Patrimônio</Label>
        <Input
          id="patrimonyNumber"
          value={formData.patrimonyNumber}
          onChange={(e) => updateField('patrimonyNumber', e.target.value)}
          placeholder="Código interno"
          className={inputClass}
        />
      </div>

      {formData.itemType === 'accessory' && mainItems.length > 0 && (
        <div className="md:col-span-2">
          <Label htmlFor="parentId" className={labelClass}>Item Principal</Label>
          <Popover open={parentSearchOpen} onOpenChange={setParentSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={parentSearchOpen}
                className={cn("w-full justify-between", inputClass)}
              >
                <span className="truncate">{getSelectedParentName()}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Pesquisar..." className="h-9" />
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
        </div>
      )}

      <div className="md:col-span-2">
        <Label htmlFor="description" className={labelClass}>Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Características principais, modelo, ano..."
          rows={2}
          className="resize-none mt-1"
        />
      </div>
    </div>
  );

  // Step 4: Valores & Datas
  const renderValuesAndDates = () => (
    <Collapsible defaultOpen={isMobile}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-between mb-3", inputClass)}
        >
          <span className={labelClass}>Informações Financeiras e Datas</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3">
        <div className={gridClass}>
          <div>
            <Label htmlFor="value" className={labelClass}>Valor de Compra</Label>
            <Input
              id="value"
              value={formData.value > 0 ? formatCurrency(formData.value) : ''}
              onChange={(e) => updateField('value', parseCurrencyInput(e.target.value))}
              placeholder="R$ 0,00"
              className={inputClass}
            />
          </div>
          
          <div>
            <Label htmlFor="depreciatedValue" className={labelClass}>Valor Depreciado</Label>
            <Input
              id="depreciatedValue"
              value={formData.depreciatedValue > 0 ? formatCurrency(formData.depreciatedValue) : ''}
              onChange={(e) => updateField('depreciatedValue', parseCurrencyInput(e.target.value))}
              placeholder="R$ 0,00"
              className={inputClass}
            />
          </div>
          
          <div>
            <Label htmlFor="store" className={labelClass}>Loja/Fornecedor</Label>
            <Input
              id="store"
              value={formData.store}
              onChange={(e) => updateField('store', e.target.value)}
              placeholder="Nome da loja"
              className={inputClass}
            />
          </div>
          
          <div>
            <Label htmlFor="invoice" className={labelClass}>Nota Fiscal</Label>
            <Input
              id="invoice"
              value={formData.invoice}
              onChange={(e) => updateField('invoice', e.target.value)}
              placeholder="Número da NF"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="purchaseDate" className={labelClass}>Data de Compra</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => updateField('purchaseDate', e.target.value)}
              className={inputClass}
            />
          </div>
          
          <div>
            <Label htmlFor="receiveDate" className={labelClass}>Data de Recebimento</Label>
            <Input
              id="receiveDate"
              type="date"
              value={formData.receiveDate}
              onChange={(e) => updateField('receiveDate', e.target.value)}
              className={inputClass}
            />
          </div>
          
          <div>
            <Label htmlFor="lastMaintenance" className={labelClass}>Última Manutenção</Label>
            <Input
              id="lastMaintenance"
              type="date"
              value={formData.lastMaintenance}
              onChange={(e) => updateField('lastMaintenance', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  // Step 5: Revisar & Salvar
  const renderReview = () => {
    const missingFields = [];
    if (!formData.name.trim()) missingFields.push('Nome');
    if (!formData.brand.trim()) missingFields.push('Marca');

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {imageUrl && (
                <div className="flex justify-center md:justify-start">
                  <img 
                    src={imageUrl} 
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                  />
                </div>
              )}
              
              <div className="flex-1 space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{formData.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Marca:</span>
                    <p className="font-medium">{formData.brand || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoria:</span>
                    <p className="font-medium">{categoryLabels[formData.category] || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium">{statusLabels[formData.status] || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nº Série:</span>
                    <p className="font-medium">{formData.serialNumber || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Patrimônio:</span>
                    <p className="font-medium">{formData.patrimonyNumber || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {missingFields.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive font-medium">
              Campos obrigatórios faltando: {missingFields.join(', ')}
            </p>
          </div>
        )}
      </div>
    );
  };

  const steps = [
    { title: "O que é", content: renderWhatIsIt() },
    { title: "Como está", content: renderHowItIs() },
    { title: "Vínculos", content: renderLinks() },
    { title: "Valores & Datas", content: renderValuesAndDates() },
    { title: "Revisar", content: renderReview() }
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
    <form onSubmit={onSubmit} className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="what" className="flex items-center gap-1.5 py-2">
            <Package className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">O que é</span>
          </TabsTrigger>
          <TabsTrigger value="how" className="flex items-center gap-1.5 py-2">
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Como está</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="flex items-center gap-1.5 py-2">
            <Link2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Vínculos</span>
          </TabsTrigger>
          <TabsTrigger value="values" className="flex items-center gap-1.5 py-2">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Valores</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-1.5 py-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Revisar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="what" className="space-y-3 mt-4">
          {renderWhatIsIt()}
        </TabsContent>

        <TabsContent value="how" className="space-y-3 mt-4">
          {renderHowItIs()}
        </TabsContent>

        <TabsContent value="links" className="space-y-3 mt-4">
          {renderLinks()}
        </TabsContent>

        <TabsContent value="values" className="space-y-3 mt-4">
          {renderValuesAndDates()}
        </TabsContent>

        <TabsContent value="review" className="space-y-3 mt-4">
          {renderReview()}
        </TabsContent>
      </Tabs>

      <MobileFriendlyFormActions className="pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-9"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="h-9">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Atualizar' : 'Adicionar'}
        </Button>
      </MobileFriendlyFormActions>
    </form>
  );
}
