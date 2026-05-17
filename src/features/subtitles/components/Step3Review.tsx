import { useMemo, useState } from 'react';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { DS, TYPO, Section } from './shared';
import { wordDiff, hasDiff, type DiffToken } from '../utils/diff';
import { cueStats } from '../utils/analyze';
import type { SrtCue } from '../types';

interface Props {
  beforeCues: SrtCue[];
  afterCues: SrtCue[];
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

export function Step3Review({ beforeCues, afterCues, onUpdate }: Props) {
  const [page, setPage] = useState(1);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<string[]>([]);

  const beforeByIdx = useMemo(() => {
    const m = new Map<number, SrtCue>();
    beforeCues.forEach((c) => m.set(c.index, c));
    return m;
  }, [beforeCues]);

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

  const startEdit = (cue: SrtCue) => {
    setEditingIdx(cue.index);
    setEditDraft(cue.text.split('\n'));
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    onUpdate(afterCues.map((c) => (c.index === editingIdx ? { ...c, text: editDraft.join('\n').trim() } : c)));
    setEditingIdx(null);
    setEditDraft([]);
  };

  return (
    <Section ix="3.1" title="Revisão">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {paged.map((a) => (
          <CueRow
            key={a.cue.index}
            entry={a}
            isEditing={editingIdx === a.cue.index}
            editDraft={editDraft}
            onStartEdit={() => startEdit(a.cue)}
            onCancelEdit={() => { setEditingIdx(null); setEditDraft([]); }}
            onSaveEdit={saveEdit}
            onUpdateDraft={setEditDraft}
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
  isEditing,
  editDraft,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onUpdateDraft,
}: {
  entry: AnnotatedCue;
  isEditing: boolean;
  editDraft: string[];
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onUpdateDraft: (lines: string[]) => void;
}) {
  const { cue, before, isChanged, isRemoved, cpsAfter } = entry;
  const isUnchanged = !isChanged && !isRemoved;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px minmax(0, 1fr) minmax(0, 1fr)',
        background: DS.surface,
        border: `1px solid ${DS.line1}`,
        padding: '16px 18px',
        gap: 18,
      }}
    >
      {/* Side */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: TYPO.display, fontWeight: 500, fontSize: 11, color: isRemoved ? DS.danger : DS.fg4, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' }}>
          CUE {String(cue.index).padStart(3, '0')}
        </span>
        <span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.fg3, lineHeight: 1.4 }}>
          <strong style={{ color: DS.fg1, fontWeight: 500 }}>{cue.startStr}</strong>
          <br />
          → {cue.endStr}
        </span>
        <span style={{ fontSize: 10, color: isRemoved ? DS.danger : DS.fg4, fontFamily: TYPO.text }}>
          {((cue.endMs - cue.startMs) / 1000).toFixed(1)}s · {cpsAfter.toFixed(1)} CPS
        </span>
      </div>

      {/* Before */}
      <div style={{ minWidth: 0 }}>
        <ColLabel>Antes</ColLabel>
        <DiffBlock before={before?.text ?? ''} after={cue.text} side="left" muted={isUnchanged} />
      </div>

      {/* After (clicável pra editar) */}
      <div style={{ minWidth: 0 }}>
        <ColLabel highlight={isChanged && !isEditing}>
          {isEditing ? 'Editando' : isRemoved ? 'Removida do output' : isUnchanged ? 'Sem alterações' : 'Depois'}
        </ColLabel>
        {isEditing ? (
          <EditBlock draft={editDraft} onUpdate={onUpdateDraft} onSave={onSaveEdit} onCancel={onCancelEdit} cps={cpsAfter} />
        ) : isRemoved ? (
          <div
            style={{
              padding: '10px 12px',
              background: DS.dangerSoft,
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
          <div
            onClick={onStartEdit}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onStartEdit();
              }
            }}
            title="Clique pra editar"
            style={{ cursor: 'text' }}
          >
            <DiffBlock before={before?.text ?? ''} after={cue.text} side="right" muted={isUnchanged} />
          </div>
        )}
      </div>
    </div>
  );
}

function DiffBlock({ before, after, side, muted }: { before: string; after: string; side: 'left' | 'right'; muted?: boolean }) {
  const text = side === 'left' ? before : after;
  if (muted || !before || !after || before === after) {
    return (
      <div
        style={{
          padding: '10px 12px',
          background: DS.surface,
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
  const diff = wordDiff(before, after);
  const tokens = side === 'left' ? diff.left : diff.right;
  return (
    <div
      style={{
        padding: '10px 12px',
        background: DS.surface,
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
          padding: '0 2px',
        }}
      >
        {t.text}
      </span>
    );
  }
  if (t.op === 'insert' && side === 'right') {
    return (
      <span
        key={i}
        style={{
          background: DS.accentSoft,
          color: DS.accentDeep,
          padding: '0 2px',
          fontWeight: 500,
        }}
      >
        {t.text}
      </span>
    );
  }
  return null;
}

function EditBlock({
  draft,
  onUpdate,
  onSave,
  onCancel,
  cps,
}: {
  draft: string[];
  onUpdate: (lines: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  cps: number;
}) {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {draft.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              padding: '8px 10px',
              background: DS.surface2,
              border: `1px solid ${DS.line2}`,
            }}
          >
            <input
              type="text"
              value={line}
              onChange={(e) => onUpdate(draft.map((l, j) => (j === i ? e.target.value : l)))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onSave();
                } else if (e.key === 'Escape') {
                  onCancel();
                }
              }}
              autoFocus={i === 0}
              style={{
                flex: 1,
                fontSize: 13,
                fontFamily: TYPO.text,
                color: DS.fg1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                minWidth: 0,
              }}
            />
            <span style={{ fontSize: 10, color: DS.fg4, fontFamily: TYPO.display, fontWeight: 500, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {line.length} chars
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onSave}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            height: 30,
            fontFamily: TYPO.display,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: DS.bg,
            background: DS.fg1,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Check size={12} strokeWidth={1.5} /> Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            height: 30,
            fontFamily: TYPO.display,
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: DS.fg2,
            background: DS.bg,
            border: `1px solid ${DS.line2}`,
            cursor: 'pointer',
          }}
        >
          <X size={12} strokeWidth={1.5} /> Cancelar
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: DS.fg4, fontFamily: TYPO.text }}>
          ⌘+↵ salvar · Esc cancelar · CPS atual: {cps.toFixed(1)}
        </span>
      </div>
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
