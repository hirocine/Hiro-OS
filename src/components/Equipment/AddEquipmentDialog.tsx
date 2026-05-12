import { useState, useEffect } from 'react';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import {
  MobileFriendlyForm,
  MobileFriendlyFormSection,
  MobileFriendlyFormGrid,
  MobileFriendlyFormField,
  MobileFriendlyFormActions,
} from '@/components/ui/mobile-friendly-form';
import { MobileStepperForm } from '@/components/ui/mobile-stepper-form';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { statusLabels } from '@/data/mockData';
import { useCategories } from '@/hooks/useCategories';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { formatMoney } from '@/ds/lib/money';

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (equipment: Omit<Equipment, 'id'>) => Promise<{ success: boolean } | undefined>;
  equipment?: Equipment;
  mainItems?: Equipment[];
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

const HelperText = ({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'success' }) => (
  <p
    style={{
      fontSize: 12,
      marginTop: 4,
      color: tone === 'success' ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-fg-3))',
    }}
  >
    {children}
  </p>
);

export function AddEquipmentDialog({ open, onOpenChange, onSubmit, equipment, mainItems = [] }: AddEquipmentDialogProps) {
  const { categories: dbCategories } = useCategories();
  const [formData, setFormData] = useState<Omit<Equipment, 'id'>>({
    name: '',
    brand: '',
    category: 'camera',
    subcategory: '',
    customCategory: '',
    status: 'available',
    itemType: 'main' as EquipmentItemType,
    parentId: '',
    serialNumber: '',
    purchaseDate: '',
    lastMaintenance: '',
    description: '',
    value: 0,
    patrimonyNumber: '',
    depreciatedValue: 0,
    receiveDate: '',
    store: '',
    invoice: '',
    capacity: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parentSearchOpen, setParentSearchOpen] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const { getSubcategoriesForCategory, addCustomCategory } = useCategories();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
    } else {
      setFormData({
        name: '',
        brand: '',
        category: 'camera',
        subcategory: '',
        customCategory: '',
        status: 'available',
        itemType: 'main' as EquipmentItemType,
        parentId: '',
        serialNumber: '',
        purchaseDate: '',
        lastMaintenance: '',
        description: '',
        value: 0,
        patrimonyNumber: '',
        depreciatedValue: 0,
        receiveDate: '',
        store: '',
        invoice: '',
        capacity: undefined,
      });
    }
  }, [equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.brand.trim()) {
      enhancedToast.error({
        title: 'Campos obrigatórios',
        description: 'Nome e marca são obrigatórios.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedData = {
        ...formData,
        parentId: formData.parentId && formData.parentId !== 'none' ? formData.parentId : undefined,
        subcategory: formData.subcategory?.trim() || undefined,
        capacity: formData.capacity && formData.capacity > 0 ? formData.capacity : undefined,
        value: formData.value && formData.value > 0 ? formData.value : undefined,
        depreciatedValue:
          formData.depreciatedValue && formData.depreciatedValue > 0 ? formData.depreciatedValue : undefined,
      };

      const result = await onSubmit(sanitizedData);

      if (result?.success) {
        enhancedToast.success({
          title: equipment ? 'Equipamento atualizado' : 'Equipamento adicionado',
          description: equipment
            ? 'As informações do equipamento foram atualizadas com sucesso.'
            : 'O novo equipamento foi adicionado ao inventário.',
        });
        onOpenChange(false);

        if (!equipment) {
          setFormData({
            name: '',
            brand: '',
            category: 'camera',
            subcategory: '',
            customCategory: '',
            status: 'available',
            itemType: 'main' as EquipmentItemType,
            parentId: '',
            serialNumber: '',
            purchaseDate: '',
            lastMaintenance: '',
            description: '',
            value: 0,
            patrimonyNumber: '',
            depreciatedValue: 0,
            receiveDate: '',
            store: '',
            invoice: '',
            capacity: undefined,
          });
        }
      }
    } catch (error) {
      logger.error('Error submitting equipment', {
        module: 'equipment',
        action: 'submit_equipment',
        error,
        data: { equipmentName: formData.name, isEdit: !!equipment },
      });
      enhancedToast.error({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o equipamento. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return Number.isNaN(num) ? '' : formatMoney(num);
  };

  const parseCurrencyInput = (value: string): number => {
    if (!value) return 0;
    const numStr = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
  };

  const getSelectedParentName = () => {
    if (!formData.parentId || formData.parentId === 'none') return 'Selecione um item principal';
    const selectedItem = mainItems.find((item) => item.id === formData.parentId);
    return selectedItem ? `${selectedItem.patrimonyNumber || 'S/N'} - ${selectedItem.name}` : 'Item não encontrado';
  };

  // ---------- Sections ----------
  const renderBasicInfo = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <FieldLabel htmlFor="name" required>
          Nome
        </FieldLabel>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Ex: Canon EOS R5, Microfone Shure..."
          required
        />
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <FieldLabel htmlFor="brand" required>
          Marca
        </FieldLabel>
        <Input
          id="brand"
          value={formData.brand}
          onChange={(e) => updateField('brand', e.target.value)}
          placeholder="Ex: Canon, Sony, Shure..."
          required
        />
      </MobileFriendlyFormField>

      <MobileFriendlyFormField span={2}>
        <FieldLabel htmlFor="description">Descrição</FieldLabel>
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
        <FieldLabel htmlFor="category" required>
          Categoria
        </FieldLabel>
        <Select
          value={formData.category}
          onValueChange={(value) => updateField('category', value as EquipmentCategory)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from(new Set(dbCategories.filter((c) => !c.subcategory).map((c) => c.category))).map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <FieldLabel htmlFor="subcategory">Subcategoria</FieldLabel>
        <Select
          value={formData.subcategory || ''}
          onValueChange={(value) => updateField('subcategory', value === 'none' ? '' : value)}
        >
          <SelectTrigger>
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
        <FieldLabel htmlFor="status" required>
          Status
        </FieldLabel>
        <Select value={formData.status} onValueChange={(value) => updateField('status', value as EquipmentStatus)}>
          <SelectTrigger>
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
        <FieldLabel htmlFor="itemType" required>
          Tipo de Item
        </FieldLabel>
        <Select
          value={formData.itemType}
          onValueChange={(value: EquipmentItemType) => {
            updateField('itemType', value);
            if (value === 'main') updateField('parentId', '');
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="main">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(var(--ds-accent))' }} />
                <span style={{ fontWeight: 500 }}>Item Principal</span>
              </div>
            </SelectItem>
            <SelectItem value="accessory">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(var(--ds-fg-4))' }} />
                <span style={{ fontWeight: 500 }}>Acessório</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {formData.itemType === 'main' && <HelperText>Este item pode ter acessórios associados a ele</HelperText>}
        {formData.itemType === 'accessory' && <HelperText>Este item será vinculado a um item principal</HelperText>}
      </MobileFriendlyFormField>

      {/* Associação de Item Principal (apenas para acessórios) */}
      {formData.itemType === 'accessory' && (
        <MobileFriendlyFormField span={2}>
          <FieldLabel htmlFor="parentId">Item Principal</FieldLabel>
          {mainItems.length === 0 ? (
            <div
              style={{
                padding: 14,
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-line-2) / 0.3)',
                textAlign: 'center',
                fontSize: 13,
                color: 'hsl(var(--ds-fg-3))',
              }}
            >
              Nenhum item principal disponível. Crie primeiro um item principal para poder associar acessórios.
            </div>
          ) : (
            <Popover open={parentSearchOpen} onOpenChange={setParentSearchOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="btn"
                  role="combobox"
                  aria-expanded={parentSearchOpen}
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getSelectedParentName()}
                  </span>
                  <ChevronsUpDown size={13} strokeWidth={1.5} style={{ opacity: 0.5, flexShrink: 0 }} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Pesquisar item principal..." className="h-9" />
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: 'hsl(var(--ds-fg-4) / 0.5)',
                            }}
                          />
                          <span style={{ color: 'hsl(var(--ds-fg-3))' }}>Nenhum (acessório independente)</span>
                        </div>
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4',
                            !formData.parentId || formData.parentId === 'none' ? 'opacity-100' : 'opacity-0',
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                            <span
                              style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(var(--ds-accent))' }}
                            />
                            <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                              {item.patrimonyNumber || 'S/N'}
                            </span>
                            <span style={{ color: 'hsl(var(--ds-fg-3))' }}>—</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.name}
                            </span>
                            <span style={{ color: 'hsl(var(--ds-fg-3))', fontSize: 12 }}>({item.brand})</span>
                          </div>
                          <Check
                            className={cn(
                              'ml-auto h-4 w-4',
                              formData.parentId === item.id ? 'opacity-100' : 'opacity-0',
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
            <HelperText tone="success">✓ Este acessório será vinculado ao item selecionado</HelperText>
          )}
        </MobileFriendlyFormField>
      )}

      {/* Nova Categoria/Subcategoria */}
      <MobileFriendlyFormField span={2}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <FieldLabel>Adicionar Nova Categoria/Subcategoria</FieldLabel>
          <button
            type="button"
            className="btn"
            style={{ fontSize: 12 }}
            onClick={() => setShowCustomCategory(!showCustomCategory)}
          >
            <Plus size={12} strokeWidth={1.5} />
            <span>{showCustomCategory ? 'Cancelar' : 'Nova Categoria'}</span>
          </button>
        </div>

        {showCustomCategory && (
          <div
            style={{
              padding: 14,
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-line-2) / 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 6,
            }}
          >
            <MobileFriendlyFormGrid>
              <MobileFriendlyFormField>
                <FieldLabel htmlFor="newCategory">Categoria</FieldLabel>
                <Input
                  id="newCategory"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: storage, camera..."
                />
              </MobileFriendlyFormField>
              <MobileFriendlyFormField>
                <FieldLabel htmlFor="newSubcategory">Subcategoria</FieldLabel>
                <Input
                  id="newSubcategory"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                  placeholder="Ex: SSD/HD, Filtro..."
                />
              </MobileFriendlyFormField>
            </MobileFriendlyFormGrid>
            <button
              type="button"
              className="btn primary"
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
                      description: 'Nova categoria/subcategoria criada com sucesso!',
                    });
                  } catch (error) {
                    enhancedToast.error({
                      title: 'Erro',
                      description: 'Erro ao criar nova categoria. Tente novamente.',
                    });
                  }
                }
              }}
              disabled={!newCategoryName || !newSubcategoryName}
              style={{ alignSelf: 'flex-start' }}
            >
              Adicionar e Usar
            </button>
          </div>
        )}
      </MobileFriendlyFormField>
    </MobileFriendlyFormGrid>
  );

  const renderIdentification = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <FieldLabel htmlFor="serialNumber">Número de Série</FieldLabel>
        <Input
          id="serialNumber"
          value={formData.serialNumber}
          onChange={(e) => updateField('serialNumber', e.target.value)}
          placeholder="Número de série do fabricante"
        />
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <FieldLabel htmlFor="patrimonyNumber">Número do Patrimônio</FieldLabel>
        <Input
          id="patrimonyNumber"
          value={formData.patrimonyNumber}
          onChange={(e) => updateField('patrimonyNumber', e.target.value)}
          placeholder="Código interno de patrimônio"
        />
      </MobileFriendlyFormField>

      {formData.category === 'Armazenamento' && (
        <MobileFriendlyFormField>
          <FieldLabel htmlFor="capacity">Capacidade (GB)</FieldLabel>
          <Input
            id="capacity"
            type="number"
            step="1"
            min="0"
            value={formData.capacity || ''}
            onChange={(e) => updateField('capacity', parseFloat(e.target.value) || 0)}
            placeholder="Ex: 256, 500, 1000..."
          />
        </MobileFriendlyFormField>
      )}
    </MobileFriendlyFormGrid>
  );

  const renderFinancialInfo = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <FieldLabel htmlFor="value">Valor de Compra</FieldLabel>
        <Input
          id="value"
          value={formData.value > 0 ? formatCurrency(formData.value) : ''}
          onChange={(e) => updateField('value', parseCurrencyInput(e.target.value))}
          placeholder="R$ 0,00"
        />
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <FieldLabel htmlFor="depreciatedValue">Valor Depreciado</FieldLabel>
        <Input
          id="depreciatedValue"
          value={formData.depreciatedValue > 0 ? formatCurrency(formData.depreciatedValue) : ''}
          onChange={(e) => updateField('depreciatedValue', parseCurrencyInput(e.target.value))}
          placeholder="R$ 0,00"
        />
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <FieldLabel htmlFor="store">Loja/Fornecedor</FieldLabel>
        <Input
          id="store"
          value={formData.store}
          onChange={(e) => updateField('store', e.target.value)}
          placeholder="Nome da loja ou fornecedor"
        />
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <FieldLabel htmlFor="invoice">Nota Fiscal</FieldLabel>
        <Input
          id="invoice"
          value={formData.invoice}
          onChange={(e) => updateField('invoice', e.target.value)}
          placeholder="Número da nota fiscal"
        />
      </MobileFriendlyFormField>
    </MobileFriendlyFormGrid>
  );

  const renderDates = () => (
    <MobileFriendlyFormGrid>
      <MobileFriendlyFormField>
        <FieldLabel htmlFor="purchaseDate">Data de Compra</FieldLabel>
        <Input
          id="purchaseDate"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => updateField('purchaseDate', e.target.value)}
        />
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <FieldLabel htmlFor="receiveDate">Data de Recebimento</FieldLabel>
        <Input
          id="receiveDate"
          type="date"
          value={formData.receiveDate}
          onChange={(e) => updateField('receiveDate', e.target.value)}
        />
      </MobileFriendlyFormField>

      <MobileFriendlyFormField>
        <FieldLabel htmlFor="lastMaintenance">Última Manutenção</FieldLabel>
        <Input
          id="lastMaintenance"
          type="date"
          value={formData.lastMaintenance}
          onChange={(e) => updateField('lastMaintenance', e.target.value)}
        />
      </MobileFriendlyFormField>
    </MobileFriendlyFormGrid>
  );

  const steps = [
    { title: 'Informações Básicas', content: renderBasicInfo() },
    { title: 'Classificação', content: renderClassification() },
    { title: 'Identificação', content: renderIdentification() },
    { title: 'Informações Financeiras', content: renderFinancialInfo() },
    { title: 'Datas', content: renderDates() },
  ];

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="w-full max-w-4xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            <span style={{ fontFamily: '"HN Display", sans-serif' }}>
              {equipment ? 'Editar Equipamento' : 'Adicionar Novo Equipamento'}
            </span>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        {isMobile ? (
          <MobileStepperForm
            steps={steps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitText={equipment ? 'Atualizar' : 'Adicionar'}
          />
        ) : (
          <MobileFriendlyForm onSubmit={handleSubmit}>
            <MobileFriendlyFormSection title="Informações Básicas">{renderBasicInfo()}</MobileFriendlyFormSection>
            <MobileFriendlyFormSection title="Classificação">{renderClassification()}</MobileFriendlyFormSection>
            <MobileFriendlyFormSection title="Identificação">{renderIdentification()}</MobileFriendlyFormSection>
            <MobileFriendlyFormSection title="Informações Financeiras">{renderFinancialInfo()}</MobileFriendlyFormSection>
            <MobileFriendlyFormSection title="Datas">{renderDates()}</MobileFriendlyFormSection>

            <MobileFriendlyFormActions>
              <button
                type="button"
                className="btn"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button type="submit" className="btn primary" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />}
                <span>{equipment ? 'Atualizar' : 'Adicionar'}</span>
              </button>
            </MobileFriendlyFormActions>
          </MobileFriendlyForm>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
