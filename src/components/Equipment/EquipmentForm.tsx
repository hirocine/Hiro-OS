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
import { Separator } from '@/components/ui/separator';
import { Loader2, Upload, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
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
  
  // Compact styling constants
  const labelClass = "text-sm font-medium";
  const inputClass = isMobile ? "h-10 mt-1" : "h-9 mt-1";
  const selectTriggerClass = isMobile ? "h-10 mt-1" : "h-9 mt-1";
  const sectionSpacing = "space-y-3";
  const gridCols2 = "grid grid-cols-1 lg:grid-cols-2 gap-3";

  // Photo upload - mobile version (full width at top)
  const renderPhotoUploadMobile = () => (
    <div className="space-y-2">
      <Label className={labelClass}>Foto do Equipamento</Label>
      
      {imageUrl ? (
        <div className="relative group">
          <img 
            src={imageUrl} 
            alt="Equipment" 
            className="w-full aspect-square object-cover rounded-lg border-2 border-border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleImageRemove}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-2">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <label htmlFor="equipment-photo-mobile" className="cursor-pointer text-primary hover:underline">
              Clique para selecionar
            </label>
            <input
              id="equipment-photo-mobile"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              disabled={isUploadingImage}
            />
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP (máx. 10MB)</p>
        </div>
      )}
      
      {isUploadingImage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando foto...
        </div>
      )}
    </div>
  );

  // Photo upload - compact inline version for desktop (120x120px)
  const renderPhotoUploadCompact = () => (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">Foto</Label>
      
      {imageUrl ? (
        <div className="relative group">
          <img 
            src={imageUrl} 
            alt="Equipment" 
            className="w-[120px] h-[120px] object-cover rounded-lg border-2 border-border"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={handleImageRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-[120px] h-[120px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-center space-y-1 hover:border-primary transition-colors">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <label htmlFor="equipment-photo-desktop" className="cursor-pointer text-xs text-primary hover:underline px-2">
            Upload
          </label>
          <input
            id="equipment-photo-desktop"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            disabled={isUploadingImage}
          />
        </div>
      )}
      
      {isUploadingImage && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Carregando...
        </div>
      )}
    </div>
  );

  // Compact summary for inline display (desktop)
  const renderSummaryCompact = () => {
    const missingFields = [];
    if (!formData.name.trim()) missingFields.push('Nome');
    if (!formData.brand.trim()) missingFields.push('Marca');

    return (
      <div className="p-3 rounded-lg border bg-card space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resumo</h4>
        
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Nome:</span>
            <span className="font-medium text-right truncate">{formData.name || '—'}</span>
          </div>
          
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Marca:</span>
            <span className="font-medium text-right truncate">{formData.brand || '—'}</span>
          </div>
          
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Categoria:</span>
            <span className="font-medium text-right truncate">
              {formData.category === 'camera' && 'Câmera'}
              {formData.category === 'audio' && 'Áudio'}
              {formData.category === 'lighting' && 'Iluminação'}
              {formData.category === 'accessories' && 'Acessórios'}
              {formData.category === 'storage' && 'Armazenamento'}
            </span>
          </div>
          
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium text-right">
              {formData.status === 'available' ? 'Disponível' : 'Manutenção'}
            </span>
          </div>
          
          {formData.patrimonyNumber && (
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Patrimônio:</span>
              <span className="font-medium text-right">{formData.patrimonyNumber}</span>
            </div>
          )}
        </div>

        {missingFields.length > 0 && (
          <Alert variant="destructive" className="py-1.5 px-2 mt-2">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs leading-tight">
              Faltando: {missingFields.join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  // Overview section with 3 columns (desktop): Identification | Photo+Summary | Status
  const renderOverviewSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-1 bg-primary rounded-full" />
        <h3 className="font-semibold">Visão Geral</h3>
      </div>
      
      {/* 3-column grid on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        
        {/* Column 1: Identificação */}
        <div className={sectionSpacing}>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Identificação</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className={labelClass}>
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Ex: Canon EOS R5"
                className={inputClass}
                required
              />
            </div>

            <div>
              <Label htmlFor="brand" className={labelClass}>
                Marca <span className="text-destructive">*</span>
              </Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => updateField('brand', e.target.value)}
                placeholder="Ex: Canon"
                className={inputClass}
                required
              />
            </div>

            <div>
              <Label htmlFor="category" className={labelClass}>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateField('category', value)}
              >
                <SelectTrigger id="category" className={selectTriggerClass}>
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
              <Label htmlFor="subcategory" className={labelClass}>Subcategoria</Label>
              <Select
                value={formData.subcategory || ''}
                onValueChange={(value) => updateField('subcategory', value)}
                disabled={categoriesLoading || !formData.category}
              >
                <SelectTrigger id="subcategory" className={selectTriggerClass}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {getSubcategoriesForCategory(formData.category).map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Column 2: Photo + Compact Summary (desktop only) */}
        <div className="hidden lg:block space-y-4">
          {renderPhotoUploadCompact()}
          {renderSummaryCompact()}
        </div>

        {/* Column 3: Status & Tipo */}
        <div className={sectionSpacing}>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Status & Tipo</h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="status" className={labelClass}>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => updateField('status', value)}
              >
                <SelectTrigger id="status" className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="itemType" className={labelClass}>Tipo de Item</Label>
              <Select
                value={formData.itemType}
                onValueChange={(value) => updateField('itemType', value)}
              >
                <SelectTrigger id="itemType" className={selectTriggerClass}>
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
                <Label htmlFor="capacity" className={labelClass}>Capacidade (GB)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => updateField('capacity', parseInt(e.target.value) || 0)}
                  placeholder="Ex: 512"
                  className={inputClass}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MobileFriendlyForm onSubmit={onSubmit}>
      <div className="space-y-6">
        
        {/* Mobile: Photo upload at top */}
        {isMobile && renderPhotoUploadMobile()}
        
        {/* SECTION 1: Overview (Identificação + Foto/Resumo + Status) - 3 columns on desktop */}
        {renderOverviewSection()}

        <Separator />

        {/* SECTION 2: Vínculos */}
        <div className={sectionSpacing}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h3 className="font-semibold">Vínculos</h3>
          </div>
          
          <div className={gridCols2}>
            <div>
              <Label htmlFor="serialNumber" className={labelClass}>Nº de Série</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber || ''}
                onChange={(e) => updateField('serialNumber', e.target.value)}
                placeholder="Ex: 123456789"
                className={inputClass}
              />
            </div>

            <div>
              <Label htmlFor="patrimonyNumber" className={labelClass}>Nº Patrimônio</Label>
              <Input
                id="patrimonyNumber"
                value={formData.patrimonyNumber || ''}
                onChange={(e) => updateField('patrimonyNumber', e.target.value)}
                placeholder="Ex: PAT-001"
                className={inputClass}
              />
            </div>

            {formData.itemType === 'accessory' && (
              <div className="lg:col-span-2">
                <Label htmlFor="parentId" className={labelClass}>Item Principal</Label>
                <Select
                  value={formData.parentId || 'none'}
                  onValueChange={(value) => updateField('parentId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger id="parentId" className={selectTriggerClass}>
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

            <div className="lg:col-span-2">
              <Label htmlFor="description" className={labelClass}>Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Informações adicionais sobre o equipamento..."
                className={cn(inputClass, "min-h-[60px] resize-none")}
                rows={2}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* SECTION 3: Valores & Datas */}
        <div className={sectionSpacing}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h3 className="font-semibold">Valores & Datas</h3>
          </div>
          
          <div className={gridCols2}>
            <div>
              <Label htmlFor="value" className={labelClass}>Valor de Compra</Label>
              <Input
                id="value"
                value={formData.value ? formatCurrency(formData.value) : ''}
                onChange={(e) => updateField('value', parseCurrencyInput(e.target.value))}
                placeholder="R$ 0,00"
                className={inputClass}
              />
            </div>

            <div>
              <Label htmlFor="depreciatedValue" className={labelClass}>Valor Depreciado</Label>
              <Input
                id="depreciatedValue"
                value={formData.depreciatedValue ? formatCurrency(formData.depreciatedValue) : ''}
                onChange={(e) => updateField('depreciatedValue', parseCurrencyInput(e.target.value))}
                placeholder="R$ 0,00"
                className={inputClass}
              />
            </div>

            <div>
              <Label htmlFor="store" className={labelClass}>Loja</Label>
              <Input
                id="store"
                value={formData.store || ''}
                onChange={(e) => updateField('store', e.target.value)}
                placeholder="Ex: Loja XYZ"
                className={inputClass}
              />
            </div>

            <div>
              <Label htmlFor="invoice" className={labelClass}>Nota Fiscal</Label>
              <Input
                id="invoice"
                value={formData.invoice || ''}
                onChange={(e) => updateField('invoice', e.target.value)}
                placeholder="Ex: NF-12345"
                className={inputClass}
              />
            </div>

            <div>
              <Label htmlFor="purchaseDate" className={labelClass}>Data de Compra</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate || ''}
                onChange={(e) => updateField('purchaseDate', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <Label htmlFor="receiveDate" className={labelClass}>Data de Recebimento</Label>
              <Input
                id="receiveDate"
                type="date"
                value={formData.receiveDate || ''}
                onChange={(e) => updateField('receiveDate', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <Label htmlFor="lastMaintenance" className={labelClass}>Última Manutenção</Label>
              <Input
                id="lastMaintenance"
                type="date"
                value={formData.lastMaintenance || ''}
                onChange={(e) => updateField('lastMaintenance', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
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
          {isEditMode ? "Atualizar Equipamento" : "Adicionar Equipamento"}
        </Button>
      </MobileFriendlyFormActions>
    </MobileFriendlyForm>
  );
};
