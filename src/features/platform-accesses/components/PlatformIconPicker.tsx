import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface PlatformIconPickerProps {
  selectedIconUrl?: string;
  onSelectIcon: (iconUrl: string) => void;
}

export function PlatformIconPicker({ selectedIconUrl, onSelectIcon }: PlatformIconPickerProps) {
  const [uploading, setUploading] = useState(false);

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
          
          const size = 256; // Tamanho final (quadrado)
          canvas.width = size;
          canvas.height = size;
          
          // Calcular dimensões para cover (preencher todo o canvas mantendo proporção)
          const imgRatio = img.width / img.height;
          
          let drawWidth = size;
          let drawHeight = size;
          let offsetX = 0;
          let offsetY = 0;
          
          if (imgRatio > 1) {
            // Imagem mais larga (paisagem)
            drawHeight = size;
            drawWidth = size * imgRatio;
            offsetX = -(drawWidth - size) / 2; // Centralizar horizontalmente
          } else if (imgRatio < 1) {
            // Imagem mais alta (retrato)
            drawWidth = size;
            drawHeight = size / imgRatio;
            offsetY = -(drawHeight - size) / 2; // Centralizar verticalmente
          }
          
          // Desenhar imagem centralizada e cortada
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB');
      return;
    }

    try {
      setUploading(true);

      // Comprimir imagem antes do upload
      const compressedBlob = await compressImage(file);

      // Upload to Supabase Storage
      const fileName = `${Math.random()}.webp`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('platform-icons')
        .upload(filePath, compressedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/webp'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('platform-icons')
        .getPublicUrl(filePath);

      onSelectIcon(data.publicUrl);
      toast.success('Ícone carregado e otimizado com sucesso!');
    } catch (error) {
      logger.error('Error uploading platform icon', {
        module: 'platform-accesses',
        action: 'upload_icon',
        error
      });
      toast.error('Erro ao carregar ícone');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Custom Upload */}
      <div>
        <Label className="text-sm text-[hsl(var(--ds-fg-3))] mb-2 block">Carregar Ícone da Plataforma</Label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn"
            style={{ width: '100%' }}
            disabled={uploading}
            onClick={() => document.getElementById('icon-upload')?.click()}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Enviando...' : 'Carregar Ícone'}
          </button>
          <input
            id="icon-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
        <p className="text-xs text-[hsl(var(--ds-fg-3))] mt-2">
          Máximo 2MB. A imagem será otimizada para 256x256px em WebP.
        </p>
      </div>

      {/* Preview */}
      {selectedIconUrl && (
        <div>
          <Label className="text-sm text-[hsl(var(--ds-fg-3))] mb-2 block">Preview</Label>
          <div className="flex justify-center">
            <div
              style={{
                width: 80,
                height: 80,
                overflow: 'hidden',
                border: '1px solid hsl(var(--ds-accent) / 0.25)',
                background: 'hsl(var(--ds-surface))',
              }}
            >
              <img
                src={selectedIconUrl}
                alt="Selected icon"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
