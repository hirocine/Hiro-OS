import { useMemo, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PresetSelector } from './PresetSelector';
import { StyleSettings } from './StyleSettings';
import { LivePreview } from './LivePreview';
import { presetToStyle, defaultStyleForAspect } from '../hooks/useSubtitlePresets';
import {
  LANGUAGE_LABELS,
  ASPECT_LABELS,
  ASPECT_HINTS,
  type SubtitlePreset,
  type SubtitleStyle,
  type SupportedLanguage,
  type AspectRatio,
  type SrtCue,
} from '../types';

interface Props {
  cues: SrtCue[];
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  style: SubtitleStyle;
  glossary: string;
  selectedPresetId: string | null;
  onChange: (next: {
    sourceLanguage: SupportedLanguage;
    targetLanguage: SupportedLanguage;
    style: SubtitleStyle;
    glossary: string;
    selectedPresetId: string | null;
  }) => void;
  onBack: () => void;
  onProcess: () => void;
  processing: boolean;
}

const ASPECT_OPTIONS: AspectRatio[] = ['16:9', '9:16', '1:1', '4:5'];
const LANG_OPTIONS = Object.keys(LANGUAGE_LABELS) as SupportedLanguage[];

export function Step2Configure({
  cues,
  sourceLanguage,
  targetLanguage,
  style,
  glossary,
  selectedPresetId,
  onChange,
  onBack,
  onProcess,
  processing,
}: Props) {
  const sampleCue = cues[0]?.text ?? 'Esta é uma legenda de exemplo';

  const update = (partial: Partial<Props['onChange'] extends (x: infer A) => void ? A : never>) =>
    onChange({
      sourceLanguage,
      targetLanguage,
      style,
      glossary,
      selectedPresetId,
      ...partial,
    });

  const setAspect = (aspect: AspectRatio) => {
    if (style.aspect_ratio === aspect) return;
    update({ style: defaultStyleForAspect(aspect), selectedPresetId: null });
  };

  const setStyle = (s: SubtitleStyle) => {
    update({ style: s, selectedPresetId: null });
  };

  const setPreset = (p: SubtitlePreset | null) => {
    if (p) update({ style: presetToStyle(p), selectedPresetId: p.id });
    else update({ selectedPresetId: null });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        <Section title="Idiomas">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Fala (idioma original)">
              <Select value={sourceLanguage} onValueChange={(v) => update({ sourceLanguage: v as SupportedLanguage })}>
                <SelectTrigger className="ds-select-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="ds-shell">
                  {LANG_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {LANGUAGE_LABELS[l]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Legenda (idioma de saída)">
              <Select value={targetLanguage} onValueChange={(v) => update({ targetLanguage: v as SupportedLanguage })}>
                <SelectTrigger className="ds-select-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="ds-shell">
                  {LANG_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {LANGUAGE_LABELS[l]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {sourceLanguage !== targetLanguage && (
            <p
              style={{
                marginTop: 8,
                fontSize: 11,
                color: 'hsl(var(--ds-info))',
                fontFamily: '"HN Text", sans-serif',
              }}
            >
              Idiomas diferentes — Claude vai traduzir + corrigir.
            </p>
          )}
        </Section>

        <Section title="Formato do vídeo">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {ASPECT_OPTIONS.map((a) => {
              const isSelected = style.aspect_ratio === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAspect(a)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 8px',
                    background: isSelected ? 'hsl(var(--ds-text))' : 'hsl(var(--ds-surface))',
                    color: isSelected ? 'hsl(var(--ds-surface))' : 'hsl(var(--ds-text))',
                    border: '1px solid',
                    borderColor: isSelected ? 'hsl(var(--ds-text))' : 'hsl(var(--ds-line-1))',
                    cursor: 'pointer',
                    fontFamily: '"HN Display", sans-serif',
                    fontWeight: 500,
                    fontSize: 12,
                  }}
                >
                  <AspectIcon aspect={a} isSelected={isSelected} />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{ASPECT_LABELS[a]}</span>
                  <span style={{ fontSize: 9, opacity: 0.7, fontFamily: '"HN Text", sans-serif' }}>
                    {ASPECT_HINTS[a]}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Preset">
          <PresetSelector
            aspectRatio={style.aspect_ratio}
            selectedPresetId={selectedPresetId}
            currentStyle={style}
            onSelect={setPreset}
          />
        </Section>

        <Section title="Ajustes finos">
          <StyleSettings style={style} onChange={setStyle} />
        </Section>

        <Section title="Glossário (opcional)">
          <textarea
            value={glossary}
            onChange={(e) => update({ glossary: e.target.value })}
            placeholder="Nomes próprios e termos técnicos, um por linha
Ex: Hiro Films
DaVinci
Yuji Tinen"
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 12,
              fontFamily: '"HN Text", sans-serif',
              background: 'hsl(var(--ds-surface))',
              border: '1px solid hsl(var(--ds-line-1))',
              color: 'hsl(var(--ds-text))',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.5,
            }}
          />
        </Section>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button type="button" className="btn" onClick={onBack} disabled={processing}>
            ← Voltar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={onProcess}
            disabled={processing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {processing ? (
              <>
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles size={14} strokeWidth={1.5} />
                Processar com Claude
              </>
            )}
          </button>
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
          Preview ao vivo
        </p>
        <PreviewSampler cues={cues} style={style} fallback={sampleCue} />
      </div>
    </div>
  );
}

function PreviewSampler({ cues, style, fallback }: { cues: SrtCue[]; style: SubtitleStyle; fallback: string }) {
  const [idx, setIdx] = useState(0);
  const current = cues[idx]?.text ?? fallback;
  const wrappedSample = useMemo(() => wrapLines(current, style.chars_per_line, style.max_lines), [current, style.chars_per_line, style.max_lines]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <LivePreview style={style} text={wrappedSample} />
      {cues.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn sm icon"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            aria-label="Cue anterior"
          >
            ←
          </button>
          <span
            style={{
              fontSize: 11,
              fontFamily: '"HN Text", sans-serif',
              color: 'hsl(var(--ds-fg-3))',
              fontVariantNumeric: 'tabular-nums',
              minWidth: 60,
              textAlign: 'center',
            }}
          >
            {idx + 1} / {cues.length}
          </span>
          <button
            type="button"
            className="btn sm icon"
            onClick={() => setIdx((i) => Math.min(cues.length - 1, i + 1))}
            disabled={idx >= cues.length - 1}
            aria-label="Próxima cue"
          >
            →
          </button>
        </div>
      )}
      <p
        style={{
          fontSize: 10,
          color: 'hsl(var(--ds-fg-3))',
          fontFamily: '"HN Text", sans-serif',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Quebras de linha simuladas.
        <br />
        Claude vai re-quebrar respeitando pontos de pausa.
      </p>
    </div>
  );
}

function wrapLines(text: string, maxChars: number, maxLines: number): string {
  const flat = text.replace(/\n/g, ' ').trim();
  const words = flat.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current) {
      current = w;
      continue;
    }
    if (current.length + 1 + w.length <= maxChars) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.join('\n');
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'hsl(var(--ds-fg-3))',
          fontFamily: '"HN Display", sans-serif',
          display: 'block',
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function AspectIcon({ aspect, isSelected }: { aspect: AspectRatio; isSelected: boolean }) {
  const dims = (() => {
    if (aspect === '16:9') return { w: 24, h: 14 };
    if (aspect === '9:16') return { w: 14, h: 24 };
    if (aspect === '1:1') return { w: 18, h: 18 };
    return { w: 16, h: 20 };
  })();
  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        border: `1px solid ${isSelected ? 'hsl(var(--ds-surface))' : 'hsl(var(--ds-fg-3))'}`,
        background: 'transparent',
      }}
    />
  );
}
