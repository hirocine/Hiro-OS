import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { Plus, Search, Edit2, Trash2, Copy, Link2, MoreVertical, Loader2, CalendarPlus, Lightbulb, CheckCircle2, ExternalLink } from 'lucide-react';
import { useIdeasWithPosts, type IdeaPostLink } from '@/hooks/useIdeasWithPosts';
import { EmptyState } from '@/components/ui/empty-state';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import {
  IDEA_STATUSES,
  type IdeaStatus,
  type MarketingIdea,
  useMarketingIdeas,
} from '@/hooks/useMarketingIdeas';
import { MarketingIdeaDialog } from '@/components/Marketing/MarketingIdeaDialog';
import { MarketingPostDialog } from '@/components/Marketing/MarketingPostDialog';
import { useMarketingPillars, type MarketingPillar } from '@/hooks/useMarketingPillars';
import { getPillarColor } from '@/lib/marketing-colors';
import { type MarketingPostInput } from '@/hooks/useMarketingPosts';

interface ProfileMini {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

function useProfilesMap(userIds: string[]) {
  const [map, setMap] = useState<Record<string, ProfileMini>>({});

  useEffect(() => {
    const ids = Array.from(new Set(userIds.filter(Boolean)));
    if (ids.length === 0) return;
    const missing = ids.filter((id) => !map[id]);
    if (missing.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', missing);
      if (data) {
        setMap((prev) => {
          const next = { ...prev };
          for (const p of data as ProfileMini[]) next[p.user_id] = p;
          return next;
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIds.join(',')]);

  return map;
}

interface IdeaCardProps {
  idea: MarketingIdea;
  profile?: ProfileMini;
  pillar?: MarketingPillar;
  postLink?: IdeaPostLink;
  onEdit: (idea: MarketingIdea) => void;
  onDelete: (idea: MarketingIdea) => void;
  onDuplicate: (idea: MarketingIdea) => void;
  onPromote: (idea: MarketingIdea) => void;
  onOpenPost?: (postId: string) => void;
  dragging?: boolean;
}

function IdeaCard({ idea, profile, pillar, postLink, onEdit, onDelete, onDuplicate, onPromote, onOpenPost, dragging }: IdeaCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: idea.id });
  const initials = (profile?.display_name || '?').slice(0, 2).toUpperCase();
  const pillarColor = pillar ? getPillarColor(pillar.color) : null;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'group rounded-xl border border-border bg-card p-3 shadow-sm transition cursor-grab active:cursor-grabbing',
        'hover:border-primary/40 hover:shadow-md',
        (isDragging || dragging) && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {pillarColor && (
            <span
              className="h-2.5 w-2.5 rounded-full mt-1 shrink-0"
              style={{ backgroundColor: pillarColor.hex }}
              title={pillar?.name}
            />
          )}
          <h4 className="text-sm font-medium leading-snug line-clamp-2 flex-1">{idea.title}</h4>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {!postLink && (
              <DropdownMenuItem onClick={() => onPromote(idea)}>
                <CalendarPlus className="h-3.5 w-3.5 mr-2" /> Criar post no calendário
              </DropdownMenuItem>
            )}
            {postLink && onOpenPost && (
              <DropdownMenuItem onClick={() => onOpenPost(postLink.post_id)}>
                <ExternalLink className="h-3.5 w-3.5 mr-2" /> Abrir post no calendário
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(idea)}>
              <Edit2 className="h-3.5 w-3.5 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(idea)}>
              <Copy className="h-3.5 w-3.5 mr-2" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(idea)} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {idea.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{idea.description}</p>
      )}

      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {idea.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {t}
            </Badge>
          ))}
          {idea.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{idea.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <Avatar className="h-5 w-5">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
        </Avatar>
        {idea.reference_ids.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Link2 className="h-3 w-3" />
            <span>{idea.reference_ids.length} ref{idea.reference_ids.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {postLink && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenPost?.(postLink.post_id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 transition cursor-pointer"
          title="Abrir post no calendário"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>Virou post</span>
          <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />
        </button>
      )}
    </div>
  );
}

interface ColumnProps {
  status: IdeaStatus;
  label: string;
  emoji: string;
  ideas: MarketingIdea[];
  profiles: Record<string, ProfileMini>;
  pillarsMap: Record<string, MarketingPillar>;
  ideaLinks: Map<string, IdeaPostLink>;
  onAdd: (status: IdeaStatus) => void;
  onEdit: (idea: MarketingIdea) => void;
  onDelete: (idea: MarketingIdea) => void;
  onDuplicate: (idea: MarketingIdea) => void;
  onPromote: (idea: MarketingIdea) => void;
  onOpenPost: (postId: string) => void;
  activeId: string | null;
}

function KanbanColumn({
  status,
  label,
  emoji,
  ideas,
  profiles,
  pillarsMap,
  ideaLinks,
  onAdd,
  onEdit,
  onDelete,
  onDuplicate,
  onPromote,
  onOpenPost,
  activeId,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col rounded-xl bg-muted/30 border border-border/50 transition',
        'w-full md:w-72 md:shrink-0',
        isOver && 'border-primary/50 bg-primary/5',
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <span className="text-sm font-medium">{label}</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {ideas.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onAdd(status)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-32 max-h-[calc(100vh-280px)] overflow-y-auto">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            profile={idea.created_by ? profiles[idea.created_by] : undefined}
            pillar={idea.pillar_id ? pillarsMap[idea.pillar_id] : undefined}
            postLink={ideaLinks.get(idea.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onPromote={onPromote}
            onOpenPost={onOpenPost}
            dragging={activeId === idea.id}
          />
        ))}
        {ideas.length === 0 && (
          <EmptyState compact icon={Lightbulb} title="" description="Sem ideias" />
        )}
      </div>
    </div>
  );
}

export default function MarketingIdeas() {
  const navigate = useNavigate();
  const { ideas, loading, updateStatus, deleteIdea, duplicateIdea, fetchIdeas } = useMarketingIdeas();
  const { pillars } = useMarketingPillars();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [pillarFilter, setPillarFilter] = useState<string[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<MarketingIdea | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<IdeaStatus>('rascunho');
  const [deleteTarget, setDeleteTarget] = useState<MarketingIdea | null>(null);

  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postPrefill, setPostPrefill] = useState<Partial<MarketingPostInput> | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    ideas.forEach((i) => i.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [ideas]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return ideas.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q) && !(i.description ?? '').toLowerCase().includes(q)) {
        return false;
      }
      if (tagFilter.length > 0 && !tagFilter.some((t) => i.tags.includes(t))) return false;
      if (pillarFilter.length > 0 && !pillarFilter.includes(i.pillar_id ?? '')) return false;
      return true;
    });
  }, [ideas, debouncedSearch, tagFilter, pillarFilter]);

  const profilesMap = useProfilesMap(ideas.map((i) => i.created_by ?? '').filter(Boolean));

  const pillarsMap = useMemo(() => {
    const m: Record<string, MarketingPillar> = {};
    pillars.forEach((p) => { m[p.id] = p; });
    return m;
  }, [pillars]);

  const ideaLinks = useIdeasWithPosts(ideas.map((i) => i.id));

  const grouped = useMemo(() => {
    const g: Record<IdeaStatus, MarketingIdea[]> = {
      rascunho: [],
      validada: [],
      em_producao: [],
      publicada: [],
      descartada: [],
    };
    filtered.forEach((i) => g[i.status]?.push(i));
    return g;
  }, [filtered]);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const idea = ideas.find((i) => i.id === active.id);
    const newStatus = over.id as IdeaStatus;
    if (!idea || idea.status === newStatus) return;
    if (!IDEA_STATUSES.some((s) => s.value === newStatus)) return;
    updateStatus(idea.id, newStatus);
  };

  const handleAdd = (status: IdeaStatus) => {
    setEditingIdea(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  };

  const handleEdit = (idea: MarketingIdea) => {
    setEditingIdea(idea);
    setDialogOpen(true);
  };

  const handlePromote = (idea: MarketingIdea) => {
    setPostPrefill({
      title: idea.title,
      caption: idea.description,
      pillar_id: idea.pillar_id,
      idea_id: idea.id,
      status: 'em_producao',
      scheduled_at: null,
      hashtags: [],
      platform: null,
      format: idea.format,
      cover_url: null,
      file_url: null,
      published_url: null,
    });
    setPostDialogOpen(true);
  };

  const handleOpenPost = (postId: string) => {
    navigate(`/marketing/posts?postId=${postId}`);
  };

  const handlePostDialogChange = (open: boolean) => {
    setPostDialogOpen(open);
    if (!open) setPostPrefill(null);
  };

  const activeIdea = activeId ? ideas.find((i) => i.id === activeId) : null;

  return (
    <ResponsiveContainer>
      <PageHeader
        title="Ideias"
        subtitle="Banco de ideias organizado por status"
        actions={
          <Button onClick={() => handleAdd('rascunho')}>
            <Plus className="h-4 w-4 mr-2" /> Nova Ideia
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título ou descrição..."
            className="pl-9"
          />
        </div>
        <div className="sm:w-56">
          <MultiSelect
            options={allTags.map((t) => ({ value: t, label: t }))}
            value={tagFilter}
            onValueChange={setTagFilter}
            placeholder="Filtrar por tags"
          />
        </div>
        <div className="sm:w-56">
          <MultiSelect
            options={pillars.map((p) => ({ value: p.id, label: `● ${p.name}` }))}
            value={pillarFilter}
            onValueChange={setPillarFilter}
            placeholder="Filtrar por pilar"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-3 md:overflow-x-auto md:pb-2">
            {IDEA_STATUSES.map((s) => (
              <KanbanColumn
                key={s.value}
                status={s.value}
                label={s.label}
                emoji={s.emoji}
                ideas={grouped[s.value]}
                profiles={profilesMap}
                pillarsMap={pillarsMap}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onDuplicate={duplicateIdea}
                onPromote={handlePromote}
                activeId={activeId}
              />
            ))}
          </div>
          <DragOverlay>
            {activeIdea ? (
              <div className="rounded-xl border border-primary/40 bg-card p-3 shadow-lg w-72 rotate-2">
                <h4 className="text-sm font-medium line-clamp-2">{activeIdea.title}</h4>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <MarketingIdeaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        idea={editingIdea}
        defaultStatus={defaultStatus}
      />

      <MarketingPostDialog
        open={postDialogOpen}
        onOpenChange={handlePostDialogChange}
        prefill={postPrefill}
        onSaved={(_p, isNew) => {
          if (isNew) {
            toast.success('Post criado no calendário 🚀', {
              action: { label: 'Ver no calendário', onClick: () => navigate('/marketing') },
            });
          }
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ideia?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTarget) await deleteIdea(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ResponsiveContainer>
  );
}
