import { useState } from 'react';
import { Upload, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PLATFORM_ICONS } from '../types';
import { cn } from '@/lib/utils';

interface PlatformIconPickerProps {
  selectedIconUrl?: string;
  onSelectIcon: (iconUrl: string) => void;
}

export function PlatformIconPicker({ selectedIconUrl, onSelectIcon }: PlatformIconPickerProps) {
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const filteredIcons = Object.entries(PLATFORM_ICONS).filter(([name]) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

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

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('platform-icons')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('platform-icons')
        .getPublicUrl(filePath);

      onSelectIcon(data.publicUrl);
      toast.success('Ícone carregado com sucesso!');
    } catch (error) {
      console.error('Error uploading icon:', error);
      toast.error('Erro ao carregar ícone');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ícones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Pre-defined Icons Grid */}
      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">Ícones Predefinidos</Label>
        <ScrollArea className="h-[200px] border rounded-lg p-4">
          <div className="grid grid-cols-6 gap-2">
            {filteredIcons.map(([name, url]) => (
              <button
                key={name}
                onClick={() => onSelectIcon(url)}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all hover:border-primary hover:bg-muted/50",
                  selectedIconUrl === url
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-muted/20"
                )}
                title={name}
              >
                <img
                  src={url}
                  alt={name}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Custom Upload */}
      <div>
        <Label className="text-sm text-muted-foreground mb-2 block">Ou faça upload customizado</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="w-full"
            disabled={uploading}
            onClick={() => document.getElementById('icon-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Enviando...' : 'Carregar Ícone'}
          </Button>
          <input
            id="icon-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Máximo 2MB. Formatos: PNG, JPG, SVG
        </p>
      </div>

      {/* Preview */}
      {selectedIconUrl && (
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Preview</Label>
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-lg border-2 border-primary/20 bg-background flex items-center justify-center p-4">
              <img
                src={selectedIconUrl}
                alt="Selected icon"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
