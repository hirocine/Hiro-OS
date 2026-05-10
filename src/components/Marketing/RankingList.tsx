import { useState, useMemo } from 'react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
          Ordenado por{' '}
          <span style={{ color: 'hsl(var(--ds-fg-1))', fontWeight: 500 }}>
            {SORT_OPTIONS.find((o) => o.value === sortKey)?.label}
          </span>
        </p>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger style={{ width: 200, fontSize: 12 }}>
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

      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
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
            sortKey === 'engagement_rate' ? `${primaryValue.toFixed(2)}%` : formatCompact(primaryValue);

          const pillarColor = pillar
            ? ((pillar.color ?? getPillarColor(pillar.name)) as string)
            : undefined;

          return (
            <li key={post.id}>
              <button
                type="button"
                onClick={() => onClick(post.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: 12,
                  textAlign: 'left',
                  background: 'hsl(var(--ds-surface))',
                  border: '1px solid hsl(var(--ds-line-1))',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
                  e.currentTarget.style.borderColor = 'hsl(var(--ds-accent) / 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--ds-surface))';
                  e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    background: isTop3 ? 'hsl(var(--ds-accent) / 0.1)' : 'hsl(var(--ds-line-2) / 0.4)',
                    border: `1px solid ${isTop3 ? 'hsl(var(--ds-accent) / 0.25)' : 'hsl(var(--ds-line-1))'}`,
                    color: isTop3 ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-3))',
                  }}
                >
                  {idx + 1}
                </div>

                <div
                  style={{
                    position: 'relative',
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    overflow: 'hidden',
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                    border: '1px solid hsl(var(--ds-line-1))',
                  }}
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={post.title}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      <ImageIcon size={18} strokeWidth={1.5} />
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      background: 'hsl(0 0% 0% / 0.6)',
                      padding: '2px 4px',
                    }}
                  >
                    <MediaIcon size={11} strokeWidth={1.5} style={{ color: '#fff', display: 'block' }} />
                  </div>
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'hsl(var(--ds-fg-1))',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {post.title}
                  </p>
                  <div
                    style={{
                      marginTop: 4,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {pillar ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 6px',
                          fontSize: 10,
                          fontWeight: 500,
                          color: '#fff',
                          background: pillarColor,
                        }}
                      >
                        {pillar.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: 'hsl(var(--ds-fg-3))' }}>Sem pilar</span>
                    )}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 11,
                        color: 'hsl(var(--ds-fg-3))',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      className="hidden sm:inline-flex"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={11} strokeWidth={1.5} />
                        {formatCompact(post.views || post.reach || 0)}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Heart size={11} strokeWidth={1.5} />
                        {formatCompact(post.likes)}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MessageCircle size={11} strokeWidth={1.5} />
                        {formatCompact(post.comments)}
                      </span>
                    </span>
                  </div>
                </div>

                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <p
                    style={{
                      fontFamily: '"HN Display", sans-serif',
                      fontSize: 18,
                      fontWeight: 700,
                      lineHeight: 1.1,
                      fontVariantNumeric: 'tabular-nums',
                      color: 'hsl(var(--ds-fg-1))',
                    }}
                  >
                    {primaryDisplay}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--ds-fg-3))',
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
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
