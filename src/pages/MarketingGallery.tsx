import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import {
  RefreshCw,
  Search,
  Heart,
  MessageCircle,
  ExternalLink,
  Images,
  Play,
  Image as ImageIcon,
  Layers as LayersIcon,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useMarketingGallery, type GalleryPost } from '@/hooks/useMarketingGallery';
import { useMarketingPillars } from '@/hooks/useMarketingPillars';
import { getPillarColor } from '@/lib/marketing-colors';

type FormatFilter = 'all' | 'foto' | 'reels' | 'carrossel';
type SourceFilter = 'all' | 'auto_discovered' | 'manual';
type PillarFilter = 'all' | 'none' | string;

const FORMAT_OPTIONS: { value: FormatFilter; label: string }[] = [
  { value: 'all', label: 'Todos os formatos' },
  { value: 'foto', label: 'Fotos' },
  { value: 'reels', label: 'Reels / Vídeos' },
  { value: 'carrossel', label: 'Carrosséis' },
];

const SOURCE_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'Todas as origens' },
  { value: 'auto_discovered', label: 'Auto-descobertos' },
  { value: 'manual', label: 'Criados manualmente' },
];

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function MediaTypeBadge({ post }: { post: GalleryPost }) {
  const mt = post.media_type ?? '';
  if (mt === 'CAROUSEL_ALBUM' || post.format === 'carrossel') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
        <LayersIcon className="h-3 w-3" /> Carrossel
      </span>
    );
  }
  if (mt === 'VIDEO' || post.format === 'reels') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
        <Play className="h-3 w-3" /> Reels
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
      <ImageIcon className="h-3 w-3" /> Foto
    </span>
  );
}

function compactNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function MarketingGallery() {
  const { posts, loading, refetch } = useMarketingGalleryPosts();
  const { pillars } = useMarketingPillars();
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [pillarFilter, setPillarFilter] = useState<PillarFilter>('all');
  const [discovering, setDiscovering] = useState(false);
  const [selected, setSelected] = useState<GalleryPost | null>(null);

  const pillarMap = useMemo(() => {
    const map = new Map<string, { name: string; color?: string | null }>();
    pillars.forEach((p) => map.set(p.id, { name: p.name, color: p.color }));
    return map;
  }, [pillars]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (formatFilter !== 'all' && p.format !== formatFilter) return false;
      if (sourceFilter !== 'all' && p.source !== sourceFilter) return false;
      if (pillarFilter === 'none' && p.pillar_id) return false;
      if (pillarFilter !== 'all' && pillarFilter !== 'none' && p.pillar_id !== pillarFilter) return false;
      if (q) {
        const hay = `${p.title ?? ''} ${p.caption ?? ''} ${(p.hashtags ?? []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, search, formatFilter, sourceFilter, pillarFilter]);

  const handleDiscover = async () => {
    try {
      setDiscovering(true);
      const { data, error } = await supabase.functions.invoke('discover-instagram-posts');
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Falha ao descobrir posts');
      toast.success(
        `Galeria atualizada — ${data.created} novos, ${data.updated} atualizados`,
      );
      await refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao atualizar: ${msg}`);
    } finally {
      setDiscovering(false);
    }
  };

  const counts = useMemo(() => {
    return {
      total: posts.length,
      reels: posts.filter((p) => p.format === 'reels' || p.media_type === 'VIDEO').length,
      carousel: posts.filter((p) => p.format === 'carrossel' || p.media_type === 'CAROUSEL_ALBUM').length,
      foto: posts.filter((p) => p.format === 'foto' || p.media_type === 'IMAGE').length,
    };
  }, [posts]);

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Galeria"
        subtitle="Todos os posts publicados no Instagram, importados automaticamente."
        actions={
          <Button onClick={handleDiscover} disabled={discovering} size="sm">
            <RefreshCw className={cn('mr-2 h-4 w-4', discovering && 'animate-spin')} />
            {discovering ? 'Buscando...' : 'Atualizar agora'}
          </Button>
        }
      />

      {/* Filtros */}
      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, legenda ou hashtag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
        <Select value={formatFilter} onValueChange={(v) => setFormatFilter(v as FormatFilter)}>
          <SelectTrigger className="h-10 md:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FORMAT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
          <SelectTrigger className="h-10 md:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SOURCE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={pillarFilter} onValueChange={(v) => setPillarFilter(v as PillarFilter)}>
          <SelectTrigger className="h-10 md:w-[200px]"><SelectValue placeholder="Pilar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os pilares</SelectItem>
            <SelectItem value="none">Sem pilar atribuído</SelectItem>
            {pillars.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats line */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span><strong className="text-foreground tabular-nums">{filtered.length}</strong> de {counts.total} posts</span>
        <span>•</span>
        <span>{counts.reels} Reels</span>
        <span>•</span>
        <span>{counts.carousel} Carrosséis</span>
        <span>•</span>
        <span>{counts.foto} Fotos</span>
      </div>

      {/* Grid */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Images}
            title={posts.length === 0 ? 'Galeria vazia' : 'Nenhum post encontrado'}
            description={
              posts.length === 0
                ? 'Clique em "Atualizar agora" para importar seus posts publicados no Instagram.'
                : 'Ajuste os filtros para ver mais resultados.'
            }
            action={
              posts.length === 0
                ? { label: discovering ? 'Buscando...' : 'Atualizar agora', onClick: handleDiscover }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((post) => {
              const pillar = post.pillar_id ? pillarMap.get(post.pillar_id) : undefined;
              const cover = post.cover_url ?? post.thumbnail_url ?? post.file_url;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelected(post)}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-muted transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}

                  {/* Top-left badge: media type */}
                  <div className="absolute left-2 top-2">
                    <MediaTypeBadge post={post} />
                  </div>

                  {/* Top-right badge: pillar */}
                  {pillar && (
                    <div className="absolute right-2 top-2">
                      <span
                        className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
                        style={{ backgroundColor: (pillar.color ?? getPillarColor(pillar.name)) as string }}
                      >
                        {pillar.name}
                      </span>
                    </div>
                  )}

                  {/* Bottom overlay on hover: stats */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="flex items-center justify-between text-xs text-white">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {compactNumber(post.likes ?? 0)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {compactNumber(post.comments ?? 0)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-white/80">
                        <CalendarIcon className="h-3 w-3" /> {formatDate(post.published_at)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
          {selected && (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Mídia */}
              <div className="relative aspect-square bg-black md:aspect-auto md:min-h-[480px]">
                {(selected.cover_url ?? selected.thumbnail_url ?? selected.file_url) ? (
                  <img
                    src={selected.cover_url ?? selected.thumbnail_url ?? selected.file_url ?? ''}
                    alt={selected.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <MediaTypeBadge post={selected} />
                </div>
              </div>

              {/* Detalhes */}
              <div className="flex flex-col gap-4 p-6">
                <div className="space-y-1">
                  <DialogTitle className="text-base font-semibold leading-snug">
                    {selected.title}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Publicado em {formatDate(selected.published_at)}
                  </p>
                </div>

                {/* Pilar */}
                {selected.pillar_id && pillarMap.get(selected.pillar_id) && (
                  <div>
                    <Badge
                      style={{
                        backgroundColor: (pillarMap.get(selected.pillar_id)?.color
                          ?? getPillarColor(pillarMap.get(selected.pillar_id)?.name ?? '')) as string,
                        color: 'white',
                      }}
                      className="border-transparent"
                    >
                      {pillarMap.get(selected.pillar_id)?.name}
                    </Badge>
                  </div>
                )}

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Curtidas</p>
                    <p className="text-lg font-bold tabular-nums">{compactNumber(selected.likes ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Comentários</p>
                    <p className="text-lg font-bold tabular-nums">{compactNumber(selected.comments ?? 0)}</p>
                  </div>
                  {selected.reach > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Alcance</p>
                      <p className="text-lg font-bold tabular-nums">{compactNumber(selected.reach)}</p>
                    </div>
                  )}
                  {selected.saves > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Salvos</p>
                      <p className="text-lg font-bold tabular-nums">{compactNumber(selected.saves)}</p>
                    </div>
                  )}
                </div>

                {/* Caption */}
                {selected.caption && (
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Legenda</p>
                    <p className="max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {selected.caption}
                    </p>
                  </div>
                )}

                {/* Hashtags */}
                {selected.hashtags && selected.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selected.hashtags.slice(0, 12).map((h) => (
                      <span key={h} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        #{h}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <span className="text-[10px] text-muted-foreground">
                    {selected.source === 'auto_discovered' ? 'Auto-descoberto' : 'Criado manualmente'}
                  </span>
                  {selected.published_url && (
                    <Button asChild variant="outline" size="sm">
                      <a href={selected.published_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Ver no Instagram
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ResponsiveContainer>
  );
}
