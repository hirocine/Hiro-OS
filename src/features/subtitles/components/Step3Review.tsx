import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DS, TYPO, Section } from './shared';
import { wordDiff, tripleDiff, hasDiff, type DiffToken, type TripleDiffToken } from '../utils/diff';
import { cueStats } from '../utils/analyze';
import type { SrtCue } from '../types';

interface Props {
  beforeCues: SrtCue[];
  afterCues: SrtCue[];
  /** Snapshot do output da IA antes de qualquer edição manual. Permite distinguir mudanças da IA (verde) das do usuário (azul). */
  aiBaselineCues?: SrtCue[];
  onUpdate: (cues: SrtCue[]) => void;
}

const PAGE_SIZE = 8;

interface AnnotatedCue {
  cue: SrtCue;
  before: SrtCue | undefined;
  isChanged: boolean;
  isRemoved: boolean;
  cpsAfter: number;
}

export function Step3Review({ beforeCues, afterCues, aiBaselineCues, onUpdate }: Props) {
  const [page, setPage] = useState(1);

  const beforeByIdx = useMemo(() => {
    const m = new Map<number, SrtCue>();
    beforeCues.forEach((c) => m.set(c.index, c));
    return m;
  }, [beforeCues]);

  const aiByIdx = useMemo(() => {
    const m = new Map<number, SrtCue>();
    (aiBaselineCues ?? []).forEach((c) => m.set(c.index, c));
    return m;
  }, [aiBaselineCues]);

  const annotated = useMemo<AnnotatedCue[]>(() => {
    return afterCues.map((c) => {
      const before = beforeByIdx.get(c.index);
      const isEmptyAfter = cueStats(c).isEmpty;
      const isChanged = before ? hasDiff(before.text, c.text) : false;
      const cpsAfter = cueStats(c).cps;
      return {
        cue: c,
        before,
        isChanged,
        isRemoved: isEmptyAfter && !!before && !cueStats(before).isEmpty,
        cpsAfter,
      };
    });
  }, [afterCues, beforeByIdx]);

  const totalPages = Math.max(1, Math.ceil(annotated.length / PAGE_SIZE));
  const visiblePage = Math.min(page, totalPages);
  const paged = annotated.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);

  const commitEdit = (cueIndex: number, value: string) => {
    onUpdate(afterCues.map((c) => (c.index === cueIndex ? { ...c, text: value.trim() } : c)));
  };

  return (
    <Section ix="3.1" title="Revisão" noBorder right={<DiffLegend />}>
      <div style={{ border: `1px solid ${DS.line1}`, background: DS.surface, padding: '14px 0' }}>
        {paged.map((a, i) => (
          <CueRow
            key={a.cue.index}
            entry={a}
            aiText={aiByIdx.get(a.cue.index)?.text ?? a.cue.text}
            isFirst={i === 0}
            onCommit={(value) => commitEdit(a.cue.index, value)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: DS.fg3, fontFamily: TYPO.text }}>
            Página <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1, fontVariantNumeric: 'tabular-nums' }}>{visiblePage}</strong> de <strong style={{ fontFamily: TYPO.display, fontWeight: 500, color: DS.fg1, fontVariantNumeric: 'tabular-nums' }}>{totalPages}</strong>
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', border: `1px solid ${DS.line2}` }}>
            <PagBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={visiblePage === 1}>
              <ChevronLeft size={13} strokeWidth={1.5} />
            </PagBtn>
            <PagBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={visiblePage >= totalPages} last>
              <ChevronRight size={13} strokeWidth={1.5} />
            </PagBtn>
          </div>
        </div>
      )}
    </Section>
  );
}

function CueRow({
  entry,
  aiText,
  isFirst,
  onCommit,
}: {
  entry: AnnotatedCue;
  aiText: string;
  isFirst: boolean;
  onCommit: (value: string) => void;
}) {
  const { cue, before, isChanged, isRemoved } = entry;
  const isUnchanged = !isChanged && !isRemoved;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px minmax(0, 1fr) minmax(0, 1fr)',
        padding: '6px 18px',
        gap: 18,
      }}
    >
      {/* Side compacta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 11, color: isRemoved ? DS.danger : DS.fg4, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' }}>
          CUE {String(cue.index).padStart(3, '0')}
        </span>
        <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.fg3, lineHeight: 1.4 }}>
          <strong style={{ color: DS.fg1, fontWeight: 500 }}>{cue.startStr}</strong>
          <br />
          → {cue.endStr}
        </span>
      </div>

      {/* Before */}
      <div style={{ minWidth: 0 }}>
        {isFirst && <ColLabel>Antes</ColLabel>}
        <DiffBlock before={before?.text ?? ''} after={cue.text} aiText={aiText} side="left" muted={isUnchanged} />
      </div>

      {/* After */}
      <div style={{ minWidth: 0 }}>
        {isFirst && (
          <ColLabel highlight={isChanged}>
            {isRemoved ? 'Removida do output' : isUnchanged ? 'Sem alterações' : 'Depois'}
          </ColLabel>
        )}
        {isRemoved ? (
          <div
            style={{
              padding: '10px 0',
              color: DS.danger,
              fontSize: 12.5,
              fontFamily: TYPO.text,
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            — cue inteira descartada (vazia ou sem texto válido)
          </div>
        ) : (
          <EditableDiff before={before?.text ?? ''} after={cue.text} aiText={aiText} muted={isUnchanged} onCommit={onCommit} />
        )}
      </div>
    </div>
  );
}

function DiffBlock({ before, after, aiText, side, muted }: { before: string; after: string; aiText: string; side: 'left' | 'right'; muted?: boolean }) {
  const text = side === 'left' ? before : after;
  if (muted || !before || !after || before === after) {
    return (
      <div
        style={{
          padding: '10px 0',
          fontSize: 13,
          color: muted ? DS.fg3 : DS.fg1,
          lineHeight: 1.5,
          whiteSpace: 'pre-line',
          fontFamily: TYPO.text,
        }}
      >
        {text || (muted ? '—' : '')}
      </div>
    );
  }
  const diff = tripleDiff(before, aiText, after);
  const tokens: (DiffToken | TripleDiffToken)[] = side === 'left' ? diff.left : diff.right;
  return (
    <div
      style={{
        padding: '10px 0',
        fontSize: 13,
        color: DS.fg1,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        fontFamily: TYPO.text,
      }}
    >
      {tokens.map((t, i) => renderToken(t, side, i))}
    </div>
  );
}

function renderToken(t: DiffToken, side: 'left' | 'right', i: number) {
  if (t.op === 'equal') {
    return (
      <span key={i} style={{ color: DS.fg2 }}>
        {t.text}
      </span>
    );
  }
  if (t.op === 'delete' && side === 'left') {
    return (
      <span
        key={i}
        style={{
          background: 'hsl(0 60% 92%)',
          color: DS.danger,
          textDecoration: 'line-through',
          textDecorationColor: 'hsl(0 60% 50% / 0.6)',
          padding: 0,
        }}
      >
        {t.text}
      </span>
    );
  }
  if (t.op === 'insert' && side === 'right') {
    const isUser = 'source' in t && t.source === 'user';
    // Verde = IA (default), Azul = usuário
    const bg = isUser ? 'hsl(209 71% 92%)' : DS.accentSoft;
    const fg = isUser ? DS.info : DS.accentDeep;
    return (
      <span
        key={i}
        style={{
          background: bg,
          color: fg,
          padding: 0,
          fontWeight: 500,
        }}
      >
        {t.text}
      </span>
    );
  }
  return null;
}

function EditableDiff({
  before,
  after,
  aiText,
  muted,
  onCommit,
}: {
  before: string;
  after: string;
  aiText: string;
  muted: boolean;
  onCommit: (value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  // Quando NÃO está editando, ressincronizamos o DOM com o conteúdo atual do `after`
  // (caso o React decida reaproveitar o elemento entre renders sem trocar children).
  // Quando ESTÁ editando, o browser controla o DOM via contentEditable — não tocamos.
  useEffect(() => {
    if (editing) return;
    // o React vai re-renderizar os filhos quando muted/diff mudam, então só precisa
    // garantir que o cursor não esteja preso de uma sessão anterior.
  }, [after, editing]);

  const finish = () => {
    const text = (ref.current?.innerText ?? '').replace(/ /g, ' ');
    setEditing(false);
    if (text.trim() !== after.trim()) onCommit(text);
  };

  const tokens = useMemo(() => {
    if (muted || !before || !after || before === after) {
      return null; // será renderizado como texto puro
    }
    return tripleDiff(before, aiText, after).right;
  }, [before, after, aiText, muted]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setEditing(true)}
      onBlur={finish}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          if (ref.current) ref.current.innerText = after;
          (e.currentTarget as HTMLDivElement).blur();
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          (e.currentTarget as HTMLDivElement).blur();
        }
      }}
      style={{
        padding: '10px 0',
        fontSize: 13,
        color: muted ? DS.fg3 : DS.fg1,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap',
        fontFamily: TYPO.text,
        outline: 'none',
        cursor: 'text',
      }}
    >
      {tokens ? tokens.map((t, i) => renderToken(t, 'right', i)) : (after || (muted ? '—' : ''))}
    </div>
  );
}

function DiffLegend() {
  const items: Array<{ bg: string; fg: string; label: string }> = [
    { bg: 'hsl(0 60% 92%)', fg: DS.danger, label: 'Removido' },
    { bg: DS.accentSoft, fg: DS.accentDeep, label: 'Trocado pelo Claude' },
    { bg: 'hsl(209 71% 92%)', fg: DS.info, label: 'Edição manual' },
  ];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
      {items.map((it) => (
        <span
          key={it.label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: TYPO.display,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.06em',
            color: DS.fg3,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 18, height: 12, background: it.bg, border: `1px solid ${it.fg}33`, display: 'inline-block' }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

function ColLabel({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: TYPO.display,
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: highlight ? DS.fg1 : DS.fg4,
        marginBottom: 6,
      }}
    >
      <span style={{ width: 6, height: 6, background: highlight ? DS.fg1 : DS.line2, display: 'inline-block' }} />
      {children}
    </span>
  );
}

function PagBtn({ children, onClick, disabled, last }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; last?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        display: 'grid',
        placeItems: 'center',
        color: DS.fg3,
        borderRight: last ? 'none' : `1px solid ${DS.line2}`,
        background: 'transparent',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}
