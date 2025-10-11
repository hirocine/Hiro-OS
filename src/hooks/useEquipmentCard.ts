import { useCallback, useState } from 'react';
import { Equipment } from '@/types/equipment';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils';

export function useEquipmentCard() {
  const [uploadingStates, setUploadingStates] = useState<Record<string, boolean>>({});

  const getStatusVariant = useCallback((status: Equipment['status']) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'maintenance':
        return 'warning';
      default:
        return 'secondary';
    }
  }, []);

  const getStatusLabel = useCallback((status: Equipment['status']) => {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'maintenance':
        return 'Manutenção';
      default:
        return status;
    }
  }, []);

  const formatCurrency = useCallback((value?: number) => {
    if (!value) return '-';
    return formatCurrencyUtil(value);
  }, []);

  const handleImageUpload = useCallback(async (
    equipment: Equipment,
    file: File,
    onImageUpload: (equipment: Equipment, file: File) => Promise<void> | void
  ) => {
    setUploadingStates(prev => ({ ...prev, [equipment.id]: true }));
    try {
      await onImageUpload(equipment, file);
    } finally {
      setUploadingStates(prev => ({ ...prev, [equipment.id]: false }));
    }
  }, []);

  const triggerFileInput = useCallback((equipmentId: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    return fileInput;
  }, []);

  const isUploading = useCallback((equipmentId: string) => {
    return uploadingStates[equipmentId] || false;
  }, [uploadingStates]);

  const getHierarchyIndicator = useCallback((equipment: Equipment, accessoryCount?: number) => {
    if (!equipment) {
      return {
        type: 'standalone' as const,
        label: 'Item principal',
        variant: 'outline' as const,
        icon: 'package'
      };
    }

    if (equipment.itemType === 'accessory') {
      return {
        type: 'accessory' as const,
        label: 'Acessório',
        variant: 'outline' as const,
        icon: 'link'
      };
    }
    
    if (equipment.itemType === 'main' && accessoryCount && accessoryCount > 0) {
      return {
        type: 'parent' as const,
        label: `${accessoryCount} acessório${accessoryCount !== 1 ? 's' : ''}`,
        variant: 'secondary' as const,
        icon: 'package'
      };
    }

    return {
      type: 'standalone' as const,
      label: 'Item principal',
      variant: 'outline' as const,
      icon: 'package'
    };
  }, []);

  return {
    getStatusVariant,
    getStatusLabel,
    formatCurrency,
    handleImageUpload,
    triggerFileInput,
    isUploading,
    getHierarchyIndicator,
  };
}