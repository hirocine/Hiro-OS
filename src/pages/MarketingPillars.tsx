import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useMarketingPillars, type MarketingPillar, type MarketingPillarInput } from '@/hooks/useMarketingPillars';
import { useMarketingIdeas } from '@/hooks/useMarketingIdeas';
import { supabase } from '@/integrations/supabase/client';
import { getPillarColor } from '@/lib/marketing-colors';
import { MarketingPillarDialog } from '@/components/Marketing/MarketingPillarDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface PostCount { pillar_id: string | null }

export default function MarketingPillars() {
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
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Pilares de Conteúdo"
        subtitle="Os temas centrais que sua marca representa"
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Novo Pilar
          </Button>
        }
      />

      {loading ? (
        <div className="text-center text-muted-foreground py-12">Carregando...</div>
      ) : pillars.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Defina seus pilares de conteúdo"
          description="Os 3 a 5 temas centrais que sua marca representa. Pilares organizam suas ideias e posts em torno de uma narrativa coerente."
          action={{ label: 'Criar primeiro pilar', onClick: openNew }}
        />
      ) : (
        <>
          {/* Donut chart */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Distribuição real (posts publicados)</h3>
            {totalPublished === 0 ? (
              <EmptyState
                compact
                icon={Layers}
                title=""
                description="Nenhum post publicado ainda. A distribuição aparecerá conforme posts forem publicados."
              />
            ) : (
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold">{totalPublished}</span>
                  <span className="text-xs text-muted-foreground">posts publicados</span>
                </div>
              </div>
            )}
          </Card>

          {/* Pillar cards */}
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
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">
                          {realPct.toFixed(0)}% real / {target}% meta
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

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <span><strong className="text-foreground">{posts}</strong> posts</span>
                    <span><strong className="text-foreground">{ideasCount}</strong> ideias</span>
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
