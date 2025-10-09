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
import { Loader2, Upload, X, Package, Activity, Link2, DollarSign, Calendar } from 'lucide-react';
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

  // Hero Card: Foto grande + campos principais em destaque
  const renderHeroCard = () => (
    <Card className="bg-accent/5 border-2 border-primary/10">
      <CardContent className="p-6">
        <div className={cn(
          "flex gap-6",
          isMobile ? "flex-col items-center" : "flex-row items-start"
        )}>
          {/* Foto Grande */}
          <div className={cn(
            "flex-shrink-0",
            isMobile ? "w-full" : "w-[150px]"
          )}>
            {imageUrl ? (
              <div className="relative group">
                <img 
                  src={imageUrl} 
                  alt="Equipment" 
                  className={cn(
                    "object-cover rounded-lg border-2 border-primary/20",
                    isMobile ? "w-full aspect-square" : "w-[150px] h-[150px]"
                  )}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size={isMobile ? "sm" : "icon"}
                    onClick={handleImageRemove}
                  >
                    <X className="h-4 w-4" />
                    {isMobile && <span className="ml-1">Remover</span>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className={cn(
                "border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center text-center space-y-2 hover:border-primary/50 transition-colors",
                isMobile ? "aspect-square p-8" : "w-[150px] h-[150px] p-4"
              )}>
                <Upload className={cn("text-muted-foreground", isMobile ? "h-12 w-12" : "h-8 w-8")} />
                <label htmlFor="equipment-photo-hero" className="cursor-pointer text-sm text-primary hover:underline font-medium">
                  {isMobile ? "Adicionar Foto" : "Upload"}
                </label>
                <input
                  id="equipment-photo-hero"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  disabled={isUploadingImage}
                />
                <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP</p>
              </div>
            )}
            
            {isUploadingImage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            )}
          </div>

          {/* Campos Principais */}
          <div className="flex-1 space-y-4 w-full">
            {/* Nome (destaque) */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Nome do Equipamento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Ex: Canon EOS R5"
                className={cn(
                  "font-semibold text-base mt-1.5",
                  isMobile ? "h-12" : "h-10"
                )}
                required
              />
            </div>

            {/* Marca + Categoria em grid */}
            <div className={cn(
              "grid gap-4",
              isMobile ? "grid-cols-1" : "grid-cols-2"
            )}>
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

              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  Categoria <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
                  <SelectTrigger id="category" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camera">Câmera</SelectItem>
                    <SelectItem value="audio">Áudio</SelectItem>
                    <SelectItem value="lighting">Iluminação</SelectItem>
                    <SelectItem value="accessories">Acessórios</SelectItem>
                    <SelectItem value="storage">Armazenamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subcategoria + Status Badge */}
            <div className={cn(
              "grid gap-4 items-end",
              isMobile ? "grid-cols-1" : "grid-cols-2"
            )}>
              <div>
                <Label htmlFor="subcategory" className="text-sm font-medium">Subcategoria</Label>
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
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium block mb-1.5">Status Atual</Label>
                <Badge 
                  variant={formData.status === 'available' ? 'default' : 'secondary'}
                  className="text-sm px-4 py-1.5 font-medium"
                >
                  {formData.status === 'available' ? '✓ Disponível' : '🔧 Manutenção'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Card: Identificação
  const renderIdentificationCard = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Identificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="name-detail" className="text-sm font-medium">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name-detail"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ex: Canon EOS R5"
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            required
          />
        </div>
        <div>
          <Label htmlFor="brand-detail" className="text-sm font-medium">
            Marca <span className="text-destructive">*</span>
          </Label>
          <Input
            id="brand-detail"
            value={formData.brand}
            onChange={(e) => updateField('brand', e.target.value)}
            placeholder="Ex: Canon"
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            required
          />
        </div>
        <div>
          <Label htmlFor="category-detail" className="text-sm font-medium">
            Categoria <span className="text-destructive">*</span>
          </Label>
          <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
            <SelectTrigger id="category-detail" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="camera">Câmera</SelectItem>
              <SelectItem value="audio">Áudio</SelectItem>
              <SelectItem value="lighting">Iluminação</SelectItem>
              <SelectItem value="accessories">Acessórios</SelectItem>
              <SelectItem value="storage">Armazenamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="subcategory-detail" className="text-sm font-medium">Subcategoria</Label>
          <Select
            value={formData.subcategory || ''}
            onValueChange={(value) => updateField('subcategory', value)}
            disabled={categoriesLoading || !formData.category}
          >
            <SelectTrigger id="subcategory-detail" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {getSubcategoriesForCategory(formData.category).map((sub) => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  // Card: Status & Tipo
  const renderStatusCard = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Status & Tipo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="status" className="text-sm font-medium">
            Status <span className="text-destructive">*</span>
          </Label>
          <Select value={formData.status} onValueChange={(value: EquipmentStatus) => updateField('status', value)}>
            <SelectTrigger id="status" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="maintenance">Em Manutenção</SelectItem>
            </SelectContent>
          </Select>
        </div>

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

        {formData.itemType === 'accessory' && (
          <div>
            <Label htmlFor="parentId" className="text-sm font-medium">Item Principal</Label>
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

      {/* Grid 2x2: Cards Organizados */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-2"
      )}>
        {renderIdentificationCard()}
        {renderStatusCard()}
        {renderLinksCard()}
        {renderFinancialCard()}
      </div>

      {/* Seção Datas: Full-width */}
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
