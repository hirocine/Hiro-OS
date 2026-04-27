import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Button } from '@/components/ui/button';
import { MultiSelect } from '@/components/ui/multi-select';
import { useMarketingPosts, type MarketingPost } from '@/hooks/useMarketingPosts';
import { useMarketingPillars } from '@/hooks/useMarketingPillars';
import { POST_PLATFORMS, POST_STATUSES } from '@/lib/marketing-posts-config';
import { getPillarColor } from '@/lib/marketing-colors';
import { PostsCalendar } from '@/components/Marketing/PostsCalendar';
import { MarketingPostDialog } from '@/components/Marketing/MarketingPostDialog';

export default function MarketingCalendar() {
  const { posts, loading, deletePost } = useMarketingPosts();
  const { pillars } = useMarketingPillars();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<MarketingPost | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [pillarFilter, setPillarFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (platformFilter.length && !platformFilter.includes(p.platform ?? '')) return false;
      if (pillarFilter.length && !pillarFilter.includes(p.pillar_id ?? '')) return false;
      if (statusFilter.length && !statusFilter.includes(p.status)) return false;
      return true;
    });
  }, [posts, platformFilter, pillarFilter, statusFilter]);

  const pillarOptions = useMemo(
    () => pillars.map((p) => {
      const c = getPillarColor(p.color);
      return { value: p.id, label: `● ${p.name}`, hex: c.hex };
    }),
    [pillars]
  );

  const openNew = (date?: Date) => {
    setEditingPost(null);
    setDefaultDate(date ?? null);
    setDialogOpen(true);
  };

  const openEdit = (post: MarketingPost) => {
    setEditingPost(post);
    setDefaultDate(null);
    setDialogOpen(true);
  };

  return (
    <ResponsiveContainer maxWidth="7xl" className="py-6 space-y-5">
      <PageHeader
        title="Calendário de Posts"
        subtitle="Planejamento e agendamento de publicações"
        actions={
          <Button onClick={() => openNew()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Post
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 min-w-[180px]">
          <MultiSelect
            options={POST_PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
            value={platformFilter}
            onValueChange={setPlatformFilter}
            placeholder="Plataforma"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <MultiSelect
            options={pillarOptions}
            value={pillarFilter}
            onValueChange={setPillarFilter}
            placeholder="Pilar"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <MultiSelect
            options={POST_STATUSES.map((s) => ({ value: s.value, label: `${s.emoji} ${s.label}` }))}
            value={statusFilter}
            onValueChange={setStatusFilter}
            placeholder="Status"
          />
        </div>
      </div>

      <PostsCalendar
        posts={filteredPosts}
        pillars={pillars}
        loading={loading}
        onCreate={openNew}
        onEdit={openEdit}
        onDelete={deletePost}
      />

      <MarketingPostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        post={editingPost}
        defaultDate={defaultDate}
      />
    </ResponsiveContainer>
  );
}
