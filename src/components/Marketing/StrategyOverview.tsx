import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Layers, ArrowRight, UserCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Estratégia ativa</CardTitle>
            <p className="text-xs text-muted-foreground">
              Para quem você produz e em que temas se posiciona
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Persona */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Persona</h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/marketing/persona">
                  Ver completo
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>

            {persona ? (
              <div className="space-y-2 rounded-lg border border-border p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Cliente ideal
                </p>
                <p className="text-base font-semibold leading-snug">{persona.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {persona.segment && (
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                      {persona.segment}
                    </span>
                  )}
                  {persona.company_size && (
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground/80">
                      {persona.company_size}
                    </span>
                  )}
                </div>
                {persona.channels_consumed && persona.channels_consumed.length > 0 && (
                  <p className="text-xs text-muted-foreground pt-1">
                    Canais: {persona.channels_consumed.slice(0, 3).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                <UserCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Defina sua persona</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Quem é o cliente ideal da Hiro Films?
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 h-7 text-xs">
                  <Link to="/marketing/persona">Criar persona</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Pilares */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  Top pilares (últimos 30 dias)
                </h3>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/marketing/pilares">
                  Ver completo
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </div>

            {pillars.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center">
                <Layers className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Defina seus pilares</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os 3-5 temas que sua marca representa
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 h-7 text-xs">
                  <Link to="/marketing/pilares">Criar pilares</Link>
                </Button>
              </div>
            ) : top3.length === 0 || postsThisMonth.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum post publicado nos últimos 30 dias
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {top3.map((d) => (
                  <div key={d.pillar.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: d.color }}
                        />
                        <span className="text-sm font-medium truncate">
                          {d.pillar.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold tabular-nums">
                          {d.realPct.toFixed(0)}%
                        </span>
                        {d.variance !== null && (
                          <span
                            className={cn(
                              'text-[11px] tabular-nums',
                              Math.abs(d.variance) < 5 && 'text-emerald-500',
                              Math.abs(d.variance) >= 5 && Math.abs(d.variance) < 15 && 'text-amber-500',
                              Math.abs(d.variance) >= 15 && 'text-destructive',
                            )}
                          >
                            {d.variance > 0 ? '+' : ''}
                            {d.variance.toFixed(0)}% vs meta
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          backgroundColor: d.color,
                          width: `${Math.min(100, d.realPct)}%`,
                        }}
                      />
                      {d.targetPct !== null && d.targetPct > 0 && (
                        <div
                          className="absolute inset-y-0 w-px bg-foreground/60"
                          style={{ left: `${Math.min(100, d.targetPct)}%` }}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground tabular-nums">
                      <span>
                        {d.count} {d.count === 1 ? 'post' : 'posts'}
                      </span>
                      {d.targetPct !== null && <span>Meta: {d.targetPct}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
