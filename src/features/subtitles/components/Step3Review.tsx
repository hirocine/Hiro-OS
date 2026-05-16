import { useState, useMemo } from 'react';
import { Check, X, Edit3, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { wordDiff, hasDiff, type DiffToken } from '../utils/diff';
import type { SrtCue } from '../types';

interface Props {
  beforeCues: SrtCue[];
  afterCues: SrtCue[];
  onUpdate: (cues: SrtCue[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Step3Review({ beforeCues, afterCues, onUpdate, onBack, onNext }: Props) {
  const [showUnchanged, setShowUnchanged] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const beforeByIdx = useMemo(() => {
    const m = new Map<number, SrtCue>();
    beforeCues.forEach((c) => m.set(c.index, c));
    return m;
  }, [beforeCues]);

  const stats = useMemo(() => {
    let changed = 0;
    let unchanged = 0;
    afterCues.forEach((c) => {
      const b = beforeByIdx.get(c.index);
      if (!b) return;
      if (hasDiff(b.text, c.text)) changed++;
      else unchanged++;
    });
    return { changed, unchanged, total: afterCues.length };
  }, [afterCues, beforeByIdx]);

  const startEdit = (cue: SrtCue) => {
    setEditingIdx(cue.index);
    setEditDraft(cue.text);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    onUpdate(afterCues.map((c) => (c.index === editingIdx ? { ...c, text: editDraft.trim() } : c)));
    setEditingIdx(null);
    setEditDraft('');
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditDraft('');
  };

  const revertCue = (cue: SrtCue) => {
    const original = beforeByIdx.get(cue.index);
    if (!original) return;
    onUpdate(afterCues.map((c) => (c.index === cue.index ? { ...c, text: original.text } : c)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
        <div style={{ display: 'flex', gap: 24 }}>
          <Stat label="Total" value={String(stats.total)} />
          <Stat label="Alteradas" value={String(stats.changed)} accent="info" />
          <Stat label="Iguais" value={String(stats.unchanged)} />
        </div>
        <button
          type="button"
          className="btn sm"
          onClick={() => setShowUnchanged((v) => !v)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {showUnchanged ? <EyeOff size={12} strokeWidth={1.5} /> : <Eye size={12} strokeWidth={1.5} />}
          {showUnchanged ? 'Ocultar iguais' : 'Mostrar iguais'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'hsl(var(--ds-line-1))', border: '1px solid hsl(var(--ds-line-1))' }}>
        {afterCues.map((cue) => {
          const before = beforeByIdx.get(cue.index);
          if (!before) return null;
          const changed = hasDiff(before.text, cue.text);
          if (!changed && !showUnchanged) return null;
          const isEditing = editingIdx === cue.index;
          const diff = changed ? wordDiff(before.text, cue.text) : null;

          return (
            <div key={cue.index} style={{ background: 'hsl(var(--ds-surface))', padding: '14px 16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontFamily: '"HN Text", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ fontWeight: 500, color: 'hsl(var(--ds-text))' }}>#{cue.index}</span>
                  <span>
                    {cue.startStr.slice(0, 8)} → {cue.endStr.slice(0, 8)}
                  </span>
                  {changed && (
                    <span
                      style={{
                        padding: '2px 6px',
                        fontSize: 10,
                        background: 'hsl(var(--ds-info) / 0.1)',
                        color: 'hsl(var(--ds-info))',
                        border: '1px solid hsl(var(--ds-info) / 0.3)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Alterada
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!isEditing && (
                    <button
                      type="button"
                      className="btn sm icon"
                      onClick={() => startEdit(cue)}
                      title="Editar texto"
                    >
                      <Edit3 size={12} strokeWidth={1.5} />
                    </button>
                  )}
                  {changed && !isEditing && (
                    <button
                      type="button"
                      className="btn sm icon"
                      onClick={() => revertCue(cue)}
                      title="Desfazer (voltar ao original)"
                    >
                      <RotateCcw size={12} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div>
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={3}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: 13,
                      fontFamily: '"HN Text", sans-serif',
                      background: 'hsl(var(--ds-bg-2))',
                      border: '1px solid hsl(var(--ds-line-2))',
                      color: 'hsl(var(--ds-text))',
                      outline: 'none',
                      resize: 'vertical',
                      lineHeight: 1.5,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn primary sm"
                      onClick={saveEdit}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Check size={12} strokeWidth={1.5} />
                      Salvar
                    </button>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={cancelEdit}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <X size={12} strokeWidth={1.5} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : changed && diff ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <DiffPane label="Antes" tokens={diff.left} side="left" />
                  <DiffPane label="Depois" tokens={diff.right} side="right" />
                </div>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontFamily: '"HN Text", sans-serif',
                    color: 'hsl(var(--ds-text))',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {cue.text}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <button type="button" className="btn" onClick={onBack}>
          ← Voltar
        </button>
        <button type="button" className="btn primary" onClick={onNext}>
          Exportar →
        </button>
      </div>
    </div>
  );
}

function DiffPane({ label, tokens, side }: { label: string; tokens: DiffToken[]; side: 'left' | 'right' }) {
  return (
    <div>
      <p
        style={{
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'hsl(var(--ds-fg-3))',
          fontFamily: '"HN Display", sans-serif',
          margin: '0 0 6px',
        }}
      >
        {label}
      </p>
      <div
        style={{
          padding: '10px 12px',
          background: 'hsl(var(--ds-bg-2))',
          border: '1px solid hsl(var(--ds-line-1))',
          fontSize: 13,
          fontFamily: '"HN Text", sans-serif',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          minHeight: 50,
        }}
      >
        {tokens.map((t, i) => {
          if (t.op === 'equal') {
            return (
              <span key={i} style={{ color: 'hsl(var(--ds-fg-2))' }}>
                {t.text}
              </span>
            );
          }
          if (t.op === 'delete' && side === 'left') {
            return (
              <span
                key={i}
                style={{
                  background: 'hsl(0 60% 50% / 0.18)',
                  color: 'hsl(0 60% 45%)',
                  textDecoration: 'line-through',
                  textDecorationColor: 'hsl(0 60% 45% / 0.6)',
                  padding: '0 2px',
                  borderRadius: 0,
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
                  background: 'hsl(140 50% 45% / 0.18)',
                  color: 'hsl(140 60% 32%)',
                  padding: '0 2px',
                  borderRadius: 0,
                  fontWeight: 500,
                }}
              >
                {t.text}
              </span>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'info' }) {
  return (
    <div>
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
          fontSize: 18,
          letterSpacing: '-0.01em',
          margin: '2px 0 0',
          color: accent === 'info' ? 'hsl(var(--ds-info))' : 'hsl(var(--ds-text))',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
    </div>
  );
}
