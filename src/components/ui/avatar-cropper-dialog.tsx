import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, RotateCw, ZoomIn } from 'lucide-react';
import Cropper from 'react-easy-crop';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AvatarCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageData: { file: Blob; url: string }) => void;
  loading?: boolean;
}

export const AvatarCropperDialog = ({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  loading = false
}: AvatarCropperDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const onCropAreaChange = useCallback((croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea,
    rotation = 0
  ): Promise<{ file: Blob; url: string }> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const rotRad = (rotation * Math.PI) / 180;

    // Calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    // Set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // Translate canvas context to a central location to allow rotating around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);

    // Draw rotated image
    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');

    if (!croppedCtx) {
      throw new Error('Could not get cropped canvas context');
    }

    // Set the size of the cropped canvas
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    // Draw the cropped image
    croppedCtx.drawImage(
      canvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      croppedCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve({ file: blob, url });
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Ajustar Foto de Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cropper Area */}
          <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropAreaChange}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              cropShape="round"
              showGrid={false}
            />
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                Zoom
              </Label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Rotação
              </Label>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={resetCrop} disabled={loading}>
            Resetar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading || !croppedAreaPixels}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};