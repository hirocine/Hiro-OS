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
import { Loader2, Upload, X, Package, Check, Link2, DollarSign, Calendar, Camera, Mic, Lightbulb, Wrench, HardDrive, CalendarIcon, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  const { getSubcategoriesForCategory, getCategoriesHierarchy, loading: categoriesLoading, addCustomCategory, refetch } = useCategories();

  // Estados para controlar os popovers de data
  const [showPurchaseDateCalendar, setShowPurchaseDateCalendar] = useState(false);
  const [showReceiveDateCalendar, setShowReceiveDateCalendar] = useState(false);
  const [showMaintenanceDateCalendar, setShowMaintenanceDateCalendar] = useState(false);

  // Estados para controlar o dialog de nova subcategoria
  const [showNewSubcategoryDialog, setShowNewSubcategoryDialog] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);

  // Estados para controlar o dialog de nova categoria
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Estados para controlar campos de empréstimo
  const [showLoanFields, setShowLoanFields] = useState(formData.status === 'loaned');
  const [showLoanDateCalendar, setShowLoanDateCalendar] = useState(false);
  const [showReturnDateCalendar, setShowReturnDateCalendar] = useState(false);

  // Estados para controlar edição dos campos monetários
  const [editingValue, setEditingValue] = useState<string>('');
  const [editingDepreciatedValue, setEditingDepreciatedValue] = useState<string>('');
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [isEditingDepreciatedValue, setIsEditingDepreciatedValue] = useState(false);

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

  // Handlers para datas de empréstimo
  const handleLoanDateSelect = (date: Date | undefined) => {
    if (date) {
      updateField('lastLoanDate', format(date, 'yyyy-MM-dd'));
      setShowLoanDateCalendar(false);
    }
  };

  const handleExpectedReturnDateSelect = (date: Date | undefined) => {
    if (date) {
      updateField('expectedReturnDate', format(date, 'yyyy-MM-dd'));
      setShowReturnDateCalendar(false);
    }
  };

  // Handler para mudança de status
  const handleStatusChange = (value: EquipmentStatus) => {
    updateField('status', value);
    setShowLoanFields(value === 'loaned');
    
    // Limpar campos de empréstimo se não for mais 'loaned'
    if (value !== 'loaned') {
      updateField('currentBorrower', '');
      updateField('lastLoanDate', '');
      updateField('expectedReturnDate', '');
    }
  };

  // Handler para mudança de categoria
  const handleCategoryChange = (value: string) => {
    if (value === '__CREATE_NEW__') {
      setShowNewCategoryDialog(true);
      setNewCategoryName('');
    } else {
      updateField('category', value);
      // Limpar subcategoria ao trocar de categoria
      updateField('subcategory', '');
    }
  };

  // Handler para mudança de subcategoria
  const handleSubcategoryChange = (value: string) => {
    if (value === '__CREATE_NEW__') {
      setShowNewSubcategoryDialog(true);
      setNewSubcategoryName('');
    } else {
      updateField('subcategory', value);
    }
  };

  // Handler para criar nova subcategoria
  const handleCreateSubcategory = async () => {
    if (!newSubcategoryName.trim() || !formData.category) return;
    
    setIsCreatingSubcategory(true);
    
    try {
      const result = await addCustomCategory(
        formData.category,
        newSubcategoryName.trim()
      );
      
      if (result.success) {
        // Atualizar o campo com a nova subcategoria
        updateField('subcategory', newSubcategoryName.trim());
        
        // Recarregar categorias
        await refetch();
        
        // Fechar dialog
        setShowNewSubcategoryDialog(false);
        setNewSubcategoryName('');
        
        toast.success('Subcategoria criada', {
          description: `"${newSubcategoryName.trim()}" foi adicionada com sucesso.`
        });
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      toast.error('Erro ao criar subcategoria', {
        description: error.message || 'Tente novamente.'
      });
    } finally {
      setIsCreatingSubcategory(false);
    }
  };

  // Handler para criar nova categoria
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsCreatingCategory(true);
    
    try {
      const result = await addCustomCategory(
        newCategoryName.trim(),
        null // Sem subcategoria inicial
      );
      
      if (result.success) {
        // Atualizar o campo com a nova categoria
        updateField('category', newCategoryName.trim());
        
        // Recarregar categorias
        await refetch();
        
        // Fechar dialog
        setShowNewCategoryDialog(false);
        setNewCategoryName('');
        
        toast.success('Categoria criada', {
          description: `"${newCategoryName.trim()}" foi adicionada com sucesso.`
        });
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      toast.error('Erro ao criar categoria', {
        description: error.message || 'Tente novamente.'
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Helper para formatar data do formato yyyy-MM-dd para dd/MM/yyyy
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    // Se for formato yyyy-MM-dd completo, formata
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      try {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // mês é 0-based
        if (!isNaN(date.getTime())) {
          return format(date, 'dd/MM/yyyy');
        }
      } catch {
        return dateString;
      }
    }
    
    // Retorna como está (permite ver o que está sendo digitado)
    return dateString;
  };

  // Helper para converter dd/MM/yyyy para yyyy-MM-dd
  const parseDateInput = (input: string): string => {
    if (!input) return '';
    
    // Se já está no formato yyyy-MM-dd, retorna
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    
    // Remove caracteres que não sejam dígitos ou /
    const cleaned = input.replace(/[^\d/]/g, '');
    
    // Se for uma data completa dd/MM/yyyy, converte
    const fullMatch = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (fullMatch) {
      const [, day, month, year] = fullMatch;
      // Valida se é uma data válida
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(date.getTime())) {
        return `${year}-${month}-${day}`;
      }
    }
    
    // Retorna a string limpa (permite digitação parcial)
    return cleaned;
  };

  // Handler para entrada de data com máscara automática
  const handleDateInput = (value: string, field: 'purchaseDate' | 'receiveDate' | 'lastMaintenance') => {
    let cleaned = value.replace(/[^\d]/g, '');
    
    // Limita a 8 dígitos (ddmmyyyy)
    cleaned = cleaned.substring(0, 8);
    
    // Adiciona as barras automaticamente
    let formatted = cleaned;
    if (cleaned.length >= 3) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    }
    if (cleaned.length >= 5) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4)}`;
    }
    
    updateField(field, formatted);
  };

  // Validar data completa apenas no blur
  const validateAndFormatDate = (value: string, field: 'purchaseDate' | 'receiveDate' | 'lastMaintenance') => {
    const fullMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (fullMatch) {
      const [, day, month, year] = fullMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      if (!isNaN(date.getTime())) {
        updateField(field, `${year}-${month}-${day}`);
        return;
      }
    }
    
    // Se não for válida, limpa o campo
    if (value && value.length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      updateField(field, '');
    }
  };

  // Handlers para campos monetários - Valor de Compra
  const handleValueFocus = () => {
    setIsEditingValue(true);
    const rawValue = formData.value ? formData.value.toString() : '';
    setEditingValue(rawValue);
  };

  const handleValueBlur = () => {
    setIsEditingValue(false);
    const parsed = parseCurrencyInput(editingValue);
    updateField('value', parsed);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };

  // Handlers para campos monetários - Valor Depreciado
  const handleDepreciatedValueFocus = () => {
    setIsEditingDepreciatedValue(true);
    const rawValue = formData.depreciatedValue ? formData.depreciatedValue.toString() : '';
    setEditingDepreciatedValue(rawValue);
  };

  const handleDepreciatedValueBlur = () => {
    setIsEditingDepreciatedValue(false);
    const parsed = parseCurrencyInput(editingDepreciatedValue);
    updateField('depreciatedValue', parsed);
  };

  const handleDepreciatedValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingDepreciatedValue(e.target.value);
  };

  // Helper para mapear categoria para variante de badge
  const getCategoryBadgeVariant = (category: EquipmentCategory): "neutral" => {
    return 'neutral' as const;
  };

  // Helper para mapear categoria para ícone
  const getCategoryIcon = (category: EquipmentCategory) => {
    const icons: Record<string, any> = {
      camera: Camera,
      'câmera': Camera,
      audio: Mic,
      'áudio': Mic,
      lighting: Lightbulb,
      'iluminação': Lightbulb,
      accessories: Wrench,
      'acessórios': Wrench,
      storage: HardDrive,
      'armazenamento': HardDrive
    };
    const IconComponent = icons[category.toLowerCase()];
    return IconComponent ? <IconComponent className="w-3 h-3" /> : <Package className="w-3 h-3" />;
  };

  // Helper para traduzir categoria
  const getCategoryLabel = (category: EquipmentCategory) => {
    const labels: Record<string, string> = {
      camera: 'Câmera',
      audio: 'Áudio',
      lighting: 'Iluminação',
      accessories: 'Acessórios',
      storage: 'Armazenamento'
    };
    return labels[category] || category; // Retorna o nome original se não estiver na lista
  };

  // Helper para obter variante do badge de status
  const getStatusBadgeVariant = (status: EquipmentStatus): 'success' | 'warning' | 'neutral' => {
    const variants: Record<EquipmentStatus, 'success' | 'warning' | 'neutral'> = {
      available: 'success',
      maintenance: 'warning',
      loaned: 'neutral'
    };
    return variants[status] || 'success';
  };

  // Helper para obter ícone do status
  const getStatusIcon = (status: EquipmentStatus) => {
    const icons: Record<EquipmentStatus, JSX.Element> = {
      available: <Check className="w-3 h-3" />,
      maintenance: <Wrench className="w-3 h-3" />,
      loaned: <Package className="w-3 h-3" />
    };
    return icons[status] || <Check className="w-3 h-3" />;
  };

  // Helper para obter label traduzido do status
  const getStatusLabel = (status: EquipmentStatus): string => {
    const labels: Record<EquipmentStatus, string> = {
      available: 'Disponível',
      maintenance: 'Em Manutenção',
      loaned: 'Emprestado'
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
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger id="category" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {/* Fallback ad-hoc: Se categoria atual não está na lista, injeta dinamicamente */}
              {formData.category && !getCategoriesHierarchy().some(cat => cat.categoryName === formData.category) && (
                <>
                  <SelectItem value={formData.category}>
                    {formData.category} (valor atual - fora da lista)
                  </SelectItem>
                  <div className="border-t my-1" />
                </>
              )}
              
              {/* Categorias do banco de dados */}
              {getCategoriesHierarchy().map((cat) => (
                <SelectItem key={cat.categoryName} value={cat.categoryName}>
                  {cat.categoryName}
                </SelectItem>
              ))}
              
              {/* Separador */}
              {getCategoriesHierarchy().length > 0 && (
                <div className="border-t my-1" />
              )}
              
              {/* Opção de criar nova */}
              <SelectItem 
                value="__CREATE_NEW__" 
                className="text-primary font-medium"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar nova categoria
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
            onValueChange={handleSubcategoryChange}
            disabled={categoriesLoading || !formData.category}
          >
            <SelectTrigger id="subcategory" className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {/* Fallback ad-hoc: Se subcategoria atual não está na lista, injeta dinamicamente */}
              {formData.subcategory && !getSubcategoriesForCategory(formData.category).includes(formData.subcategory) && (
                <>
                  <SelectItem value={formData.subcategory}>
                    {formData.subcategory} (valor atual - fora da lista)
                  </SelectItem>
                  <div className="border-t my-1" />
                </>
              )}
              
              {getSubcategoriesForCategory(formData.category).map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
              
              {/* Separador */}
              {getSubcategoriesForCategory(formData.category).length > 0 && (
                <div className="border-t my-1" />
              )}
              
              {/* Opção de criar nova */}
              <SelectItem 
                value="__CREATE_NEW__" 
                className="text-primary font-medium"
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar nova subcategoria
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

        {/* Status */}
        <div>
          <Label htmlFor="status" className="text-sm font-medium">
            Status <span className="text-destructive">*</span>
          </Label>
          <Select 
            value={formData.status} 
            onValueChange={handleStatusChange}
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
              <SelectItem value="loaned">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="gap-1.5">
                    <Package className="w-3 h-3" />
                    Emprestado
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Informações de Empréstimo (condicionais) */}
        {showLoanFields && (
          <>
            {/* Para quem foi emprestado */}
            <div>
              <Label htmlFor="currentBorrower" className="text-sm font-medium">
                Para quem foi emprestado? <span className="text-destructive">*</span>
              </Label>
              <Input
                id="currentBorrower"
                type="text"
                value={formData.currentBorrower || ''}
                onChange={(e) => updateField('currentBorrower', e.target.value)}
                placeholder="Nome da pessoa ou departamento"
                className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
                required={formData.status === 'loaned'}
              />
            </div>

            {/* Data de empréstimo */}
            <div>
              <Label htmlFor="lastLoanDate" className="text-sm font-medium">
                Data de Empréstimo <span className="text-destructive">*</span>
              </Label>
              <Popover 
                open={showLoanDateCalendar} 
                onOpenChange={setShowLoanDateCalendar}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="lastLoanDate"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1.5",
                      !formData.lastLoanDate && "text-muted-foreground",
                      isMobile ? "h-10" : "h-9"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.lastLoanDate 
                      ? format(new Date(formData.lastLoanDate), 'dd/MM/yyyy')
                      : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.lastLoanDate ? new Date(formData.lastLoanDate) : undefined}
                    onSelect={handleLoanDateSelect}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data de devolução esperada */}
            <div>
              <Label htmlFor="expectedReturnDate" className="text-sm font-medium">
                Data de Devolução Esperada <span className="text-destructive">*</span>
              </Label>
              <Popover 
                open={showReturnDateCalendar} 
                onOpenChange={setShowReturnDateCalendar}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="expectedReturnDate"
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1.5",
                      !formData.expectedReturnDate && "text-muted-foreground",
                      isMobile ? "h-10" : "h-9"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expectedReturnDate 
                      ? format(new Date(formData.expectedReturnDate), 'dd/MM/yyyy')
                      : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={formData.expectedReturnDate ? new Date(formData.expectedReturnDate) : undefined}
                    onSelect={handleExpectedReturnDateSelect}
                    initialFocus
                    disabled={(date) => {
                      // Impedir seleção de datas anteriores à data de empréstimo
                      if (formData.lastLoanDate) {
                        return date < new Date(formData.lastLoanDate);
                      }
                      return false;
                    }}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Alerta informativo */}
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              <p className="flex items-start gap-2">
                <Package className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Este equipamento ficará marcado como emprestado até que o status seja alterado manualmente.
                </span>
              </p>
            </div>
          </>
        )}

        {/* Capacidade (condicional para storage) */}
        {formData.category === 'Armazenamento' && (
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
            value={isEditingValue ? editingValue : (formData.value ? formatCurrency(formData.value) : '')}
            onChange={handleValueChange}
            onFocus={handleValueFocus}
            onBlur={handleValueBlur}
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            placeholder="R$ 0,00"
            inputMode="decimal"
          />
        </div>

        <div>
          <Label htmlFor="depreciatedValue" className="text-sm font-medium">Valor Depreciado</Label>
          <Input
            id="depreciatedValue"
            value={isEditingDepreciatedValue ? editingDepreciatedValue : (formData.depreciatedValue ? formatCurrency(formData.depreciatedValue) : '')}
            onChange={handleDepreciatedValueChange}
            onFocus={handleDepreciatedValueFocus}
            onBlur={handleDepreciatedValueBlur}
            className={cn("mt-1.5", isMobile ? "h-10" : "h-9")}
            placeholder="R$ 0,00"
            inputMode="decimal"
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
                onChange={(e) => handleDateInput(e.target.value, 'purchaseDate')}
                onBlur={(e) => validateAndFormatDate(e.target.value, 'purchaseDate')}
                placeholder="dd/mm/aaaa"
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
                onChange={(e) => handleDateInput(e.target.value, 'receiveDate')}
                onBlur={(e) => validateAndFormatDate(e.target.value, 'receiveDate')}
                placeholder="dd/mm/aaaa"
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
                onChange={(e) => handleDateInput(e.target.value, 'lastMaintenance')}
                onBlur={(e) => validateAndFormatDate(e.target.value, 'lastMaintenance')}
                placeholder="dd/mm/aaaa"
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

      {/* Dialog para criar nova subcategoria */}
      <Dialog open={showNewSubcategoryDialog} onOpenChange={setShowNewSubcategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Subcategoria</DialogTitle>
            <DialogDescription>
              Adicione uma nova subcategoria personalizada para {formData.category ? getCategoryLabel(formData.category) : 'a categoria selecionada'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Categoria selecionada (read-only) */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Categoria
              </Label>
              <div className="mt-1.5">
                <Badge variant="neutral" className="gap-1.5">
                  {formData.category && getCategoryIcon(formData.category)}
                  {formData.category && getCategoryLabel(formData.category)}
                </Badge>
              </div>
            </div>
            
            {/* Input para nome da subcategoria */}
            <div>
              <Label htmlFor="new-subcategory" className="text-sm font-medium">
                Nome da Subcategoria <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-subcategory"
                placeholder="Ex: Lente Grande Angular, Tripé Profissional..."
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubcategoryName.trim()) {
                    handleCreateSubcategory();
                  }
                }}
                disabled={isCreatingSubcategory}
                autoFocus
                className="mt-1.5"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewSubcategoryDialog(false);
                setNewSubcategoryName('');
              }}
              disabled={isCreatingSubcategory}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateSubcategory}
              disabled={!newSubcategoryName.trim() || isCreatingSubcategory}
            >
              {isCreatingSubcategory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar nova categoria */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para o equipamento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-category">Nome da Categoria *</Label>
              <Input
                id="new-category"
                placeholder="Ex: Computadores, Drones, Monitores..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewCategoryDialog(false)}
              disabled={isCreatingCategory}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateCategory}
              disabled={isCreatingCategory || !newCategoryName.trim()}
            >
              {isCreatingCategory ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
