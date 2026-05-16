import React, { useState, useCallback } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { Check, AlertTriangle, X, Eye, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploadArea } from '@/components/ui/image-upload-area';
import { useImageUpload } from '@/hooks/useImageUpload';
import { logger } from '@/lib/logger';
import { generateEquipmentImageName } from '@/lib/imageNaming';
import { StatusPill as DSStatusPill } from '@/ds/components/StatusPill';

interface ImageUploadResult {
  filename: string;
  status: 'success' | 'pending_manual' | 'error';
  equipmentId?: string;
  equipmentName?: string;
  confidence?: number;
  method?: string;
  imageUrl?: string;
  error?: string;
  possibleMatches?: any[];
  imageData?: string;
}

interface BulkImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  equipments: any[];
}

type StatusTone = 'success' | 'warning' | 'danger';

const statusTone: Record<ImageUploadResult['status'], StatusTone> = {
  success: 'success',
  pending_manual: 'warning',
  error: 'danger',
};

const StatusPill = ({ status }: { status: ImageUploadResult['status'] }) => {
  const tone = statusTone[status];
  const label = status === 'success' ? 'Sucesso' : status === 'error' ? 'Erro' : 'Pendente';
  const Icon = status === 'success' ? Check : status === 'error' ? X : AlertTriangle;
  return (
    <DSStatusPill label={label} tone={tone} icon={<Icon size={11} strokeWidth={1.5} />} />
  );
};

export const BulkImageUploadDialog: React.FC<BulkImageUploadDialogProps> = ({
  open,
  onOpenChange,
  onComplete,
  equipments,
}) => {
  const { images, addImages, removeImage, clearImages, retryUpload } = useImageUpload();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<ImageUploadResult[]>([]);
  const [step, setStep] = useState<'select' | 'preview' | 'processing' | 'review'>('select');

  const handleFilesAdded = useCallback(
    (files: File[]) => {
      addImages(files);
      if (files.length > 0) {
        setStep('preview');
      }
    },
    [addImages],
  );

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processImages = async () => {
    setStep('processing');

    try {
      const imagesData = await Promise.all(
        images.map(async (imageFile) => ({
          filename: imageFile.file.name,
          fileData: await convertFileToBase64(imageFile.file),
        })),
      );

      setUploadProgress(25);

      const { data, error } = await supabase.functions.invoke('process-equipment-images', {
        body: { images: imagesData },
      });

      if (error) throw error;

      setUploadProgress(75);
      setResults(data.results);
      setUploadProgress(100);

      enhancedToast.success({
        title: 'Processamento concluído',
        description: `${data.summary.success} sucessos, ${data.summary.pending} pendentes, ${data.summary.errors} erros`,
      });

      setStep('review');
    } catch (error) {
      logger.error('Error during bulk image upload', {
        module: 'equipment',
        action: 'bulk_image_upload',
        error,
        data: { imageCount: images.length },
      });
      enhancedToast.error({
        title: 'Erro durante processamento',
        description: 'Falha ao processar as imagens',
      });
    }
  };

  const handleManualMatch = async (filename: string, equipmentId: string) => {
    const pendingResult = results.find((r) => r.filename === filename && r.status === 'pending_manual');
    const equipment = equipments.find((eq) => eq.id === equipmentId);
    if (!pendingResult || !pendingResult.imageData || !equipment) return;

    try {
      const base64Data = pendingResult.imageData.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      const filePath = generateEquipmentImageName(equipmentId, equipment.patrimonyNumber);

      const { error: uploadError } = await supabase.storage
        .from('equipment-images')
        .upload(filePath, binaryData, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('equipment-images').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('equipments')
        .update({ image: publicUrl })
        .eq('id', equipmentId);

      if (updateError) throw updateError;

      setResults((prev) =>
        prev.map((r) =>
          r.filename === filename
            ? {
                ...r,
                status: 'success' as const,
                equipmentId,
                equipmentName: equipments.find((eq) => eq.id === equipmentId)?.name,
                imageUrl: publicUrl,
              }
            : r,
        ),
      );

      enhancedToast.success({
        title: 'Imagem associada',
        description: `${filename} associada com sucesso!`,
      });
    } catch (error) {
      logger.error('Error in manual image match', {
        module: 'equipment',
        action: 'manual_image_match',
        error,
        data: { filename, equipmentId },
      });
      enhancedToast.error({
        title: 'Erro na associação',
        description: `Falha ao associar ${filename}`,
      });
    }
  };

  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
    clearImages();
    setResults([]);
    setStep('select');
    setUploadProgress(0);
  };

  const successCount = results.filter((r) => r.status === 'success').length;
  const pendingCount = results.filter((r) => r.status === 'pending_manual').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="w-full max-w-4xl ds-shell">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            <span style={{ fontFamily: '"HN Display", sans-serif' }}>Upload de Imagens em Massa</span>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        {step === 'select' && (
          <ImageUploadArea
            images={images}
            onFilesAdded={handleFilesAdded}
            onRemoveImage={removeImage}
            onRetryUpload={retryUpload}
            className="min-h-[300px]"
          />
        )}

        {step === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
            <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                {images.length}
              </span>{' '}
              imagens selecionadas. Clique em "Processar" para iniciar o upload.
            </p>
            <ImageUploadArea
              images={images}
              onFilesAdded={handleFilesAdded}
              onRemoveImage={removeImage}
              onRetryUpload={retryUpload}
              className="max-h-[400px] overflow-y-auto"
            />
          </div>
        )}

        {step === 'processing' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              padding: '32px 0',
              textAlign: 'center',
            }}
          >
            <Loader2 size={28} strokeWidth={1.5} className="animate-spin" style={{ color: 'hsl(var(--ds-accent))' }} />
            <p
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
              }}
            >
              Processando imagens...
            </p>
            <div
              style={{
                width: '100%',
                maxWidth: 320,
                height: 4,
                background: 'hsl(var(--ds-line-2))',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'hsl(var(--ds-accent))',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
              Fazendo upload e associando automaticamente aos equipamentos
            </p>
          </div>
        )}

        {step === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <DSStatusPill
                label={`${successCount} Sucessos`}
                tone="success"
                icon={<Check size={11} strokeWidth={1.5} />}
              />
              <DSStatusPill
                label={`${pendingCount} Pendentes`}
                tone="warning"
                icon={<AlertTriangle size={11} strokeWidth={1.5} />}
              />
              <DSStatusPill
                label={`${errorCount} Erros`}
                tone="danger"
                icon={<X size={11} strokeWidth={1.5} />}
              />
            </div>

            <ScrollArea className="h-80" style={{ border: '1px solid hsl(var(--ds-line-1))' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {results.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      padding: 12,
                      borderBottom: index < results.length - 1 ? '1px solid hsl(var(--ds-line-1))' : undefined,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
                      {result.imageData && (
                        <img
                          src={result.imageData}
                          alt={result.filename}
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: 48,
                            height: 48,
                            objectFit: 'cover',
                            border: '1px solid hsl(var(--ds-line-1))',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}
                        >
                          <span
                            style={{
                              fontWeight: 500,
                              fontSize: 13,
                              color: 'hsl(var(--ds-fg-1))',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {result.filename}
                          </span>
                          <StatusPill status={result.status} />
                        </div>

                        {result.status === 'success' && (
                          <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
                            Associado a: <span style={{ color: 'hsl(var(--ds-fg-2))' }}>{result.equipmentName}</span>
                            {result.method && (
                              <span style={{ marginLeft: 6, fontSize: 11, color: 'hsl(var(--ds-fg-4))' }}>
                                ({result.method})
                              </span>
                            )}
                          </p>
                        )}

                        {result.status === 'error' && (
                          <p style={{ fontSize: 12, color: 'hsl(var(--ds-danger))' }}>{result.error}</p>
                        )}

                        {result.status === 'pending_manual' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                            <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
                              Selecione o equipamento manualmente:
                            </p>
                            <Select onValueChange={(value) => handleManualMatch(result.filename, value)}>
                              <SelectTrigger style={{ width: '100%' }}>
                                <SelectValue placeholder="Selecionar equipamento..." />
                              </SelectTrigger>
                              <SelectContent>
                                {equipments.map((equipment) => (
                                  <SelectItem key={equipment.id} value={equipment.id}>
                                    {equipment.name} - {equipment.patrimony_number || equipment.brand}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>

                    {result.imageUrl && (
                      <button
                        type="button"
                        className="btn"
                        style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', flexShrink: 0 }}
                        aria-label="Visualizar"
                      >
                        <Eye size={13} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <ResponsiveDialogFooter>
          {step === 'select' && (
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>
              Cancelar
            </button>
          )}

          {step === 'preview' && (
            <>
              <button type="button" className="btn" onClick={() => setStep('select')}>
                Voltar
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={processImages}
                disabled={images.length === 0}
              >
                Processar {images.length} Imagens
              </button>
            </>
          )}

          {step === 'review' && (
            <button type="button" className="btn primary" onClick={handleComplete}>
              Finalizar
            </button>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
