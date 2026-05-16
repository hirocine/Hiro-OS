import { useMemo } from 'react';
import type { SubtitleStyle, AspectRatio } from '../types';

interface Props {
  style: SubtitleStyle;
  text: string;
  showSafeArea?: boolean;
  width?: number;
}

const ASPECT_DIMS: Record<AspectRatio, { w: number; h: number }> = {
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '1:1': { w: 1080, h: 1080 },
  '4:5': { w: 1080, h: 1350 },
  '2.39:1': { w: 2048, h: 858 },
};

export function LivePreview({ style, text, showSafeArea, width = 560 }: Props) {
  const dims = ASPECT_DIMS[style.aspect_ratio];
  const aspectRatio = dims.w / dims.h;
  const containerW = width;
  const containerH = containerW / aspectRatio;
  const scale = containerH / dims.h;

  const rendered = useMemo(() => {
    const fontSize = style.font_size * scale;
    const outlineW = style.outline_width * scale;
    const trackingEm = style.tracking / 1000;

    const textShadow = (() => {
      const parts: string[] = [];
      if (style.outline_width > 0 && style.outline_color) {
        const w = Math.max(0.5, outlineW);
        const c = style.outline_color;
        // 8-direction stroke
        parts.push(
          `${-w}px ${-w}px 0 ${c}`,
          `${w}px ${-w}px 0 ${c}`,
          `${-w}px ${w}px 0 ${c}`,
          `${w}px ${w}px 0 ${c}`,
          `0 ${-w}px 0 ${c}`,
          `0 ${w}px 0 ${c}`,
          `${-w}px 0 0 ${c}`,
          `${w}px 0 0 ${c}`,
        );
      }
      if (style.shadow_enabled) {
        parts.push(`${style.shadow_x * scale}px ${style.shadow_y * scale}px ${style.shadow_blur * scale}px ${style.shadow_color}`);
      }
      return parts.length > 0 ? parts.join(', ') : undefined;
    })();

    const bg = (() => {
      if (style.bg_type === 'none' || !style.background_color || style.background_opacity === 0) return 'transparent';
      const hex = style.background_color.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${style.background_opacity})`;
    })();

    const textTransform = style.casing === 'upper' ? 'uppercase' : 'none';

    return {
      lineStyle: {
        fontFamily: `"${style.font_family}", "HN Display", sans-serif`,
        fontSize: `${fontSize}px`,
        fontWeight: style.font_weight === 'bold' ? 700 : 500,
        color: style.text_color,
        textShadow,
        background: bg,
        padding: bg === 'transparent' ? 0 : `${style.padding_v * scale}px ${style.padding_h * scale}px`,
        lineHeight: 1.2,
        letterSpacing: `${trackingEm}em`,
        textTransform: textTransform as 'uppercase' | 'none',
        whiteSpace: 'nowrap' as const,
        display: 'inline-block',
      },
    };
  }, [style, scale]);

  const positionStyle = useMemo(() => {
    const marginPct = style.margin_v;
    if (style.position === 'top') return { top: `${marginPct}%`, bottom: 'auto' };
    if (style.position === 'middle') return { top: '50%', bottom: 'auto', transform: 'translateY(-50%)' };
    return { bottom: `${marginPct}%`, top: 'auto' };
  }, [style.position, style.margin_v]);

  const lines = (text || '—').split('\n');

  return (
    <div
      style={{
        position: 'relative',
        width: containerW,
        height: containerH,
        background: '#0A0A0A',
        overflow: 'hidden',
        display: 'inline-block',
      }}
    >
      {/* Cena fake (gradient quente) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(70% 80% at 50% 30%, #6a5840 0%, transparent 65%), linear-gradient(180deg, #3a3128 0%, #110d09 100%)',
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(70% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      {/* Safe area */}
      {showSafeArea && (
        <>
          <div
            style={{
              position: 'absolute',
              left: '5%',
              right: '5%',
              top: '5%',
              bottom: '5%',
              border: '1px dashed rgba(0, 226, 122, 0.5)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '10%',
              right: '10%',
              top: '10%',
              bottom: '10%',
              border: '1px dashed rgba(255, 255, 255, 0.3)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
      {/* Subtitle */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: `0 ${100 - style.max_width}%`,
          zIndex: 2,
          ...positionStyle,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3 * scale,
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: `${style.max_width}%`,
          }}
        >
          {lines.map((line, i) => (
            <span key={i} style={rendered.lineStyle}>
              {line || '—'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function wrapLines(text: string, maxChars: number, maxLines: number): string {
  const flat = text.replace(/\n/g, ' ').trim();
  const words = flat.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current) {
      current = w;
      continue;
    }
    if (current.length + 1 + w.length <= maxChars) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.join('\n');
}
