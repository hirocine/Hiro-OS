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
    return <p className="text-sm text-muted-foreground">Sem dados</p>;
  }
  return (
    <ul className="space-y-2">
      {list.map((e) => (
        <li
          key={e.key}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card hover:bg-muted/30 px-3 py-3 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0" aria-hidden>
              {localeFlag(e.key)}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{localeLabel(e.key)}</p>
              <p className="text-xs text-muted-foreground font-numeric">{e.key}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-base font-bold font-numeric">{e.pct.toFixed(1)}%</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
