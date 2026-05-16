import { useRef, useState } from 'react';
import { Upload, FileText, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { parseSrt } from '../utils/parseSrt';
import type { SrtCue } from '../types';

interface Props {
  srt: string | null;
  cues: SrtCue[];
  fileName: string | null;
  onUpload: (srt: string, cues: SrtCue[], fileName: string) => void;
  onReset: () => void;
  onNext: () => void;
}

export function Step1Upload({ srt, cues, fileName, onUpload, onReset, onNext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.srt')) {
      toast.error('Apenas arquivos .srt são aceitos');
      return;
    }
    if (file.size > 1_000_000) {
      toast.error('Arquivo muito grande (máx 1MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      const parsed = parseSrt(content);
      if (parsed.length === 0) {
        toast.error('Não consegui parsear o SRT. Verifique o formato.');
        return;
      }
      onUpload(content, parsed, file.name);
    };
    reader.onerror = () => toast.error('Erro lendo arquivo');
    reader.readAsText(file, 'utf-8');
  };

  const durationMs = cues.length > 0 ? cues[cues.length - 1].endMs - cues[0].startMs : 0;
  const durationStr = (() => {
    const total = Math.floor(durationMs / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  })();
  const totalChars = cues.reduce((sum, c) => sum + c.text.length, 0);

  if (!srt) {
    return (
      <div>
        <Section title="Arquivo">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '60px 24px',
              border: `1px ${dragging ? 'solid' : 'dashed'} hsl(var(--ds-line-${dragging ? '2' : '1'}))`,
              background: dragging ? 'hsl(var(--ds-bg-2))' : 'hsl(var(--ds-surface))',
              cursor: 'pointer',
              transition: 'border-color 100ms, background 100ms',
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".srt"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />
            <Upload size={28} strokeWidth={1.25} style={{ color: 'hsl(var(--ds-fg-3))' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: '"HN Display", sans-serif', fontWeight: 500, fontSize: 14, margin: 0, color: 'hsl(var(--ds-text))' }}>
                Clique pra escolher ou arraste o SRT
              </p>
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', margin: '4px 0 0', fontFamily: '"HN Text", sans-serif' }}>
                Formato .srt, até 1 MB
              </p>
            </div>
          </label>
        </Section>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Arquivo">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '14px 16px',
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <FileText size={20} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontFamily: '"HN Display", sans-serif',
                  fontWeight: 500,
                  fontSize: 13,
                  margin: 0,
                  color: 'hsl(var(--ds-text))',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {fileName ?? 'legenda.srt'}
              </p>
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', margin: '2px 0 0', fontFamily: '"HN Text", sans-serif' }}>
                {(srt.length / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button type="button" className="btn sm" onClick={onReset} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={12} strokeWidth={1.5} />
            Trocar
          </button>
        </div>
      </Section>

      <Section title="Resumo">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'hsl(var(--ds-line-1))',
            border: '1px solid hsl(var(--ds-line-1))',
          }}
        >
          <Stat label="Legendas" value={String(cues.length)} />
          <Stat label="Duração" value={durationStr} />
          <Stat label="Caracteres" value={totalChars.toLocaleString('pt-BR')} />
        </div>
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
            maxHeight: 180,
            overflow: 'auto',
            fontFamily: '"HN Text", sans-serif',
            fontSize: 11,
            color: 'hsl(var(--ds-fg-2))',
            lineHeight: 1.5,
          }}
        >
          {cues.slice(0, 5).map((c) => (
            <div key={c.index} style={{ display: 'flex', gap: 12, padding: '4px 0' }}>
              <span style={{ color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                #{c.index}
              </span>
              <span style={{ color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                {c.startStr.slice(0, 8)}
              </span>
              <span style={{ whiteSpace: 'pre-line' }}>{c.text}</span>
            </div>
          ))}
          {cues.length > 5 && (
            <p style={{ margin: '8px 0 0', color: 'hsl(var(--ds-fg-3))', fontSize: 10 }}>
              … + {cues.length - 5} legendas
            </p>
          )}
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn primary" onClick={onNext}>
          Configurar →
        </button>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '14px 16px', background: 'hsl(var(--ds-surface))' }}>
      <p
        style={{
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'hsl(var(--ds-fg-3))',
          margin: 0,
          fontFamily: '"HN Display", sans-serif',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: '"HN Display", sans-serif',
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: '-0.01em',
          margin: '4px 0 0',
          color: 'hsl(var(--ds-text))',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
    </div>
  );
}
