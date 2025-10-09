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

  // Photo upload component (for sidebar on desktop, inline on mobile)
  const renderPhotoUpload = () => (
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
            <label htmlFor="equipment-photo" className="cursor-pointer text-primary hover:underline">
              Clique para selecionar
            </label>
            <input
              id="equipment-photo"
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

  // Summary card for sidebar (desktop only)
  const renderSummary = () => {
    const missingFields = [];
    if (!formData.name.trim()) missingFields.push('Nome');
    if (!formData.brand.trim()) missingFields.push('Marca');

    return (
      <Card className="sticky top-24">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Resumo</h3>
          <Separator />
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium truncate">{formData.name || '—'}</p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Marca:</span>
              <p className="font-medium truncate">{formData.brand || '—'}</p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Categoria:</span>
              <p className="font-medium truncate">
                {formData.category === 'camera' && 'Câmera'}
                {formData.category === 'audio' && 'Áudio'}
                {formData.category === 'lighting' && 'Iluminação'}
                {formData.category === 'accessories' && 'Acessórios'}
                {formData.category === 'storage' && 'Armazenamento'}
              </p>
            </div>
            
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium">
                {formData.status === 'available' ? 'Disponível' : 'Manutenção'}
              </p>
            </div>
            
            {formData.patrimonyNumber && (
              <div>
                <span className="text-muted-foreground">Patrimônio:</span>
                <p className="font-medium">{formData.patrimonyNumber}</p>
              </div>
            )}
          </div>

          {missingFields.length > 0 && (
            <>
              <Separator />
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Campos obrigatórios faltando: {missingFields.join(', ')}
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <MobileFriendlyForm onSubmit={onSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form content - 2/3 width on desktop */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mobile: Photo upload at top */}
          {isMobile && renderPhotoUpload()}
          
          {/* SECTION 1: Identificação */}
          <div className={sectionSpacing}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h3 className="font-semibold">Identificação</h3>
            </div>
            
            <div className={gridCols2}>
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

          <Separator />

          {/* SECTION 2: Status e Classificação */}
          <div className={sectionSpacing}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h3 className="font-semibold">Status e Classificação</h3>
            </div>
            
            <div className={gridCols2}>
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

          <Separator />

          {/* SECTION 3: Vínculos */}
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

          {/* SECTION 4: Valores & Datas */}
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

        {/* Sidebar - 1/3 width on desktop, hidden on mobile */}
        {!isMobile && (
          <div className="space-y-6">
            {renderPhotoUpload()}
            {renderSummary()}
          </div>
        )}
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
