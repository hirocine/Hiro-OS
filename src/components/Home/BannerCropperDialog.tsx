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
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { logger } from "@/lib/logger";

interface BannerCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BannerCropperDialog({ open, onOpenChange }: BannerCropperDialogProps) {
  const { bannerSettings, updateBanner, uploadBannerImage, uploadOriginalBanner, isUpdating } = useSiteSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null); // URL do original no storage
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isNewUpload, setIsNewUpload] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

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
      setIsNewUpload(true);
      setPendingFile(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
          setImageSrc(result);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setRotation(0);
          setIsLoadingImage(false);
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

  const loadExistingBanner = () => {
    // Priorizar original_url se existir, senão usar url
    const sourceUrl = bannerSettings?.original_url || bannerSettings?.url;
    if (!sourceUrl) return;

    setIsLoadingImage(true);
    setFileName("Banner atual");
    setIsNewUpload(false);
    setOriginalUrl(bannerSettings?.original_url || null);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setImageSrc(sourceUrl);
      
      // Restaurar configurações salvas
      if (bannerSettings?.crop_position) {
        setCrop(bannerSettings.crop_position);
      } else {
        setCrop({ x: 0, y: 0 });
      }
      setZoom(bannerSettings?.zoom ?? 1);
      setRotation(bannerSettings?.rotation ?? 0);
      setIsLoadingImage(false);
      
      logger.debug("BannerCropperDialog: Existing banner loaded with settings", { 
        module: "banner",
        data: { 
          hasOriginal: !!bannerSettings?.original_url,
          zoom: bannerSettings?.zoom,
          rotation: bannerSettings?.rotation
        }
      });
    };
    img.onerror = () => {
      logger.error("BannerCropperDialog: Failed to load current banner", { module: "banner" });
      setIsLoadingImage(false);
    };
    img.src = sourceUrl;
  };

  const createCroppedImage = async (): Promise<Blob | null> => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    // Helper functions (oficial react-easy-crop)
    const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180;
    
    const rotateSize = (width: number, height: number, rot: number) => {
      const rotRad = getRadianAngle(rot);
      return {
        width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
      };
    };

    // PASSO 1: Criar canvas com imagem rotacionada
    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(image.width, image.height, rotation);

    const rotatedCanvas = document.createElement("canvas");
    rotatedCanvas.width = bBoxWidth;
    rotatedCanvas.height = bBoxHeight;
    const rotCtx = rotatedCanvas.getContext("2d");
    if (!rotCtx) return null;

    // Transladar para centro, rotacionar, transladar de volta, desenhar
    rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
    rotCtx.rotate(rotRad);
    rotCtx.translate(-image.width / 2, -image.height / 2);
    rotCtx.drawImage(image, 0, 0);

    // PASSO 2: Extrair área recortada (tamanho original do crop)
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = croppedAreaPixels.width;
    croppedCanvas.height = croppedAreaPixels.height;
    const croppedCtx = croppedCanvas.getContext("2d");
    if (!croppedCtx) return null;

    croppedCtx.drawImage(
      rotatedCanvas,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    // PASSO 3: Redimensionar para tamanho final (1920x640, aspect 3:1)
    const finalCanvas = document.createElement("canvas");
    const maxWidth = 1920;
    finalCanvas.width = maxWidth;
    finalCanvas.height = maxWidth / 3; // 640px
    const finalCtx = finalCanvas.getContext("2d");
    if (!finalCtx) return null;

    finalCtx.drawImage(
      croppedCanvas,
      0, 0, croppedCanvas.width, croppedCanvas.height,
      0, 0, finalCanvas.width, finalCanvas.height
    );

    return new Promise((resolve) => {
      finalCanvas.toBlob(resolve, "image/webp", 0.9);
    });
  };

  const handleSave = async () => {
    if (!imageSrc) return;
    
    setIsProcessing(true);
    try {
      let finalOriginalUrl = originalUrl;

      // Se é novo upload, fazer upload do original primeiro
      if (isNewUpload && pendingFile) {
        finalOriginalUrl = await uploadOriginalBanner(pendingFile);
        if (!finalOriginalUrl) throw new Error("Failed to upload original image");
      }

      // Criar e fazer upload da imagem recortada
      const croppedBlob = await createCroppedImage();
      if (!croppedBlob) throw new Error("Failed to create cropped image");

      const croppedUrl = await uploadBannerImage(croppedBlob);
      if (!croppedUrl) throw new Error("Failed to upload cropped image");

      // Salvar ambas URLs e configurações
      updateBanner({
        url: croppedUrl,
        original_url: finalOriginalUrl,
        crop: croppedAreaPixels ? {
          x: croppedAreaPixels.x,
          y: croppedAreaPixels.y,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
        } : null,
        crop_position: crop,  // Salvar posição de arraste
        zoom,
        rotation,
      });

      handleClose();
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
    setOriginalUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFileName(null);
    setImageDimensions(null);
    setIsNewUpload(false);
    setPendingFile(null);
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
            <div className="p-4">
              {isLoadingImage ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[hsl(var(--ds-line-1))]">
                  <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
                  <p className="text-muted-foreground">Carregando imagem...</p>
                  {fileName && (
                    <p className="text-sm text-muted-foreground mt-2">{fileName}</p>
                  )}
                </div>
              ) : (
                <div className={`grid gap-4 ${bannerSettings?.url ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Opção 1: Nova imagem */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[hsl(var(--ds-line-1))] hover:border-[hsl(var(--ds-accent))] hover:bg-[hsl(var(--ds-line-2)/0.3)] transition-colors"
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                    <span className="font-medium">Enviar Nova Imagem</span>
                    <span className="text-sm text-muted-foreground mt-1 text-center">
                      Fazer upload de uma nova foto
                    </span>
                  </button>

                  {/* Opção 2: Editar atual (só se existir) */}
                  {bannerSettings?.url && (
                    <button
                      onClick={loadExistingBanner}
                      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[hsl(var(--ds-line-1))] hover:border-[hsl(var(--ds-accent))] hover:bg-[hsl(var(--ds-line-2)/0.3)] transition-colors"
                    >
                      <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                      <span className="font-medium">Editar Banner Atual</span>
                      <span className="text-sm text-muted-foreground mt-1 text-center">
                        Ajustar crop, zoom ou rotação
                      </span>
                      {bannerSettings.original_url && (
                        <span className="text-xs text-success mt-2">
                          ✓ Imagem original preservada
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <>
              {/* Image info */}
              {imageDimensions && fileName && (
                <div className="flex items-center justify-between text-sm text-muted-foreground bg-[hsl(var(--ds-line-2)/0.4)] border border-[hsl(var(--ds-line-1))] px-3 py-2">
                  <span>{fileName}</span>
                  <span>{imageDimensions.width} × {imageDimensions.height}px</span>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Arraste para posicionar, use os controles para zoom e rotação
              </p>
              
              <div className="relative h-80 bg-[hsl(var(--ds-line-2)/0.4)] border border-[hsl(var(--ds-line-1))] overflow-hidden">
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
                  <button type="button" className="btn sm" onClick={handleRotateLeft}>
                    <RotateCcw className="h-4 w-4" />
                    -90°
                  </button>
                  <button type="button" className="btn sm" onClick={handleRotateRight}>
                    <RotateCw className="h-4 w-4" />
                    +90°
                  </button>
                  <button type="button" className="btn sm" onClick={handleReset}>
                    Resetar
                  </button>
                  <button type="button" className="btn sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Trocar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <button type="button" className="btn" onClick={handleClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSave}
            disabled={!imageSrc || isProcessing || isUpdating}
          >
            {isProcessing ? "Processando..." : "Salvar Banner"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
