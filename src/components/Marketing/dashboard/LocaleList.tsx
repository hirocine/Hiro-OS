import {
  topEntries,
  localeFlag,
  localeLabel,
} from '@/lib/marketing-dashboard-utils';

interface Props {
  locales: Record<string, number>;
}

export function LocaleList({ locales }: Props) {
  const list = topEntries(locales, 5);
  if (list.length === 0) {
    return <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>Sem dados</p>;
  }

  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: 0, padding: 0, listStyle: 'none' }}>
      {list.map((e) => (
        <li
          key={e.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 12px',
            border: '1px solid hsl(var(--ds-line-1))',
            background: 'hsl(var(--ds-surface))',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(ev) => {
            ev.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
          }}
          onMouseLeave={(ev) => {
            ev.currentTarget.style.background = 'hsl(var(--ds-surface))';
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }} aria-hidden>
              {localeFlag(e.key)}
            </span>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'hsl(var(--ds-fg-1))',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {localeLabel(e.key)}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: 'hsl(var(--ds-fg-3))',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {e.key}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 16,
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                color: 'hsl(var(--ds-fg-1))',
              }}
            >
              {e.pct.toFixed(1)}%
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
