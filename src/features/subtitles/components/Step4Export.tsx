import { useMemo } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { DS, TYPO } from './shared';
import { exportCues, type ExportOptions } from '../utils/export';
import {
  EXPORT_FORMAT_LABELS,
  EXPORT_FORMAT_EXTENSIONS,
  EXPORT_FORMAT_HINTS,
  EXPORT_FORMAT_BADGES,
  EXPORT_FORMAT_COMPAT,
  type ExportFormat,
  type SubtitleStyle,
  type SrtCue,
} from '../types';
import { cueStats } from '../utils/analyze';

interface Props {
  beforeCues: SrtCue[];
  afterCues: SrtCue[];
  style: SubtitleStyle;
  format: ExportFormat;
  fileName: string;
  onFormatChange: (f: ExportFormat) => void;
  onFileNameChange: (name: string) => void;
}

const FORMATS: ExportFormat[] = ['srt', 'txt'];

export const EXPORT_OPTS: ExportOptions = { bom: true, crlf: false, renumber: true };

export function Step4Export({ beforeCues, afterCues, style, format, fileName, onFormatChange, onFileNameChange }: Props) {
  const opts = EXPORT_OPTS;

  // Stats finais
  const finalStats = useMemo(() => {
    const nonEmpty = afterCues.filter((c) => !cueStats(c).isEmpty);
    const totalChars = nonEmpty.reduce((sum, c) => sum + cueStats(c).charCount, 0);
    const totalSec = nonEmpty.reduce((sum, c) => sum + cueStats(c).durationSec, 0);
    const avgCps = totalSec > 0 ? totalChars / totalSec : 0;
    const totalDurMs = nonEmpty.length > 0 ? nonEmpty[nonEmpty.length - 1].endMs - nonEmpty[0].startMs : 0;
    const dm = Math.floor(totalDurMs / 60000);
    const ds = Math.floor((totalDurMs % 60000) / 1000);
    const changed = afterCues.filter((c, i) => beforeCues[i] && beforeCues[i].text.trim() !== c.text.trim()).length;
    const removed = beforeCues.length - nonEmpty.length;
    return {
      final: nonEmpty.length,
      changed,
      removed,
      avgCps,
      duration: `${String(dm).padStart(2, '0')}:${String(ds).padStart(2, '0')}`,
    };
  }, [beforeCues, afterCues]);

  const preview = useMemo(
    () => exportCues(afterCues, style, format, fileName, opts),
    [afterCues, style, format, fileName, opts],
  );

  const previewLines = useMemo(() => preview.content.split('\n').slice(0, 16).join('\n'), [preview.content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview.content);
      toast.success('Copiado pra área de transferência');
    } catch {
      toast.error('Erro copiando');
    }
  };

  return (
    <>
      {/* SUCCESS BANNER */}
      <div
        style={{
          padding: '32px 40px',
          borderBottom: `1px solid ${DS.line1}`,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          alignItems: 'center',
          gap: 40,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: DS.accentDeep, margin: '0 0 8px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, background: DS.accent, display: 'inline-block' }} />
            Revisão concluída
          </p>
          <h2 style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 26, letterSpacing: '-0.02em', margin: '0 0 8px', color: DS.fg1 }}>
            Legendas prontas pra exportar
          </h2>
          <p style={{ margin: 0, fontSize: 13.5, color: DS.fg3, fontFamily: TYPO.text, lineHeight: 1.55, maxWidth: '62ch' }}>
            {finalStats.final} cues processadas, {finalStats.changed} alteradas{finalStats.removed > 0 ? `, ${finalStats.removed} removidas` : ''}.
            CPS médio agora em {finalStats.avgCps.toFixed(1)}. Escolha o formato e baixe.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignSelf: 'center' }}>
          <SuccStat label="Cues finais" value={String(finalStats.final)} />
          <SuccStat label="Alteradas" value={String(finalStats.changed)} accent />
          <SuccStat label="CPS médio" value={finalStats.avgCps.toFixed(1)} accent />
          <SuccStat label="Duração" value={finalStats.duration} />
        </div>
      </div>

      {/* 4.1 FORMAT */}
      <div style={{ padding: '32px 40px', borderBottom: `1px solid ${DS.line1}` }}>
        <SectHead ix="4.1" title="Escolher formato" info={`${FORMATS.length} formatos disponíveis`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {FORMATS.map((f) => {
            const isOn = format === f;
            const badge = EXPORT_FORMAT_BADGES[f];
            return (
              <button
                key={f}
                type="button"
                onClick={() => onFormatChange(f)}
                style={{
                  padding: 14,
                  background: DS.bg,
                  border: `1px solid ${isOn ? DS.fg1 : DS.line2}`,
                  outline: isOn ? `1px solid ${DS.fg1}` : 'none',
                  outlineOffset: -2,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  textAlign: 'left',
                  minHeight: 130,
                  transition: 'border-color 120ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 34,
                      height: 22,
                      background: DS.fg1,
                      color: DS.accentBright,
                      fontFamily: TYPO.display,
                      fontWeight: 500,
                      fontSize: 10,
                      letterSpacing: '0.1em',
                    }}
                  >
                    {EXPORT_FORMAT_EXTENSIONS[f].toUpperCase()}
                  </span>
                  <span
                    style={{
                      padding: '2px 6px',
                      fontSize: 9,
                      fontFamily: TYPO.display,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: badge.tone === 'acc' ? DS.accentDeep : badge.tone === 'warn' ? DS.warn : DS.fg3,
                      background: badge.tone === 'acc' ? DS.accentSoft : badge.tone === 'warn' ? 'hsl(43 89% 92%)' : DS.surface2,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
                <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 14, color: DS.fg1, letterSpacing: '-0.01em' }}>
                  {EXPORT_FORMAT_LABELS[f]}
                  <small style={{ marginLeft: 6, fontFamily: DS.mono, color: DS.fg4, fontWeight: 400 }}>
                    .{EXPORT_FORMAT_EXTENSIONS[f]}
                  </small>
                </span>
                <span style={{ fontSize: 11.5, color: DS.fg3, fontFamily: TYPO.text, lineHeight: 1.4, flex: 1 }}>
                  {EXPORT_FORMAT_HINTS[f]}
                </span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {EXPORT_FORMAT_COMPAT[f].map((t) => (
                    <span
                      key={t}
                      style={{
                        padding: '1px 6px',
                        fontSize: 9,
                        color: DS.fg3,
                        background: DS.surface2,
                        fontFamily: TYPO.display,
                        fontWeight: 500,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4.2 OPTIONS + PREVIEW */}
      <div style={{ padding: '32px 40px', borderBottom: `1px solid ${DS.line1}` }}>
        <SectHead ix="4.2" title="Opções do arquivo" />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
          <div>
            <label style={{ display: 'block', fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: DS.fg4, marginBottom: 6 }}>
              Nome do arquivo
            </label>
            <div style={{ display: 'flex', border: `1px solid ${DS.line2}`, background: DS.bg, alignItems: 'stretch' }}>
              <input
                type="text"
                value={fileName}
                onChange={(e) => onFileNameChange(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0 12px',
                  height: 36,
                  fontSize: 13,
                  fontFamily: TYPO.text,
                  color: DS.fg1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  minWidth: 0,
                }}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', fontFamily: DS.mono, fontSize: 12, color: DS.fg2, background: DS.surface, borderLeft: `1px solid ${DS.line1}` }}>
                .<strong style={{ fontWeight: 500, color: DS.fg1 }}>{EXPORT_FORMAT_EXTENSIONS[format]}</strong>
              </span>
            </div>

          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: DS.fg4 }}>
                Prévia do arquivo
              </span>
              <span style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', color: DS.fg4 }}>
                primeiras linhas
              </span>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  fontFamily: TYPO.display,
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: DS.fg2,
                  background: DS.bg,
                  border: `1px solid ${DS.line2}`,
                  cursor: 'pointer',
                  height: 24,
                }}
              >
                <Copy size={11} strokeWidth={1.5} />
                Copiar
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: '14px 16px',
                background: 'hsl(0 0% 6%)',
                color: 'hsl(0 0% 80%)',
                border: `1px solid ${DS.line1}`,
                fontSize: 12,
                fontFamily: DS.mono,
                lineHeight: 1.6,
                maxHeight: 320,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}
            >
              {previewLines}
            </pre>
          </div>
        </div>
      </div>

    </>
  );
}

function SectHead({ ix, title, info }: { ix: string; title: string; info?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
      <h2 style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 18, letterSpacing: '-0.015em', color: DS.fg1, margin: 0 }}>
        <span style={{ marginRight: 8, letterSpacing: 0 }}>{ix}</span>
        {title}
      </h2>
      {info && (
        <span style={{ marginLeft: 'auto', fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: DS.fg4 }}>
          {info}
        </span>
      )}
    </div>
  );
}

function SuccStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: DS.fg4 }}>
        {label}
      </span>
      <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 22, letterSpacing: '-0.015em', color: accent ? DS.accentDeep : DS.fg1, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

