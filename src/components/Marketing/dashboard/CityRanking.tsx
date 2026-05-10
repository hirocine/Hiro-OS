import { topEntries } from '@/lib/marketing-dashboard-utils';

interface Props {
  cities: Record<string, number>;
}

const rankBg = (i: number): { bg: string; fg: string } => {
  if (i === 0) return { bg: 'hsl(45 90% 60% / 0.15)', fg: 'hsl(45 90% 50%)' };
  if (i === 1) return { bg: 'hsl(var(--ds-line-2))', fg: 'hsl(var(--ds-fg-2))' };
  if (i === 2) return { bg: 'hsl(30 90% 60% / 0.15)', fg: 'hsl(30 90% 50%)' };
  return { bg: 'hsl(var(--ds-line-2))', fg: 'hsl(var(--ds-fg-3))' };
};

export function CityRanking({ cities }: Props) {
  const list = topEntries(cities, 8);
  if (list.length === 0) {
    return <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>Sem dados</p>;
  }
  const max = list[0].pct;

  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
      {list.map((e, i) => {
        const isTop3 = i < 3;
        const widthPct = max > 0 ? (e.pct / max) * 100 : 0;
        const tone = rankBg(i);
        return (
          <li
            key={e.key}
            style={{
              padding: '10px 12px',
              background: isTop3 ? 'hsl(var(--ds-line-2) / 0.5)' : 'transparent',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(ev) => {
              if (!isTop3) ev.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
            }}
            onMouseLeave={(ev) => {
              if (!isTop3) ev.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    background: tone.bg,
                    color: tone.fg,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-1))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {e.key}
                </span>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: 'hsl(var(--ds-fg-1))',
                  flexShrink: 0,
                }}
              >
                {e.pct.toFixed(1)}%
              </span>
            </div>
            <div style={{ height: 4, background: 'hsl(var(--ds-line-2))', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${widthPct}%`,
                  background: isTop3 ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-accent) / 0.4)',
                  transition: 'width 0.5s',
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
