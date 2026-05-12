import { useMemo, useState } from 'react';
import { Bookmark, Plus, Search, Pencil, Trash2, ExternalLink, Image as ImageIcon, Instagram, Youtube, Linkedin, Globe } from 'lucide-react';
import { EmptyState } from '@/ds/components/EmptyState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
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
import { StatusPill } from '@/ds/components/StatusPill';

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Globe,
  website: Globe,
  other: Globe,
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
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Referências.</h1>
            <p className="ph-sub">Banco de inspirações — links, imagens e ideias visuais.</p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={handleNew} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Nova referência</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search
              size={14}
              strokeWidth={1.5}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--ds-fg-4))', pointerEvents: 'none' }}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título…"
              style={{ paddingLeft: 34 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

        <div style={{ marginTop: 20 }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 256, border: '1px solid hsl(var(--ds-line-1))' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title={references.length === 0 ? 'Nenhuma referência cadastrada' : 'Nenhuma referência encontrada'}
              description={
                references.length === 0
                  ? 'Comece adicionando inspirações de marketing — links, imagens, posts.'
                  : 'Tente ajustar os filtros ou a busca para encontrar o que procura.'
              }
              action={
                references.length === 0 ? (
                  <button className="btn primary" onClick={handleNew} type="button">
                    <Plus size={14} strokeWidth={1.5} />
                    <span>Nova referência</span>
                  </button>
                ) : undefined
              }
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {filtered.map((ref) => {
                const PlatformIcon = ref.platform ? PLATFORM_ICONS[ref.platform] ?? Globe : null;
                const platformLabel = PLATFORM_OPTIONS.find((p) => p.value === ref.platform)?.label;
                return (
                  <div
                    key={ref.id}
                    className="group"
                    onClick={() => setLightbox(ref)}
                    style={{
                      position: 'relative',
                      border: '1px solid hsl(var(--ds-line-1))',
                      background: 'hsl(var(--ds-surface))',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ aspectRatio: '4 / 3', background: 'hsl(var(--ds-line-2) / 0.3)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                      {ref.image_url ? (
                        <img
                          src={ref.image_url}
                          alt={ref.title}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'hsl(var(--ds-fg-4))' }}>
                          {PlatformIcon ? <PlatformIcon size={32} strokeWidth={1.25} /> : <ImageIcon size={32} strokeWidth={1.25} />}
                          {ref.source_url && <span style={{ fontSize: 11 }}>Apenas link</span>}
                        </div>
                      )}
                    </div>

                    <div
                      className="ref-actions"
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        display: 'flex', gap: 4, opacity: 0, transition: 'opacity .15s',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleEdit(ref); }}
                        style={{
                          width: 28, height: 28, display: 'grid', placeItems: 'center',
                          background: 'hsl(var(--ds-surface))', border: '1px solid hsl(var(--ds-line-1))',
                          color: 'hsl(var(--ds-fg-2))', cursor: 'pointer',
                        }}
                        aria-label="Editar"
                      >
                        <Pencil size={13} strokeWidth={1.5} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleAskDelete(ref); }}
                        style={{
                          width: 28, height: 28, display: 'grid', placeItems: 'center',
                          background: 'hsl(var(--ds-surface))', border: '1px solid hsl(var(--ds-line-1))',
                          color: 'hsl(var(--ds-fg-2))', cursor: 'pointer',
                        }}
                        aria-label="Excluir"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                      {ref.source_url && (
                        <a
                          href={ref.source_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: 28, height: 28, display: 'grid', placeItems: 'center',
                            background: 'hsl(var(--ds-surface))', border: '1px solid hsl(var(--ds-line-1))',
                            color: 'hsl(var(--ds-fg-2))',
                          }}
                          aria-label="Abrir"
                        >
                          <ExternalLink size={13} strokeWidth={1.5} />
                        </a>
                      )}
                    </div>

                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <h3
                        style={{
                          fontSize: 13, fontWeight: 500, lineHeight: 1.35,
                          color: 'hsl(var(--ds-fg-1))',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {ref.title}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {platformLabel && (
                          <StatusPill label={platformLabel} tone="muted" />
                        )}
                        {ref.tags.slice(0, 3).map((t) => (
                          <span key={t} className="pill muted" style={{ fontSize: 10 }}>
                            {t}
                          </span>
                        ))}
                        {ref.tags.length > 3 && (
                          <span className="pill muted" style={{ fontSize: 10 }}>
                            +{ref.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>

                    <style>{`
                      .group:hover .ref-actions { opacity: 1; }
                    `}</style>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
      </div>
    </div>
  );
}
