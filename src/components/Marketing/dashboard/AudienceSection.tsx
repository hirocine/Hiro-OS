import { Users, MapPin, Globe } from 'lucide-react';
import { GenderAgeHero } from './GenderAgeHero';
import { CityRanking } from './CityRanking';
import { LocaleList } from './LocaleList';
import { formatTimeAgo, topEntries } from '@/lib/marketing-dashboard-utils';

interface Audience {
  captured_at: string;
  gender_age: Record<string, number>;
  cities: Record<string, number>;
  locales: Record<string, number>;
}

interface Props {
  audience: Audience | null;
  syncingAudience: boolean;
  onSyncAudience: () => void;
}

export function AudienceSection({ audience, syncingAudience, onSyncAudience }: Props) {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          borderBottom: '1px solid hsl(var(--ds-line-1))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              background: 'hsl(var(--ds-accent) / 0.1)',
              color: 'hsl(var(--ds-accent))',
              flexShrink: 0,
            }}
          >
            <Users size={16} strokeWidth={1.5} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: 'hsl(var(--ds-fg-1))',
                lineHeight: 1.25,
              }}
            >
              Sobre sua audiência
            </h3>
            <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
              Quem te segue no Instagram
            </p>
          </div>
        </div>
        {audience && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'hsl(var(--ds-fg-3))',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'hsl(var(--ds-success))',
              }}
            />
            Atualizado {formatTimeAgo(audience.captured_at).text}
          </span>
        )}
      </div>

      <div style={{ padding: 18 }}>
        {!audience ? (
          <div className="empties" style={{ borderTop: 0, borderLeft: 0, borderRight: 0 }}>
            <div className="empty" style={{ borderRight: 0 }}>
              <div className="glyph">
                <Users strokeWidth={1.25} />
              </div>
              <h5>Sem dados de audiência ainda</h5>
              <p>A demografia é atualizada semanalmente. Você pode forçar a primeira sincronização agora.</p>
              <div className="actions">
                <button className="btn primary" onClick={onSyncAudience} type="button" disabled={syncingAudience}>
                  <span>{syncingAudience ? 'Sincronizando…' : 'Sincronizar audiência agora'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <GenderAgeHero audience={audience} />

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24 }}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      color: 'hsl(var(--ds-fg-3))',
                    }}
                  >
                    <MapPin size={13} strokeWidth={1.5} />
                    <span
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                      }}
                    >
                      Top cidades
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'hsl(var(--ds-fg-4))',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {topEntries(audience.cities, 100).length} cidades
                  </span>
                </div>
                <CityRanking cities={audience.cities} />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      color: 'hsl(var(--ds-fg-3))',
                    }}
                  >
                    <Globe size={13} strokeWidth={1.5} />
                    <span
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                      }}
                    >
                      Idiomas falados
                    </span>
                  </div>
                </div>
                <LocaleList locales={audience.locales} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
