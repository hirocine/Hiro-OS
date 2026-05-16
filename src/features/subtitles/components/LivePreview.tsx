import { useMemo } from 'react';
import type { SubtitleStyle, AspectRatio } from '../types';

interface Props {
  style: SubtitleStyle;
  text: string;
  caption?: string;
}

const ASPECT_DIMS: Record<AspectRatio, { w: number; h: number }> = {
  '16:9': { w: 320, h: 180 },
  '9:16': { w: 180, h: 320 },
  '1:1': { w: 240, h: 240 },
  '4:5': { w: 220, h: 275 },
};

export function LivePreview({ style, text, caption }: Props) {
  const dims = ASPECT_DIMS[style.aspect_ratio];
  const scale = dims.h / 1080;

  const renderedStyle = useMemo(() => {
    const fontSize = style.font_size * scale;
    const outlineWidth = style.outline_width * scale;

    const textShadow = (() => {
      if (style.outline_width === 0 || !style.outline_color) return undefined;
      const w = Math.max(1, outlineWidth);
      const c = style.outline_color;
      return `${-w}px ${-w}px 0 ${c}, ${w}px ${-w}px 0 ${c}, ${-w}px ${w}px 0 ${c}, ${w}px ${w}px 0 ${c}, 0 ${-w}px 0 ${c}, 0 ${w}px 0 ${c}, ${-w}px 0 0 ${c}, ${w}px 0 0 ${c}`;
    })();

    const bg = (() => {
      if (!style.background_color || style.background_opacity === 0) return 'transparent';
      const hex = style.background_color.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${style.background_opacity})`;
    })();

    return {
      fontFamily: `"${style.font_family}", sans-serif`,
      fontSize: `${fontSize}px`,
      fontWeight: style.font_weight === 'bold' ? 700 : 400,
      color: style.text_color,
      textShadow,
      background: bg,
      padding: bg === 'transparent' ? 0 : `${4 * scale}px ${10 * scale}px`,
      lineHeight: 1.15,
      letterSpacing: '-0.005em',
      textAlign: 'center' as const,
      whiteSpace: 'pre-line' as const,
      maxWidth: `${dims.w * 0.92}px`,
      display: 'inline-block',
    };
  }, [style, scale, dims.w]);

  const containerJustify = (() => {
    if (style.position === 'top') return 'flex-start';
    if (style.position === 'middle') return 'center';
    return 'flex-end';
  })();

  return (
    <div style={{ display: 'inline-block' }}>
      <div
        style={{
          position: 'relative',
          width: dims.w,
          height: dims.h,
          background: '#2a2a2a',
          border: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: containerJustify,
          alignItems: 'center',
          padding: `${12 * scale}px`,
          overflow: 'hidden',
        }}
      >
        <div style={renderedStyle}>{text || '—'}</div>
      </div>
      {caption && (
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 10,
            color: 'hsl(var(--ds-fg-3))',
            fontFamily: '"HN Text", sans-serif',
            textAlign: 'center',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
