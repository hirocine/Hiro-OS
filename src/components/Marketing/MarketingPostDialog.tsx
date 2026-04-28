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
import { useMarketingIntegrations } from '@/hooks/useMarketingIntegrations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

function slugify(s: string | undefined | null): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

export function MarketingPostDialog({ open, onOpenChange, post, defaultDate, prefill, onSaved }: Props) {
  const { createPost, updatePost, uploadCover } = useMarketingPosts();
  const { pillars } = useMarketingPillars();
  const { ideas } = useMarketingIdeas();
  const { instagramConnected, linkedinConnected } = useMarketingIntegrations();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<'instagram' | 'linkedin' | null>(null);
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

  // UTM Builder
  const [destinationUrl, setDestinationUrl] = useState('https://hiro.film');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');

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
    const m = post ?? null;
    if (m) {
      setTitle(m.title);
      setPlatform(m.platform ?? '');
      setFormat(m.format ?? '');
      setPillarId(m.pillar_id ?? '');
      setStatus(m.status);
      setScheduledLocal(toLocalInput(m.scheduled_at));
      setCoverUrl(m.cover_url ?? '');
      setCaption(m.caption ?? '');
      setHashtags(m.hashtags ?? []);
      setFileUrl(m.file_url ?? '');
      setPublishedUrl(m.published_url ?? '');
      setIdeaId(m.idea_id ?? '');
      setDestinationUrl((m as unknown as { destination_url?: string }).destination_url ?? 'https://hiro.film');
      setUtmSource((m as unknown as { utm_source?: string }).utm_source ?? '');
      setUtmMedium((m as unknown as { utm_medium?: string }).utm_medium ?? '');
      setUtmCampaign((m as unknown as { utm_campaign?: string }).utm_campaign ?? '');
      setUtmContent((m as unknown as { utm_content?: string }).utm_content ?? '');
      setViews(m.views ?? 0);
      setLikes(m.likes ?? 0);
      setCommentsCount(m.comments ?? 0);
      setShares(m.shares ?? 0);
      setSaves(m.saves ?? 0);
      setReach(m.reach ?? 0);
      setProfileClicks(m.profile_clicks ?? 0);
      setNewFollowers(m.new_followers ?? 0);
      setMetricsUpdatedAt(m.metrics_updated_at);
      setMetricsSource(m.metrics_source);
      initialMetricsRef.current = JSON.stringify([
        m.views, m.likes, m.comments, m.shares, m.saves, m.reach, m.profile_clicks, m.new_followers,
      ]);
      setMetricsOpen(m.status === 'publicado');
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
      setDestinationUrl('https://hiro.film');
      setUtmSource(''); setUtmMedium(''); setUtmCampaign(''); setUtmContent('');
      setViews(0); setLikes(0); setCommentsCount(0); setShares(0);
      setSaves(0); setReach(0); setProfileClicks(0); setNewFollowers(0);
      setMetricsUpdatedAt(null); setMetricsSource(null);
      initialMetricsRef.current = JSON.stringify([0, 0, 0, 0, 0, 0, 0, 0]);
      setMetricsOpen(false);
    }
  }, [open, post, defaultDate, prefill]);

  const computedEngagement = useMemo(() => {
    if (reach <= 0) return 0;
    return ((likes + commentsCount + shares + saves) / reach) * 100;
  }, [likes, commentsCount, shares, saves, reach]);

  const effectiveUtm = useMemo(() => {
    const has = !!destinationUrl.trim();
    if (!has) return { source: '', medium: '', campaign: '', content: '' };
    return {
      source: utmSource || 'instagram',
      medium: utmMedium || 'social',
      campaign: utmCampaign || slugify(title) || 'post',
      content: utmContent || '',
    };
  }, [destinationUrl, utmSource, utmMedium, utmCampaign, utmContent, title]);

  const generatedUtmUrl = useMemo(() => {
    if (!destinationUrl.trim()) return '';
    try {
      const u = new URL(destinationUrl.trim());
      if (effectiveUtm.source) u.searchParams.set('utm_source', effectiveUtm.source);
      if (effectiveUtm.medium) u.searchParams.set('utm_medium', effectiveUtm.medium);
      if (effectiveUtm.campaign) u.searchParams.set('utm_campaign', effectiveUtm.campaign);
      if (effectiveUtm.content) u.searchParams.set('utm_content', effectiveUtm.content);
      return u.toString();
    } catch {
      return destinationUrl.trim();
    }
  }, [destinationUrl, effectiveUtm]);

  const copyUtmUrl = async () => {
    if (!generatedUtmUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUtmUrl);
      toast.success('Link copiado');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

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
    const currentMetrics = JSON.stringify([views, likes, commentsCount, shares, saves, reach, profileClicks, newFollowers]);
    const metricsChanged = currentMetrics !== initialMetricsRef.current;
    const payload = {
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
      views, likes, comments: commentsCount, shares, saves, reach,
      profile_clicks: profileClicks, new_followers: newFollowers,
      destination_url: destinationUrl.trim() || null,
      utm_source: destinationUrl.trim() ? effectiveUtm.source || null : null,
      utm_medium: destinationUrl.trim() ? effectiveUtm.medium || null : null,
      utm_campaign: destinationUrl.trim() ? effectiveUtm.campaign || null : null,
      utm_content: effectiveUtm.content || null,
      utm_url: generatedUtmUrl || null,
      ...(metricsChanged
        ? { metrics_updated_at: new Date().toISOString(), metrics_source: 'manual' }
        : {}),
    } as MarketingPostInput;
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

  const handleSync = async (target: 'instagram' | 'linkedin') => {
    if (!post) return;
    try {
      setSyncingPlatform(target);
      const fnName = target === 'instagram' ? 'sync-instagram-post' : 'sync-linkedin-post';
      const { data, error } = await supabase.functions.invoke(fnName, { body: { post_id: post.id } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido');
      const m = data.metrics ?? {};
      if (m.views != null) setViews(Number(m.views) || 0);
      if (m.likes != null) setLikes(Number(m.likes) || 0);
      if (m.comments != null) setCommentsCount(Number(m.comments) || 0);
      if (m.shares != null) setShares(Number(m.shares) || 0);
      if (m.saved != null) setSaves(Number(m.saved) || 0);
      if (m.saves != null) setSaves(Number(m.saves) || 0);
      if (m.reach != null) setReach(Number(m.reach) || 0);
      if (m.profile_clicks != null) setProfileClicks(Number(m.profile_clicks) || 0);
      setMetricsUpdatedAt(new Date().toISOString());
      setMetricsSource(target === 'instagram' ? 'api_instagram' : 'api_linkedin');
      toast.success(`Métricas sincronizadas do ${target === 'instagram' ? 'Instagram' : 'LinkedIn'}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao sincronizar';
      toast.error(msg);
    } finally {
      setSyncingPlatform(null);
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

        {/* ===== Link e rastreamento (UTM Builder) ===== */}
        <div className="border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4" />
            Link e rastreamento
          </div>

          <div className="space-y-2">
            <Label className="text-xs">URL de destino (sem UTM)</Label>
            <Input
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://hiro.film/portfolio"
              type="url"
            />
          </div>

          {destinationUrl.trim() && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">utm_source</Label>
                  <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="instagram" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">utm_medium</Label>
                  <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="social" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">utm_campaign</Label>
                  <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder={slugify(title) || 'campanha'} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">utm_content (opcional)</Label>
                  <Input value={utmContent} onChange={(e) => setUtmContent(e.target.value)} placeholder="ex: cta-bio" />
                </div>
              </div>

              {generatedUtmUrl && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-primary">Link com rastreamento</Label>
                    <Button type="button" size="sm" variant="outline" onClick={copyUtmUrl} className="h-7 gap-1.5">
                      <Copy className="h-3 w-3" />
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs font-mono break-all text-foreground">{generatedUtmUrl}</p>
                </div>
              )}
            </>
          )}
        </div>

        {status === 'publicado' && (
          <Collapsible open={metricsOpen} onOpenChange={setMetricsOpen} className="border border-border rounded-xl">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition rounded-xl"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="h-4 w-4" />
                  Métricas de performance
                </span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', metricsOpen && 'rotate-180')} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Views', value: views, set: setViews },
                    { label: 'Curtidas', value: likes, set: setLikes },
                    { label: 'Comentários', value: commentsCount, set: setCommentsCount },
                    { label: 'Shares', value: shares, set: setShares },
                    { label: 'Saves', value: saves, set: setSaves },
                    { label: 'Alcance', value: reach, set: setReach },
                    { label: 'Cliques na bio', value: profileClicks, set: setProfileClicks },
                    { label: 'Novos seguidores', value: newFollowers, set: setNewFollowers },
                  ].map((m) => (
                    <div key={m.label} className="space-y-1.5">
                      <Label className="text-xs">{m.label}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={m.value}
                        onChange={(e) => m.set(Number(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Taxa de engajamento será calculada automaticamente:{' '}
                  <span className="font-medium text-foreground">{computedEngagement.toFixed(2)}%</span>
                </p>

                {metricsUpdatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Atualizado em {new Date(metricsUpdatedAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(metricsUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                    via{' '}
                    {metricsSource === 'api_instagram'
                      ? 'Instagram'
                      : metricsSource === 'api_linkedin'
                      ? 'LinkedIn'
                      : 'manual'}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <TooltipProvider>
                    {(() => {
                      const igEligible = platform === 'instagram' && status === 'publicado' && !!publishedUrl.trim();
                      const igDisabled = !igEligible || !instagramConnected || syncingPlatform !== null;
                      const igTooltip = !instagramConnected
                        ? 'Configure a integração do Instagram em Admin → Integrações'
                        : !igEligible
                        ? 'Disponível apenas para posts publicados do Instagram com URL preenchida'
                        : 'Sincronizar métricas do Instagram';
                      const liEligible = platform === 'linkedin' && status === 'publicado' && !!publishedUrl.trim();
                      const liDisabled = !liEligible || !linkedinConnected || syncingPlatform !== null;
                      const liTooltip = !linkedinConnected
                        ? 'Configure a integração do LinkedIn em Admin → Integrações'
                        : !liEligible
                        ? 'Disponível apenas para posts publicados do LinkedIn com URL preenchida'
                        : 'Sincronizar métricas do LinkedIn';
                      return (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={igDisabled}
                                  onClick={() => handleSync('instagram')}
                                  className="gap-2"
                                >
                                  {syncingPlatform === 'instagram'
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <RefreshCw className="h-3.5 w-3.5" />}
                                  Sincronizar do Instagram
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{igTooltip}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={liDisabled}
                                  onClick={() => handleSync('linkedin')}
                                  className="gap-2"
                                >
                                  {syncingPlatform === 'linkedin'
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <RefreshCw className="h-3.5 w-3.5" />}
                                  Sincronizar do LinkedIn
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{liTooltip}</TooltipContent>
                          </Tooltip>
                        </>
                      );
                    })()}
                  </TooltipProvider>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

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
