import React, { useRef, useState } from 'react';
import { Upload, Image, X, RotateCw, Eye, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ImageFile } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface ImageUploadAreaProps {
  images: ImageFile[];
  onFilesAdded: (files: File[]) => void;
  onRemoveImage: (id: string) => void;
  onReorderImages?: (fromIndex: number, toIndex: number) => void;
  onRetryUpload?: (id: string) => void;
  className?: string;
  maxImages?: number;
  disabled?: boolean;
}

export const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({
  images,
  onFilesAdded,
  onRemoveImage,
  onReorderImages,
  onRetryUpload,
  className,
  maxImages = 20,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragCounter(0);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onFilesAdded(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesAdded(Array.from(files));
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: ImageFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "rounded-full p-4 transition-colors",
            isDragOver ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            <Upload className="h-8 w-8" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium">
              {isDragOver ? 'Solte as imagens aqui' : 'Arraste imagens ou clique para selecionar'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Suporte para JPEG, PNG e WEBP até 10MB cada. Máximo {maxImages} imagens.
            </p>
          </div>
          
          <Button 
            type="button"
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || images.length >= maxImages}
          >
            <Image className="h-4 w-4 mr-2" />
            Selecionar Imagens
          </Button>
        </div>
      </div>

      {/* Images Preview */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              Imagens Selecionadas ({images.length}/{maxImages})
            </h4>
            {images.some(img => img.status === 'error') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  images
                    .filter(img => img.status === 'error')
                    .forEach(img => onRetryUpload?.(img.id));
                }}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group border rounded-lg overflow-hidden bg-card"
              >
                {/* Image Preview */}
                <div className="aspect-square bg-muted">
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1">
                    {/* View Image */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="secondary" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <img
                          src={image.preview}
                          alt={image.file.name}
                          className="w-full h-auto max-h-[70vh] object-contain"
                        />
                      </DialogContent>
                    </Dialog>

                    {/* Remove Image */}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => onRemoveImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <Badge 
                    variant={
                      image.status === 'success' ? 'default' :
                      image.status === 'error' ? 'destructive' :
                      image.status === 'uploading' ? 'secondary' : 'outline'
                    }
                    className="h-6 px-2"
                  >
                    {getStatusIcon(image.status)}
                  </Badge>
                </div>

                {/* Progress Bar */}
                {image.status === 'uploading' && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/90">
                    <Progress value={image.progress} className="h-1" />
                  </div>
                )}

                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs">
                  <p className="truncate font-medium">{image.file.name}</p>
                  <p className="text-white/80">{formatFileSize(image.file.size)}</p>
                  {image.error && (
                    <p className="text-red-300 mt-1">{image.error}</p>
                  )}
                </div>

                {/* Retry Button for Failed Uploads */}
                {image.status === 'error' && onRetryUpload && (
                  <div className="absolute bottom-2 right-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-6 w-6"
                      onClick={() => onRetryUpload(image.id)}
                    >
                      <RotateCw className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};