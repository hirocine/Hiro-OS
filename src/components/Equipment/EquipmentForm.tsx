import React from 'react';
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
import { Loader2, Upload, X, Package, Activity, Link2, DollarSign, Calendar, Camera, Mic, Lightbulb, Wrench, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Helper para mapear categoria para variante de badge
  const getCategoryBadgeVariant = (category: EquipmentCategory): "default" | "secondary" | "warning" | "success" | "info" => {
    const variants = {
      camera: 'default' as const,
      audio: 'secondary' as const,
      lighting: 'warning' as const,
      accessories: 'success' as const,
      storage: 'info' as const
    };
    return variants[category];
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

  // Hero Card: Foto grande + Nome em destaque
  const renderHeroCard = () => (
    <Card className="bg-accent/5 border-2 border-primary/10">
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
            {(formData.brand || formData.category) && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {formData.brand && <span className="text-sm font-medium text-muted-foreground">{formData.brand}</span>}
                {formData.brand && formData.category && <span className="text-muted-foreground">•</span>}
                {formData.category && (
                  <Badge variant={getCategoryBadgeVariant(formData.category)} className="gap-1.5">
                    {getCategoryIcon(formData.category)}
                    {getCategoryLabel(formData.category)}
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
                <Badge variant={getCategoryBadgeVariant(formData.category)} className="gap-1.5">
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
                  <Badge variant="default" className="gap-1.5">
                    <Camera className="w-3 h-3" />
                    Câmera
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="audio">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1.5">
                    <Mic className="w-3 h-3" />
                    Áudio
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="lighting">
                <div className="flex items-center gap-2">
                  <Badge variant="warning" className="gap-1.5">
                    <Lightbulb className="w-3 h-3" />
                    Iluminação
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="accessories">
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="gap-1.5">
                    <Wrench className="w-3 h-3" />
                    Acessórios
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="storage">
                <div className="flex items-center gap-2">
                  <Badge variant="info" className="gap-1.5">
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="maintenance">Em Manutenção</SelectItem>
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
            <Select
              value={formData.parentId || 'none'}
              onValueChange={(value) => updateField('parentId', value === 'none' ? '' : value)}
            >
              <SelectTrigger id="parentId" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
                <SelectValue>{getSelectedParentName()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {getMainItems().map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.patrimonyNumber || 'S/N'} - {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Label htmlFor="invoice" className="text-sm font-medium">Nota Fiscal</Label>
          <Input
            id="invoice"
            value={formData.invoice || ''}
            onChange={(e) => updateField('invoice', e.target.value)}
            placeholder="Ex: NF-12345"
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
          <div>
            <Label htmlFor="purchaseDate" className="text-sm font-medium">Data de Compra</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate || ''}
              onChange={(e) => updateField('purchaseDate', e.target.value)}
              className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            />
          </div>

          <div>
            <Label htmlFor="receiveDate" className="text-sm font-medium">Data de Recebimento</Label>
            <Input
              id="receiveDate"
              type="date"
              value={formData.receiveDate || ''}
              onChange={(e) => updateField('receiveDate', e.target.value)}
              className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            />
          </div>

          <div>
            <Label htmlFor="lastMaintenance" className="text-sm font-medium">Última Manutenção</Label>
            <Input
              id="lastMaintenance"
              type="date"
              value={formData.lastMaintenance || ''}
              onChange={(e) => updateField('lastMaintenance', e.target.value)}
              className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            />
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
