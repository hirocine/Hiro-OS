import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { DS, TYPO } from './shared';
import { defaultStyleForAspect } from '../hooks/useSubtitlePresets';
import {
  LANGUAGE_LABELS,
  ASPECT_LABELS,
  ASPECT_HINTS,
  type AspectRatio,
  type SubtitleStyle,
  type SupportedLanguage,
  type SrtCue,
} from '../types';
import { estimateCost, estimateTime } from '../utils/analyze';

interface Props {
  cues: SrtCue[];
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  style: SubtitleStyle;
  glossary: string[];
  onChange: (next: {
    sourceLanguage: SupportedLanguage;
    targetLanguage: SupportedLanguage;
    style: SubtitleStyle;
    glossary: string[];
  }) => void;
}

const ASPECT_OPTIONS: AspectRatio[] = ['16:9', '9:16', '1:1', '2.39:1'];
const LANG_OPTIONS = Object.keys(LANGUAGE_LABELS) as SupportedLanguage[];

export function Step2Configure({ cues, sourceLanguage, targetLanguage, style, glossary, onChange }: Props) {
  const [glossaryInput, setGlossaryInput] = useState('');

  const update = (partial: Partial<Parameters<typeof onChange>[0]>) =>
    onChange({
      sourceLanguage,
      targetLanguage,
      style,
      glossary,
      ...partial,
    });

  const setAspect = (a: AspectRatio) => {
    if (style.aspect_ratio === a) return;
    update({ style: defaultStyleForAspect(a) });
  };

  const addGlossaryChip = () => {
    const v = glossaryInput.trim();
    if (!v) return;
    if (glossary.includes(v)) {
      toast.message('Termo já está no glossário');
      setGlossaryInput('');
      return;
    }
    update({ glossary: [...glossary, v] });
    setGlossaryInput('');
  };

  return (
    <div style={{ minHeight: 0 }}>
      <div style={{ minWidth: 0 }}>
        {/* 2.1 IDIOMAS */}
        <CfgBlock ix="2.1" title="Idiomas" description="Como a Hiro lê o áudio e em que idioma escreve a legenda. Mantenha igual pra revisão; troque pra gerar uma versão traduzida.">
          <FldGrid cols={2}>
            <Fld label="Idioma da fala">
              <NativeSelect value={sourceLanguage} onChange={(v) => update({ sourceLanguage: v as SupportedLanguage })}>
                {LANG_OPTIONS.map((l) => (
                  <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>
                ))}
              </NativeSelect>
            </Fld>
            <Fld label="Idioma da legenda">
              <NativeSelect value={targetLanguage} onChange={(v) => update({ targetLanguage: v as SupportedLanguage })}>
                {LANG_OPTIONS.map((l) => (
                  <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>
                ))}
              </NativeSelect>
            </Fld>
          </FldGrid>
          {sourceLanguage !== targetLanguage && (
            <p style={{ marginTop: 8, fontSize: 11, color: DS.info, fontFamily: TYPO.text }}>
              Idiomas diferentes — Claude vai traduzir + corrigir.
            </p>
          )}
        </CfgBlock>

        {/* 2.2 FORMATO */}
        <CfgBlock
          ix="2.2"
          title="Formato do vídeo"
          description={<>Onde a legenda vai aparecer. Cada formato define limites diferentes de <strong style={{ fontFamily: TYPO.display, color: DS.fg1 }}>chars por linha</strong>, <strong style={{ fontFamily: TYPO.display, color: DS.fg1 }}>posição</strong> e <strong style={{ fontFamily: TYPO.display, color: DS.fg1 }}>safe-area</strong>.</>}
          info="define defaults dos presets"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {ASPECT_OPTIONS.map((a) => {
              const isOn = style.aspect_ratio === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAspect(a)}
                  style={{
                    padding: '16px 14px',
                    background: isOn ? DS.fg1 : DS.bg,
                    color: isOn ? DS.bg : DS.fg1,
                    border: `1px solid ${isOn ? DS.fg1 : DS.line2}`,
                    outline: isOn ? `1px solid ${DS.fg1}` : 'none',
                    outlineOffset: -2,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    transition: 'background 120ms, border-color 120ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!isOn) e.currentTarget.style.borderColor = DS.line3;
                  }}
                  onMouseLeave={(e) => {
                    if (!isOn) e.currentTarget.style.borderColor = DS.line2;
                  }}
                >
                  <FmtFrame aspect={a} isOn={isOn} />
                  <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 13, letterSpacing: '-0.005em' }}>
                    {ASPECT_LABELS[a].split('·')[0].trim()}
                    <span style={{ fontFamily: DS.mono, fontSize: 11, color: isOn ? 'hsl(0 0% 70%)' : DS.fg4, marginLeft: 6 }}>
                      {a}
                    </span>
                  </span>
                  <span style={{ fontSize: 10, color: isOn ? 'hsl(0 0% 70%)' : DS.fg4, fontFamily: TYPO.text }}>
                    {ASPECT_HINTS[a]}
                  </span>
                </button>
              );
            })}
          </div>
        </CfgBlock>

        {/* 2.3 GLOSSÁRIO */}
        <CfgBlock
          ix="2.3"
          title="Glossário"
          description={<>Termos que <strong style={{ fontFamily: TYPO.display, color: DS.fg1 }}>não devem ser alterados</strong> pela revisão — nomes próprios, marcas, jargões. Pressione <kbd style={{ fontFamily: DS.mono, background: DS.surface2, padding: '1px 5px', border: `1px solid ${DS.line1}`, fontSize: 10 }}>⏎</kbd> para adicionar.</>}
          info={`${glossary.length} termo${glossary.length === 1 ? '' : 's'}`}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {glossary.map((term) => (
              <span
                key={term}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  background: DS.surface2,
                  border: `1px solid ${DS.line2}`,
                  fontSize: 12.5,
                  color: DS.fg1,
                  fontFamily: TYPO.display,
                  fontWeight: 500,
                }}
              >
                {term}
                <button
                  type="button"
                  onClick={() => update({ glossary: glossary.filter((t) => t !== term) })}
                  style={{
                    marginLeft: 2,
                    color: DS.fg4,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = DS.danger)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = DS.fg4)}
                >
                  <X size={10} strokeWidth={2} />
                </button>
              </span>
            ))}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                background: 'transparent',
                border: `1px dashed ${DS.line2}`,
                color: glossaryInput ? DS.fg1 : DS.fg3,
              }}
            >
              <input
                type="text"
                value={glossaryInput}
                onChange={(e) => setGlossaryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addGlossaryChip();
                  }
                }}
                placeholder="+ adicionar termo"
                style={{
                  background: 'transparent',
                  border: 0,
                  outline: 0,
                  width: 140,
                  font: 'inherit',
                  fontFamily: TYPO.display,
                  fontSize: 12.5,
                  fontWeight: 500,
                }}
              />
            </span>
          </div>
        </CfgBlock>
      </div>
    </div>
  );
}

// ============== Estimate helper exposed para footer ==============
export function step2Estimate(cues: SrtCue[]) {
  const time = estimateTime(cues);
  const { cost } = estimateCost(cues);
  return { time, cost };
}

// ============== Sub components ==============

function CfgBlock({ ix, title, description, info, children }: { ix: string; title: string; description?: React.ReactNode; info?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ padding: '24px 40px', borderBottom: `1px solid ${DS.line1}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ margin: 0, fontFamily: TYPO.display, fontWeight: 500, fontSize: 18, letterSpacing: '-0.015em', color: DS.fg1, lineHeight: 1.3 }}>
            <span style={{ marginRight: 8, letterSpacing: 0 }}>{ix}</span>
            {title}
          </h3>
          {description && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: DS.fg3, fontFamily: TYPO.text, lineHeight: 1.5, maxWidth: '60ch' }}>
              {description}
            </p>
          )}
        </div>
        {info && (
          <span style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: DS.fg4, flexShrink: 0 }}>
            {info}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function FldGrid({ cols, children }: { cols: 2 | 3 | 4; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>;
}

function Fld({ label, children, colSpan }: { label: string; children: React.ReactNode; colSpan?: number }) {
  return (
    <div style={{ gridColumn: colSpan ? `span ${colSpan}` : undefined }}>
      <label style={{ display: 'block', fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: DS.fg4, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function NativeSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          appearance: 'none',
          height: 34,
          padding: '0 32px 0 12px',
          fontSize: 13,
          fontFamily: TYPO.text,
          background: DS.bg,
          border: `1px solid ${DS.line2}`,
          color: DS.fg1,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {children}
      </select>
      <ChevronDown size={13} strokeWidth={1.5} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: DS.fg3, pointerEvents: 'none' }} />
    </div>
  );
}

function FmtFrame({ aspect, isOn }: { aspect: AspectRatio; isOn: boolean }) {
  const dims = (() => {
    if (aspect === '16:9') return { w: 32, h: 18 };
    if (aspect === '9:16') return { w: 18, h: 32 };
    if (aspect === '1:1') return { w: 22, h: 22 };
    if (aspect === '4:5') return { w: 20, h: 25 };
    return { w: 36, h: 15 }; // 2.39:1
  })();
  return (
    <div
      style={{
        width: dims.w,
        height: dims.h,
        background: isOn ? 'hsl(0 0% 18%)' : DS.surface3,
        border: `1px solid ${isOn ? 'hsl(0 0% 30%)' : DS.line2}`,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 2px 2px',
      }}
    >
      <span
        style={{
          background: isOn ? 'hsl(0 0% 90%)' : DS.fg3,
          height: 2,
          width: '60%',
        }}
      />
    </div>
  );
}

