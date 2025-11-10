import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, PlayCircle, AlertCircle, CheckCircle, SkipForward } from 'lucide-react';

interface PlatformAccess {
  id: string;
  platform_name: string;
  platform_icon_url: string | null;
}

interface IconOptimizationResult {
  platformName: string;
  status: 'pending' | 'processing' | 'success' | 'skipped' | 'error';
  oldUrl?: string;
  newUrl?: string;
  error?: string;
  oldSize?: number;
  newSize?: number;
}

export function OptimizePlatformIcons() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<IconOptimizationResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [optimizedCount, setOptimizedCount] = useState(0);

  const compressImage = async (img: HTMLImageElement): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Falha ao obter contexto do canvas'));
        return;
      }
      
      const maxSize = 256;
      canvas.width = maxSize;
      canvas.height = maxSize;
      
      ctx.drawImage(img, 0, 0, maxSize, maxSize);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Falha na compressão'));
        },
        'image/webp',
        0.85
      );
    });
  };

  const loadImage = (blob: Blob): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  };

  const fetchIconStats = async () => {
    const { data, error } = await supabase
      .from('platform_accesses')
      .select('id, platform_name, platform_icon_url')
      .not('platform_icon_url', 'is', null);

    if (error) throw error;

    const total = data?.length || 0;
    const optimized = data?.filter(item => 
      item.platform_icon_url?.includes('.webp')
    ).length || 0;
    const pending = total - optimized;

    setTotalCount(total);
    setOptimizedCount(optimized);
    setPendingCount(pending);

    return data || [];
  };

  const processIcon = async (access: PlatformAccess): Promise<IconOptimizationResult> => {
    const result: IconOptimizationResult = {
      platformName: access.platform_name,
      status: 'processing',
      oldUrl: access.platform_icon_url || undefined,
    };

    try {
      if (!access.platform_icon_url) {
        return { ...result, status: 'skipped', error: 'Sem ícone' };
      }

      // Pular se já for WebP
      if (access.platform_icon_url.includes('.webp')) {
        return { ...result, status: 'skipped', error: 'Já otimizado (WebP)' };
      }

      // Baixar imagem original
      const response = await fetch(access.platform_icon_url);
      if (!response.ok) throw new Error('Falha ao baixar imagem');
      
      const blob = await response.blob();
      result.oldSize = blob.size;

      // Converter para Image e comprimir
      const img = await loadImage(blob);
      const compressedBlob = await compressImage(img);
      result.newSize = compressedBlob.size;

      // Upload da versão otimizada
      const fileName = `optimized_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from('platform-icons')
        .upload(fileName, compressedBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter nova URL
      const { data: urlData } = supabase.storage
        .from('platform-icons')
        .getPublicUrl(fileName);

      // Atualizar banco de dados
      const { error: updateError } = await supabase
        .from('platform_accesses')
        .update({ platform_icon_url: urlData.publicUrl })
        .eq('id', access.id);

      if (updateError) throw updateError;

      // Tentar deletar arquivo antigo (não-crítico)
      try {
        const oldPath = access.platform_icon_url.split('/platform-icons/')[1];
        if (oldPath) {
          await supabase.storage.from('platform-icons').remove([oldPath]);
        }
      } catch (deleteError) {
        console.warn('Não foi possível deletar ícone antigo:', deleteError);
      }

      return {
        ...result,
        status: 'success',
        newUrl: urlData.publicUrl,
      };
    } catch (error: any) {
      return {
        ...result,
        status: 'error',
        error: error.message || 'Erro desconhecido',
      };
    }
  };

  const startOptimization = async () => {
    try {
      setIsProcessing(true);
      setResults([]);
      setCurrentIndex(0);

      // Buscar todos os platform_accesses
      const accesses = await fetchIconStats();
      
      // Filtrar apenas não-WebP
      const toProcess = accesses.filter(access => 
        access.platform_icon_url && !access.platform_icon_url.includes('.webp')
      );

      if (toProcess.length === 0) {
        toast.success('Todos os ícones já estão otimizados!');
        return;
      }

      toast.info(`Iniciando otimização de ${toProcess.length} ícones...`);

      const processResults: IconOptimizationResult[] = [];

      for (let i = 0; i < toProcess.length; i++) {
        setCurrentIndex(i + 1);
        const result = await processIcon(toProcess[i]);
        processResults.push(result);
        setResults([...processResults]);

        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Atualizar estatísticas
      await fetchIconStats();

      const successCount = processResults.filter(r => r.status === 'success').length;
      const errorCount = processResults.filter(r => r.status === 'error').length;
      const skippedCount = processResults.filter(r => r.status === 'skipped').length;

      toast.success(
        `Otimização concluída! ✅ ${successCount} processados, ⏭️ ${skippedCount} pulados, ❌ ${errorCount} erros`
      );
    } catch (error: any) {
      toast.error(`Erro ao otimizar ícones: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const calculateSavings = (oldSize?: number, newSize?: number) => {
    if (!oldSize || !newSize) return '-';
    const saved = ((oldSize - newSize) / oldSize) * 100;
    return `${saved.toFixed(0)}%`;
  };

  const getStatusIcon = (status: IconOptimizationResult['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  const getStatusBadge = (status: IconOptimizationResult['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">Processando</Badge>;
      case 'success':
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300">Sucesso</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-700 dark:text-gray-300">Pulado</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-300">Erro</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total de Ícones</div>
          <div className="text-2xl font-bold">{totalCount}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Já Otimizados (WebP)</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{optimizedCount}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Pendentes de Otimização</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={startOptimization}
          disabled={isProcessing || pendingCount === 0}
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Iniciar Otimização
            </>
          )}
        </Button>
        
        {pendingCount === 0 && !isProcessing && (
          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300">
            ✅ Todos os ícones já estão otimizados!
          </Badge>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Processando: {currentIndex}/{pendingCount} ícones
            </span>
            <span className="text-muted-foreground">
              {Math.round((currentIndex / pendingCount) * 100)}%
            </span>
          </div>
          <Progress value={(currentIndex / pendingCount) * 100} />
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Antes</TableHead>
                <TableHead className="text-right">Depois</TableHead>
                <TableHead className="text-right">Economia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>{getStatusIcon(result.status)}</TableCell>
                  <TableCell className="font-medium">{result.platformName}</TableCell>
                  <TableCell>{getStatusBadge(result.status)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatSize(result.oldSize)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatSize(result.newSize)}
                  </TableCell>
                  <TableCell className="text-right">
                    {result.status === 'success' && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300">
                        ↓ {calculateSavings(result.oldSize, result.newSize)}
                      </Badge>
                    )}
                    {result.status === 'error' && result.error && (
                      <span className="text-xs text-red-600 dark:text-red-400">{result.error}</span>
                    )}
                    {result.status === 'skipped' && result.error && (
                      <span className="text-xs text-muted-foreground">{result.error}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
