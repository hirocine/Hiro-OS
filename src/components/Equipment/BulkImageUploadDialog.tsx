import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { Check, AlertTriangle, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploadArea } from '@/components/ui/image-upload-area';
import { useImageUpload } from '@/hooks/useImageUpload';

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

export const BulkImageUploadDialog: React.FC<BulkImageUploadDialogProps> = ({
  open,
  onOpenChange,
  onComplete,
  equipments
}) => {
  const {
    images,
    isUploading,
    addImages,
    removeImage,
    uploadAll,
    clearImages,
    retryUpload
  } = useImageUpload();
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<ImageUploadResult[]>([]);
  const [step, setStep] = useState<'select' | 'preview' | 'processing' | 'review'>('select');
  const [manualMatches, setManualMatches] = useState<Record<string, string>>({});

  const handleFilesAdded = useCallback((files: File[]) => {
    addImages(files);
    if (files.length > 0) {
      setStep('preview');
    }
  }, [addImages]);

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
      // Converter arquivos para base64
      const imagesData = await Promise.all(
        images.map(async (imageFile) => ({
          filename: imageFile.file.name,
          fileData: await convertFileToBase64(imageFile.file)
        }))
      );

      setUploadProgress(25);

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('process-equipment-images', {
        body: { images: imagesData }
      });

      if (error) throw error;

      setUploadProgress(75);
      setResults(data.results);
      setUploadProgress(100);
      
      enhancedToast.success({
        title: 'Processamento concluído',
        description: `${data.summary.success} sucessos, ${data.summary.pending} pendentes, ${data.summary.errors} erros`
      });
      
      setStep('review');
    } catch (error) {
      console.error('Erro no upload em massa:', error);
      enhancedToast.error({
        title: 'Erro durante processamento',
        description: 'Falha ao processar as imagens'
      });
    }
  };

  const handleManualMatch = async (filename: string, equipmentId: string) => {
    const pendingResult = results.find(r => r.filename === filename && r.status === 'pending_manual');
    if (!pendingResult || !pendingResult.imageData) return;

    try {
      // Upload manual da imagem
      const base64Data = pendingResult.imageData.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const fileExt = filename.split('.').pop();
      const filePath = `${equipmentId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('equipment-images')
        .upload(filePath, binaryData, {
          contentType: `image/${fileExt}`,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Atualizar URL da imagem no equipamento
      const { data: { publicUrl } } = supabase.storage
        .from('equipment-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('equipments')
        .update({ image: publicUrl })
        .eq('id', equipmentId);

      if (updateError) throw updateError;

      // Atualizar resultado
      setResults(prev => prev.map(r => 
        r.filename === filename 
          ? { 
              ...r, 
              status: 'success' as const,
              equipmentId,
              equipmentName: equipments.find(eq => eq.id === equipmentId)?.name,
              imageUrl: publicUrl
            }
          : r
      ));

      enhancedToast.success({
        title: 'Imagem associada',
        description: `${filename} associada com sucesso!`
      });
    } catch (error) {
      console.error('Erro no match manual:', error);
      enhancedToast.error({
        title: 'Erro na associação',
        description: `Falha ao associar ${filename}`
      });
    }
  };

  const handleComplete = () => {
    onComplete();
    onOpenChange(false);
    // Reset state
    clearImages();
    setResults([]);
    setStep('select');
    setUploadProgress(0);
    setManualMatches({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'destructive';
      case 'pending_manual': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <Check className="h-4 w-4" />;
      case 'error': return <X className="h-4 w-4" />;
      case 'pending_manual': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Upload de Imagens em Massa</DialogTitle>
        </DialogHeader>

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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {images.length} imagens selecionadas. Clique em "Processar" para iniciar o upload.
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
          <div className="space-y-4 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-lg font-medium">Processando imagens...</p>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Fazendo upload e associando automaticamente aos equipamentos
            </p>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <Badge variant="success" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                {results.filter(r => r.status === 'success').length} Sucessos
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {results.filter(r => r.status === 'pending_manual').length} Pendentes
              </Badge>
              <Badge variant="destructive" className="flex items-center gap-1">
                <X className="h-3 w-3" />
                {results.filter(r => r.status === 'error').length} Erros
              </Badge>
            </div>

            <ScrollArea className="h-80">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {result.imageData && (
                            <img
                              src={result.imageData}
                              alt={result.filename}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{result.filename}</span>
                              <Badge variant={getStatusColor(result.status)}>
                                {getStatusIcon(result.status)}
                                {result.status === 'success' ? 'Sucesso' : 
                                 result.status === 'error' ? 'Erro' : 'Pendente'}
                              </Badge>
                            </div>
                            
                            {result.status === 'success' && (
                              <p className="text-sm text-muted-foreground">
                                Associado a: {result.equipmentName}
                                {result.method && (
                                  <span className="ml-2 text-xs">({result.method})</span>
                                )}
                              </p>
                            )}
                            
                            {result.status === 'error' && (
                              <p className="text-sm text-destructive">{result.error}</p>
                            )}
                            
                            {result.status === 'pending_manual' && (
                              <div className="space-y-2 mt-2">
                                <p className="text-sm text-muted-foreground">
                                  Selecione o equipamento manualmente:
                                </p>
                                <Select onValueChange={(value) => handleManualMatch(result.filename, value)}>
                                  <SelectTrigger className="w-full">
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
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {step === 'select' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>
                Voltar
              </Button>
              <Button onClick={processImages} disabled={images.length === 0}>
                Processar {images.length} Imagens
              </Button>
            </>
          )}
          
          {step === 'review' && (
            <Button onClick={handleComplete}>
              Finalizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};