import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EquipmentImageUploadProps {
  imageUrl?: string;
  isUploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}

export function EquipmentImageUpload({
  imageUrl,
  isUploading,
  onUpload,
  onRemove
}: EquipmentImageUploadProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
    }
  };

  return (
    <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
      {imageUrl ? (
        <>
          <img 
            src={imageUrl}
            alt="Foto do equipamento"
            className="w-full h-full object-cover rounded-lg border-2 border-border"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={onRemove}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-muted/30">
          <Camera className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-xs text-muted-foreground font-medium">Adicionar Foto</span>
          <input 
            type="file" 
            onChange={handleFileChange} 
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploading}
          />
        </label>
      )}
      
      {isUploading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
