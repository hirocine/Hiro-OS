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

    // PASSO 3: Redimensionar para tamanho final (1920×600, aspect 16:5)
    // Aspect alinhado com o hero da Home (height: clamp(360px, 52vh, 520px)
    // full-bleed → ~3.2:1 em laptops, ~3.7:1 em telas wide; 16:5 cobre os dois
    // sem cortar conteúdo central).
    const finalCanvas = document.createElement("canvas");
    const maxWidth = 1920;
    finalCanvas.width = maxWidth;
    finalCanvas.height = Math.round(maxWidth / (16 / 5)); // 600px
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

  const eyebrowStyle: React.CSSProperties = {
    fontFamily: '"HN Display", sans-serif',
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'hsl(var(--ds-fg-4))',
  };
  const valueStyle: React.CSSProperties = {
    fontFamily: '"HN Display", sans-serif',
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.04em',
    color: 'hsl(var(--ds-fg-1))',
    fontVariantNumeric: 'tabular-nums',
    minWidth: 44,
    textAlign: 'right',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0 border-[hsl(var(--ds-line-1))] bg-[hsl(var(--ds-surface))]">
        <div className="ds-shell" style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
          {/* ─── Header ─── */}
          <DialogHeader
            style={{
              padding: '18px 24px 14px',
              borderBottom: '1px solid hsl(var(--ds-line-1))',
              display: 'block',
              textAlign: 'left',
            }}
          >
            <div style={{ ...eyebrowStyle, display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 6, height: 6, background: 'hsl(var(--ds-accent))', flexShrink: 0 }} />
              Hiro OS · Configuração
            </div>
            <DialogTitle
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: 'hsl(var(--ds-fg-1))',
                margin: 0,
              }}
            >
              Editar banner da Home
            </DialogTitle>
          </DialogHeader>

          {/* ─── Body ─── */}
          <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!imageSrc ? (
              isLoadingImage ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 48,
                    border: '1px dashed hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-line-2) / 0.25)',
                  }}
                >
                  <Loader2 className="h-10 w-10 animate-spin" style={{ color: 'hsl(var(--ds-fg-3))', marginBottom: 12 }} strokeWidth={1.5} />
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>Carregando imagem…</p>
                  {fileName && (
                    <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>{fileName}</p>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gap: 12,
                    gridTemplateColumns: bannerSettings?.url ? '1fr 1fr' : '1fr',
                  }}
                >
                  {/* Opção 1: Nova imagem */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 32,
                      border: '1px dashed hsl(var(--ds-line-1))',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'background 120ms, border-color 120ms',
                      textAlign: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
                      e.currentTarget.style.borderColor = 'hsl(var(--ds-fg-3))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                    }}
                  >
                    <Upload size={28} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', marginBottom: 12 }} />
                    <span
                      style={{
                        fontFamily: '"HN Display", sans-serif',
                        fontWeight: 500,
                        fontSize: 14,
                        color: 'hsl(var(--ds-fg-1))',
                      }}
                    >
                      Enviar nova imagem
                    </span>
                    <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                      Upload de uma foto nova
                    </span>
                  </button>

                  {/* Opção 2: Editar atual */}
                  {bannerSettings?.url && (
                    <button
                      type="button"
                      onClick={loadExistingBanner}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 32,
                        border: '1px dashed hsl(var(--ds-line-1))',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'background 120ms, border-color 120ms',
                        textAlign: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
                        e.currentTarget.style.borderColor = 'hsl(var(--ds-fg-3))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                      }}
                    >
                      <ImageIcon size={28} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', marginBottom: 12 }} />
                      <span
                        style={{
                          fontFamily: '"HN Display", sans-serif',
                          fontWeight: 500,
                          fontSize: 14,
                          color: 'hsl(var(--ds-fg-1))',
                        }}
                      >
                        Editar banner atual
                      </span>
                      <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                        Ajustar crop, zoom ou rotação
                      </span>
                      {bannerSettings.original_url && (
                        <span
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'hsl(var(--ds-accent))',
                            marginTop: 10,
                            fontFamily: '"HN Display", sans-serif',
                            fontWeight: 500,
                          }}
                        >
                          ✓ Original preservado
                        </span>
                      )}
                    </button>
                  )}
                </div>
              )
            ) : (
              <>
                {/* Image info bar */}
                {imageDimensions && fileName && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      border: '1px solid hsl(var(--ds-line-1))',
                      background: 'hsl(var(--ds-line-2) / 0.3)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"HN Display", sans-serif',
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-1))',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {fileName}
                    </span>
                    <span
                      style={{
                        ...eyebrowStyle,
                        fontSize: 11,
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      {imageDimensions.width} × {imageDimensions.height} px
                    </span>
                  </div>
                )}

                {/* Hint */}
                <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', margin: 0 }}>
                  Arraste a imagem para posicionar · use os controles abaixo para zoom e rotação.
                </p>

                {/* Cropper — 16:5 matches the new hero banner aspect */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16 / 5',
                    background: 'hsl(var(--ds-line-2) / 0.4)',
                    border: '1px solid hsl(var(--ds-line-1))',
                    overflow: 'hidden',
                  }}
                >
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={16 / 5}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    onCropComplete={onCropComplete}
                  />
                </div>

                {/* Sliders */}
                <div style={{ display: 'grid', gap: 14, paddingTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Label style={{ ...eyebrowStyle, width: 64, margin: 0 }}>Zoom</Label>
                    <ZoomOut size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))', flexShrink: 0 }} />
                    <Slider
                      value={[zoom]}
                      min={1}
                      max={3}
                      step={0.1}
                      onValueChange={([value]) => setZoom(value)}
                      className="flex-1"
                    />
                    <ZoomIn size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))', flexShrink: 0 }} />
                    <span style={valueStyle}>{zoom.toFixed(1)}x</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Label style={{ ...eyebrowStyle, width: 64, margin: 0 }}>Rotação</Label>
                    <RotateCcw size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))', flexShrink: 0 }} />
                    <Slider
                      value={[rotation]}
                      min={-180}
                      max={180}
                      step={1}
                      onValueChange={([value]) => setRotation(value)}
                      className="flex-1"
                    />
                    <RotateCw size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))', flexShrink: 0 }} />
                    <span style={valueStyle}>{rotation}°</span>
                  </div>
                </div>

                {/* Quick actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    paddingTop: 8,
                    borderTop: '1px solid hsl(var(--ds-line-1))',
                  }}
                >
                  <button type="button" className="btn sm" onClick={handleRotateLeft}>
                    <RotateCcw size={13} strokeWidth={1.5} />
                    <span>-90°</span>
                  </button>
                  <button type="button" className="btn sm" onClick={handleRotateRight}>
                    <RotateCw size={13} strokeWidth={1.5} />
                    <span>+90°</span>
                  </button>
                  <button type="button" className="btn sm" onClick={handleReset}>
                    <span>Resetar</span>
                  </button>
                  <div style={{ flex: 1 }} />
                  <button type="button" className="btn sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={13} strokeWidth={1.5} />
                    <span>Trocar imagem</span>
                  </button>
                </div>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* ─── Footer ─── */}
          <DialogFooter
            style={{
              padding: '14px 24px',
              borderTop: '1px solid hsl(var(--ds-line-1))',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: 8,
              margin: 0,
            }}
          >
            <button type="button" className="btn" onClick={handleClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleSave}
              disabled={!imageSrc || isProcessing || isUpdating}
            >
              {isProcessing || isUpdating ? (
                <>
                  <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                  <span>Processando…</span>
                </>
              ) : (
                <span>Salvar banner</span>
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
