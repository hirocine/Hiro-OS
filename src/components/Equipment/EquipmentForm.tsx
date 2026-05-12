import React, { useCallback, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCategories } from '@/hooks/useCategories';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MobileFriendlyForm, MobileFriendlyFormActions } from '@/components/ui/mobile-friendly-form';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Loader2, X, Package, Check, Link2, DollarSign, Calendar, Camera, Mic, Lightbulb, Wrench, HardDrive, CalendarIcon, Plus, type LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusPill } from '@/ds/components/StatusPill';
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

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const FieldLabel = ({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label htmlFor={htmlFor} style={fieldLabel}>
    {children}
    {required && <span style={{ marginLeft: 4, color: 'hsl(var(--ds-danger))' }}>*</span>}
  </label>
);

const sectionHeaderStyle: React.CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid hsl(var(--ds-line-1))',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-2))',
};

const SectionShell: React.FC<{
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}> = ({ icon: Icon, title, children }) => (
  <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
    <div style={sectionHeaderStyle}>
      <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
      <span style={sectionTitleStyle}>{title}</span>
    </div>
    <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
  </div>
);

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

  // Drag-and-drop state for image upload
  const [isDraggingImage, setIsDraggingImage] = useState(false);

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

  // Função para formatar moeda durante digitação (em tempo real)
  const formatCurrencyInput = (value: string): string => {
    // Remove tudo que não seja dígito
    const digits = value.replace(/\D/g, '');

    if (!digits) return '';

    // Converte para número (centavos)
    const number = parseInt(digits, 10);

    // Formata para reais (divide por 100 para ter os centavos)
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number / 100);

    return formatted;
  };

  // Handlers para campos monetários - Valor de Compra
  const handleValueFocus = () => {
    setIsEditingValue(true);
    const rawValue = formData.value ? formData.value.toString() : '';
    if (rawValue && parseFloat(rawValue) > 0) {
      const formatted = formatCurrencyInput((parseFloat(rawValue) * 100).toString());
      setEditingValue(formatted);
    } else {
      setEditingValue('');
    }
  };

  const handleValueBlur = () => {
    setIsEditingValue(false);
    const digits = editingValue.replace(/\D/g, '');
    const parsed = digits ? parseInt(digits, 10) / 100 : 0;
    updateField('value', parsed);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatCurrencyInput(inputValue);
    setEditingValue(formatted);
  };

  // Handlers para campos monetários - Valor Depreciado
  const handleDepreciatedValueFocus = () => {
    setIsEditingDepreciatedValue(true);
    const rawValue = formData.depreciatedValue ? formData.depreciatedValue.toString() : '';
    if (rawValue && parseFloat(rawValue) > 0) {
      const formatted = formatCurrencyInput((parseFloat(rawValue) * 100).toString());
      setEditingDepreciatedValue(formatted);
    } else {
      setEditingDepreciatedValue('');
    }
  };

  const handleDepreciatedValueBlur = () => {
    setIsEditingDepreciatedValue(false);
    const digits = editingDepreciatedValue.replace(/\D/g, '');
    const parsed = digits ? parseInt(digits, 10) / 100 : 0;
    updateField('depreciatedValue', parsed);
  };

  const handleDepreciatedValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatCurrencyInput(inputValue);
    setEditingDepreciatedValue(formatted);
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
    return IconComponent ? <IconComponent size={11} strokeWidth={1.5} /> : <Package size={11} strokeWidth={1.5} />;
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
    return labels[category] || category;
  };

  // Helper para tonalidade do status (success/warning/muted)
  const getStatusTone = (status: EquipmentStatus): 'success' | 'warning' | 'muted' => {
    const tones: Record<EquipmentStatus, 'success' | 'warning' | 'muted'> = {
      available: 'success',
      maintenance: 'warning',
      loaned: 'muted'
    };
    return tones[status] || 'success';
  };

  // Helper para obter ícone do status
  const getStatusIcon = (status: EquipmentStatus) => {
    const icons: Record<EquipmentStatus, JSX.Element> = {
      available: <Check size={11} strokeWidth={1.5} />,
      maintenance: <Wrench size={11} strokeWidth={1.5} />,
      loaned: <Package size={11} strokeWidth={1.5} />
    };
    return icons[status] || <Check size={11} strokeWidth={1.5} />;
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

  // Drag-and-drop handlers for image
  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  // ---------- Sections ----------

  // Hero Section: Foto grande + Nome em destaque
  const renderHeroSection = () => {
    const imageBoxBaseBorder = isDraggingImage
      ? '2px dashed hsl(var(--ds-accent))'
      : imageUrl
      ? '1px solid hsl(var(--ds-line-1))'
      : '2px dashed hsl(var(--ds-line-1))';

    const hasMiniInfo =
      formData.brand ||
      formData.category ||
      formData.status ||
      (formData.itemType === 'accessory' && formData.parentId && formData.parentId !== 'none');

    return (
      <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
        <div style={{ padding: 18 }}>
          <div
            style={{
              display: 'flex',
              gap: 18,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
            }}
          >
            {/* Foto Upload */}
            <div
              style={{
                flexShrink: 0,
                alignSelf: 'flex-start',
                width: isMobile ? '100%' : 150,
              }}
            >
              <div
                onDragOver={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                onDrop={handleImageDrop}
                style={{
                  position: 'relative',
                  border: imageBoxBaseBorder,
                  background: isDraggingImage
                    ? 'hsl(var(--ds-accent) / 0.05)'
                    : 'hsl(var(--ds-line-2) / 0.3)',
                  overflow: 'hidden',
                  width: isMobile ? '100%' : 150,
                  aspectRatio: isMobile ? '1 / 1' : undefined,
                  height: isMobile ? undefined : 150,
                }}
              >
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="Equipment preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      className="btn"
                      onClick={handleImageRemove}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 28,
                        height: 28,
                        padding: 0,
                        justifyContent: 'center',
                        color: 'hsl(var(--ds-danger))',
                        background: 'hsl(var(--ds-surface))',
                      }}
                      aria-label="Remover imagem"
                    >
                      <X size={13} strokeWidth={1.5} />
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 14,
                      textAlign: 'center',
                    }}
                  >
                    <Camera
                      size={26}
                      strokeWidth={1.5}
                      style={{ color: 'hsl(var(--ds-fg-3))', marginBottom: 8 }}
                    />
                    <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginBottom: 4 }}>
                      Clique ou arraste uma foto
                    </p>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                )}
              </div>

              {isUploadingImage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'hsl(var(--ds-fg-3))',
                    marginTop: 8,
                  }}
                >
                  <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                  Carregando...
                </div>
              )}
            </div>

            {/* Nome em Destaque */}
            <div style={{ flex: 1, width: '100%' }}>
              <FieldLabel htmlFor="hero-name" required>
                Nome do Equipamento
              </FieldLabel>
              <Input
                id="hero-name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Ex: Canon EOS R5"
                style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                }}
                required
              />

              {/* Mini-resumo visual */}
              {hasMiniInfo && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  {formData.brand && (
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>
                      {formData.brand}
                    </span>
                  )}
                  {formData.brand &&
                    (formData.category ||
                      formData.status ||
                      (formData.itemType === 'accessory' &&
                        formData.parentId &&
                        formData.parentId !== 'none')) && (
                      <span style={{ color: 'hsl(var(--ds-fg-4))' }}>•</span>
                    )}
                  {formData.category && (
                    <StatusPill
                      label={getCategoryLabel(formData.category)}
                      tone="muted"
                      icon={getCategoryIcon(formData.category)}
                    />
                  )}
                  {formData.category &&
                    (formData.status ||
                      (formData.itemType === 'accessory' &&
                        formData.parentId &&
                        formData.parentId !== 'none')) && (
                      <span style={{ color: 'hsl(var(--ds-fg-4))' }}>•</span>
                    )}
                  {formData.status && (
                    <StatusPill
                      label={getStatusLabel(formData.status)}
                      tone={getStatusTone(formData.status)}
                      icon={getStatusIcon(formData.status)}
                    />
                  )}
                  {formData.status &&
                    formData.itemType === 'accessory' &&
                    formData.parentId &&
                    formData.parentId !== 'none' && <span style={{ color: 'hsl(var(--ds-fg-4))' }}>•</span>}

                  {formData.itemType === 'accessory' && formData.parentId && formData.parentId !== 'none' && (
                    <StatusPill
                      label={`Acessório de › ${getSelectedParentName()}`}
                      tone="muted"
                      icon={<Link2 size={11} strokeWidth={1.5} />}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Section: Identificação & Status
  const renderStatusSection = () => (
    <SectionShell icon={Package} title="Identificação & Status">
      {/* Marca */}
      <div>
        <FieldLabel htmlFor="brand" required>
          Marca
        </FieldLabel>
        <Input
          id="brand"
          value={formData.brand}
          onChange={(e) => updateField('brand', e.target.value)}
          placeholder="Ex: Canon"
          required
        />
      </div>

      {/* Categoria */}
      <div>
        <FieldLabel htmlFor="category" required>
          Categoria
        </FieldLabel>
        {categoriesLoading ? (
          <span className="sk line" style={{ display: 'block', height: 36, width: '100%' }} />
        ) : (
          <Select
            key={`category-${categoriesLoading}-${formData.category}`}
            value={formData.category || undefined}
            onValueChange={handleCategoryChange}
            disabled={categoriesLoading}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Selecione uma categoria">
                {formData.category || 'Selecione uma categoria'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {formData.category &&
                !getCategoriesHierarchy().some((cat) => cat.categoryName === formData.category) && (
                  <>
                    <SelectItem value={formData.category}>
                      {formData.category} (valor atual - fora da lista)
                    </SelectItem>
                    <div style={{ borderTop: '1px solid hsl(var(--ds-line-1))', margin: '4px 0' }} />
                  </>
                )}

              {getCategoriesHierarchy().map((cat) => (
                <SelectItem key={cat.categoryName} value={cat.categoryName}>
                  {cat.categoryName}
                </SelectItem>
              ))}

              {getCategoriesHierarchy().length > 0 && (
                <div style={{ borderTop: '1px solid hsl(var(--ds-line-1))', margin: '4px 0' }} />
              )}

              <SelectItem value="__CREATE_NEW__">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-accent))', fontWeight: 500 }}>
                  <Plus size={13} strokeWidth={1.5} />
                  Criar nova categoria
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Subcategoria */}
      <div>
        <FieldLabel htmlFor="subcategory">Subcategoria</FieldLabel>
        <Select
          key={`subcategory-${categoriesLoading}-${formData.category}-${formData.subcategory || ''}`}
          value={formData.subcategory || ''}
          onValueChange={handleSubcategoryChange}
          disabled={categoriesLoading || !formData.category}
        >
          <SelectTrigger id="subcategory">
            <SelectValue placeholder="Selecione">
              {formData.subcategory || 'Selecione'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {formData.subcategory &&
              !getSubcategoriesForCategory(formData.category).includes(formData.subcategory) && (
                <>
                  <SelectItem value={formData.subcategory}>
                    {formData.subcategory} (valor atual - fora da lista)
                  </SelectItem>
                  <div style={{ borderTop: '1px solid hsl(var(--ds-line-1))', margin: '4px 0' }} />
                </>
              )}

            {getSubcategoriesForCategory(formData.category).map((sub) => (
              <SelectItem key={sub} value={sub}>
                {sub}
              </SelectItem>
            ))}

            {getSubcategoriesForCategory(formData.category).length > 0 && (
              <div style={{ borderTop: '1px solid hsl(var(--ds-line-1))', margin: '4px 0' }} />
            )}

            <SelectItem value="__CREATE_NEW__">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-accent))', fontWeight: 500 }}>
                <Plus size={13} strokeWidth={1.5} />
                Criar nova subcategoria
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tipo de Item */}
      <div>
        <FieldLabel htmlFor="itemType" required>
          Tipo de Item
        </FieldLabel>
        <Select
          value={formData.itemType}
          onValueChange={(value: 'main' | 'accessory') => updateField('itemType', value)}
        >
          <SelectTrigger id="itemType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">Item Principal</SelectItem>
            <SelectItem value="accessory">Acessório</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Item Principal (condicional) */}
      {formData.itemType === 'accessory' && (
        <div>
          <FieldLabel htmlFor="parentId">Item Principal</FieldLabel>
          <Autocomplete
            options={getMainItemsAsOptions()}
            value={formData.parentId || 'none'}
            onValueChange={(value) => updateField('parentId', value === 'none' ? '' : value)}
            placeholder="Pesquise por número ou nome"
            allowCustomValue={false}
          />
        </div>
      )}

      {/* Status */}
      <div>
        <FieldLabel htmlFor="status" required>
          Status
        </FieldLabel>
        <Select value={formData.status} onValueChange={handleStatusChange}>
          <SelectTrigger id="status">
            <SelectValue>
              <StatusPill
                label={getStatusLabel(formData.status)}
                tone={getStatusTone(formData.status)}
                icon={getStatusIcon(formData.status)}
              />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">
              <StatusPill label="Disponível" tone="success" icon={<Check size={11} strokeWidth={1.5} />} />
            </SelectItem>
            <SelectItem value="maintenance">
              <StatusPill label="Em Manutenção" tone="warning" icon={<Wrench size={11} strokeWidth={1.5} />} />
            </SelectItem>
            <SelectItem value="loaned">
              <StatusPill label="Emprestado" tone="muted" icon={<Package size={11} strokeWidth={1.5} />} />
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Informações de Empréstimo (condicionais) */}
      {showLoanFields && (
        <>
          <div>
            <FieldLabel htmlFor="currentBorrower" required>
              Para quem foi emprestado?
            </FieldLabel>
            <Input
              id="currentBorrower"
              type="text"
              value={formData.currentBorrower || ''}
              onChange={(e) => updateField('currentBorrower', e.target.value)}
              placeholder="Nome da pessoa ou departamento"
              required={formData.status === 'loaned'}
            />
          </div>

          <div>
            <FieldLabel htmlFor="lastLoanDate" required>
              Data de Empréstimo
            </FieldLabel>
            <Popover open={showLoanDateCalendar} onOpenChange={setShowLoanDateCalendar}>
              <PopoverTrigger asChild>
                <button
                  id="lastLoanDate"
                  type="button"
                  className="btn"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <CalendarIcon size={13} strokeWidth={1.5} />
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: formData.lastLoanDate ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                    }}
                  >
                    {formData.lastLoanDate
                      ? format(new Date(formData.lastLoanDate), 'dd/MM/yyyy')
                      : 'Selecione a data'}
                  </span>
                </button>
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

          <div>
            <FieldLabel htmlFor="expectedReturnDate" required>
              Data de Devolução Esperada
            </FieldLabel>
            <Popover open={showReturnDateCalendar} onOpenChange={setShowReturnDateCalendar}>
              <PopoverTrigger asChild>
                <button
                  id="expectedReturnDate"
                  type="button"
                  className="btn"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  <CalendarIcon size={13} strokeWidth={1.5} />
                  <span
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: formData.expectedReturnDate ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                    }}
                  >
                    {formData.expectedReturnDate
                      ? format(new Date(formData.expectedReturnDate), 'dd/MM/yyyy')
                      : 'Selecione a data'}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={formData.expectedReturnDate ? new Date(formData.expectedReturnDate) : undefined}
                  onSelect={handleExpectedReturnDateSelect}
                  initialFocus
                  disabled={(date) => {
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

          {/* Callout informativo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 12,
              border: '1px solid hsl(var(--ds-info) / 0.3)',
              background: 'hsl(var(--ds-info) / 0.06)',
              fontSize: 13,
              color: 'hsl(var(--ds-fg-2))',
            }}
          >
            <Package
              size={15}
              strokeWidth={1.5}
              style={{ color: 'hsl(var(--ds-info))', marginTop: 1, flexShrink: 0 }}
            />
            <span>
              Este equipamento ficará marcado como emprestado até que o status seja alterado manualmente.
            </span>
          </div>
        </>
      )}

      {/* Capacidade (condicional para storage) */}
      {formData.category === 'Armazenamento' && (
        <div>
          <FieldLabel htmlFor="capacity">Capacidade (GB)</FieldLabel>
          <Input
            id="capacity"
            type="number"
            value={formData.capacity || ''}
            onChange={(e) => updateField('capacity', e.target.value ? parseInt(e.target.value) : 0)}
            placeholder="Ex: 512"
          />
        </div>
      )}
    </SectionShell>
  );

  // Section: Vínculos
  const renderLinksSection = () => (
    <SectionShell icon={Link2} title="Vínculos">
      <div>
        <FieldLabel htmlFor="serialNumber">Número de Série</FieldLabel>
        <Input
          id="serialNumber"
          value={formData.serialNumber || ''}
          onChange={(e) => updateField('serialNumber', e.target.value)}
          placeholder="Ex: 123456789"
        />
      </div>

      <div>
        <FieldLabel htmlFor="patrimonyNumber">Número de Patrimônio</FieldLabel>
        <Input
          id="patrimonyNumber"
          value={formData.patrimonyNumber || ''}
          onChange={(e) => updateField('patrimonyNumber', e.target.value)}
          placeholder="Ex: PAT-001"
        />
      </div>

      <div>
        <FieldLabel htmlFor="description">Descrição</FieldLabel>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Informações adicionais..."
          style={{ minHeight: 80 }}
        />
      </div>
    </SectionShell>
  );

  // Section: Financeiro
  const renderFinancialSection = () => (
    <SectionShell icon={DollarSign} title="Financeiro">
      <div>
        <FieldLabel htmlFor="value">Valor de Compra</FieldLabel>
        <Input
          id="value"
          value={isEditingValue ? editingValue : formData.value ? formatCurrency(formData.value) : ''}
          onChange={handleValueChange}
          onFocus={handleValueFocus}
          onBlur={handleValueBlur}
          placeholder="R$ 0,00"
          inputMode="decimal"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        />
      </div>

      <div>
        <FieldLabel htmlFor="depreciatedValue">Valor Depreciado</FieldLabel>
        <Input
          id="depreciatedValue"
          value={
            isEditingDepreciatedValue
              ? editingDepreciatedValue
              : formData.depreciatedValue
              ? formatCurrency(formData.depreciatedValue)
              : ''
          }
          onChange={handleDepreciatedValueChange}
          onFocus={handleDepreciatedValueFocus}
          onBlur={handleDepreciatedValueBlur}
          placeholder="R$ 0,00"
          inputMode="decimal"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        />
      </div>

      <div>
        <FieldLabel htmlFor="store">Loja</FieldLabel>
        <Input
          id="store"
          value={formData.store || ''}
          onChange={(e) => updateField('store', e.target.value)}
          placeholder="Ex: B&H Photo"
        />
      </div>

      <div>
        <FieldLabel htmlFor="invoice">Link da Nota Fiscal (Drive)</FieldLabel>
        <Input
          id="invoice"
          value={formData.invoice || ''}
          onChange={(e) => updateField('invoice', e.target.value)}
          placeholder="Ex: https://drive.google.com/..."
        />
      </div>
    </SectionShell>
  );

  // Section: Datas (full-width grid)
  const renderDatesSection = () => (
    <SectionShell icon={Calendar} title="Datas">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 14,
        }}
      >
        {/* Data de Compra */}
        <div>
          <FieldLabel htmlFor="purchaseDate">Data de Compra</FieldLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              id="purchaseDate"
              value={formatDateForDisplay(formData.purchaseDate || '')}
              onChange={(e) => handleDateInput(e.target.value, 'purchaseDate')}
              onBlur={(e) => validateAndFormatDate(e.target.value, 'purchaseDate')}
              placeholder="dd/mm/aaaa"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
            <Popover open={showPurchaseDateCalendar} onOpenChange={setShowPurchaseDateCalendar}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="btn"
                  style={{ width: 36, height: 36, padding: 0, justifyContent: 'center' }}
                  aria-label="Abrir calendário de data de compra"
                >
                  <CalendarIcon size={13} strokeWidth={1.5} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={formData.purchaseDate ? new Date(formData.purchaseDate) : undefined}
                  onSelect={handlePurchaseDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Data de Recebimento */}
        <div>
          <FieldLabel htmlFor="receiveDate">Data de Recebimento</FieldLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              id="receiveDate"
              value={formatDateForDisplay(formData.receiveDate || '')}
              onChange={(e) => handleDateInput(e.target.value, 'receiveDate')}
              onBlur={(e) => validateAndFormatDate(e.target.value, 'receiveDate')}
              placeholder="dd/mm/aaaa"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
            <Popover open={showReceiveDateCalendar} onOpenChange={setShowReceiveDateCalendar}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="btn"
                  style={{ width: 36, height: 36, padding: 0, justifyContent: 'center' }}
                  aria-label="Abrir calendário de data de recebimento"
                >
                  <CalendarIcon size={13} strokeWidth={1.5} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={formData.receiveDate ? new Date(formData.receiveDate) : undefined}
                  onSelect={handleReceiveDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Última Manutenção */}
        <div>
          <FieldLabel htmlFor="lastMaintenance">Última Manutenção</FieldLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              id="lastMaintenance"
              value={formatDateForDisplay(formData.lastMaintenance || '')}
              onChange={(e) => handleDateInput(e.target.value, 'lastMaintenance')}
              onBlur={(e) => validateAndFormatDate(e.target.value, 'lastMaintenance')}
              placeholder="dd/mm/aaaa"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            />
            <Popover open={showMaintenanceDateCalendar} onOpenChange={setShowMaintenanceDateCalendar}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="btn"
                  style={{ width: 36, height: 36, padding: 0, justifyContent: 'center' }}
                  aria-label="Abrir calendário de última manutenção"
                >
                  <CalendarIcon size={13} strokeWidth={1.5} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={formData.lastMaintenance ? new Date(formData.lastMaintenance) : undefined}
                  onSelect={handleMaintenanceDateSelect}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </SectionShell>
  );

  return (
    <MobileFriendlyForm onSubmit={onSubmit} className="space-y-6">
      {/* Hero Section: Foto + Campos Principais */}
      {renderHeroSection()}

      {/* Sections em Coluna Única */}
      {renderStatusSection()}
      {renderLinksSection()}
      {renderFinancialSection()}
      {renderDatesSection()}

      {/* Dialog para criar nova subcategoria */}
      <Dialog open={showNewSubcategoryDialog} onOpenChange={setShowNewSubcategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>
              Criar Nova Subcategoria
            </DialogTitle>
            <DialogDescription>
              Adicione uma nova subcategoria personalizada para{' '}
              {formData.category ? getCategoryLabel(formData.category) : 'a categoria selecionada'}.
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '14px 0' }}>
            {/* Categoria selecionada (read-only) */}
            <div>
              <FieldLabel>Categoria</FieldLabel>
              <div>
                {formData.category && (
                  <StatusPill
                    label={getCategoryLabel(formData.category)}
                    tone="muted"
                    icon={getCategoryIcon(formData.category)}
                  />
                )}
              </div>
            </div>

            {/* Input para nome da subcategoria */}
            <div>
              <FieldLabel htmlFor="new-subcategory" required>
                Nome da Subcategoria
              </FieldLabel>
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
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowNewSubcategoryDialog(false);
                setNewSubcategoryName('');
              }}
              disabled={isCreatingSubcategory}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleCreateSubcategory}
              disabled={!newSubcategoryName.trim() || isCreatingSubcategory}
            >
              {isCreatingSubcategory ? (
                <>
                  <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <Plus size={13} strokeWidth={1.5} />
                  <span>Criar</span>
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para criar nova categoria */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>Nova Categoria</DialogTitle>
            <DialogDescription>Crie uma nova categoria para o equipamento.</DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <FieldLabel htmlFor="new-category" required>
                Nome da Categoria
              </FieldLabel>
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
            <button
              type="button"
              className="btn"
              onClick={() => setShowNewCategoryDialog(false)}
              disabled={isCreatingCategory}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleCreateCategory}
              disabled={isCreatingCategory || !newCategoryName.trim()}
            >
              {isCreatingCategory ? (
                <>
                  <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <span>Criar</span>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Actions */}
      <MobileFriendlyFormActions>
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn primary" disabled={isSubmitting}>
          {isSubmitting && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />}
          <span>
            {isSubmitting ? 'Salvando...' : isEditMode ? 'Atualizar Equipamento' : 'Adicionar Equipamento'}
          </span>
        </button>
      </MobileFriendlyFormActions>
    </MobileFriendlyForm>
  );
};
