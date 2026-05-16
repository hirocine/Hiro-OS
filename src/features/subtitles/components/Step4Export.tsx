import { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { LivePreview } from './LivePreview';
import { exportCues, downloadFile } from '../utils/export';
import {
  EXPORT_FORMAT_LABELS,
  EXPORT_FORMAT_HINTS,
  type ExportFormat,
  type SubtitleStyle,
  type SrtCue,
} from '../types';

interface Props {
  cues: SrtCue[];
  style: SubtitleStyle;
  onBack: () => void;
  onReset: () => void;
}

const FORMATS: ExportFormat[] = ['srt', 'srt-html', 'ass'];

export function Step4Export({ cues, style, onBack, onReset }: Props) {
  const [format, setFormat] = useState<ExportFormat>('srt');
  const [copied, setCopied] = useState(false);

  const preview = exportCues(cues, style, format);

  const handleDownload = () => {
    downloadFile(preview.content, preview.filename, preview.mime);
    toast.success(`${preview.filename} baixado`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview.content);
      setCopied(true);
      toast.success('Copiado pra área de transferência');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Erro copiando');
    }
  };

  const firstWrappedCue = cues[0]?.text ?? 'Exemplo';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        <Section title="Formato de saída">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FORMATS.map((f) => {
              const isSelected = format === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 14px',
                    background: isSelected ? 'hsl(var(--ds-text))' : 'hsl(var(--ds-surface))',
                    color: isSelected ? 'hsl(var(--ds-surface))' : 'hsl(var(--ds-text))',
                    border: '1px solid',
                    borderColor: isSelected ? 'hsl(var(--ds-text))' : 'hsl(var(--ds-line-1))',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: `1px solid ${isSelected ? 'hsl(var(--ds-surface))' : 'hsl(var(--ds-fg-3))'}`,
                      flexShrink: 0,
                      marginTop: 2,
                      position: 'relative',
                    }}
                  >
                    {isSelected && (
                      <span
                        style={{
                          position: 'absolute',
                          inset: 3,
                          background: 'hsl(var(--ds-surface))',
                          borderRadius: '50%',
                        }}
                      />
                    )}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: '"HN Display", sans-serif',
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      {EXPORT_FORMAT_LABELS[f]}
                    </p>
                    <p
                      style={{
                        margin: '3px 0 0',
                        fontSize: 11,
                        fontFamily: '"HN Text", sans-serif',
                        opacity: 0.8,
                      }}
                    >
                      {EXPORT_FORMAT_HINTS[f]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title={`Conteúdo · ${preview.filename}`}>
          <pre
            style={{
              margin: 0,
              padding: '12px 14px',
              background: 'hsl(var(--ds-bg-2))',
              border: '1px solid hsl(var(--ds-line-1))',
              maxHeight: 280,
              overflow: 'auto',
              fontSize: 11,
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
              color: 'hsl(var(--ds-fg-2))',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {preview.content.length > 4000
              ? preview.content.slice(0, 4000) + `\n\n... [+${preview.content.length - 4000} caracteres]`
              : preview.content}
          </pre>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn" onClick={onBack}>
            ← Voltar
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={handleCopy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button type="button" className="btn" onClick={onReset}>
              Nova legenda
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleDownload}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Download size={14} strokeWidth={1.5} />
              Baixar
            </button>
          </div>
        </div>
      </div>

      <div style={{ position: 'sticky', top: 16, alignSelf: 'start' }}>
        <p
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'hsl(var(--ds-fg-3))',
            margin: '0 0 10px',
          }}
        >
          Preview final
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LivePreview style={style} text={firstWrappedCue.replace(/\n/g, '\n')} caption={`Cue #${cues[0]?.index ?? 1}`} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'hsl(var(--ds-fg-3))',
          margin: '0 0 10px',
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
