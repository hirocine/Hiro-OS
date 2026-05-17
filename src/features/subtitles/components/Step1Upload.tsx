import { useMemo, useRef, useState } from 'react';
import { Upload, FileText, RotateCw, AlertTriangle, Eye, Edit3, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { parseSrt } from '../utils/parseSrt';
import { summarizeSrt } from '../utils/analyze';
import { Section, StatsGrid, DS, TYPO, StatValueSmall } from './shared';
import type { SrtCue } from '../types';

interface Props {
  srt: string | null;
  cues: SrtCue[];
  fileName: string | null;
  parseTimeMs: number | null;
  cpsMax: number;
  maxCharsPerLine: number;
  onUpload: (srt: string, cues: SrtCue[], fileName: string, parseTimeMs: number) => void;
  onRename: (next: string) => void;
  onRemove: () => void;
  onShowRaw: () => void;
}

export function Step1Upload({ srt, cues, fileName, parseTimeMs, cpsMax, maxCharsPerLine, onUpload, onRename, onRemove, onShowRaw }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');

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
      const t0 = performance.now();
      const parsed = parseSrt(content);
      const dt = Math.round(performance.now() - t0);
      if (parsed.length === 0) {
        toast.error('Não consegui parsear o SRT. Verifique o formato.');
        return;
      }
      onUpload(content, parsed, file.name, dt);
    };
    reader.onerror = () => toast.error('Erro lendo arquivo');
    reader.readAsText(file, 'utf-8');
  };

  const summary = useMemo(
    () => summarizeSrt(cues, { maxCharsPerLine, cpsMax, parseTimeMs }),
    [cues, maxCharsPerLine, cpsMax, parseTimeMs],
  );

  if (!srt) {
    return (
      <Section ix="1.1" title="Arquivo" noBorder>
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
            border: `1.5px dashed ${dragging ? DS.line3 : DS.line2}`,
            background: dragging ? DS.surface2 : DS.surface,
            cursor: 'pointer',
            transition: 'border-color 120ms, background 120ms',
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
          <Upload size={28} strokeWidth={1.5} style={{ color: DS.fg3 }} />
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: TYPO.display,
                fontWeight: 500,
                fontSize: 15,
                color: DS.fg1,
                margin: 0,
              }}
            >
              Arraste um .srt aqui ou clique pra escolher
            </p>
            <p
              style={{
                fontSize: 12,
                color: DS.fg4,
                margin: '4px 0 0',
                fontFamily: TYPO.text,
              }}
            >
              UTF-8 detectado automaticamente · até 1 MB
            </p>
          </div>
        </label>
      </Section>
    );
  }

  return (
    <>
      <Section ix="1.1" title="Arquivo" right={<TopActions onReplace={() => inputRef.current?.click()} onShowRaw={onShowRaw} />}>
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '64px 1fr auto',
            gap: 18,
            alignItems: 'center',
            padding: '20px 22px',
            border: `1px solid ${DS.line2}`,
            background: DS.bg,
          }}
        >
          <span
            style={{
              width: 64,
              height: 64,
              display: 'grid',
              placeItems: 'center',
              background: DS.fg1,
              color: DS.accentBright,
              fontFamily: TYPO.display,
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: '0.08em',
            }}
          >
            SRT
          </span>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {renaming ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const trimmed = renameDraft.trim();
                      if (trimmed) {
                        onRename(trimmed.endsWith('.srt') ? trimmed : trimmed + '.srt');
                        setRenaming(false);
                      }
                    } else if (e.key === 'Escape') {
                      setRenaming(false);
                    }
                  }}
                  autoFocus
                  style={{
                    fontFamily: TYPO.display,
                    fontWeight: 500,
                    fontSize: 18,
                    color: DS.fg1,
                    letterSpacing: '-0.015em',
                    border: `1px solid ${DS.fg1}`,
                    background: DS.bg,
                    padding: '4px 8px',
                    outline: 'none',
                    flex: 1,
                  }}
                />
              </div>
            ) : (
              <span
                style={{
                  fontFamily: TYPO.display,
                  fontWeight: 500,
                  fontSize: 18,
                  color: DS.fg1,
                  letterSpacing: '-0.015em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {fileName ?? 'legenda.srt'}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12.5, color: DS.fg3, fontFamily: TYPO.text, flexWrap: 'wrap' }}>
              <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1, fontVariantNumeric: 'tabular-nums' }}>
                {(srt.length / 1024).toFixed(1)} KB
              </strong>
              <span style={{ color: DS.line2 }}>·</span>
              <Chip>
                <span style={{ width: 5, height: 5, background: DS.accent, display: 'inline-block' }} />
                UTF-8 detectado
              </Chip>
            </div>
          </div>
          <div style={{ display: 'flex', border: `1px solid ${DS.line2}` }}>
            <IconBtn
              title="Renomear"
              onClick={() => {
                setRenameDraft(fileName ?? '');
                setRenaming((v) => !v);
              }}
            >
              <Edit3 size={14} strokeWidth={1.5} />
            </IconBtn>
            <IconBtn title="Remover" onClick={onRemove}>
              <X size={14} strokeWidth={1.5} />
            </IconBtn>
          </div>
        </div>
      </Section>

      <Section
        ix="1.2"
        title="Resumo"
        meta={summary.parseTimeMs !== null ? `parse concluído em ${summary.parseTimeMs}ms` : undefined}
      >
        <StatsGrid
          items={[
            { label: 'Cues', value: summary.cueCount.toLocaleString('pt-BR') },
            { label: 'Duração total', value: <>{summary.durationLabel} <StatValueSmall>min</StatValueSmall></> },
            { label: 'Palavras', value: summary.wordCount.toLocaleString('pt-BR'), hint: `${(summary.wordCount / Math.max(1, summary.cueCount)).toFixed(1)} palavras/cue` },
            { label: 'Caracteres', value: summary.charCount.toLocaleString('pt-BR'), hint: `${(summary.charCount / Math.max(1, summary.cueCount)).toFixed(1)} chars/cue` },
            {
              label: 'CPS médio',
              value: summary.avgCps.toFixed(1),
              hint: summary.avgCps > cpsMax ? `acima do ideal (${cpsMax})` : `dentro do limite (≤${cpsMax})`,
              hintColor: summary.avgCps > cpsMax ? 'warn' : 'ok',
            },
            {
              label: 'CPS pico',
              value: summary.peakCps.toFixed(1),
              hint: summary.peakCpsCueIndex !== null ? `cue #${String(summary.peakCpsCueIndex).padStart(3, '0')}` : undefined,
              valueColor: summary.peakCps > cpsMax ? 'warn' : 'default',
              hintColor: summary.peakCps > cpsMax ? 'warn' : 'default',
            },
            {
              label: 'Idioma detectado',
              value: <span style={{ fontSize: 15 }}>PT-BR</span>,
              hint: 'manual · escolha no passo 02',
            },
            {
              label: 'Alertas',
              value: String(summary.emptyCueCount + summary.longLineCount + summary.highCpsCount),
              valueColor: summary.emptyCueCount + summary.longLineCount + summary.highCpsCount > 0 ? 'warn' : 'default',
              hint: summary.emptyCueCount + summary.longLineCount + summary.highCpsCount > 0
                ? `${summary.highCpsCount} CPS · ${summary.longLineCount} longas · ${summary.emptyCueCount} vazias`
                : 'tudo limpo',
              hintColor: summary.emptyCueCount + summary.longLineCount + summary.highCpsCount > 0 ? 'warn' : 'ok',
            },
          ]}
        />
      </Section>

      <Section
        ix="1.3"
        title="Amostra do conteúdo"
        meta={`cues 001 a ${String(Math.min(5, cues.length)).padStart(3, '0')}`}
      >
        <div style={{ border: `1px solid ${DS.line1}`, background: DS.bg }}>
          {cues.slice(0, 5).map((c, i) => (
            <div
              key={c.index}
              style={{
                display: 'grid',
                gridTemplateColumns: '60px 200px 1fr',
                gap: 18,
                padding: '14px 18px',
                borderBottom: i < Math.min(4, cues.length - 1) ? `1px solid ${DS.line1}` : 'none',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 11, color: DS.fg4, letterSpacing: '0.12em' }}>
                {String(c.index).padStart(3, '0')}
              </span>
              <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.fg3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <strong style={{ color: DS.fg1, fontWeight: 500 }}>{c.startStr}</strong>
                <span>→ {c.endStr}</span>
              </span>
              <div style={{ fontSize: 14, color: DS.fg1, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 2, whiteSpace: 'pre-line' }}>
                {c.text}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        ix="1.4"
        title="Avisos detectados"
        meta={
          summary.emptyCueCount + summary.longLineCount + summary.highCpsCount > 0
            ? `${summary.emptyCueCount + summary.longLineCount + summary.highCpsCount} de ${summary.cueCount} · serão resolvidos na configuração`
            : 'nenhum aviso · tudo dentro dos limites'
        }
        noBorder
      >
        <div style={{ border: `1px solid ${DS.line1}`, background: DS.bg }}>
          {summary.highCpsCount > 0 && (
            <AlertRow
              tone="warn"
              icon={<AlertTriangle size={14} strokeWidth={1.5} />}
              title="CPS acima do ideal"
              count={`${summary.highCpsCount} cues`}
              description={
                summary.highCpsIndices.slice(0, 7).map((i) => `#${String(i).padStart(3, '0')}`).join(', ') +
                (summary.highCpsIndices.length > 7 ? '…' : '') +
                ` · pico ${summary.peakCps.toFixed(1)}`
              }
            />
          )}
          {summary.longLineCount > 0 && (
            <AlertRow
              tone="warn"
              icon={<AlertTriangle size={14} strokeWidth={1.5} />}
              title="Linhas longas demais"
              count={`${summary.longLineCount} cues`}
              description={`passam de ${maxCharsPerLine} caracteres na linha — vão precisar quebrar.`}
            />
          )}
          {summary.emptyCueCount > 0 && (
            <AlertRow
              tone="danger"
              icon={<X size={14} strokeWidth={1.5} />}
              title="Cues vazias"
              count={`${summary.emptyCueCount} cues`}
              description={
                summary.emptyCueIndices.map((i) => `#${String(i).padStart(3, '0')}`).join(', ') +
                ' — serão removidas no processamento.'
              }
              last={true}
            />
          )}
          {summary.emptyCueCount + summary.longLineCount + summary.highCpsCount === 0 && (
            <AlertRow
              tone="info"
              icon={<Check size={14} strokeWidth={1.75} />}
              title="Sem avisos"
              description="O SRT já chegou bem formatado. Avance pra configurar o estilo."
              last={true}
            />
          )}
        </div>
      </Section>
    </>
  );
}

function TopActions({ onReplace, onShowRaw }: { onReplace: () => void; onShowRaw: () => void }) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${DS.line2}` }}>
      <SmallBtn icon={<RotateCw size={11} strokeWidth={1.5} />} onClick={onReplace}>
        Substituir
      </SmallBtn>
      <SmallBtn icon={<Eye size={11} strokeWidth={1.5} />} onClick={onShowRaw} last>
        Ver SRT bruto
      </SmallBtn>
    </div>
  );
}

function SmallBtn({ icon, children, onClick, last }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; last?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 28,
        padding: '0 12px',
        fontFamily: TYPO.display,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: DS.fg2,
        borderRight: last ? 'none' : `1px solid ${DS.line2}`,
        background: 'transparent',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        transition: 'color 120ms, background 120ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = DS.fg1;
        e.currentTarget.style.background = DS.surface2;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = DS.fg2;
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 34,
        height: 34,
        display: 'grid',
        placeItems: 'center',
        color: DS.fg3,
        borderRight: `1px solid ${DS.line2}`,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'color 120ms, background 120ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = DS.fg1;
        e.currentTarget.style.background = DS.surface;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = DS.fg3;
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        background: DS.accentSoft,
        color: DS.accentDeep,
        fontFamily: TYPO.display,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        border: `1px solid hsl(var(--ds-accent) / 0.25)`,
      }}
    >
      {children}
    </span>
  );
}

function AlertRow({
  tone,
  icon,
  title,
  count,
  description,
  last,
}: {
  tone: 'warn' | 'danger' | 'info';
  icon: React.ReactNode;
  title: string;
  count?: string;
  description: React.ReactNode;
  last?: boolean;
}) {
  const iconBg = tone === 'warn' ? DS.warnSoft : tone === 'danger' ? DS.dangerSoft : DS.accentSoft;
  const iconColor = tone === 'warn' ? DS.warn : tone === 'danger' ? DS.danger : DS.accentDeep;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr',
        gap: 14,
        alignItems: 'center',
        padding: '14px 18px',
        borderBottom: last ? 'none' : `1px solid ${DS.line1}`,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          display: 'grid',
          placeItems: 'center',
          background: iconBg,
          color: iconColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 13.5, color: DS.fg1, display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {title}
          {count && (
            <span style={{ fontFamily: TYPO.display, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: DS.fg4 }}>
              {count}
            </span>
          )}
        </span>
        <span style={{ fontSize: 12, color: DS.fg3, lineHeight: 1.4 }}>{description}</span>
      </div>
    </div>
  );
}
