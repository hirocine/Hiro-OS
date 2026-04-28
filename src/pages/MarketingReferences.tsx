import { useMemo, useState } from 'react';
import { Bookmark, Plus, Search, Pencil, Trash2, ExternalLink, Image as ImageIcon, Instagram, Youtube, Linkedin, Globe } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useMarketingReferences, type MarketingReference } from '@/hooks/useMarketingReferences';
import {
  MarketingReferenceDialog,
  PLATFORM_OPTIONS,
  CATEGORY_OPTIONS,
} from '@/components/Marketing/MarketingReferenceDialog';
import { MarketingReferenceLightbox } from '@/components/Marketing/MarketingReferenceLightbox';
import { cn } from '@/lib/utils';

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Globe,
  website: Globe,
  other: Globe,
};

const PLATFORM_BADGE_CLASS: Record<string, string> = {
  instagram: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  youtube: 'bg-red-500/15 text-red-400 border-red-500/30',
  tiktok: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  linkedin: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  website: 'bg-muted text-muted-foreground border-border',
  other: 'bg-muted text-muted-foreground border-border',
};

export default function MarketingReferences() {
  const { references, loading, deleteReference } = useMarketingReferences();
  const [search, setSearch] = useState('');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingReference | null>(null);
  const [lightbox, setLightbox] = useState<MarketingReference | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MarketingReference | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    references.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort().map((t) => ({ value: t, label: t }));
  }, [references]);

  const filtered = useMemo(() => {
    return references.filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (filterPlatform !== 'all' && r.platform !== filterPlatform) return false;
      if (filterTags.length > 0 && !filterTags.every((t) => r.tags.includes(t))) return false;
      return true;
    });
  }, [references, search, filterCategory, filterPlatform, filterTags]);

  const handleNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (ref: MarketingReference) => {
    setLightbox(null);
    setEditing(ref);
    setDialogOpen(true);
  };

  const handleAskDelete = (ref: MarketingReference) => {
    setLightbox(null);
    setConfirmDelete(ref);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    await deleteReference(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <ResponsiveContainer>
      <PageHeader
        title="Referências"
        subtitle="Banco de inspirações — links, imagens e ideias visuais"
        actions={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1.5" /> Nova referência
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título..."
            className="pl-9 h-10"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:w-auto md:flex">
          <MultiSelect
            options={allTags}
            value={filterTags}
            onValueChange={setFilterTags}
            placeholder="Tags"
            className="md:w-48"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-10 md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {CATEGORY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="h-10 md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas plataformas</SelectItem>
              {PLATFORM_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={references.length === 0 ? 'Nenhuma referência ainda' : 'Nada encontrado'}
          description={
            references.length === 0
              ? 'Comece adicionando inspirações de marketing — links, imagens, posts.'
              : 'Tente ajustar os filtros ou a busca.'
          }
          action={references.length === 0 ? { label: 'Nova referência', onClick: handleNew } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ref) => {
            const PlatformIcon = ref.platform ? PLATFORM_ICONS[ref.platform] ?? Globe : null;
            const platformClass = ref.platform ? PLATFORM_BADGE_CLASS[ref.platform] : '';
            const platformLabel = PLATFORM_OPTIONS.find((p) => p.value === ref.platform)?.label;
            return (
              <div
                key={ref.id}
                className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-foreground/20 transition cursor-pointer"
                onClick={() => setLightbox(ref)}
              >
                <div className="aspect-[4/3] bg-muted/30 flex items-center justify-center overflow-hidden">
                  {ref.image_url ? (
                    <img
                      src={ref.image_url}
                      alt={ref.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      {PlatformIcon ? <PlatformIcon className="h-10 w-10" /> : <ImageIcon className="h-10 w-10" />}
                      {ref.source_url && <span className="text-xs">Apenas link</span>}
                    </div>
                  )}
                </div>

                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); handleEdit(ref); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); handleAskDelete(ref); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  {ref.source_url && (
                    <a
                      href={ref.source_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button size="icon" variant="secondary" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-tight line-clamp-2">{ref.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {platformLabel && (
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5', platformClass)}>
                        {platformLabel}
                      </Badge>
                    )}
                    {ref.tags.slice(0, 3).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        {t}
                      </Badge>
                    ))}
                    {ref.tags.length > 3 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                        +{ref.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MarketingReferenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reference={editing}
      />

      <MarketingReferenceLightbox
        reference={lightbox}
        onOpenChange={(o) => !o && setLightbox(null)}
        onEdit={handleEdit}
        onDelete={handleAskDelete}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir referência?</AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ResponsiveContainer>
  );
}
