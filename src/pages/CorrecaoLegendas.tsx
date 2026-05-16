import { useState, useRef, useEffect, useMemo } from 'react';
import { Captions, Upload, Download, Loader2, FileText, Languages } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// ============================================================
// Subtitle Correction tool
//   Internal page at /pos-producao/legendas
//
//   Upload SRT → choose target aspect ratio + language → Claude API
//   returns a cleaned-up SRT. Live preview mimics the DaVinci frame
//   so the user can see how the line breaks behave on 16:9 vs 9:16.
//
//   The actual LLM call lives in the `correct-subtitle` Edge Function
//   so we don't ship the Anthropic key to the client.
// ============================================================

type AspectRatio = '16:9' | '9:16';
type Language = 'pt-BR' | 'en' | 'es';

const LANG_LABELS: Record<Language, string> = {
  'pt-BR': 'Português (Brasil)',
  'en': 'English',
  'es': 'Español',
};

// Character-per-line limits sourced from Netflix's timed-text style
// guide (and matched against what fits visually on each frame ratio).
const MAX_CHARS_PER_LINE: Record<AspectRatio, number> = {
  '16:9': 42,
  '9:16': 28,
};

interface SrtCue {
  index: number;
  start: string;
  end: string;
  text: string;
}

function parseSrt(raw: string): SrtCue[] {
  const blocks = raw.replace(/\r\n/g, '\n').trim().split(/\n\n+/);
  const cues: SrtCue[] = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;
    const index = parseInt(lines[0].trim(), 10);
    const timing = lines[1].trim();
    const match = timing.match(/^(\S+)\s+-->\s+(\S+)/);
    if (!match) continue;
    const text = lines.slice(2).join('\n').trim();
    cues.push({ index, start: match[1], end: match[2], text });
  }
  return cues;
}

export default function CorrecaoLegendas() {
  const [file, setFile] = useState<File | null>(null);
  const [srtContent, setSrtContent] = useState<string>('');
  const [correctedSrt, setCorrectedSrt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [language, setLanguage] = useState<Language>('pt-BR');
  const [glossary, setGlossary] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview cycles through cues so the user can see how line breaks
  // behave across the whole subtitle, not just the first cue.
  const [previewIdx, setPreviewIdx] = useState(0);
  const previewCues = useMemo(() => parseSrt(correctedSrt || srtContent), [srtContent, correctedSrt]);
  const previewCue = previewCues[previewIdx] ?? null;

  useEffect(() => {
    if (previewIdx >= previewCues.length) setPreviewIdx(0);
  }, [previewCues.length, previewIdx]);

  function handleFile(f: File) {
    if (!f.name.toLowerCase().endsWith('.srt')) {
      toast.error('Selecione um arquivo .srt');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFile(f);
      setSrtContent(text);
      setCorrectedSrt('');
      setPreviewIdx(0);
    };
    reader.readAsText(f);
  }

  async function handleCorrect() {
    if (!srtContent) {
      toast.error('Faça upload de um SRT primeiro');
      return;
    }
    setIsCorrecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('correct-subtitle', {
        body: {
          srt: srtContent,
          aspectRatio,
          language,
          glossary: glossary.split('\n').map((s) => s.trim()).filter(Boolean),
          maxCharsPerLine: MAX_CHARS_PER_LINE[aspectRatio],
        },
      });
      if (error) throw error;
      if (!data?.srt) throw new Error('Resposta inválida do servidor');
      setCorrectedSrt(data.srt);
      setPreviewIdx(0);
      toast.success('Legenda corrigida!');
    } catch (err) {
      logger.error('subtitle correction failed', { error: err });
      toast.error('Erro ao corrigir legenda. Tente novamente.');
    } finally {
      setIsCorrecting(false);
    }
  }

  function handleDownload() {
    if (!correctedSrt) return;
    const blob = new Blob([correctedSrt], { type: 'application/x-subrip;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const base = file?.name.replace(/\.srt$/i, '') || 'legenda';
    a.download = `${base}-corrigido.srt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setFile(null);
    setSrtContent('');
    setCorrectedSrt('');
    setPreviewIdx(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Frame dimensions for the preview.
  const frame = aspectRatio === '16:9'
    ? { width: 480, height: 270 }
    : { width: 200, height: 356 };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            Pós-Produção
          </p>
          <h1
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 32,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'hsl(var(--ds-text))',
            }}
          >
            Correção de Legendas.
          </h1>
          <p style={{ fontSize: 14, color: 'hsl(var(--ds-fg-3))', marginTop: 6, maxWidth: 600 }}>
            Carregue um arquivo SRT — a Claude API corrige pontuação, quebra de linhas conforme o formato do vídeo e devolve um SRT pronto pro DaVinci Resolve.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 540px', gap: 24, alignItems: 'start' }}>
          {/* LEFT COLUMN — Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* File upload */}
            <Section title="Arquivo">
              {!file ? (
                <label
                  htmlFor="srt-upload"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    border: '1px dashed hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-bg))',
                    cursor: 'pointer',
                    transition: 'border-color 120ms, background 120ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--ds-text))';
                    e.currentTarget.style.background = 'hsl(var(--ds-surface))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                    e.currentTarget.style.background = 'hsl(var(--ds-bg))';
                  }}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) handleFile(f);
                  }}
                >
                  <Upload size={28} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'hsl(var(--ds-text))', marginBottom: 4 }}>
                    Clique pra escolher ou arraste o SRT
                  </p>
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>Formato .srt, até 1 MB</p>
                  <input
                    ref={fileInputRef}
                    id="srt-upload"
                    type="file"
                    accept=".srt"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </label>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 14px',
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-surface))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <FileText size={16} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: 'hsl(var(--ds-text))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                      <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                        {previewCues.length} legendas · {Math.round(file.size / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <button type="button" className="btn" onClick={clearAll}>
                    Trocar
                  </button>
                </div>
              )}
            </Section>

            {/* Format */}
            <Section title="Formato do vídeo">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <AspectChoice
                  active={aspectRatio === '16:9'}
                  onClick={() => setAspectRatio('16:9')}
                  ratio="16:9"
                  label="Horizontal"
                  hint="YouTube, TV, web"
                />
                <AspectChoice
                  active={aspectRatio === '9:16'}
                  onClick={() => setAspectRatio('9:16')}
                  ratio="9:16"
                  label="Vertical"
                  hint="Reels, Shorts, TikTok"
                />
              </div>
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 10 }}>
                Limite por linha: <strong style={{ color: 'hsl(var(--ds-text))', fontVariantNumeric: 'tabular-nums' }}>{MAX_CHARS_PER_LINE[aspectRatio]} caracteres</strong> · máx 2 linhas
              </p>
            </Section>

            {/* Language */}
            <Section title="Idioma da fala">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
                <Languages size={16} strokeWidth={1.5} color="hsl(var(--ds-fg-3))" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 0,
                    outline: 'none',
                    fontSize: 13,
                    color: 'hsl(var(--ds-text))',
                    cursor: 'pointer',
                  }}
                >
                  {Object.entries(LANG_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>
            </Section>

            {/* Glossary */}
            <Section title="Glossário (opcional)">
              <textarea
                value={glossary}
                onChange={(e) => setGlossary(e.target.value)}
                placeholder="Nomes próprios e termos técnicos, um por linha&#10;Ex:&#10;Hiro Films&#10;DaVinci&#10;Yuji Tinen"
                rows={4}
                style={{
                  width: '100%',
                  padding: 12,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: 'hsl(var(--ds-text))',
                  background: 'hsl(var(--ds-surface))',
                  border: '1px solid hsl(var(--ds-line-1))',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </Section>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn primary"
                disabled={!srtContent || isCorrecting}
                onClick={handleCorrect}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {isCorrecting ? (
                  <>
                    <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                    <span>Corrigindo...</span>
                  </>
                ) : (
                  <>
                    <Captions size={14} strokeWidth={1.5} />
                    <span>Corrigir legenda</span>
                  </>
                )}
              </button>
              {correctedSrt && (
                <button type="button" className="btn" onClick={handleDownload}>
                  <Download size={14} strokeWidth={1.5} />
                  <span>Baixar .srt</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 24 }}>
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500 }}>
              Preview ({aspectRatio})
            </p>
            <div
              style={{
                width: frame.width,
                height: frame.height,
                margin: '0 auto',
                background: '#2a2a2a',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                padding: aspectRatio === '16:9' ? '0 24px 24px' : '0 12px 60px',
              }}
            >
              {previewCue ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: 'white',
                    fontSize: aspectRatio === '16:9' ? 16 : 14,
                    fontFamily: '"HN Display", sans-serif',
                    fontWeight: 500,
                    lineHeight: 1.25,
                    textShadow: '0 0 4px rgba(0,0,0,0.95), 1px 1px 2px rgba(0,0,0,0.95)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {previewCue.text}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontStyle: 'italic' }}>
                  Carregue um SRT pra ver o preview
                </p>
              )}
            </div>

            {previewCues.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn sm"
                  disabled={previewIdx === 0}
                  onClick={() => setPreviewIdx((i) => Math.max(0, i - 1))}
                >
                  ←
                </button>
                <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums', minWidth: 80, textAlign: 'center' }}>
                  Cue {previewIdx + 1} / {previewCues.length}
                </span>
                <button
                  type="button"
                  className="btn sm"
                  disabled={previewIdx >= previewCues.length - 1}
                  onClick={() => setPreviewIdx((i) => Math.min(previewCues.length - 1, i + 1))}
                >
                  →
                </button>
              </div>
            )}

            {previewCue && (
              <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                {previewCue.start} → {previewCue.end}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Small helpers — local so the page stays self-contained.
// ============================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          color: 'hsl(var(--ds-fg-3))',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 500,
          marginBottom: 8,
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function AspectChoice({
  active,
  onClick,
  ratio,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  ratio: '16:9' | '9:16';
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: active ? 'hsl(var(--ds-text))' : 'hsl(var(--ds-surface))',
        color: active ? 'hsl(var(--ds-surface))' : 'hsl(var(--ds-text))',
        border: '1px solid',
        borderColor: active ? 'hsl(var(--ds-text))' : 'hsl(var(--ds-line-1))',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 120ms, color 120ms, border-color 120ms',
      }}
    >
      <div
        aria-hidden
        style={{
          width: ratio === '16:9' ? 32 : 18,
          height: ratio === '16:9' ? 18 : 32,
          border: '1.5px solid currentColor',
          flexShrink: 0,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, fontFamily: '"HN Display", sans-serif' }}>{label} · {ratio}</p>
        <p style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{hint}</p>
      </div>
    </button>
  );
}
