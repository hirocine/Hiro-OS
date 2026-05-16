import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FONT_FAMILIES, type SubtitleStyle, type SubtitlePosition, type FontWeight } from '../types';

interface Props {
  style: SubtitleStyle;
  onChange: (style: SubtitleStyle) => void;
}

export function StyleSettings({ style, onChange }: Props) {
  const set = <K extends keyof SubtitleStyle>(k: K, v: SubtitleStyle[K]) => onChange({ ...style, [k]: v });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Field label="Linhas">
        <NumberInput value={style.max_lines} min={1} max={4} onChange={(v) => set('max_lines', v)} />
      </Field>
      <Field label="Caracteres por linha">
        <NumberInput value={style.chars_per_line} min={10} max={80} onChange={(v) => set('chars_per_line', v)} />
      </Field>

      <Field label="Posição">
        <Select value={style.position} onValueChange={(v) => set('position', v as SubtitlePosition)}>
          <SelectTrigger className="ds-select-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="ds-shell">
            <SelectItem value="top">Topo</SelectItem>
            <SelectItem value="middle">Meio</SelectItem>
            <SelectItem value="bottom">Base</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Fonte">
        <Select value={style.font_family} onValueChange={(v) => set('font_family', v)}>
          <SelectTrigger className="ds-select-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="ds-shell">
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f} value={f}>
                <span style={{ fontFamily: `"${f}", sans-serif` }}>{f}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Tamanho (px)">
        <NumberInput value={style.font_size} min={10} max={96} onChange={(v) => set('font_size', v)} />
      </Field>
      <Field label="Peso">
        <Select value={style.font_weight} onValueChange={(v) => set('font_weight', v as FontWeight)}>
          <SelectTrigger className="ds-select-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="ds-shell">
            <SelectItem value="normal">Regular</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Cor do texto">
        <ColorInput value={style.text_color} onChange={(v) => set('text_color', v)} />
      </Field>
      <Field label="Outline">
        <div style={{ display: 'flex', gap: 6 }}>
          <ColorInput value={style.outline_color ?? '#000000'} onChange={(v) => set('outline_color', v)} />
          <NumberInput
            value={style.outline_width}
            min={0}
            max={10}
            onChange={(v) => set('outline_width', v)}
            style={{ width: 56 }}
            suffix="px"
          />
        </div>
      </Field>

      <Field label="Background" full>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontFamily: '"HN Text", sans-serif',
              color: 'hsl(var(--ds-text))',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={style.background_color !== null && style.background_opacity > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({
                    ...style,
                    background_color: style.background_color ?? '#000000',
                    background_opacity: style.background_opacity > 0 ? style.background_opacity : 0.75,
                  });
                } else {
                  onChange({ ...style, background_color: null, background_opacity: 0 });
                }
              }}
            />
            Ativar
          </label>
          {style.background_color !== null && style.background_opacity > 0 && (
            <>
              <ColorInput value={style.background_color ?? '#000000'} onChange={(v) => set('background_color', v)} />
              <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontFamily: '"HN Text", sans-serif' }}>
                Opacidade
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={style.background_opacity}
                onChange={(e) => set('background_opacity', Number(e.target.value))}
                style={{ flex: 1, accentColor: 'hsl(var(--ds-text))' }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--ds-text))',
                  fontFamily: '"HN Text", sans-serif',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 28,
                  textAlign: 'right',
                }}
              >
                {Math.round(style.background_opacity * 100)}%
              </span>
            </>
          )}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
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

function NumberInput({
  value,
  min,
  max,
  onChange,
  style,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  style?: React.CSSProperties;
  suffix?: string;
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: style?.width ?? '100%' }}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        style={{
          width: '100%',
          padding: '7px 10px',
          paddingRight: suffix ? 28 : 10,
          fontSize: 12,
          fontFamily: '"HN Text", sans-serif',
          fontVariantNumeric: 'tabular-nums',
          background: 'hsl(var(--ds-surface))',
          border: '1px solid hsl(var(--ds-line-1))',
          color: 'hsl(var(--ds-text))',
          outline: 'none',
          ...style,
        }}
      />
      {suffix && (
        <span
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 10,
            color: 'hsl(var(--ds-fg-3))',
            fontFamily: '"HN Text", sans-serif',
            pointerEvents: 'none',
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 6px',
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
      }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 22, height: 22, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 70,
          padding: 0,
          fontSize: 11,
          fontFamily: '"HN Text", sans-serif',
          fontVariantNumeric: 'tabular-nums',
          background: 'transparent',
          border: 'none',
          color: 'hsl(var(--ds-text))',
          outline: 'none',
          textTransform: 'uppercase',
        }}
      />
    </div>
  );
}
