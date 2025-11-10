import { useState, useRef } from 'react';
import { 
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Download, AlertCircle, CheckCircle, FileText, FileSpreadsheet } from 'lucide-react';
import { parseCSV, parseExcel, generateTemplate, ImportResult, ImportError } from '@/lib/csvParser';
import { useToast } from '@/hooks/use-toast';
import { importDebug } from '@/lib/debug';
import { MobileFriendlyForm, MobileFriendlyFormActions } from '@/components/ui/mobile-friendly-form';
import { useIsMobile } from '@/hooks/use-mobile';

interface ImportSummary {
  totalParsed: number;
  mainsNew: number;
  accessoriesNew: number;
  mainsExisting: number;
  accessoriesExisting: number;
  skippedMissingParent: number;
  errors: string[];
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (equipment: any[]) => Promise<ImportSummary>;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo CSV ou Excel.",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setImportResult(null);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let result: ImportResult;

      if (fileExtension === 'csv') {
        result = await parseCSV(file);
      } else {
        result = await parseExcel(file);
      }

      setImportResult(result);
      setStep('preview');
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar o arquivo.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importResult?.data?.length) return;

    setIsProcessing(true);
    try {
      importDebug('Starting import of items', { count: importResult.data.length });
      const summary = await onImport(importResult.data);
      setImportSummary(summary);
      setStep('complete');
      importDebug('Import completed successfully', summary);
    } catch (error) {
      importDebug('Import failed', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : 'Erro desconhecido na importação',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setImportSummary(null);
    setStep('upload');
    setIsProcessing(false);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = generateTemplate();
    // Add BOM for UTF-8 encoding (ensures correct display of accents in Excel)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_equipamentos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-semibold">Importar Equipamentos</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Faça upload de um arquivo CSV ou Excel com os dados dos equipamentos
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="file-upload">Selecionar arquivo</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="mt-1"
          />
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            O arquivo deve conter as colunas: Nome*, Marca*, Categoria* (* obrigatórios)
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Template
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    if (!importResult) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Prévia da Importação</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              <FileText className="h-3 w-3" />
              {importResult.totalRows} linhas
            </Badge>
            <Badge variant={importResult.successRows > 0 ? "default" : "destructive"} className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {importResult.successRows} válidos
            </Badge>
            {importResult.errors.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {importResult.errors.length} erros
              </Badge>
            )}
          </div>
        </div>

        {importResult.successRows > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Equipamentos válidos ({importResult.successRows})</h4>
            <div className="text-xs text-muted-foreground mb-2">
              • {importResult.data.filter(item => item.itemType === 'main').length} itens principais
              • {importResult.data.filter(item => item.itemType === 'accessory').length} acessórios
            </div>
            <ScrollArea className="h-40 border rounded-md p-2">
              <div className="space-y-1">
                {importResult.data.slice(0, 10).map((equipment, index) => (
                  <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{equipment.itemType === 'main' ? '📦' : '🔧'}</span>
                      <div>
                        <span className="font-medium">{equipment.name}</span> - {equipment.brand}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {equipment.category}
                        </Badge>
                        {equipment.patrimonyNumber && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            #{equipment.patrimonyNumber}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {importResult.data.length > 10 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    ... e mais {importResult.data.length - 10} equipamentos
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {importResult.errors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-destructive">Erros encontrados ({importResult.errors.length})</h4>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-1">
                {importResult.errors.map((error, index) => (
                  <div key={index} className="text-sm p-2 bg-destructive/10 rounded border border-destructive/20">
                    <span className="font-medium">Linha {error.row}</span> - {error.field}: {error.message}
                    {error.value && <span className="text-muted-foreground"> (valor: "{error.value}")</span>}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator />

        <MobileFriendlyFormActions>
          <Button variant="outline" onClick={() => setStep('upload')}>
            Voltar
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={importResult.successRows === 0 || isProcessing}
          >
            {isProcessing ? 'Importando...' : `Importar (${importResult.successRows})`}
          </Button>
        </MobileFriendlyFormActions>
      </div>
    );
  };

  const renderCompleteStep = () => {
    if (!importSummary) return null;
    
    const totalNew = importSummary.mainsNew + importSummary.accessoriesNew;
    const totalExisting = importSummary.mainsExisting + importSummary.accessoriesExisting;
    
    return (
      <div className="text-center space-y-6">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
        <div>
          <h3 className="text-lg font-semibold">Importação Concluída!</h3>
          <p className="text-muted-foreground mt-2">
            Os equipamentos foram processados com sucesso
          </p>
        </div>

        <div className="space-y-3 text-left max-w-md mx-auto">
          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <span className="text-sm font-medium">Novos inseridos:</span>
            <Badge variant="default" className="bg-green-600">
              {totalNew} ({importSummary.mainsNew} principais, {importSummary.accessoriesNew} acessórios)
            </Badge>
          </div>

          {totalExisting > 0 && (
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-sm font-medium">Já cadastrados:</span>
              <Badge variant="secondary">
                {totalExisting} ({importSummary.mainsExisting} principais, {importSummary.accessoriesExisting} acessórios)
              </Badge>
            </div>
          )}

          {importSummary.skippedMissingParent > 0 && (
            <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <span className="text-sm font-medium">Acessórios ignorados:</span>
              <Badge variant="outline" className="border-orange-500 text-orange-700 dark:text-orange-400">
                {importSummary.skippedMissingParent} (sem item principal)
              </Badge>
            </div>
          )}

          {importSummary.errors.length > 0 && (
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm font-medium text-destructive mb-2">Avisos:</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                {importSummary.errors.slice(0, 5).map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
                {importSummary.errors.length > 5 && (
                  <li>• ... e mais {importSummary.errors.length - 5} avisos</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <Button onClick={handleClose} className="w-full max-w-xs">
          Fechar
        </Button>
      </div>
    );
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent className={isMobile ? "" : "max-w-2xl max-h-[80vh]"}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Equipamentos
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processando arquivo...</span>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {!isProcessing && (
          <>
            {step === 'upload' && renderUploadStep()}
            {step === 'preview' && renderPreviewStep()}
            {step === 'complete' && renderCompleteStep()}
          </>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}