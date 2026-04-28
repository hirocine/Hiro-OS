import { cn } from '@/lib/utils';
import {
  splitGenderAge,
  ageEntries,
  GENDER_COLORS,
} from '@/lib/marketing-dashboard-utils';

interface Props {
  audience: { gender_age: Record<string, number> };
}

export function GenderAgeHero({ audience }: Props) {
  const { ages, genders } = splitGenderAge(audience.gender_age);
  const ageList = ageEntries(ages);
  const genderTotal = Object.values(genders).reduce((s, v) => s + v, 0);
  const fPct = genderTotal > 0 ? ((genders.F ?? 0) / genderTotal) * 100 : 0;
  const mPct = genderTotal > 0 ? ((genders.M ?? 0) / genderTotal) * 100 : 0;
  const uPct = Math.max(0, 100 - fPct - mPct);

  const dominantAge = ageList.reduce(
    (max, e) => (e.pct > (max?.pct ?? 0) ? e : max),
    null as null | (typeof ageList)[number],
  );

  if (genderTotal === 0 && ageList.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Dados de gênero e idade ainda não disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted/20 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Perfil dominante
          </p>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            {dominantAge ? `${dominantAge.key} anos` : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fPct >= 55 && 'Maioria mulheres'}
            {mPct >= 55 && 'Maioria homens'}
            {fPct < 55 && mPct < 55 && 'Equilibrado'}
            {dominantAge && ` • ${dominantAge.pct.toFixed(0)}% da audiência`}
          </p>
        </div>
      </div>

      {genderTotal > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-muted-foreground">Gênero</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex bg-muted">
            {fPct > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${fPct}%`, backgroundColor: GENDER_COLORS.F }}
                title={`Mulheres ${fPct.toFixed(1)}%`}
              />
            )}
            {mPct > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${mPct}%`, backgroundColor: GENDER_COLORS.M }}
                title={`Homens ${mPct.toFixed(1)}%`}
              />
            )}
            {uPct > 0.1 && (
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${uPct}%`, backgroundColor: GENDER_COLORS.U }}
                title={`Outros ${uPct.toFixed(1)}%`}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS.F }} />
              <span className="font-medium font-numeric">{fPct.toFixed(1)}%</span>
              <span className="text-muted-foreground">mulheres</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS.M }} />
              <span className="font-medium font-numeric">{mPct.toFixed(1)}%</span>
              <span className="text-muted-foreground">homens</span>
            </div>
            {uPct > 0.1 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS.U }} />
                <span className="font-medium font-numeric">{uPct.toFixed(1)}%</span>
                <span className="text-muted-foreground">outros</span>
              </div>
            )}
          </div>
        </div>
      )}

      {ageList.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-medium text-muted-foreground">Faixa etária</span>
          </div>
          <ul className="space-y-2.5">
            {ageList.map((e) => {
              const isDominant = dominantAge?.key === e.key;
              return (
                <li key={e.key} className="grid grid-cols-[60px_1fr_50px] items-center gap-3">
                  <span
                    className={cn(
                      'text-xs font-medium font-numeric',
                      isDominant ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {e.key}
                  </span>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isDominant
                          ? 'bg-gradient-to-r from-primary/80 to-primary'
                          : 'bg-primary/40',
                      )}
                      style={{ width: `${e.pct}%` }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-numeric text-right',
                      isDominant ? 'font-semibold text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {e.pct.toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
