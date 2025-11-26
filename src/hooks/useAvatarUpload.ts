import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface CroppedImageData {
  file: Blob;
  url: string;
}

interface AvatarUploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const useAvatarUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File): void => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Por favor, selecione apenas arquivos de imagem.');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('A imagem deve ter no máximo 10MB.');
    }
  };

  const compressImage = useCallback(
    (file: Blob, options: AvatarUploadOptions = {}): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          const { maxWidth = 512, maxHeight = 512, quality = 0.8 } = options;

          // Calculate new dimensions
          let { width, height } = img;
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              'image/webp',
              quality
            );
          } else {
            reject(new Error('Could not get canvas context'));
          }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
      });
    },
    []
  );

  const uploadAvatar = async (
    userId: string,
    croppedImageData: CroppedImageData,
    options?: AvatarUploadOptions
  ): Promise<string> => {
    try {
      setUploading(true);
      logger.debug('Avatar: Starting optimized upload process', { module: 'profile' });

      // Compress the image
      const compressedFile = await compressImage(croppedImageData.file, options);
      
      const fileExt = 'webp';
      const filePath = `${userId}/avatar.${fileExt}`;
      logger.debug('Avatar: Upload path', { 
        module: 'profile',
        data: { filePath }
      });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { 
          upsert: true,
          contentType: 'image/webp'
        });

      if (uploadError) {
        logger.error('Avatar: Upload error', { 
          module: 'profile',
          error: uploadError 
        });
        throw uploadError;
      }

      logger.debug('Avatar: Upload successful, getting public URL', { module: 'profile' });

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      logger.debug('Avatar: Public URL obtained', { 
        module: 'profile',
        data: { publicUrl: data.publicUrl }
      });

      // Update profile with avatar URL
      const updateData = {
        user_id: userId,
        avatar_url: data.publicUrl
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (updateError) {
        logger.error('Avatar: Profile update error', { 
          module: 'profile',
          error: updateError 
        });
        throw updateError;
      }

      logger.debug('Avatar: Profile updated successfully', { module: 'profile' });
      setImageUrl(data.publicUrl);

      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

      return data.publicUrl;
    } catch (error: unknown) {
      logger.error('Avatar: Error in upload process', { 
        module: 'profile',
        error: error as Error
      });
      toast({
        title: "Erro ao fazer upload",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o avatar.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async (userId: string): Promise<void> => {
    try {
      setUploading(true);
      
      // Update profile to remove avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (error) throw error;

      setImageUrl(null);
      toast({
        title: "Avatar removido",
        description: "Sua foto de perfil foi removida com sucesso.",
      });
    } catch (error: unknown) {
      toast({
        title: "Erro ao remover avatar",
        description: error instanceof Error ? error.message : "Não foi possível remover o avatar.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    imageUrl,
    validateFile,
    uploadAvatar,
    removeAvatar,
    setImageUrl
  };
};