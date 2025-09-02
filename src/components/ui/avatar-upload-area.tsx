import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadAreaProps {
  currentAvatarUrl?: string | null;
  userInitials: string;
  onFileSelect: (file: File) => void;
  onRemoveAvatar?: () => void;
  uploading?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarUploadArea = ({
  currentAvatarUrl,
  userInitials,
  onFileSelect,
  onRemoveAvatar,
  uploading = false,
  className,
  size = 'lg'
}: AvatarUploadAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-20 w-20',
    lg: 'h-24 w-24'
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onFileSelect(imageFile);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Avatar with Upload Overlay */}
      <div
        className={cn(
          "relative group cursor-pointer transition-all duration-200",
          isDragOver && "scale-105"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
      >
        <Avatar className={cn(sizeClasses[size], "ring-2 ring-background")}>
          <AvatarImage src={currentAvatarUrl || undefined} />
          <AvatarFallback className={cn("text-lg", size === 'sm' && "text-sm")}>
            {userInitials}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            isDragOver && "opacity-100 bg-primary/60",
            uploading && "opacity-100"
          )}
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>

        {/* Drag Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-full border-2 border-dashed border-primary">
            <Upload className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileSelect}
          disabled={uploading}
        >
          <Camera className="mr-2 h-4 w-4" />
          {currentAvatarUrl ? 'Alterar' : 'Adicionar'}
        </Button>
        
        {currentAvatarUrl && onRemoveAvatar && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveAvatar();
            }}
            disabled={uploading}
          >
            <X className="mr-2 h-4 w-4" />
            Remover
          </Button>
        )}
      </div>

      {/* Drag Instructions */}
      <p className="text-xs text-muted-foreground text-center max-w-[200px]">
        Clique para selecionar ou arraste uma imagem aqui
        <br />
        <span className="text-[10px]">PNG, JPG até 10MB</span>
      </p>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};