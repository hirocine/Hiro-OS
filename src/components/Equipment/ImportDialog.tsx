import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (equipment: any[]) => void;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const handleImport = () => {
    if (importResult?.data) {
      onImport(importResult.data);
      setStep('complete');
      toast({
        title: "Importação concluída",
        description: `${importResult.successRows} equipamentos importados com sucesso.`,
      });
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setStep('upload');
    setIsProcessing(false);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = generateTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
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
            O arquivo deve conter as colunas: Nome*, Marca*, Modelo*, Categoria* (* obrigatórios)
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
            <ScrollArea className="h-40 border rounded-md p-2">
              <div className="space-y-1">
                {importResult.data.slice(0, 10).map((equipment, index) => (
                  <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                    <span className="font-medium">{equipment.name}</span> - {equipment.brand} {equipment.model}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {equipment.category}
                    </Badge>
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {importResult.successRows > 0 
              ? `${importResult.successRows} equipamentos serão importados`
              : 'Nenhum equipamento válido para importar'
            }
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Voltar
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={importResult.successRows === 0}
            >
              Importar ({importResult.successRows})
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
      <div>
        <h3 className="text-lg font-semibold">Importação Concluída!</h3>
        <p className="text-muted-foreground">
          {importResult?.successRows} equipamentos foram importados com sucesso.
        </p>
      </div>
      <Button onClick={handleClose}>
        Fechar
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Equipamentos
          </DialogTitle>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}