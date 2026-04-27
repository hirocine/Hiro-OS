import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, X, Loader2, Check, ChevronsUpDown, ChevronDown, BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  POST_FORMATS,
  POST_PLATFORMS,
  POST_STATUSES,
  type PostStatus,
} from '@/lib/marketing-posts-config';
import { PILLAR_COLORS, getPillarColor } from '@/lib/marketing-colors';
import { type MarketingPost, type MarketingPostInput, useMarketingPosts } from '@/hooks/useMarketingPosts';
import { useMarketingPillars } from '@/hooks/useMarketingPillars';
import { useMarketingIdeas } from '@/hooks/useMarketingIdeas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: MarketingPost | null;
  defaultDate?: Date | null;
  prefill?: Partial<MarketingPostInput> | null;
  onSaved?: (post: MarketingPost, isNew: boolean) => void;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MarketingPostDialog({ open, onOpenChange, post, defaultDate, prefill, onSaved }: Props) {
  const { createPost, updatePost, uploadCover } = useMarketingPosts();
  const { pillars } = useMarketingPillars();
  const { ideas } = useMarketingIdeas();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<string>('');
  const [format, setFormat] = useState<string>('');
  const [pillarId, setPillarId] = useState<string>('');
  const [status, setStatus] = useState<PostStatus>('em_producao');
  const [scheduledLocal, setScheduledLocal] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [ideaId, setIdeaId] = useState<string>('');
  const [ideaPickerOpen, setIdeaPickerOpen] = useState(false);

  // Metrics
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [shares, setShares] = useState(0);
  const [saves, setSaves] = useState(0);
  const [reach, setReach] = useState(0);
  const [profileClicks, setProfileClicks] = useState(0);
  const [newFollowers, setNewFollowers] = useState(0);
  const [metricsUpdatedAt, setMetricsUpdatedAt] = useState<string | null>(null);
  const [metricsSource, setMetricsSource] = useState<string | null>(null);
  const initialMetricsRef = useRef<string>('');

  useEffect(() => {
    if (!open) return;
    if (post) {
      setTitle(post.title);
      setPlatform(post.platform ?? '');
      setFormat(post.format ?? '');
      setPillarId(post.pillar_id ?? '');
      setStatus(post.status);
      setScheduledLocal(toLocalInput(post.scheduled_at));
      setCoverUrl(post.cover_url ?? '');
      setCaption(post.caption ?? '');
      setHashtags(post.hashtags ?? []);
      setFileUrl(post.file_url ?? '');
      setPublishedUrl(post.published_url ?? '');
      setIdeaId(post.idea_id ?? '');
    } else {
      setTitle(prefill?.title ?? '');
      setPlatform(prefill?.platform ?? '');
      setFormat(prefill?.format ?? '');
      setPillarId(prefill?.pillar_id ?? '');
      setStatus((prefill?.status as PostStatus) ?? 'em_producao');
      setScheduledLocal(
        prefill?.scheduled_at
          ? toLocalInput(prefill.scheduled_at)
          : defaultDate ? toLocalInput(defaultDate.toISOString()) : ''
      );
      setCoverUrl(prefill?.cover_url ?? '');
      setCaption(prefill?.caption ?? '');
      setHashtags(prefill?.hashtags ?? []);
      setHashtagInput('');
      setFileUrl(prefill?.file_url ?? '');
      setPublishedUrl(prefill?.published_url ?? '');
      setIdeaId(prefill?.idea_id ?? '');
    }
  }, [open, post, defaultDate, prefill]);

  const addHashtag = () => {
    const parts = hashtagInput.split(/[\s,]+/).map((s) => s.replace(/^#/, '').trim().toLowerCase()).filter(Boolean);
    if (parts.length === 0) return;
    setHashtags((prev) => Array.from(new Set([...prev, ...parts])));
    setHashtagInput('');
  };

  const handleFile = async (file: File) => {
    try {
      setUploading(true);
      const url = await uploadCover(file);
      setCoverUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const ideaLabel = useMemo(() => ideas.find((i) => i.id === ideaId)?.title ?? '', [ideas, ideaId]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const payload: MarketingPostInput = {
      title: title.trim(),
      caption: caption.trim() || null,
      hashtags,
      platform: platform || null,
      format: format || null,
      status,
      scheduled_at: scheduledLocal ? new Date(scheduledLocal).toISOString() : null,
      cover_url: coverUrl || null,
      file_url: fileUrl.trim() || null,
      published_url: status === 'publicado' ? publishedUrl.trim() || null : null,
      pillar_id: pillarId || null,
      idea_id: ideaId || null,
    };
    try {
      setSaving(true);
      let saved: MarketingPost;
      if (post) {
        saved = await updatePost(post.id, payload);
        onSaved?.(saved, false);
      } else {
        saved = await createPost(payload);
        onSaved?.(saved, true);
      }
      onOpenChange(false);
    } catch {
      // toast in hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? 'Editar post' : 'Novo post'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
          {/* Left column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Bastidores da gravação" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {POST_PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {POST_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pilar</Label>
              <Select value={pillarId} onValueChange={setPillarId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar pilar">
                    {pillarId && (
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: getPillarColor(pillars.find((p) => p.id === pillarId)?.color).hex }}
                        />
                        {pillars.find((p) => p.id === pillarId)?.name}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {pillars.map((p) => {
                    const c = getPillarColor(p.color);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                          {p.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POST_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span>{s.emoji} {s.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data e hora agendada</Label>
              <Input
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Capa / Thumbnail</Label>
              {coverUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={coverUrl} alt="capa" className="w-full max-h-48 object-contain bg-muted/30" />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => setCoverUrl('')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl border-2 border-dashed border-border p-5 text-center cursor-pointer hover:bg-accent/30 transition"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-5 w-5" />
                      <span>Clique para enviar capa</span>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Legenda</Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={8}
                placeholder="Escreva a legenda do post..."
              />
            </div>

            <div className="space-y-2">
              <Label>Hashtags</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {hashtags.map((h) => (
                  <Badge key={h} variant="secondary" className="gap-1">
                    #{h}
                    <button onClick={() => setHashtags(hashtags.filter((x) => x !== h))} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addHashtag();
                  }
                }}
                onBlur={addHashtag}
                placeholder="Digite hashtags separadas por espaço ou vírgula"
              />
            </div>

            <div className="space-y-2">
              <Label>Link do arquivo final</Label>
              <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
            </div>

            {status === 'publicado' && (
              <div className="space-y-2">
                <Label>Link do post publicado</Label>
                <Input value={publishedUrl} onChange={(e) => setPublishedUrl(e.target.value)} placeholder="https://..." />
              </div>
            )}

            <div className="space-y-2">
              <Label>Ideia vinculada</Label>
              <Popover open={ideaPickerOpen} onOpenChange={setIdeaPickerOpen} modal={false}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    <span className={cn('truncate', !ideaLabel && 'text-muted-foreground')}>
                      {ideaLabel || 'Buscar ideia...'}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width] z-[200]">
                  <Command>
                    <CommandInput placeholder="Buscar ideia..." />
                    <CommandEmpty>Nenhuma ideia encontrada.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-auto">
                      {ideaId && (
                        <CommandItem onSelect={() => { setIdeaId(''); setIdeaPickerOpen(false); }}>
                          <X className="mr-2 h-4 w-4" /> Remover vínculo
                        </CommandItem>
                      )}
                      {ideas.map((i) => (
                        <CommandItem
                          key={i.id}
                          value={i.title}
                          onSelect={() => { setIdeaId(i.id); setIdeaPickerOpen(false); }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', ideaId === i.id ? 'opacity-100' : 'opacity-0')} />
                          {i.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim() || uploading}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
