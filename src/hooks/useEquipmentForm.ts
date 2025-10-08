import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { useEquipment } from '@/hooks/useEquipment';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { logger } from '@/lib/logger';

interface UseEquipmentFormProps {
  equipmentId?: string;
}

export function useEquipmentForm({ equipmentId }: UseEquipmentFormProps = {}) {
  const navigate = useNavigate();
  const { allEquipment, addEquipment, updateEquipment } = useEquipment();
  
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
  const [isLoading, setIsLoading] = useState(false);
  const [parentSearchOpen, setParentSearchOpen] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Carregar dados do equipamento se for edição
  useEffect(() => {
    if (equipmentId && allEquipment.length > 0) {
      setIsLoading(true);
      const equipment = allEquipment.find(e => e.id === equipmentId);
      
      if (equipment) {
        setFormData(equipment);
      } else {
        enhancedToast.error({
          title: 'Equipamento não encontrado',
          description: 'O equipamento solicitado não foi encontrado.'
        });
        navigate('/equipment');
      }
      setIsLoading(false);
    }
  }, [equipmentId, allEquipment, navigate]);

  const updateField = useCallback((field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name.trim() || !formData.brand.trim()) {
      enhancedToast.error({
        title: 'Campos obrigatórios',
        description: 'Nome e marca são obrigatórios.'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Sanitize data
      const sanitizedData = {
        ...formData,
        parentId: formData.parentId && formData.parentId !== 'none' ? formData.parentId : undefined,
        subcategory: formData.subcategory?.trim() || undefined,
        capacity: formData.capacity && formData.capacity > 0 ? formData.capacity : undefined,
        value: formData.value && formData.value > 0 ? formData.value : undefined,
        depreciatedValue: formData.depreciatedValue && formData.depreciatedValue > 0 ? formData.depreciatedValue : undefined
      };
      
      if (equipmentId) {
        // Atualizar
        await updateEquipment(equipmentId, sanitizedData);
        enhancedToast.success({
          title: 'Equipamento atualizado',
          description: 'As informações do equipamento foram atualizadas com sucesso.'
        });
      } else {
        // Adicionar
        await addEquipment(sanitizedData);
        enhancedToast.success({
          title: 'Equipamento adicionado',
          description: 'O novo equipamento foi adicionado ao inventário.'
        });
      }
      
      navigate('/equipment');
    } catch (error) {
      logger.error('Error submitting equipment', {
        module: 'equipment-form',
        action: 'submit_equipment',
        error,
        data: { equipmentName: formData.name, isEdit: !!equipmentId }
      });
      enhancedToast.error({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar o equipamento. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = useCallback(() => {
    navigate('/equipment');
  }, [navigate]);

  const formatCurrency = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const parseCurrencyInput = (value: string): number => {
    if (!value) return 0;
    const numStr = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const num = parseFloat(numStr);
    return isNaN(num) ? 0 : num;
  };

  const getMainItems = useCallback(() => {
    return allEquipment.filter(e => e.itemType === 'main');
  }, [allEquipment]);

  const getSelectedParentName = useCallback(() => {
    if (!formData.parentId || formData.parentId === 'none') return 'Selecione um item principal';
    const selectedItem = allEquipment.find(item => item.id === formData.parentId);
    return selectedItem ? `${selectedItem.patrimonyNumber || 'S/N'} - ${selectedItem.name}` : 'Item não encontrado';
  }, [formData.parentId, allEquipment]);

  return {
    formData,
    isSubmitting,
    isLoading,
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
    updateField,
    handleSubmit,
    handleCancel,
    formatCurrency,
    parseCurrencyInput,
    getMainItems,
    getSelectedParentName,
    isEditMode: !!equipmentId
  };
}
