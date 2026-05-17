import { useState, useMemo } from 'react';
import { Check, Download, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { DS, TYPO } from './shared';
import { exportCues, downloadFile, type ExportOptions } from '../utils/export';
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
  fileNameBase: string;
}

const FORMATS: ExportFormat[] = ['srt', 'txt'];

export function Step4Export({ beforeCues, afterCues, style, fileNameBase }: Props) {
  const [format, setFormat] = useState<ExportFormat>('srt');
  const [fileName, setFileName] = useState(() => {
    const base = fileNameBase.replace(/\.srt$/i, '');
    return `${base}_revisado_v1`;
  });
  // Opções fixas: BOM (UTF-8) ligado pra compat Resolve/Windows, sem CRLF, renumera vazias.
  const opts = useMemo<ExportOptions>(() => ({ bom: true, crlf: false, renumber: true }), []);

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

  const handleDownload = () => {
    downloadFile(preview.content, preview.filename, preview.mime);
    toast.success(`${preview.filename} baixado`);
  };

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
          padding: '36px 40px',
          borderBottom: `1px solid ${DS.line1}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 22,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            display: 'grid',
            placeItems: 'center',
            background: DS.accent,
            color: '#0A0A0A',
            flexShrink: 0,
          }}
        >
          <Check size={26} strokeWidth={2} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: DS.accentDeep, margin: '0 0 6px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, background: DS.accent, display: 'inline-block' }} />
            Revisão concluída
          </p>
          <h2 style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 8px', color: DS.fg1 }}>
            Legendas prontas pra exportar
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 13.5, color: DS.fg3, fontFamily: TYPO.text, lineHeight: 1.55, maxWidth: '62ch' }}>
            {finalStats.final} cues processadas, {finalStats.changed} alteradas{finalStats.removed > 0 ? `, ${finalStats.removed} removidas` : ''}.
            CPS médio agora em {finalStats.avgCps.toFixed(1)}. Escolha o formato e baixe.
          </p>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <SuccStat label="Cues finais" value={String(finalStats.final)} />
            <SuccStat label="Alteradas" value={String(finalStats.changed)} accent />
            <SuccStat label="CPS médio" value={finalStats.avgCps.toFixed(1)} accent />
            <SuccStat label="Duração" value={finalStats.duration} />
          </div>
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
                onClick={() => setFormat(f)}
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
                onChange={(e) => setFileName(e.target.value)}
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

      {/* DOWNLOAD ROW */}
      <div style={{ padding: '24px 40px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            border: `1px solid ${DS.line2}`,
            background: DS.bg,
          }}
        >
          <Download size={14} strokeWidth={1.5} style={{ color: DS.fg3 }} />
          <strong style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 13, color: DS.fg1 }}>
            {preview.filename}
          </strong>
          <span style={{ color: DS.fg4, fontFamily: TYPO.text, fontSize: 12 }}>
            · {(preview.content.length / 1024).toFixed(1)} KB · {finalStats.final} cues
          </span>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            height: 38,
            padding: '0 22px',
            fontFamily: TYPO.display,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: DS.bg,
            background: DS.fg1,
            border: 'none',
            cursor: 'pointer',
            transition: 'background 120ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = DS.accent;
            e.currentTarget.style.color = '#0A0A0A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = DS.fg1;
            e.currentTarget.style.color = DS.bg;
          }}
        >
          <Download size={13} strokeWidth={1.5} />
          Baixar arquivo
        </button>
      </div>
    </>
  );
}

function SectHead({ ix, title, info }: { ix: string; title: string; info?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18 }}>
      <span style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', color: DS.fg4, fontVariantNumeric: 'tabular-nums' }}>
        {ix}
      </span>
      <h2 style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 18, letterSpacing: '-0.015em', color: DS.fg1, margin: 0 }}>
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

