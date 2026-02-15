import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Equipment, EquipmentCategory, EquipmentStatus, EquipmentItemType } from '@/types/equipment';
import { useEquipment } from '@/features/equipment';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { generateEquipmentImageName } from '@/lib/imageNaming';
import { compressImage } from '@/lib/imageUtils';

interface UseEquipmentFormProps {
  equipmentId?: string;
}

export function useEquipmentForm({ equipmentId }: UseEquipmentFormProps = {}) {
  const navigate = useNavigate();
  const { allEquipment, addEquipment, updateEquipment } = useEquipment();
  
  const [formData, setFormData] = useState<Omit<Equipment, 'id'>>({
    name: '',
    brand: '',
    category: '',
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
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Carregar dados do equipamento se for edição
  useEffect(() => {
    if (equipmentId && allEquipment.length > 0) {
      setIsLoading(true);
      const equipment = allEquipment.find(e => e.id === equipmentId);
      
      if (equipment) {
        // Carregar valores exatamente como estão no banco
        setFormData({
          name: equipment.name,
          brand: equipment.brand,
          category: equipment.category?.replace(/[\n\r\t]/g, '').trim() || '',
          subcategory: equipment.subcategory?.replace(/[\n\r\t]/g, '').trim() || '',
          customCategory: equipment.customCategory || '',
          status: equipment.status,
          itemType: equipment.itemType,
          parentId: equipment.parentId || '',
          serialNumber: equipment.serialNumber || '',
          purchaseDate: equipment.purchaseDate || '',
          lastMaintenance: equipment.lastMaintenance || '',
          description: equipment.description || '',
          image: equipment.image || '',
          value: equipment.value || 0,
          patrimonyNumber: equipment.patrimonyNumber || '',
          depreciatedValue: equipment.depreciatedValue || 0,
          receiveDate: equipment.receiveDate || '',
          store: equipment.store || '',
          invoice: equipment.invoice || '',
          capacity: equipment.capacity,
          currentBorrower: equipment.currentBorrower || '',
          lastLoanDate: equipment.lastLoanDate || '',
          expectedReturnDate: equipment.expectedReturnDate || '',
          currentLoanId: equipment.currentLoanId
        });
        setImageUrl(equipment.image);
      } else {
        enhancedToast.error({
          title: 'Equipamento não encontrado',
          description: 'O equipamento solicitado não foi encontrado.'
        });
        navigate('/inventario');
      }
      setIsLoading(false);
    }
  }, [equipmentId, allEquipment, navigate]);

  const updateField = useCallback((field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de campos obrigatórios
    if (!formData.name?.trim() || !formData.brand?.trim() || !formData.category) {
      enhancedToast.error({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha nome, marca e categoria.'
      });
      return;
    }

    // Validação de campos de empréstimo quando status é 'loaned'
    if (formData.status === 'loaned') {
      if (!formData.currentBorrower?.trim()) {
        enhancedToast.error({
          title: 'Erro de validação',
          description: 'Informe para quem o equipamento foi emprestado.'
        });
        return;
      }
      if (!formData.lastLoanDate) {
        enhancedToast.error({
          title: 'Erro de validação',
          description: 'Informe a data do empréstimo.'
        });
        return;
      }
      if (!formData.expectedReturnDate) {
        enhancedToast.error({
          title: 'Erro de validação',
          description: 'Informe a data esperada de devolução.'
        });
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Sanitize data - using null explicitly for empty fields
      const sanitizedData = {
        ...formData,
        category: formData.category.replace(/[\n\r\t]/g, '').trim(),
        subcategory: formData.subcategory ? formData.subcategory.replace(/[\n\r\t]/g, '').trim() : null,
        parentId: formData.parentId && formData.parentId !== 'none' ? formData.parentId : null,
        customCategory: formData.customCategory?.trim() || null,
        capacity: formData.capacity && formData.capacity > 0 ? formData.capacity : null,
        value: formData.value && formData.value > 0 ? formData.value : null,
        depreciatedValue: formData.depreciatedValue && formData.depreciatedValue > 0 ? formData.depreciatedValue : null,
        serialNumber: formData.serialNumber?.trim() || null,
        description: formData.description?.trim() || null,
        image: formData.image?.trim() || null,
        purchaseDate: formData.purchaseDate || null,
        lastMaintenance: formData.lastMaintenance || null,
        receiveDate: formData.receiveDate || null,
        store: formData.store?.trim() || null,
        invoice: formData.invoice?.trim() || null,
      };
      
      if (equipmentId) {
        // Atualizar equipamento existente
        const result = await updateEquipment(equipmentId, sanitizedData);
        
        if (!result.success) {
          enhancedToast.error({ 
            title: 'Erro ao atualizar equipamento', 
            description: result.error || 'Não foi possível salvar as alterações. Tente novamente.' 
          });
          setIsSubmitting(false);
          return;
        }
        
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
      
      navigate('/inventario');
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
    navigate('/inventario');
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
    if (!value || value.trim() === '') return 0;
    
    // Remove tudo exceto dígitos, vírgula e ponto
    let cleaned = value.replace(/[^\d,.-]/g, '');
    
    // Trata diferentes formatos:
    // "1.500,00" (BR) → 1500.00
    // "1500.00" (US) → 1500.00
    // "1500,00" (BR sem milhar) → 1500.00
    // "4" → 4.00
    // "4.5" → 4.50
    
    // Se tem vírgula E ponto, assume formato BR (ponto=milhar, vírgula=decimal)
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    // Se tem apenas vírgula, assume como decimal
    else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    // Se tem apenas ponto, verifica se é milhar ou decimal
    else if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      // Se tem mais de 3 dígitos após o ponto, é separador de milhar
      if (parts.length === 2 && parts[1].length > 2) {
        cleaned = cleaned.replace(/\./g, '');
      }
      // Senão, é decimal, deixa como está
    }
    
    const num = parseFloat(cleaned);
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

  // compressImage imported from @/lib/imageUtils

  const handleImageUpload = async (file: File) => {
    // Validar formato
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      enhancedToast.error({
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem JPG, PNG ou WEBP.'
      });
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      enhancedToast.error({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 10MB.'
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      // Comprimir imagem antes do upload
      const compressedBlob = await compressImage(file);
      
      // Gerar nome padronizado usando nomenclatura híbrida
      const fileName = equipmentId
        ? generateEquipmentImageName(equipmentId, formData.patrimonyNumber)
        : `temp-${Date.now()}.webp`; // Fallback para novos equipamentos sem ID ainda

      const { error: uploadError, data } = await supabase.storage
        .from('equipment-images')
        .upload(fileName, compressedBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true // Sobrescreve imagem existente com mesmo nome
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('equipment-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      updateField('image', publicUrl);
      
      enhancedToast.success({
        title: 'Imagem otimizada e carregada',
        description: 'A foto foi comprimida e adicionada com sucesso.'
      });
    } catch (error) {
      logger.error('Error uploading image', {
        module: 'equipment-form',
        action: 'upload_image',
        error
      });
      enhancedToast.error({
        title: 'Erro ao carregar imagem',
        description: 'Não foi possível fazer upload da imagem.'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageRemove = () => {
    setImageUrl(undefined);
    updateField('image', '');
  };

  return {
    formData,
    isSubmitting,
    isLoading,
    updateField,
    handleSubmit,
    handleCancel,
    formatCurrency,
    parseCurrencyInput,
    getMainItems,
    getSelectedParentName,
    imageUrl,
    isUploadingImage,
    handleImageUpload,
    handleImageRemove,
    isEditMode: !!equipmentId
  };
}
