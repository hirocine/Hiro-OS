import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Layers, ArrowRight } from 'lucide-react';
import { CardContent } from '@/components/ui/card';
import { useMarketingPillars, type MarketingPillar, type MarketingPillarInput } from '@/hooks/useMarketingPillars';
import { useMarketingIdeas } from '@/hooks/useMarketingIdeas';
import { supabase } from '@/integrations/supabase/client';
import { getPillarColor } from '@/lib/marketing-colors';
import { MarketingPillarDialog } from '@/components/Marketing/MarketingPillarDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface PostCount { pillar_id: string | null }

export function PillarsContent() {
  const { pillars, loading, createPillar, updatePillar, deletePillar } = useMarketingPillars();
  const { ideas } = useMarketingIdeas();
  const [postCounts, setPostCounts] = useState<PostCount[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingPillar | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('marketing_posts')
        .select('pillar_id')
        .eq('status', 'publicado');
      setPostCounts((data || []) as PostCount[]);
    })();
  }, [pillars.length]);

  const totalPublished = postCounts.length;

  const stats = useMemo(() => {
    return pillars.map((p) => {
      const posts = postCounts.filter((pc) => pc.pillar_id === p.id).length;
      const ideasCount = ideas.filter((i) => (i as any).pillar_id === p.id).length;
      const realPct = totalPublished > 0 ? (posts / totalPublished) * 100 : 0;
      return { pillar: p, posts, ideasCount, realPct };
    });
  }, [pillars, postCounts, ideas, totalPublished]);

  const chartData = stats
    .filter((s) => s.posts > 0)
    .map((s) => ({ name: s.pillar.name, value: s.posts, color: getPillarColor(s.pillar.color).hex }));

  const handleSave = async (input: MarketingPillarInput) => {
    if (editing) await updatePillar(editing.id, input);
    else await createPillar(input);
  };

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p: MarketingPillar) => { setEditing(p); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      {/* Header da seção com botão integrado */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight">Pilares de Conteúdo</h2>
            <p className="text-sm text-muted-foreground">Os temas centrais que sua marca representa</p>
          </div>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Novo Pilar
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : pillars.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="group cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
            onClick={openNew}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">Criar primeiro pilar</h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    3 a 5 temas centrais que sua marca representa. Organizam ideias e posts em torno de uma narrativa coerente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {totalPublished > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Distribuição real</h3>
                <span className="text-xs text-muted-foreground">
                  <strong className="text-foreground font-numeric">{totalPublished}</strong> posts publicados
                </span>
              </div>

              <div className="h-3 w-full rounded-full overflow-hidden bg-muted flex">
                {chartData.map((d, i) => {
                  const pct = (d.value / totalPublished) * 100;
                  return (
                    <div
                      key={i}
                      className="h-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: d.color }}
                      title={`${d.name}: ${d.value} (${pct.toFixed(0)}%)`}
                    />
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                {chartData.map((d, i) => {
                  const pct = (d.value / totalPublished) * 100;
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-medium">{d.name}</span>
                      <span className="text-muted-foreground font-numeric">
                        {d.value} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(({ pillar, posts, ideasCount, realPct }) => {
              const c = getPillarColor(pillar.color);
              const target = pillar.target_percentage;
              return (
                <Card key={pillar.id} className="p-5 group relative hover:shadow-md transition-shadow">
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(pillar)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(pillar.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.hex }} />
                    <h3 className="font-semibold truncate pr-16">{pillar.name}</h3>
                  </div>

                  {pillar.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{pillar.description}</p>
                  )}

                  {target != null && (
                    <div className="mb-3">
                      <div className="flex items-baseline justify-between text-xs mb-1.5">
                        <span>
                          <strong className="text-foreground font-numeric">{realPct.toFixed(0)}%</strong>
                          <span className="text-muted-foreground"> real</span>
                        </span>
                        <span className="text-muted-foreground">
                          meta <strong className="text-foreground font-numeric">{target}%</strong>
                        </span>
                      </div>
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all"
                          style={{ width: `${Math.min(realPct, 100)}%`, backgroundColor: c.hex }}
                        />
                        <div
                          className="absolute inset-y-0 w-0.5 bg-foreground/60"
                          style={{ left: `${Math.min(target, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 mt-1 border-t border-border">
                    <span>
                      <strong className="text-foreground font-numeric">{posts}</strong> posts
                    </span>
                    <span>
                      <strong className="text-foreground font-numeric">{ideasCount}</strong> ideias
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <MarketingPillarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pillar={editing}
        onSave={handleSave}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover pilar?</AlertDialogTitle>
            <AlertDialogDescription>
              Posts e ideias vinculados perderão o vínculo, mas não serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deletingId) await deletePillar(deletingId);
                setDeletingId(null);
              }}
              className={cn('bg-destructive text-destructive-foreground hover:bg-destructive/90')}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
