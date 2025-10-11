import React, { useCallback, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCategories } from '@/hooks/useCategories';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MobileFriendlyForm, MobileFriendlyFormActions } from '@/components/ui/mobile-friendly-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Loader2, Upload, X, Package, Check, Link2, DollarSign, Calendar, Camera, Mic, Lightbulb, Wrench, HardDrive, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EquipmentFormProps {
  formData: Omit<Equipment, 'id'>;
  updateField: (field: keyof Omit<Equipment, 'id'>, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditMode: boolean;
  formatCurrency: (value: number | string) => string;
  parseCurrencyInput: (value: string) => number;
  getMainItems: () => Equipment[];
  getSelectedParentName: () => string;
  imageUrl?: string;
  isUploadingImage: boolean;
  handleImageUpload: (file: File) => Promise<void>;
  handleImageRemove: () => void;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  formData,
  updateField,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditMode,
  formatCurrency,
  parseCurrencyInput,
  getMainItems,
  getSelectedParentName,
  imageUrl,
  isUploadingImage,
  handleImageUpload,
  handleImageRemove,
}) => {
  const isMobile = useIsMobile();
  const { getSubcategoriesForCategory, loading: categoriesLoading } = useCategories();

  // Estados para controlar os popovers de data
  const [showPurchaseDateCalendar, setShowPurchaseDateCalendar] = useState(false);
  const [showReceiveDateCalendar, setShowReceiveDateCalendar] = useState(false);
  const [showMaintenanceDateCalendar, setShowMaintenanceDateCalendar] = useState(false);

  // Handlers para seleção de datas
  const handlePurchaseDateSelect = (date: Date | undefined) => {
    if (date) {
      updateField('purchaseDate', format(date, 'yyyy-MM-dd'));
      setShowPurchaseDateCalendar(false);
    }
  };

  const handleReceiveDateSelect = (date: Date | undefined) => {
    if (date) {
      updateField('receiveDate', format(date, 'yyyy-MM-dd'));
      setShowReceiveDateCalendar(false);
    }
  };

  const handleMaintenanceDateSelect = (date: Date | undefined) => {
    if (date) {
      updateField('lastMaintenance', format(date, 'yyyy-MM-dd'));
      setShowMaintenanceDateCalendar(false);
    }
  };

  // Helper para formatar data do formato yyyy-MM-dd para dd/MM/yyyy
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };

  // Helper para converter dd/MM/yyyy para yyyy-MM-dd
  const parseDateInput = (input: string): string => {
    if (!input) return '';
    
    // Se já está no formato yyyy-MM-dd, retorna
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    
    // Tenta converter dd/MM/yyyy para yyyy-MM-dd
    const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }
    
    return '';
  };

  // Helper para mapear categoria para variante de badge
  const getCategoryBadgeVariant = (category: EquipmentCategory): "neutral" => {
    return 'neutral' as const;
  };

  // Helper para mapear categoria para ícone
  const getCategoryIcon = (category: EquipmentCategory) => {
    const icons = {
      camera: Camera,
      audio: Mic,
      lighting: Lightbulb,
      accessories: Wrench,
      storage: HardDrive
    };
    const IconComponent = icons[category];
    return IconComponent ? <IconComponent className="w-3 h-3" /> : null;
  };

  // Helper para traduzir categoria
  const getCategoryLabel = (category: EquipmentCategory) => {
    const labels = {
      camera: 'Câmera',
      audio: 'Áudio',
      lighting: 'Iluminação',
      accessories: 'Acessórios',
      storage: 'Armazenamento'
    };
    return labels[category];
  };

  // Helper para obter variante do badge de status
  const getStatusBadgeVariant = (status: EquipmentStatus): 'success' | 'warning' => {
    const variants: Record<EquipmentStatus, 'success' | 'warning'> = {
      available: 'success',
      maintenance: 'warning'
    };
    return variants[status] || 'success';
  };

  // Helper para obter ícone do status
  const getStatusIcon = (status: EquipmentStatus) => {
    const icons: Record<EquipmentStatus, JSX.Element> = {
      available: <Check className="w-3 h-3" />,
      maintenance: <Wrench className="w-3 h-3" />
    };
    return icons[status] || <Check className="w-3 h-3" />;
  };

  // Helper para obter label traduzido do status
  const getStatusLabel = (status: EquipmentStatus): string => {
    const labels: Record<EquipmentStatus, string> = {
      available: 'Disponível',
      maintenance: 'Em Manutenção'
    };
    return labels[status];
  };

  // Helper para transformar itens principais em opções do Autocomplete
  const getMainItemsAsOptions = useCallback(() => {
    return [
      { value: 'none', label: 'Nenhum', description: '' },
      ...getMainItems().map(item => ({
        value: item.id,
        label: `${item.patrimonyNumber || 'S/N'} - ${item.name}`,
        description: item.brand || item.category || ''
      }))
    ];
  }, [getMainItems]);

  // Hero Card: Foto grande + Nome em destaque
  const renderHeroCard = () => (
    <Card className="border-2 border-border">
      <CardContent className="p-6">
        <div className={cn(
          "flex gap-6",
          isMobile ? "flex-col items-center" : "flex-row items-center"
        )}>
          {/* Foto Upload */}
          <div className={cn(
            "flex-shrink-0 self-start",
            isMobile ? "w-full" : "w-[150px]"
          )}>
            <div className={cn(
              "relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-muted/30",
              isMobile ? "aspect-square w-full" : "w-[150px] h-[150px]"
            )}>
              {imageUrl ? (
                <>
                  <img 
                    src={imageUrl} 
                    alt="Equipment preview" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                    onClick={handleImageRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground mb-2">
                    Clique ou arraste uma foto
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
            
            {isUploadingImage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            )}
          </div>

          {/* Nome em Destaque */}
          <div className="flex-1 w-full">
            <Label htmlFor="hero-name" className="text-sm font-medium">
              Nome do Equipamento <span className="text-destructive">*</span>
            </Label>
            <Input
              id="hero-name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ex: Canon EOS R5"
              className={cn(
                "font-bold text-lg mt-1.5",
                isMobile ? "h-12" : "h-11"
              )}
              required
            />
            
            {/* Mini-resumo visual */}
            {(formData.brand || formData.category || formData.status || (formData.itemType === 'accessory' && formData.parentId && formData.parentId !== 'none')) && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {formData.brand && <span className="text-sm font-medium text-muted-foreground">{formData.brand}</span>}
                {formData.brand && (formData.category || formData.status || (formData.itemType === 'accessory' && formData.parentId && formData.parentId !== 'none')) && <span className="text-muted-foreground">•</span>}
                {formData.category && (
                  <Badge variant={getCategoryBadgeVariant(formData.category)} className="gap-1.5">
                    {getCategoryIcon(formData.category)}
                    {getCategoryLabel(formData.category)}
                  </Badge>
                )}
                {formData.category && (formData.status || (formData.itemType === 'accessory' && formData.parentId && formData.parentId !== 'none')) && <span className="text-muted-foreground">•</span>}
                {formData.status && (
                  <Badge variant={getStatusBadgeVariant(formData.status)} className="gap-1.5">
                    {getStatusIcon(formData.status)}
                    {getStatusLabel(formData.status)}
                  </Badge>
                )}
                {formData.status && (formData.itemType === 'accessory' && formData.parentId && formData.parentId !== 'none') && <span className="text-muted-foreground">•</span>}
                
                {/* Badge de Acessório */}
                {formData.itemType === 'accessory' && formData.parentId && formData.parentId !== 'none' && (
                  <Badge variant="neutral" className="gap-1.5">
                    <Link2 className="w-3 h-3" />
                    Acessório de <span className="mx-1">›</span> {getSelectedParentName()}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );


  // Card: Identificação & Status
  const renderStatusCard = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Identificação & Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Marca */}
        <div>
          <Label htmlFor="brand" className="text-sm font-medium">
            Marca <span className="text-destructive">*</span>
          </Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => updateField('brand', e.target.value)}
            placeholder="Ex: Canon"
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            required
          />
        </div>

        {/* Categoria */}
        <div>
          <Label htmlFor="category" className="text-sm font-medium">
            Categoria <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.category} 
            onValueChange={(value: EquipmentCategory) => updateField('category', value)}
          >
            <SelectTrigger id="category" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
              {formData.category ? (
                <Badge variant="neutral" className="gap-1.5">
                  {getCategoryIcon(formData.category)}
                  {getCategoryLabel(formData.category)}
                </Badge>
              ) : (
                <SelectValue placeholder="Selecione uma categoria" />
              )}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="camera">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="gap-1.5">
                    <Camera className="w-3 h-3" />
                    Câmera
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="audio">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="gap-1.5">
                    <Mic className="w-3 h-3" />
                    Áudio
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="lighting">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="gap-1.5">
                    <Lightbulb className="w-3 h-3" />
                    Iluminação
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="accessories">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="gap-1.5">
                    <Wrench className="w-3 h-3" />
                    Acessórios
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="storage">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="gap-1.5">
                    <HardDrive className="w-3 h-3" />
                    Armazenamento
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subcategoria */}
        <div>
          <Label htmlFor="subcategory" className="text-sm font-medium">
            Subcategoria
          </Label>
          <Select
            value={formData.subcategory || ''}
            onValueChange={(value) => updateField('subcategory', value)}
            disabled={categoriesLoading || !formData.category}
          >
            <SelectTrigger id="subcategory" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {getSubcategoriesForCategory(formData.category).map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status" className="text-sm font-medium">
            Status <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: EquipmentStatus) => updateField('status', value)}
          >
            <SelectTrigger id="status" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
              <SelectValue>
                <Badge variant={getStatusBadgeVariant(formData.status)} className="gap-1.5">
                  {getStatusIcon(formData.status)}
                  {getStatusLabel(formData.status)}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="gap-1.5">
                    <Check className="w-3 h-3" />
                    Disponível
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="maintenance">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" className="gap-1.5">
                    <Wrench className="w-3 h-3" />
                    Em Manutenção
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Item */}
        <div>
          <Label htmlFor="itemType" className="text-sm font-medium">
            Tipo de Item <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.itemType} 
            onValueChange={(value: 'main' | 'accessory') => updateField('itemType', value)}
          >
            <SelectTrigger id="itemType" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Item Principal</SelectItem>
              <SelectItem value="accessory">Acessório</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Item Principal (condicional - só para acessórios) */}
        {formData.itemType === 'accessory' && (
          <div>
            <Label htmlFor="parentId" className="text-sm font-medium">
              Item Principal
            </Label>
            <Autocomplete
              options={getMainItemsAsOptions()}
              value={formData.parentId || 'none'}
              onValueChange={(value) => updateField('parentId', value === 'none' ? '' : value)}
              placeholder="Pesquise por número ou nome"
              allowCustomValue={false}
              className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            />
          </div>
        )}

        {/* Capacidade (condicional para storage) */}
        {formData.category === 'storage' && (
          <div>
            <Label htmlFor="capacity" className="text-sm font-medium">
              Capacidade (GB)
            </Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity || ''}
              onChange={(e) => updateField('capacity', e.target.value ? parseInt(e.target.value) : 0)}
              className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
              placeholder="Ex: 512"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Card: Vínculos
  const renderLinksCard = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          Vínculos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="serialNumber" className="text-sm font-medium">Número de Série</Label>
          <Input
            id="serialNumber"
            value={formData.serialNumber || ''}
            onChange={(e) => updateField('serialNumber', e.target.value)}
            placeholder="Ex: 123456789"
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
          />
        </div>

        <div>
          <Label htmlFor="patrimonyNumber" className="text-sm font-medium">Número de Patrimônio</Label>
          <Input
            id="patrimonyNumber"
            value={formData.patrimonyNumber || ''}
            onChange={(e) => updateField('patrimonyNumber', e.target.value)}
            placeholder="Ex: PAT-001"
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Informações adicionais..."
            className="min-h-[80px] mt-1.5"
          />
        </div>
      </CardContent>
    </Card>
  );

  // Card: Financeiro
  const renderFinancialCard = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="value" className="text-sm font-medium">Valor de Compra</Label>
          <Input
            id="value"
            value={formData.value ? formatCurrency(formData.value) : ''}
            onChange={(e) => updateField('value', parseCurrencyInput(e.target.value))}
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            placeholder="R$ 0,00"
          />
        </div>

        <div>
          <Label htmlFor="depreciatedValue" className="text-sm font-medium">Valor Depreciado</Label>
          <Input
            id="depreciatedValue"
            value={formData.depreciatedValue ? formatCurrency(formData.depreciatedValue) : ''}
            onChange={(e) => updateField('depreciatedValue', parseCurrencyInput(e.target.value))}
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            placeholder="R$ 0,00"
          />
        </div>

        <div>
          <Label htmlFor="store" className="text-sm font-medium">Loja</Label>
          <Input
            id="store"
            value={formData.store || ''}
            onChange={(e) => updateField('store', e.target.value)}
            placeholder="Ex: B&H Photo"
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
          />
        </div>

        <div>
          <Label htmlFor="invoice" className="text-sm font-medium">Link da Nota Fiscal (Drive)</Label>
          <Input
            id="invoice"
            value={formData.invoice || ''}
            onChange={(e) => updateField('invoice', e.target.value)}
            placeholder="Ex: https://drive.google.com/..."
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
          />
        </div>
      </CardContent>
    </Card>
  );

  // Seção: Datas (full-width)
  const renderDatesSection = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Datas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-3"
        )}>
          {/* Data de Compra */}
          <div>
            <Label htmlFor="purchaseDate" className="text-sm font-medium">Data de Compra</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="purchaseDate"
                value={formatDateForDisplay(formData.purchaseDate || '')}
                onChange={(e) => {
                  const parsed = parseDateInput(e.target.value);
                  if (parsed || !e.target.value) {
                    updateField('purchaseDate', parsed);
                  }
                }}
                placeholder="dd/MM/aaaa"
                className={cn(isMobile ? "h-10" : "h-9")}
              />
              <Popover open={showPurchaseDateCalendar} onOpenChange={setShowPurchaseDateCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(isMobile ? "h-10 w-10" : "h-9 w-9")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={formData.purchaseDate ? new Date(formData.purchaseDate) : undefined}
                    onSelect={handlePurchaseDateSelect}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Data de Recebimento */}
          <div>
            <Label htmlFor="receiveDate" className="text-sm font-medium">Data de Recebimento</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="receiveDate"
                value={formatDateForDisplay(formData.receiveDate || '')}
                onChange={(e) => {
                  const parsed = parseDateInput(e.target.value);
                  if (parsed || !e.target.value) {
                    updateField('receiveDate', parsed);
                  }
                }}
                placeholder="dd/MM/aaaa"
                className={cn(isMobile ? "h-10" : "h-9")}
              />
              <Popover open={showReceiveDateCalendar} onOpenChange={setShowReceiveDateCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(isMobile ? "h-10 w-10" : "h-9 w-9")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={formData.receiveDate ? new Date(formData.receiveDate) : undefined}
                    onSelect={handleReceiveDateSelect}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Última Manutenção */}
          <div>
            <Label htmlFor="lastMaintenance" className="text-sm font-medium">Última Manutenção</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="lastMaintenance"
                value={formatDateForDisplay(formData.lastMaintenance || '')}
                onChange={(e) => {
                  const parsed = parseDateInput(e.target.value);
                  if (parsed || !e.target.value) {
                    updateField('lastMaintenance', parsed);
                  }
                }}
                placeholder="dd/MM/aaaa"
                className={cn(isMobile ? "h-10" : "h-9")}
              />
              <Popover open={showMaintenanceDateCalendar} onOpenChange={setShowMaintenanceDateCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(isMobile ? "h-10 w-10" : "h-9 w-9")}
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={formData.lastMaintenance ? new Date(formData.lastMaintenance) : undefined}
                    onSelect={handleMaintenanceDateSelect}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MobileFriendlyForm onSubmit={onSubmit} className="space-y-6">
      {/* Hero Card: Foto + Campos Principais */}
      {renderHeroCard()}

      {/* Cards em Coluna Única */}
      {renderStatusCard()}
      {renderLinksCard()}
      {renderFinancialCard()}
      {renderDatesSection()}

      {/* Actions */}
      <MobileFriendlyFormActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditMode ? 'Atualizar Equipamento' : 'Adicionar Equipamento'}
        </Button>
      </MobileFriendlyFormActions>
    </MobileFriendlyForm>
  );
};
