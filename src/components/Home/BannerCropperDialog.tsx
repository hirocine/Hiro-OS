import { useState, useCallback, useRef } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Upload, RotateCcw, RotateCw, ZoomIn, ZoomOut, Image as ImageIcon, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { logger } from "@/lib/logger";

interface BannerCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BannerCropperDialog({ open, onOpenChange }: BannerCropperDialogProps) {
  const { bannerSettings, updateBanner, uploadBannerImage, isUpdating } = useSiteSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      logger.debug("BannerCropperDialog: File selected", { 
        module: "banner", 
        data: { name: file.name, size: file.size, type: file.type } 
      });
      setIsLoadingImage(true);
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        logger.debug("BannerCropperDialog: FileReader completed", { 
          module: "banner", 
          data: { resultLength: result?.length } 
        });
        
        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setImageSrc(result);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setRotation(0);
          setIsLoadingImage(false);
          logger.debug("BannerCropperDialog: Image loaded", { 
            module: "banner", 
            data: { width: img.width, height: img.height } 
          });
        };
        img.onerror = () => {
          logger.error("BannerCropperDialog: Failed to load image", { module: "banner" });
          setIsLoadingImage(false);
        };
        img.src = result;
      };
      reader.onerror = () => {
        logger.error("BannerCropperDialog: FileReader error", { module: "banner" });
        setIsLoadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const createCroppedImage = async (): Promise<Blob | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Set output dimensions (banner aspect ratio ~3:1)
    const maxWidth = 1920;
    const aspectRatio = 3;
    canvas.width = maxWidth;
    canvas.height = maxWidth / aspectRatio;

    // Apply rotation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.9);
    });
  };

  const handleSave = async () => {
    if (!imageSrc) return;
    
    setIsProcessing(true);
    try {
      const croppedBlob = await createCroppedImage();
      if (!croppedBlob) throw new Error("Failed to create cropped image");

      const url = await uploadBannerImage(croppedBlob);
      if (!url) throw new Error("Failed to upload image");

      updateBanner({
        url,
        crop: croppedAreaPixels ? {
          x: croppedAreaPixels.x,
          y: croppedAreaPixels.y,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
        } : null,
      });

      onOpenChange(false);
      setImageSrc(null);
    } catch (error) {
      console.error("Error saving banner:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleRotateLeft = () => setRotation((prev) => prev - 90);
  const handleRotateRight = () => setRotation((prev) => prev + 90);

  const handleClose = () => {
    onOpenChange(false);
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFileName(null);
    setImageDimensions(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Editar Banner da Home
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!imageSrc ? (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
              {isLoadingImage ? (
                <>
                  <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
                  <p className="text-muted-foreground">Carregando imagem...</p>
                  {fileName && (
                    <p className="text-sm text-muted-foreground mt-2">{fileName}</p>
                  )}
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Selecione uma imagem para o banner
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Escolher Imagem
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {bannerSettings?.url && (
                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Banner atual:</p>
                      <img 
                        src={bannerSettings.url} 
                        alt="Banner atual" 
                        className="max-h-24 rounded-md"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {/* Image info */}
              {imageDimensions && fileName && (
                <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                  <span>{fileName}</span>
                  <span>{imageDimensions.width} × {imageDimensions.height}px</span>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Arraste para posicionar, use os controles para zoom e rotação
              </p>
              
              <div className="relative h-80 bg-muted rounded-lg overflow-hidden">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={3}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="space-y-4">
                {/* Zoom control */}
                <div className="flex items-center gap-4">
                  <ZoomOut className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={([value]) => setZoom(value)}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  <Label className="w-12 text-right text-sm text-muted-foreground">
                    {zoom.toFixed(1)}x
                  </Label>
                </div>

                {/* Rotation control */}
                <div className="flex items-center gap-4">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[rotation]}
                    min={-180}
                    max={180}
                    step={1}
                    onValueChange={([value]) => setRotation(value)}
                    className="flex-1"
                  />
                  <RotateCw className="h-4 w-4 text-muted-foreground" />
                  <Label className="w-12 text-right text-sm text-muted-foreground">
                    {rotation}°
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotateLeft}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    -90°
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotateRight}
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    +90°
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    Resetar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Trocar
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!imageSrc || isProcessing || isUpdating}
          >
            {isProcessing ? "Processando..." : "Salvar Banner"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
