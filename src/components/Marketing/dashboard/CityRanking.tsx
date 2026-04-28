import { cn } from '@/lib/utils';
import { topEntries } from '@/lib/marketing-dashboard-utils';

interface Props {
  cities: Record<string, number>;
}

export function CityRanking({ cities }: Props) {
  const list = topEntries(cities, 8);
  if (list.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados</p>;
  }
  const max = list[0].pct;
  return (
    <ul className="space-y-2.5">
      {list.map((e, i) => {
        const isTop3 = i < 3;
        const widthPct = max > 0 ? (e.pct / max) * 100 : 0;
        return (
          <li
            key={e.key}
            className={cn(
              'rounded-lg p-3 transition-all',
              isTop3 ? 'bg-muted/50' : 'hover:bg-muted/30',
            )}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-numeric',
                    i === 0 && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    i === 1 && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                    i === 2 && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                    i > 2 && 'bg-muted text-muted-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium truncate">{e.key}</span>
              </div>
              <span className="text-sm font-numeric font-semibold shrink-0">
                {e.pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isTop3 ? 'bg-primary' : 'bg-primary/40',
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
