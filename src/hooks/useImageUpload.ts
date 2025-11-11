import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { generateEquipmentImageName } from '@/lib/imageNaming';

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGES = 20;

const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Falha ao obter contexto do canvas'));
          return;
        }
        
        // Calcular dimensões mantendo proporção (max 1920x1920)
        const maxSize = 1920;
        let width = img.width;
        let height = img.height;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimir para WebP com qualidade 85%
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Falha na compressão'));
            }
          },
          'image/webp',
          0.85
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const useImageUpload = () => {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return 'Formato não suportado. Use JPEG, PNG ou WEBP.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'Arquivo muito grande. Máximo 10MB.';
    }
    
    return null;
  };

  const addImages = (files: File[]) => {
    const validFiles: ImageFile[] = [];
    
    files.forEach(file => {
      const error = validateFile(file);
      
      if (error) {
        enhancedToast.error({
          title: 'Arquivo rejeitado',
          description: `${file.name}: ${error}`
        });
        return;
      }
      
      if (images.length + validFiles.length >= MAX_IMAGES) {
        enhancedToast.warning({
          title: 'Limite atingido',
          description: `Máximo ${MAX_IMAGES} imagens por vez`
        });
        return;
      }
      
      const imageFile: ImageFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0
      };
      
      validFiles.push(imageFile);
    });
    
    setImages(prev => [...prev, ...validFiles]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return newImages;
    });
  };

  const uploadImage = async (
    imageFile: ImageFile, 
    bucket: string = 'equipment-images',
    equipmentId?: string,
    patrimonyNumber?: string
  ): Promise<UploadResult> => {
    try {
      setImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { ...img, status: 'uploading', progress: 0 }
          : img
      ));

      // Comprimir imagem antes do upload
      const compressedBlob = await compressImage(imageFile.file);
      
      // Gerar nome padronizado usando nomenclatura híbrida
      const fileName = equipmentId
        ? generateEquipmentImageName(equipmentId, patrimonyNumber)
        : `temp-${Date.now()}.webp`; // Fallback para uploads sem equipmentId

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true, // Sobrescreve imagem existente com mesmo nome
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { ...img, status: 'success', progress: 100 }
          : img
      ));

      return { success: true, url: publicUrl };
    } catch (error: unknown) {
      setImages(prev => prev.map(img => 
        img.id === imageFile.id 
          ? { ...img, status: 'error', error: error instanceof Error ? error.message : String(error) }
          : img
      ));

      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };

  const uploadAll = async (bucket: string = 'equipment-images'): Promise<UploadResult[]> => {
    setIsUploading(true);
    const results: UploadResult[] = [];
    
    const pendingImages = images.filter(img => img.status === 'pending');
    
    for (const image of pendingImages) {
      const result = await uploadImage(image, bucket);
      results.push(result);
    }
    
    setIsUploading(false);
    return results;
  };

  const clearImages = () => {
    images.forEach(image => {
      URL.revokeObjectURL(image.preview);
    });
    setImages([]);
  };

  const retryUpload = async (id: string, bucket: string = 'equipment-images') => {
    const image = images.find(img => img.id === id);
    if (image) {
      return await uploadImage(image, bucket);
    }
    return { success: false, error: 'Imagem não encontrada' };
  };

  return {
    images,
    isUploading,
    addImages,
    removeImage,
    reorderImages,
    uploadImage,
    uploadAll,
    clearImages,
    retryUpload,
    canAddMore: images.length < MAX_IMAGES
  };
};