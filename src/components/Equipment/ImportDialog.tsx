import { useState, useRef } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  FileText,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { parseCSV, parseExcel, generateTemplate, ImportResult } from '@/lib/csvParser';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { MobileFriendlyFormActions } from '@/components/ui/mobile-friendly-form';
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

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

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
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo CSV ou Excel.',
          variant: 'destructive',
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
        title: 'Erro no processamento',
        description: 'Ocorreu um erro ao processar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importResult?.data?.length) return;

    setIsProcessing(true);
    try {
      logger.debug('Starting import of items', {
        module: 'import',
        data: { count: importResult.data.length },
      });
      const summary = await onImport(importResult.data);
      setImportSummary(summary);
      setStep('complete');
      logger.debug('Import completed successfully', {
        module: 'import',
        data: {
          totalParsed: summary.totalParsed,
          mainsNew: summary.mainsNew,
          accessoriesNew: summary.accessoriesNew,
          mainsExisting: summary.mainsExisting,
          accessoriesExisting: summary.accessoriesExisting,
          skippedMissingParent: summary.skippedMissingParent,
          errorsCount: summary.errors.length,
        },
      });
    } catch (error) {
      logger.error('Import failed', {
        module: 'import',
        error: error as Error,
      });
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido na importação',
        variant: 'destructive',
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
    const BOM = '﻿';
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

  // ---------- STEP: UPLOAD ----------
  const renderUploadStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8 }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: 56,
            height: 56,
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-line-2) / 0.3)',
            color: 'hsl(var(--ds-fg-3))',
            marginBottom: 12,
          }}
        >
          <Upload size={22} strokeWidth={1.5} />
        </div>
        <h3
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: 'hsl(var(--ds-fg-1))',
          }}
        >
          Importar Equipamentos
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'hsl(var(--ds-fg-3))',
            marginTop: 4,
          }}
        >
          Faça upload de um arquivo CSV ou Excel com os dados dos equipamentos
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label htmlFor="file-upload" style={fieldLabel}>
            Selecionar arquivo
          </label>
          <Input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 12,
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-info) / 0.06)',
            color: 'hsl(var(--ds-fg-2))',
            fontSize: 13,
          }}
        >
          <AlertCircle
            size={15}
            strokeWidth={1.5}
            style={{ color: 'hsl(var(--ds-info))', marginTop: 1, flexShrink: 0 }}
          />
          <span>
            O arquivo deve conter as colunas: <strong>Nome*</strong>, <strong>Marca*</strong>,{' '}
            <strong>Categoria*</strong> (* obrigatórios)
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" className="btn" onClick={downloadTemplate}>
            <Download size={13} strokeWidth={1.5} />
            <span>Baixar Template</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ---------- STEP: PREVIEW ----------
  const renderPreviewStep = () => {
    if (!importResult) return null;

    const mainsCount = importResult.data.filter((item) => item.itemType === 'main').length;
    const accessoriesCount = importResult.data.filter((item) => item.itemType === 'accessory').length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <h3
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: 'hsl(var(--ds-fg-1))',
            }}
          >
            Prévia da Importação
          </h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="pill muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <FileText size={11} strokeWidth={1.5} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{importResult.totalRows} linhas</span>
            </span>
            <span
              className="pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: importResult.successRows > 0 ? 'hsl(var(--ds-success))' : 'hsl(var(--ds-danger))',
                borderColor:
                  importResult.successRows > 0 ? 'hsl(var(--ds-success) / 0.3)' : 'hsl(var(--ds-danger) / 0.3)',
                background:
                  importResult.successRows > 0 ? 'hsl(var(--ds-success) / 0.08)' : 'hsl(var(--ds-danger) / 0.08)',
              }}
            >
              <CheckCircle size={11} strokeWidth={1.5} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{importResult.successRows} válidos</span>
            </span>
            {importResult.errors.length > 0 && (
              <span
                className="pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: 'hsl(var(--ds-danger))',
                  borderColor: 'hsl(var(--ds-danger) / 0.3)',
                  background: 'hsl(var(--ds-danger) / 0.08)',
                }}
              >
                <AlertCircle size={11} strokeWidth={1.5} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{importResult.errors.length} erros</span>
              </span>
            )}
          </div>
        </div>

        {importResult.successRows > 0 && (
          <div>
            <div style={fieldLabel}>Equipamentos válidos ({importResult.successRows})</div>
            <div style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginBottom: 6, fontVariantNumeric: 'tabular-nums' }}>
              · {mainsCount} itens principais · {accessoriesCount} acessórios
            </div>
            <ScrollArea className="h-40" style={{ border: '1px solid hsl(var(--ds-line-1))' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {importResult.data.slice(0, 10).map((equipment, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      fontSize: 13,
                      borderBottom:
                        index < Math.min(importResult.data.length, 10) - 1
                          ? '1px solid hsl(var(--ds-line-1))'
                          : undefined,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>
                      {equipment.itemType === 'main' ? '📦' : '🔧'}
                    </span>
                    <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{equipment.name}</span>
                    <span style={{ color: 'hsl(var(--ds-fg-3))' }}>— {equipment.brand}</span>
                    <span className="pill muted" style={{ fontSize: 10 }}>
                      {equipment.category}
                    </span>
                    {equipment.patrimonyNumber && (
                      <span
                        className="pill"
                        style={{
                          fontSize: 10,
                          background: 'hsl(var(--ds-line-2))',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        #{equipment.patrimonyNumber}
                      </span>
                    )}
                  </div>
                ))}
                {importResult.data.length > 10 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'hsl(var(--ds-fg-3))',
                      textAlign: 'center',
                      padding: '10px 0',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    ... e mais {importResult.data.length - 10} equipamentos
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {importResult.errors.length > 0 && (
          <div>
            <div style={{ ...fieldLabel, color: 'hsl(var(--ds-danger))' }}>
              Erros encontrados ({importResult.errors.length})
            </div>
            <ScrollArea className="h-32" style={{ border: '1px solid hsl(var(--ds-danger) / 0.3)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {importResult.errors.map((error, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 10px',
                      fontSize: 12,
                      color: 'hsl(var(--ds-fg-2))',
                      background: 'hsl(var(--ds-danger) / 0.06)',
                      borderBottom:
                        index < importResult.errors.length - 1
                          ? '1px solid hsl(var(--ds-danger) / 0.2)'
                          : undefined,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: 'hsl(var(--ds-danger))', fontVariantNumeric: 'tabular-nums' }}>
                      Linha {error.row}
                    </span>{' '}
                    — {error.field}: {error.message}
                    {error.value && (
                      <span style={{ color: 'hsl(var(--ds-fg-3))' }}> (valor: "{error.value}")</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <div style={{ borderTop: '1px solid hsl(var(--ds-line-1))', paddingTop: 12 }}>
          <MobileFriendlyFormActions>
            <button type="button" className="btn" onClick={() => setStep('upload')}>
              Voltar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleImport}
              disabled={importResult.successRows === 0 || isProcessing}
            >
              {isProcessing && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />}
              <span>{isProcessing ? 'Importando...' : `Importar (${importResult.successRows})`}</span>
            </button>
          </MobileFriendlyFormActions>
        </div>
      </div>
    );
  };

  // ---------- STEP: COMPLETE ----------
  const renderCompleteStep = () => {
    if (!importSummary) return null;

    const totalNew = importSummary.mainsNew + importSummary.accessoriesNew;
    const totalExisting = importSummary.mainsExisting + importSummary.accessoriesExisting;

    const SummaryRow = ({
      label,
      value,
      tone,
    }: {
      label: string;
      value: React.ReactNode;
      tone: 'success' | 'info' | 'warning' | 'danger';
    }) => {
      const color = `hsl(var(--ds-${tone}))`;
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            border: `1px solid hsl(var(--ds-${tone}) / 0.3)`,
            background: `hsl(var(--ds-${tone}) / 0.06)`,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{label}</span>
          <span
            className="pill"
            style={{
              color,
              borderColor: `hsl(var(--ds-${tone}) / 0.3)`,
              background: `hsl(var(--ds-${tone}) / 0.1)`,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </span>
        </div>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 8, textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 56,
              height: 56,
              border: '1px solid hsl(var(--ds-success) / 0.3)',
              background: 'hsl(var(--ds-success) / 0.08)',
              color: 'hsl(var(--ds-success))',
            }}
          >
            <CheckCircle size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
              }}
            >
              Importação Concluída!
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
              Os equipamentos foram processados com sucesso
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            textAlign: 'left',
            maxWidth: 420,
            margin: '0 auto',
            width: '100%',
          }}
        >
          <SummaryRow
            label="Novos inseridos"
            tone="success"
            value={`${totalNew} (${importSummary.mainsNew} principais, ${importSummary.accessoriesNew} acessórios)`}
          />

          {totalExisting > 0 && (
            <SummaryRow
              label="Já cadastrados"
              tone="info"
              value={`${totalExisting} (${importSummary.mainsExisting} principais, ${importSummary.accessoriesExisting} acessórios)`}
            />
          )}

          {importSummary.skippedMissingParent > 0 && (
            <SummaryRow
              label="Acessórios ignorados"
              tone="warning"
              value={`${importSummary.skippedMissingParent} (sem item principal)`}
            />
          )}

          {importSummary.errors.length > 0 && (
            <div
              style={{
                padding: 12,
                border: '1px solid hsl(var(--ds-danger) / 0.3)',
                background: 'hsl(var(--ds-danger) / 0.06)',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'hsl(var(--ds-danger))',
                  marginBottom: 6,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Avisos
              </p>
              <ul style={{ fontSize: 12, color: 'hsl(var(--ds-fg-2))', listStyle: 'none', padding: 0, margin: 0 }}>
                {importSummary.errors.slice(0, 5).map((error, idx) => (
                  <li key={idx} style={{ padding: '2px 0' }}>
                    · {error}
                  </li>
                ))}
                {importSummary.errors.length > 5 && (
                  <li style={{ padding: '2px 0', color: 'hsl(var(--ds-fg-3))' }}>
                    · ... e mais {importSummary.errors.length - 5} avisos
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" className="btn primary" onClick={handleClose} style={{ minWidth: 160 }}>
            Fechar
          </button>
        </div>
      </div>
    );
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent className={isMobile ? '' : 'max-w-2xl max-h-[80vh]'}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: '"HN Display", sans-serif',
              }}
            >
              <FileSpreadsheet size={16} strokeWidth={1.5} />
              <span>Importar Equipamentos</span>
            </span>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        {isProcessing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'hsl(var(--ds-fg-2))',
              }}
            >
              <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
              <span>Processando arquivo...</span>
            </div>
            <div
              style={{
                position: 'relative',
                height: 4,
                background: 'hsl(var(--ds-line-2))',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '40%',
                  background: 'hsl(var(--ds-accent))',
                  animation: 'indeterminate 1.4s ease-in-out infinite',
                }}
              />
              <style>{`
                @keyframes indeterminate {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(350%); }
                }
              `}</style>
            </div>
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
