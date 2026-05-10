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
    null as null | (typeof ageList)[number]
  );

  if (genderTotal === 0 && ageList.length === 0) {
    return (
      <div
        style={{
          border: '1px dashed hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-line-2) / 0.3)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
          Dados de gênero e idade ainda não disponíveis.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: 20,
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 500,
            color: 'hsl(var(--ds-fg-3))',
          }}
        >
          Perfil dominante
        </p>
        <p
          style={{
            fontFamily: '"HN Display", sans-serif',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'hsl(var(--ds-fg-1))',
            marginTop: 4,
          }}
        >
          {dominantAge ? `${dominantAge.key} anos` : '—'}
        </p>
        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
          {fPct >= 55 && 'Maioria mulheres'}
          {mPct >= 55 && 'Maioria homens'}
          {fPct < 55 && mPct < 55 && 'Equilibrado'}
          {dominantAge && ` • ${dominantAge.pct.toFixed(0)}% da audiência`}
        </p>
      </div>

      {genderTotal > 0 && (
        <div style={{ marginBottom: 24 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-3))',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Gênero
          </span>
          <div style={{ height: 8, background: 'hsl(var(--ds-line-2))', overflow: 'hidden', display: 'flex' }}>
            {fPct > 0 && (
              <div
                style={{ height: '100%', width: `${fPct}%`, background: GENDER_COLORS.F, transition: 'width 0.5s' }}
                title={`Mulheres ${fPct.toFixed(1)}%`}
              />
            )}
            {mPct > 0 && (
              <div
                style={{ height: '100%', width: `${mPct}%`, background: GENDER_COLORS.M, transition: 'width 0.5s' }}
                title={`Homens ${mPct.toFixed(1)}%`}
              />
            )}
            {uPct > 0.1 && (
              <div
                style={{ height: '100%', width: `${uPct}%`, background: GENDER_COLORS.U, transition: 'width 0.5s' }}
                title={`Outros ${uPct.toFixed(1)}%`}
              />
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 10, fontSize: 11 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: GENDER_COLORS.F }} />
              <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-1))' }}>
                {fPct.toFixed(1)}%
              </span>
              <span style={{ color: 'hsl(var(--ds-fg-3))' }}>mulheres</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: GENDER_COLORS.M }} />
              <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-1))' }}>
                {mPct.toFixed(1)}%
              </span>
              <span style={{ color: 'hsl(var(--ds-fg-3))' }}>homens</span>
            </div>
            {uPct > 0.1 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: GENDER_COLORS.U }} />
                <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-1))' }}>
                  {uPct.toFixed(1)}%
                </span>
                <span style={{ color: 'hsl(var(--ds-fg-3))' }}>outros</span>
              </div>
            )}
          </div>
        </div>
      )}

      {ageList.length > 0 && (
        <div>
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-3))',
              display: 'block',
              marginBottom: 12,
            }}
          >
            Faixa etária
          </span>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
            {ageList.map((e) => {
              const isDominant = dominantAge?.key === e.key;
              return (
                <li
                  key={e.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 50px',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                      color: isDominant ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                    }}
                  >
                    {e.key}
                  </span>
                  <div style={{ height: 6, background: 'hsl(var(--ds-line-2))', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${e.pct}%`,
                        background: isDominant ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-accent) / 0.4)',
                        transition: 'width 0.5s',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'right',
                      fontWeight: isDominant ? 600 : 400,
                      color: isDominant ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                    }}
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
