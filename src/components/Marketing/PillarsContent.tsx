import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Layers, ArrowRight } from 'lucide-react';
import { useMarketingPillars, type MarketingPillar, type MarketingPillarInput } from '@/hooks/useMarketingPillars';
import { useMarketingIdeas } from '@/hooks/useMarketingIdeas';
import { supabase } from '@/integrations/supabase/client';
import { getPillarColor } from '@/lib/marketing-colors';
import { MarketingPillarDialog } from '@/components/Marketing/MarketingPillarDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
        .is('deleted_at', null)
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
    <>
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
          <Layers size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
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
              Pilares de Conteúdo
            </span>
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
              Os temas centrais que sua marca representa
            </span>
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={openNew}
            style={{ marginLeft: 'auto' }}
          >
            <Plus size={13} strokeWidth={1.5} />
            <span>Novo Pilar</span>
          </button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                color: 'hsl(var(--ds-fg-3))',
                padding: '48px 0',
                fontSize: 13,
              }}
            >
              Carregando...
            </div>
          ) : pillars.length === 0 ? (
            <button
              type="button"
              onClick={openNew}
              className="group"
              style={{
                width: '100%',
                textAlign: 'left',
                border: '2px dashed hsl(var(--ds-line-1))',
                background: 'transparent',
                padding: 24,
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
                e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div
                  style={{
                    height: 48,
                    width: 48,
                    background: 'hsl(var(--ds-accent) / 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <h3
                      style={{
                        fontFamily: '"HN Display", sans-serif',
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'hsl(var(--ds-fg-1))',
                      }}
                    >
                      Criar primeiro pilar
                    </h3>
                    <ArrowRight
                      size={14}
                      strokeWidth={1.5}
                      style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0, marginTop: 2 }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--ds-fg-3))',
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    3 a 5 temas centrais que sua marca representa. Organizam ideias e posts em torno de uma narrativa coerente.
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <>
              {totalPublished > 0 && (
                <div
                  style={{
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-surface))',
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      Distribuição real
                    </h3>
                    <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                      <strong
                        style={{
                          color: 'hsl(var(--ds-fg-1))',
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {totalPublished}
                      </strong>{' '}
                      posts publicados
                    </span>
                  </div>

                  <div
                    style={{
                      height: 8,
                      width: '100%',
                      overflow: 'hidden',
                      background: 'hsl(var(--ds-line-2) / 0.5)',
                      display: 'flex',
                    }}
                  >
                    {chartData.map((d, i) => {
                      const pct = (d.value / totalPublished) * 100;
                      return (
                        <div
                          key={i}
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: d.color,
                            transition: 'width 0.2s',
                          }}
                          title={`${d.name}: ${d.value} (${pct.toFixed(0)}%)`}
                        />
                      );
                    })}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      columnGap: 16,
                      rowGap: 8,
                      marginTop: 12,
                    }}
                  >
                    {chartData.map((d, i) => {
                      const pct = (d.value / totalPublished) * 100;
                      return (
                        <div
                          key={i}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}
                        >
                          <span
                            style={{
                              height: 8,
                              width: 8,
                              borderRadius: '50%',
                              background: d.color,
                            }}
                          />
                          <span style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{d.name}</span>
                          <span style={{ color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                            {d.value} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                {stats.map(({ pillar, posts, ideasCount, realPct }) => {
                  const c = getPillarColor(pillar.color);
                  const target = pillar.target_percentage;
                  return (
                    <div
                      key={pillar.id}
                      className="group"
                      style={{
                        position: 'relative',
                        border: '1px solid hsl(var(--ds-line-1))',
                        background: 'hsl(var(--ds-surface))',
                        padding: 18,
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          display: 'flex',
                          gap: 4,
                        }}
                      >
                        <button
                          type="button"
                          className="btn"
                          style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                          onClick={() => openEdit(pillar)}
                          aria-label="Editar"
                        >
                          <Pencil size={12} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            width: 28,
                            height: 28,
                            padding: 0,
                            justifyContent: 'center',
                            color: 'hsl(var(--ds-danger))',
                          }}
                          onClick={() => setDeletingId(pillar.id)}
                          aria-label="Remover"
                        >
                          <Trash2 size={12} strokeWidth={1.5} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span
                          style={{
                            height: 10,
                            width: 10,
                            borderRadius: '50%',
                            background: c.hex,
                            flexShrink: 0,
                          }}
                        />
                        <h3
                          style={{
                            fontFamily: '"HN Display", sans-serif',
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'hsl(var(--ds-fg-1))',
                            paddingRight: 70,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {pillar.name}
                        </h3>
                      </div>

                      {pillar.description && (
                        <p
                          style={{
                            fontSize: 13,
                            color: 'hsl(var(--ds-fg-3))',
                            marginBottom: 16,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {pillar.description}
                        </p>
                      )}

                      {target != null && (
                        <div style={{ marginBottom: 12 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              justifyContent: 'space-between',
                              fontSize: 11,
                              marginBottom: 6,
                            }}
                          >
                            <span>
                              <strong
                                style={{
                                  color: 'hsl(var(--ds-fg-1))',
                                  fontWeight: 600,
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {realPct.toFixed(0)}%
                              </strong>
                              <span style={{ color: 'hsl(var(--ds-fg-3))' }}> real</span>
                            </span>
                            <span style={{ color: 'hsl(var(--ds-fg-3))' }}>
                              meta{' '}
                              <strong
                                style={{
                                  color: 'hsl(var(--ds-fg-1))',
                                  fontWeight: 600,
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {target}%
                              </strong>
                            </span>
                          </div>
                          <div
                            style={{
                              position: 'relative',
                              height: 6,
                              background: 'hsl(var(--ds-line-2) / 0.5)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                inset: '0 0 0 0',
                                width: `${Math.min(realPct, 100)}%`,
                                background: c.hex,
                                transition: 'width 0.2s',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                width: 2,
                                background: 'hsl(var(--ds-fg-1) / 0.6)',
                                left: `${Math.min(target, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          fontSize: 11,
                          color: 'hsl(var(--ds-fg-3))',
                          paddingTop: 12,
                          marginTop: 4,
                          borderTop: '1px solid hsl(var(--ds-line-1))',
                        }}
                      >
                        <span>
                          <strong
                            style={{
                              color: 'hsl(var(--ds-fg-1))',
                              fontWeight: 600,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {posts}
                          </strong>{' '}
                          posts
                        </span>
                        <span>
                          <strong
                            style={{
                              color: 'hsl(var(--ds-fg-1))',
                              fontWeight: 600,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {ideasCount}
                          </strong>{' '}
                          ideias
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <MarketingPillarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pillar={editing}
        onSave={handleSave}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>Remover pilar?</span>
            </AlertDialogTitle>
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
              style={{
                background: 'hsl(var(--ds-danger))',
                color: 'hsl(var(--ds-surface))',
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
