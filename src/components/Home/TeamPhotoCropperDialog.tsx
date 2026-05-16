import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CropSettings } from '@/hooks/useTeamMembers';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TeamPhotoCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob, settings: CropSettings) => void;
  loading?: boolean;
  initialSettings?: CropSettings | null;
}

export function TeamPhotoCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  loading,
  initialSettings,
}: TeamPhotoCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  // Load initial settings when dialog opens
  useEffect(() => {
    if (open && initialSettings) {
      setCrop(initialSettings.crop);
      setZoom(initialSettings.zoom);
      setRotation(initialSettings.rotation);
    } else if (open && !initialSettings) {
      // Reset to defaults for new crops
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    }
  }, [open, initialSettings]);

  const onCropAreaChange = useCallback((_: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.crossOrigin = 'anonymous';
      image.src = url;
    });

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const getCroppedImg = async (): Promise<Blob> => {
    if (!croppedAreaPixels) throw new Error('No crop area');

    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas context');

    const rotRad = (rotation * Math.PI) / 180;
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.width / 2, -image.height / 2);
    ctx.drawImage(image, 0, 0);

    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) throw new Error('No cropped canvas context');

    // Output size - larger for quality but reasonable
    const maxOutputWidth = 800;
    const aspectRatio = croppedAreaPixels.width / croppedAreaPixels.height;
    const outputWidth = Math.min(croppedAreaPixels.width, maxOutputWidth);
    const outputHeight = outputWidth / aspectRatio;

    croppedCanvas.width = outputWidth;
    croppedCanvas.height = outputHeight;

    croppedCtx.drawImage(
      canvas,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return new Promise((resolve, reject) => {
      croppedCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/webp',
        0.85
      );
    });
  };

  const handleSave = async () => {
    try {
      const croppedBlob = await getCroppedImg();
      const settings: CropSettings = {
        crop,
        zoom,
        rotation,
      };
      onCropComplete(croppedBlob, settings);
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
      <DialogContent className="max-w-3xl max-h-[90vh] ds-shell">
        <DialogHeader>
          <DialogTitle>Ajustar Foto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cropper Area */}
          <div className="relative h-96 bg-[hsl(var(--ds-line-2)/0.4)] border border-[hsl(var(--ds-line-1))] overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={3 / 2}
              cropShape="rect"
              showGrid={true}
              onCropChange={setCrop}
              onCropComplete={onCropAreaChange}
              onZoomChange={setZoom}
            />
          </div>

          {/* Zoom Control */}
          <div className="space-y-2">
            <Label className="text-sm">Zoom</Label>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(values) => setZoom(values[0])}
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Rotação</Label>
              <span className="text-xs text-[hsl(var(--ds-fg-3))]">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              min={-180}
              max={180}
              step={1}
              onValueChange={(values) => setRotation(values[0])}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button type="button" className="btn" onClick={resetCrop}>
            <RotateCcw size={13} strokeWidth={1.5} />
            Resetar
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>
            <button type="button" className="btn primary" onClick={handleSave} disabled={loading}>
              {loading && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />}
              Salvar
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
