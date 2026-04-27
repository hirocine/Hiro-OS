import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, User, Calendar, Layers, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer as RechartsContainer, Tooltip } from 'recharts';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMarketingPersonas } from '@/hooks/useMarketingPersonas';
import { useMarketingPosts } from '@/hooks/useMarketingPosts';
import { useMarketingPillars } from '@/hooks/useMarketingPillars';
import { getPillarColor } from '@/lib/marketing-colors';
import { getPostPlatformLabel } from '@/lib/marketing-posts-config';

export default function MarketingHome() {
  const { personas } = useMarketingPersonas();
  const { posts } = useMarketingPosts();
  const { pillars } = useMarketingPillars();

  const activePersona = personas[0];

  const upcomingPosts = useMemo(() => {
    const now = new Date();
    return posts
      .filter((p) => (p.status === 'em_producao' || p.status === 'agendado') && p.scheduled_at && new Date(p.scheduled_at) >= now)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .slice(0, 5);
  }, [posts]);

  const distribution = useMemo(() => {
    const published = posts.filter((p) => p.status === 'publicado');
    const total = published.length;
    return pillars.map((p) => {
      const count = published.filter((pp) => pp.pillar_id === p.id).length;
      const color = getPillarColor(p.color);
      return {
        id: p.id,
        name: p.name,
        value: count,
        pct: total > 0 ? (count / total) * 100 : 0,
        color: color.hex,
      };
    });
  }, [posts, pillars]);

  const distributionData = distribution.filter((d) => d.value > 0);

  return (
    <ResponsiveContainer>
      <PageHeader title="Marketing" subtitle="Visão geral do módulo de Marketing" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Próximos posts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos posts
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/marketing/calendario">
                Ver calendário <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingPosts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground mb-3">
                  Nenhum post agendado.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/marketing/calendario">
                    <Plus className="h-4 w-4 mr-2" /> Criar primeiro post
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingPosts.map((p) => {
                  const d = parseISO(p.scheduled_at!);
                  const pillar = pillars.find((pp) => pp.id === p.pillar_id);
                  const color = pillar ? getPillarColor(pillar.color) : null;
                  return (
                    <Link
                      key={p.id}
                      to="/marketing/calendario"
                      className="flex items-center gap-3 py-2.5 hover:bg-muted/40 -mx-2 px-2 rounded-md transition"
                    >
                      <div className="w-24 shrink-0 text-xs text-muted-foreground">
                        <span className="capitalize">
                          {format(d, "EEE, dd/MM", { locale: ptBR })}
                        </span>
                        <span className="block">às {format(d, "HH'h'", { locale: ptBR })}</span>
                      </div>
                      {color ? (
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-muted shrink-0" />
                      )}
                      {p.platform && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {getPostPlatformLabel(p.platform)}
                        </Badge>
                      )}
                      <p className="text-sm font-medium truncate flex-1">{p.title}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por pilar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Distribuição por pilar
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/marketing/pilares">
                Gerenciar <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pillars.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">
                  Defina seus pilares para ver a distribuição.
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/marketing/pilares">
                    <Plus className="h-4 w-4 mr-2" /> Criar pilar
                  </Link>
                </Button>
              </div>
            ) : distributionData.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhum post publicado ainda.
              </div>
            ) : (
              <div>
                <div className="h-36">
                  <RechartsContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        dataKey="value"
                        innerRadius={36}
                        outerRadius={60}
                        paddingAngle={2}
                      >
                        {distributionData.map((d) => (
                          <Cell key={d.id} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </RechartsContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {distribution.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="truncate">{d.name}</span>
                      </div>
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {d.value} ({d.pct.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Persona ativa */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Persona ativa
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/marketing/persona">
                Gerenciar <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activePersona ? (
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={activePersona.avatar_url || undefined} alt={activePersona.name} />
                  <AvatarFallback>
                    {activePersona.name ? activePersona.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{activePersona.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {activePersona.segment && (
                      <Badge variant="outline" className="text-xs">{activePersona.segment}</Badge>
                    )}
                    {activePersona.company_size && (
                      <Badge variant="outline" className="text-xs">{activePersona.company_size}</Badge>
                    )}
                  </div>
                  {activePersona.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {activePersona.description}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">
                  Defina sua persona — quem é o cliente ideal da Hiro Films?
                </p>
                <Button asChild size="sm">
                  <Link to="/marketing/persona">
                    <Plus className="h-4 w-4 mr-2" /> Definir persona
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );
}
