import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface SecureUploadOptions {
  bucket: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  sanitizeFilename?: boolean;
}

const DEFAULT_OPTIONS: SecureUploadOptions = {
  bucket: 'avatars',
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  sanitizeFilename: true,
};

export function useSecureUpload(options: Partial<SecureUploadOptions> = {}) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  const config = { ...DEFAULT_OPTIONS, ...options };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > config.maxSize!) {
      return `Arquivo muito grande. Tamanho máximo: ${(config.maxSize! / 1024 / 1024).toFixed(1)}MB`;
    }

    // Check file type
    if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${config.allowedTypes.join(', ')}`;
    }

    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    const fileName = file.name.toLowerCase();
    
    for (const ext of suspiciousExtensions) {
      if (fileName.endsWith(ext)) {
        return 'Tipo de arquivo não permitido por questões de segurança';
      }
    }

    return null;
  };

  const sanitizeFilename = (filename: string): string => {
    if (!config.sanitizeFilename) return filename;

    // Remove or replace dangerous characters
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/^\.+/, '') // Remove leading dots
      .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
      .substring(0, 100); // Limit length
  };

  const uploadFile = async (
    file: File,
    path?: string,
    onProgress?: (progress: number) => void
  ): Promise<{ url?: string; error?: string }> => {
    setUploading(true);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: 'Erro de validação',
          description: validationError,
          variant: 'destructive',
        });
        return { error: validationError };
      }

      // Generate secure filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const sanitizedOriginalName = sanitizeFilename(
        file.name.split('.').slice(0, -1).join('.')
      );
      
      const filename = path || `${timestamp}_${randomString}_${sanitizedOriginalName}.${fileExtension}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false // Prevent overwriting
        });

      if (error) {
        logger.error('File upload failed', {
          module: 'secure-upload',
          action: 'upload_file',
          data: { filename, bucket: config.bucket },
          error
        });
        toast({
          title: 'Erro no upload',
          description: 'Falha ao fazer upload do arquivo',
          variant: 'destructive',
        });
        return { error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(config.bucket)
        .getPublicUrl(data.path);

      toast({
        title: 'Upload concluído',
        description: 'Arquivo enviado com sucesso',
      });

      return { url: urlData.publicUrl };

    } catch (error) {
      logger.error('Unexpected upload error', {
        module: 'secure-upload',
        action: 'upload_file',
        error: error instanceof Error ? error : String(error)
      });
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro durante o upload',
        variant: 'destructive',
      });
      return { error: 'Erro inesperado durante o upload' };
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (path: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.storage
        .from(config.bucket)
        .remove([path]);

      if (error) {
        logger.error('File deletion failed', {
          module: 'secure-upload',
          action: 'delete_file',
          data: { path, bucket: config.bucket },
          error
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Unexpected delete error', {
        module: 'secure-upload',
        action: 'delete_file',
        data: { path },
        error: error instanceof Error ? error : String(error)
      });
      return { success: false, error: 'Erro inesperado ao deletar arquivo' };
    }
  };

  return {
    uploading,
    uploadFile,
    deleteFile,
    validateFile,
  };
}