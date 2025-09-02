import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { profileDebug } from '@/lib/debug';

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
      profileDebug('Avatar: Starting optimized upload process');

      // Compress the image
      const compressedFile = await compressImage(croppedImageData.file, options);
      
      const fileExt = 'webp';
      const filePath = `${userId}/avatar.${fileExt}`;
      profileDebug('Avatar: Upload path', filePath);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { 
          upsert: true,
          contentType: 'image/webp'
        });

      if (uploadError) {
        profileDebug('Avatar: Upload error', uploadError);
        throw uploadError;
      }

      profileDebug('Avatar: Upload successful, getting public URL');

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      profileDebug('Avatar: Public URL obtained', data.publicUrl);

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
        profileDebug('Avatar: Profile update error', updateError);
        throw updateError;
      }

      profileDebug('Avatar: Profile updated successfully');
      setImageUrl(data.publicUrl);

      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

      return data.publicUrl;
    } catch (error: any) {
      profileDebug('Avatar: Error in upload process', error);
      toast({
        title: "Erro ao fazer upload",
        description: error.message || "Não foi possível atualizar o avatar.",
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
    } catch (error: any) {
      toast({
        title: "Erro ao remover avatar",
        description: error.message || "Não foi possível remover o avatar.",
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