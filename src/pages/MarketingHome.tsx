import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, Image as ImageIcon, User, Calendar, Layers, BarChart3, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMarketingReferences } from '@/hooks/useMarketingReferences';
import { useMarketingIdeas, IDEA_STATUSES } from '@/hooks/useMarketingIdeas';
import { useMarketingPersonas } from '@/hooks/useMarketingPersonas';

export default function MarketingHome() {
  const { references } = useMarketingReferences();
  const { ideas } = useMarketingIdeas();
  const { personas } = useMarketingPersonas();

  const recentReferences = references.slice(0, 6);
  const activePersona = personas[0];

  const ideaCounts = IDEA_STATUSES.map((s) => ({
    ...s,
    count: ideas.filter((i) => i.status === s.value).length,
  }));

  return (
    <ResponsiveContainer>
      <PageHeader title="Marketing" subtitle="Visão geral do módulo de Marketing" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Últimas referências */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Últimas referências
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/marketing/referencias">
                Ver todas <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentReferences.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground mb-3">
                  Nenhuma referência cadastrada ainda
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/marketing/referencias">
                    <Plus className="h-4 w-4 mr-2" /> Adicionar referência
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {recentReferences.map((r) => (
                  <Link
                    key={r.id}
                    to="/marketing/referencias"
                    className="group block rounded-lg overflow-hidden border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt={r.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{r.title}</p>
                      {r.platform && (
                        <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                          {r.platform}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ideias por status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Ideias por status
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/marketing/ideias">
                Kanban <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ideaCounts.map((s) => (
                <div
                  key={s.value}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span>{s.emoji}</span>
                    <span>{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{s.count}</span>
                </div>
              ))}
            </div>
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

        {/* Em breve */}
        {[
          { icon: Calendar, title: 'Calendário de Posts' },
          { icon: Layers, title: 'Pilares de Conteúdo' },
          { icon: BarChart3, title: 'Dashboard' },
        ].map((w) => (
          <Card key={w.title} className="border-dashed">
            <CardContent className="py-8 flex flex-col items-center text-center gap-2">
              <w.icon className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">{w.title}</p>
              <Badge variant="outline" className="text-xs">Em breve</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </ResponsiveContainer>
  );
}
