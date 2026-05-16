import { useMemo, useState } from 'react';
import { Check, X, Edit3, RotateCcw, Search, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { DS, TYPO } from './shared';
import { wordDiff, hasDiff, type DiffToken } from '../utils/diff';
import { classifyChange, cueStats, CHANGE_TAG_LABELS, CHANGE_TAG_COLORS, type ChangeTag } from '../utils/analyze';
import type { SrtCue } from '../types';

interface Props {
  beforeCues: SrtCue[];
  afterCues: SrtCue[];
  glossary: string[];
  onUpdate: (cues: SrtCue[]) => void;
}

type StatusFilter = 'all' | 'changed' | 'unchanged' | 'removed';

const PAGE_SIZE = 8;

interface AnnotatedCue {
  cue: SrtCue;
  before: SrtCue | undefined;
  isChanged: boolean;
  isRemoved: boolean;
  tags: ChangeTag[];
  cpsBefore: number;
  cpsAfter: number;
}

export function Step3Review({ beforeCues, afterCues, glossary, onUpdate }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilters, setTypeFilters] = useState<Set<ChangeTag>>(new Set());
  const [search, setSearch] = useState('');
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
      const isRemoved = before ? cueStats(before).isEmpty && !cueStats(c).isEmpty : false;
      const isEmptyAfter = cueStats(c).isEmpty;
      const isChanged = before ? hasDiff(before.text, c.text) : false;
      const cpsBefore = before ? cueStats(before).cps : 0;
      const cpsAfter = cueStats(c).cps;
      const tags = before ? classifyChange(before.text, c.text, glossary, cpsBefore, cpsAfter) : [];
      return {
        cue: c,
        before,
        isChanged,
        isRemoved: isEmptyAfter && !!before && !cueStats(before).isEmpty,
        tags: isEmptyAfter ? ['removida' as ChangeTag] : tags,
        cpsBefore,
        cpsAfter,
      };
    });
  }, [afterCues, beforeByIdx, glossary]);

  const stats = useMemo(() => {
    let changed = 0;
    let unchanged = 0;
    let removed = 0;
    const byType: Record<ChangeTag, number> = {
      pontuacao: 0, quebra: 0, casing: 0, glossario: 0, acentos: 0, cps: 0, removida: 0,
    };
    annotated.forEach((a) => {
      if (a.isRemoved) removed++;
      else if (a.isChanged) changed++;
      else unchanged++;
      a.tags.forEach((t) => byType[t]++);
    });
    return { total: annotated.length, changed, unchanged, removed, byType };
  }, [annotated]);

  const filtered = useMemo(() => {
    return annotated.filter((a) => {
      if (statusFilter === 'changed' && !a.isChanged) return false;
      if (statusFilter === 'unchanged' && (a.isChanged || a.isRemoved)) return false;
      if (statusFilter === 'removed' && !a.isRemoved) return false;
      if (typeFilters.size > 0 && !a.tags.some((t) => typeFilters.has(t))) return false;
      if (search) {
        const q = search.toLowerCase();
        const tBefore = a.before?.text.toLowerCase() ?? '';
        const tAfter = a.cue.text.toLowerCase();
        if (!tBefore.includes(q) && !tAfter.includes(q)) return false;
      }
      return true;
    });
  }, [annotated, statusFilter, typeFilters, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visiblePage = Math.min(page, totalPages);
  const paged = filtered.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);

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

  const revertCue = (cue: SrtCue) => {
    const before = beforeByIdx.get(cue.index);
    if (!before) return;
    onUpdate(afterCues.map((c) => (c.index === cue.index ? { ...c, text: before.text } : c)));
  };

  const toggleType = (t: ChangeTag) => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
    setPage(1);
  };

  return (
    <>
      {/* FILTER BAR */}
      <div
        style={{
          padding: '14px 40px',
          borderBottom: `1px solid ${DS.line1}`,
          background: DS.surface,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <FilterGroup>
          <FilterChip active={statusFilter === 'all'} onClick={() => { setStatusFilter('all'); setPage(1); }}>
            Todas <Count>{stats.total}</Count>
          </FilterChip>
          <FilterChip active={statusFilter === 'changed'} onClick={() => { setStatusFilter('changed'); setPage(1); }}>
            Alteradas <Count>{stats.changed}</Count>
          </FilterChip>
          <FilterChip active={statusFilter === 'unchanged'} onClick={() => { setStatusFilter('unchanged'); setPage(1); }}>
            Mantidas <Count>{stats.unchanged}</Count>
          </FilterChip>
          <FilterChip active={statusFilter === 'removed'} onClick={() => { setStatusFilter('removed'); setPage(1); }}>
            Removidas <Count>{stats.removed}</Count>
          </FilterChip>
        </FilterGroup>

        <span style={{ width: 1, height: 22, background: DS.line2 }} />

        <FilterGroup>
          {(['pontuacao', 'quebra', 'casing', 'glossario', 'acentos', 'cps'] as ChangeTag[]).map((t) => (
            <FilterChip
              key={t}
              active={typeFilters.has(t)}
              onClick={() => toggleType(t)}
              dotColor={CHANGE_TAG_COLORS[t].fg}
            >
              {CHANGE_TAG_LABELS[t]} <Count>{stats.byType[t]}</Count>
            </FilterChip>
          ))}
        </FilterGroup>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            border: `1px solid ${DS.line2}`,
            background: DS.bg,
            flex: 1,
            maxWidth: 280,
          }}
        >
          <Search size={13} strokeWidth={1.5} style={{ color: DS.fg3 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar no texto…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 12,
              fontFamily: TYPO.text,
              color: DS.fg1,
              background: 'transparent',
              minWidth: 0,
            }}
          />
        </div>

        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: DS.fg4,
            fontFamily: TYPO.display,
            letterSpacing: '0.04em',
          }}
        >
          Mostrando <strong style={{ fontWeight: 500, color: DS.fg1 }}>{paged.length === 0 ? 0 : (visiblePage - 1) * PAGE_SIZE + 1}–{Math.min(visiblePage * PAGE_SIZE, filtered.length)}</strong> de <strong style={{ fontWeight: 500, color: DS.fg1 }}>{filtered.length}</strong>
        </span>
      </div>

      {/* CUE LIST */}
      <div style={{ padding: '20px 40px', display: 'flex', flexDirection: 'column', gap: 1, background: DS.line1 }}>
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
            onRevert={() => revertCue(a.cue)}
            chars={a.cue.text.split('\n').map((l) => l.length)}
          />
        ))}
        {paged.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', background: DS.bg, color: DS.fg3, fontSize: 13, fontFamily: TYPO.text }}>
            Nenhuma legenda corresponde aos filtros atuais.
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{ padding: '14px 40px', display: 'flex', alignItems: 'center', gap: 12, borderTop: `1px solid ${DS.line1}` }}>
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
    </>
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
  onRevert,
  chars,
}: {
  entry: AnnotatedCue;
  isEditing: boolean;
  editDraft: string[];
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onUpdateDraft: (lines: string[]) => void;
  onRevert: () => void;
  chars: number[];
}) {
  const { cue, before, isChanged, isRemoved, tags, cpsAfter } = entry;
  const isUnchanged = !isChanged && !isRemoved;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px minmax(0, 1fr) minmax(0, 1fr) 102px',
        background: DS.bg,
        padding: '18px 22px',
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
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
            {tags.map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          </div>
        )}
      </div>

      {/* After */}
      <div style={{ minWidth: 0 }}>
        <ColLabel highlight={isChanged && !isEditing}>{isEditing ? 'Editando' : isRemoved ? 'Removida do output' : isUnchanged ? 'Sem alterações' : 'Depois'}</ColLabel>
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
          <DiffBlock before={before?.text ?? ''} after={cue.text} side="right" muted={isUnchanged} />
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 0, height: 'fit-content', border: `1px solid ${DS.line2}` }}>
        {!isEditing && !isRemoved && (
          <ActionBtn title="Editar" onClick={onStartEdit}>
            <Edit3 size={13} strokeWidth={1.5} />
          </ActionBtn>
        )}
        {isChanged && !isEditing && !isRemoved && (
          <ActionBtn title="Reverter" onClick={onRevert}>
            <RotateCcw size={13} strokeWidth={1.5} />
          </ActionBtn>
        )}
        {!isEditing && (
          <ActionBtn title="Mais" last>
            <MoreHorizontal size={13} strokeWidth={1.5} />
          </ActionBtn>
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

function TagPill({ tag }: { tag: ChangeTag }) {
  const c = CHANGE_TAG_COLORS[tag];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        background: c.bg,
        color: c.fg,
        fontFamily: TYPO.display,
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ width: 4, height: 4, background: c.fg, display: 'inline-block' }} />
      {CHANGE_TAG_LABELS[tag]}
    </span>
  );
}

function FilterGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'inline-flex', gap: 0, border: `1px solid ${DS.line2}` }}>{children}</div>;
}

function FilterChip({
  active,
  onClick,
  children,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 28,
        padding: '0 10px',
        fontFamily: TYPO.display,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: active ? DS.bg : DS.fg2,
        background: active ? DS.fg1 : DS.bg,
        border: 'none',
        borderRight: `1px solid ${DS.line2}`,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {dotColor && <span style={{ width: 6, height: 6, background: dotColor, display: 'inline-block' }} />}
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ marginLeft: 6, fontSize: 9, color: 'currentColor', opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>
      {children}
    </span>
  );
}

function ActionBtn({ children, onClick, title, last }: { children: React.ReactNode; onClick?: () => void; title: string; last?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 32,
        height: 32,
        display: 'grid',
        placeItems: 'center',
        color: DS.fg3,
        borderRight: last ? 'none' : `1px solid ${DS.line2}`,
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
