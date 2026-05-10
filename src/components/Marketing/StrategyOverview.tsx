import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Target, Layers, ArrowRight, UserCircle, Sparkles } from 'lucide-react';
import { getPillarColor } from '@/lib/marketing-colors';

interface PersonaSummary {
  id: string;
  name: string;
  segment?: string | null;
  company_size?: string | null;
  channels_consumed?: string[] | null;
}

interface PillarSummary {
  id: string;
  name: string;
  color?: string | null;
  target_percentage?: number | null;
}

interface PostSummary {
  pillar_id: string | null;
}

interface Props {
  persona: PersonaSummary | null;
  pillars: PillarSummary[];
  postsThisMonth: PostSummary[];
}

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
};

export function StrategyOverview({ persona, pillars, postsThisMonth }: Props) {
  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    postsThisMonth.forEach((p) => {
      if (p.pillar_id) counts[p.pillar_id] = (counts[p.pillar_id] ?? 0) + 1;
    });
    const total = postsThisMonth.length;
    return pillars
      .map((pillar) => {
        const count = counts[pillar.id] ?? 0;
        const realPct = total > 0 ? (count / total) * 100 : 0;
        const targetPct = pillar.target_percentage ?? null;
        const variance = targetPct !== null ? realPct - targetPct : null;
        const color =
          (pillar.color ? getPillarColor(pillar.color).hex : undefined) ??
          getPillarColor(pillar.name).hex;
        return { pillar, count, realPct, targetPct, variance, color };
      })
      .sort((a, b) => b.count - a.count);
  }, [pillars, postsThisMonth]);

  const top3 = distribution.slice(0, 3);

  return (
    <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--ds-line-1))',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Sparkles size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-2))',
            }}
          >
            Estratégia ativa
          </span>
          <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
            Para quem você produz e em que temas se posiciona
          </span>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 24,
          }}
        >
          {/* Persona */}
          <div style={{ gridColumn: 'span 12 / span 12', display: 'flex', flexDirection: 'column', gap: 12 }} className="strategy-persona-col">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserCircle size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'hsl(var(--ds-fg-1))',
                    fontFamily: '"HN Display", sans-serif',
                  }}
                >
                  Persona
                </h3>
              </div>
              <Link
                to="/marketing/estrategia?aba=persona"
                className="btn"
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                Ver completo
                <ArrowRight size={11} strokeWidth={1.5} />
              </Link>
            </div>

            {persona ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  border: '1px solid hsl(var(--ds-line-1))',
                  padding: 16,
                }}
              >
                <p style={eyebrow}>Cliente ideal</p>
                <p
                  style={{
                    fontFamily: '"HN Display", sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: 1.3,
                    color: 'hsl(var(--ds-fg-1))',
                  }}
                >
                  {persona.name}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {persona.segment && <span className="pill muted">{persona.segment}</span>}
                  {persona.company_size && <span className="pill muted">{persona.company_size}</span>}
                </div>
                {persona.channels_consumed && persona.channels_consumed.length > 0 && (
                  <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', paddingTop: 4 }}>
                    Canais: {persona.channels_consumed.slice(0, 3).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed hsl(var(--ds-line-1))',
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <UserCircle size={28} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', marginBottom: 8 }} />
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-1))',
                    fontFamily: '"HN Display", sans-serif',
                  }}
                >
                  Defina sua persona
                </p>
                <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                  Quem é o cliente ideal da Hiro Films?
                </p>
                <Link
                  to="/marketing/estrategia?aba=persona"
                  className="btn"
                  style={{ marginTop: 12, fontSize: 11 }}
                >
                  Criar persona
                </Link>
              </div>
            )}
          </div>

          {/* Pilares */}
          <div style={{ gridColumn: 'span 12 / span 12', display: 'flex', flexDirection: 'column', gap: 12 }} className="strategy-pillars-col">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'hsl(var(--ds-fg-1))',
                    fontFamily: '"HN Display", sans-serif',
                  }}
                >
                  Top pilares (últimos 30 dias)
                </h3>
              </div>
              <Link
                to="/marketing/estrategia?aba=pilares"
                className="btn"
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                Ver completo
                <ArrowRight size={11} strokeWidth={1.5} />
              </Link>
            </div>

            {pillars.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed hsl(var(--ds-line-1))',
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <Layers size={28} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', marginBottom: 8 }} />
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-1))',
                    fontFamily: '"HN Display", sans-serif',
                  }}
                >
                  Defina seus pilares
                </p>
                <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 4 }}>
                  Os 3-5 temas que sua marca representa
                </p>
                <Link
                  to="/marketing/estrategia?aba=pilares"
                  className="btn"
                  style={{ marginTop: 12, fontSize: 11 }}
                >
                  Criar pilares
                </Link>
              </div>
            ) : top3.length === 0 || postsThisMonth.length === 0 ? (
              <div
                style={{
                  border: '2px dashed hsl(var(--ds-line-1))',
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                  Nenhum post publicado nos últimos 30 dias
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {top3.map((d) => {
                  const variance = d.variance;
                  let varColor = 'hsl(var(--ds-fg-3))';
                  if (variance !== null) {
                    const abs = Math.abs(variance);
                    if (abs < 5) varColor = 'hsl(var(--ds-success))';
                    else if (abs < 15) varColor = 'hsl(var(--ds-warning))';
                    else varColor = 'hsl(var(--ds-danger))';
                  }
                  return (
                    <div key={d.pillar.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <span
                            style={{
                              height: 10,
                              width: 10,
                              borderRadius: '50%',
                              flexShrink: 0,
                              background: d.color,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: 'hsl(var(--ds-fg-1))',
                            }}
                          >
                            {d.pillar.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: 'hsl(var(--ds-fg-1))',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {d.realPct.toFixed(0)}%
                          </span>
                          {variance !== null && (
                            <span
                              style={{
                                fontSize: 11,
                                color: varColor,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {variance > 0 ? '+' : ''}
                              {variance.toFixed(0)}% vs meta
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          position: 'relative',
                          height: 6,
                          width: '100%',
                          overflow: 'hidden',
                          background: 'hsl(var(--ds-line-2) / 0.5)',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            background: d.color,
                            width: `${Math.min(100, d.realPct)}%`,
                          }}
                        />
                        {d.targetPct !== null && d.targetPct > 0 && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              width: 1,
                              background: 'hsl(var(--ds-fg-1) / 0.6)',
                              left: `${Math.min(100, d.targetPct)}%`,
                            }}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 10,
                          color: 'hsl(var(--ds-fg-3))',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        <span>
                          {d.count} {d.count === 1 ? 'post' : 'posts'}
                        </span>
                        {d.targetPct !== null && <span>Meta: {d.targetPct}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .strategy-persona-col { grid-column: span 5 / span 5 !important; }
          .strategy-pillars-col { grid-column: span 7 / span 7 !important; }
        }
      `}</style>
    </div>
  );
}
