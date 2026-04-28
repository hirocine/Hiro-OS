import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Eye, Heart, MessageCircle, ImageIcon, Film, Layers } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { GalleryPost } from '@/hooks/useMarketingGallery';
import { getPillarColor } from '@/lib/marketing-colors';

type SortKey = 'engagement_rate' | 'views' | 'likes' | 'comments' | 'reach';

interface Props {
  posts: GalleryPost[];
  pillars: Array<{ id: string; name: string; color?: string | null }>;
  onClick: (postId: string) => void;
}

function formatCompact(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString('pt-BR');
}

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'engagement_rate', label: 'Engajamento' },
  { value: 'views', label: 'Views' },
  { value: 'likes', label: 'Curtidas' },
  { value: 'comments', label: 'Comentários' },
  { value: 'reach', label: 'Alcance' },
];

export function RankingList({ posts, pillars, onClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('engagement_rate');

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aVal = Number(a[sortKey] ?? 0);
      const bVal = Number(b[sortKey] ?? 0);
      return bVal - aVal;
    });
  }, [posts, sortKey]);

  if (sortedPosts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Ordenado por{' '}
          <span className="text-foreground font-medium">
            {SORT_OPTIONS.find((o) => o.value === sortKey)?.label}
          </span>
        </p>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                Ordenar: {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="space-y-2">
        {sortedPosts.map((post, idx) => {
          const pillar = pillars.find((p) => p.id === post.pillar_id);
          const cover = post.cover_url ?? post.thumbnail_url ?? post.file_url;
          const MediaIcon =
            post.media_type === 'VIDEO'
              ? Film
              : post.media_type === 'CAROUSEL_ALBUM'
              ? Layers
              : ImageIcon;
          const isTop3 = idx < 3;

          const primaryValue = Number(post[sortKey] ?? 0);
          const primaryLabel = SORT_OPTIONS.find((o) => o.value === sortKey)?.label;
          const primaryDisplay =
            sortKey === 'engagement_rate'
              ? `${primaryValue.toFixed(2)}%`
              : formatCompact(primaryValue);

          const pillarColor = pillar
            ? (pillar.color ?? getPillarColor(pillar.name)) as string
            : undefined;

          return (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => onClick(post.id)}
                className={cn(
                  'w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all',
                  'border border-border bg-card hover:bg-muted/40 hover:border-primary/30',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                )}
              >
                <div
                  className={cn(
                    'shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold font-numeric',
                    isTop3
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {idx + 1}
                </div>

                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {cover ? (
                    <img
                      src={cover}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 py-0.5">
                    <MediaIcon className="h-3 w-3 text-white" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{post.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {pillar ? (
                      <span
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                        style={{ backgroundColor: pillarColor }}
                      >
                        {pillar.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Sem pilar</span>
                    )}
                    <span className="hidden sm:inline-flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatCompact(post.views || post.reach || 0)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatCompact(post.likes)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {formatCompact(post.comments)}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold font-numeric leading-tight">
                    {primaryDisplay}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {primaryLabel}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
