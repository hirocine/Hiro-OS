import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, X, Loader2, Check, ChevronsUpDown, ChevronDown, BarChart3, RefreshCw } from 'lucide-react';
import {
  POST_FORMATS,
  POST_PLATFORMS,
  POST_STATUSES,
  type PostStatus,
} from '@/lib/marketing-posts-config';
import { getPillarColor } from '@/lib/marketing-colors';
import { type MarketingPost, type MarketingPostInput, useMarketingPosts } from '@/hooks/useMarketingPosts';
import { useMarketingPillars } from '@/hooks/useMarketingPillars';
import { useMarketingPersonas } from '@/hooks/useMarketingPersonas';
import { useMarketingIdeas } from '@/hooks/useMarketingIdeas';
import { useMarketingIntegrations } from '@/hooks/useMarketingIntegrations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={fieldLabel}>
      {label}
      {required && <span style={{ marginLeft: 4, color: 'hsl(var(--ds-danger))' }}>*</span>}
    </label>
    {children}
  </div>
);

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MarketingPostDialog({ open, onOpenChange, post, defaultDate, prefill, onSaved }: Props) {
  const { createPost, updatePost, uploadCover } = useMarketingPosts();
  const { pillars } = useMarketingPillars();
  const { personas } = useMarketingPersonas();
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
  const [personaId, setPersonaId] = useState<string>('');
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
      setPersonaId(m.persona_id ?? '');
      setStatus(m.status);
      setScheduledLocal(toLocalInput(m.scheduled_at));
      setCoverUrl(m.cover_url ?? '');
      setCaption(m.caption ?? '');
      setHashtags(m.hashtags ?? []);
      setFileUrl(m.file_url ?? '');
      setPublishedUrl(m.published_url ?? '');
      setIdeaId(m.idea_id ?? '');
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
      setPersonaId(prefill?.persona_id ?? '');
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
      persona_id: personaId || null,
      idea_id: ideaId || null,
      views, likes, comments: commentsCount, shares, saves, reach,
      profile_clicks: profileClicks, new_followers: newFollowers,
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
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>
            {post ? 'Editar post' : 'Novo post'}
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, paddingTop: 8, paddingBottom: 8 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Título" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Bastidores da gravação"
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Field label="Plataforma">
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Formato">
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Pilar">
              <Select value={pillarId} onValueChange={setPillarId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar pilar">
                    {pillarId && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: getPillarColor(pillars.find((p) => p.id === pillarId)?.color).hex,
                          }}
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.hex }} />
                          {p.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Persona">
              <Select value={personaId} onValueChange={setPersonaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar persona (opcional)">
                    {personaId &&
                      (() => {
                        const persona = personas.find((p) => p.id === personaId);
                        if (!persona) return null;
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Avatar style={{ width: 18, height: 18 }}>
                              <AvatarImage src={persona.avatar_url ?? undefined} alt={persona.name} />
                              <AvatarFallback style={{ fontSize: 9 }}>
                                {persona.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {persona.name}
                          </span>
                        );
                      })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {personas.length === 0 ? (
                    <div
                      style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      Nenhuma persona cadastrada
                    </div>
                  ) : (
                    personas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <Avatar style={{ width: 18, height: 18 }}>
                            <AvatarImage src={p.avatar_url ?? undefined} alt={p.name} />
                            <AvatarFallback style={{ fontSize: 9 }}>
                              {p.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {p.name}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as PostStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <span>
                        {s.emoji} {s.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Data e hora agendada">
              <Input
                type="datetime-local"
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
              />
            </Field>

            <Field label="Capa / Thumbnail">
              {coverUrl ? (
                <div
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                  }}
                >
                  <img
                    src={coverUrl}
                    alt="capa"
                    style={{ width: '100%', maxHeight: 192, objectFit: 'contain', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() => setCoverUrl('')}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 28,
                      height: 28,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'hsl(var(--ds-surface))',
                      border: '1px solid hsl(var(--ds-line-1))',
                      color: 'hsl(var(--ds-fg-2))',
                      cursor: 'pointer',
                    }}
                    aria-label="Remover capa"
                  >
                    <X size={13} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed hsl(var(--ds-line-1))',
                    padding: 20,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
                    e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                  }}
                >
                  {uploading ? (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                      Enviando…
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 13,
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      <Upload size={18} strokeWidth={1.5} />
                      <span>Clique para enviar capa</span>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>
              )}
            </Field>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Legenda">
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={8}
                placeholder="Escreva a legenda do post…"
              />
            </Field>

            <Field label="Hashtags">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {hashtags.map((h) => (
                  <span
                    key={h}
                    className="pill muted"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    #{h}
                    <button
                      type="button"
                      onClick={() => setHashtags(hashtags.filter((x) => x !== h))}
                      style={{
                        display: 'inline-grid',
                        placeItems: 'center',
                        width: 14,
                        height: 14,
                        color: 'hsl(var(--ds-fg-3))',
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                      }}
                      aria-label={`Remover #${h}`}
                    >
                      <X size={10} strokeWidth={1.5} />
                    </button>
                  </span>
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
            </Field>

            <Field label="Link do arquivo final">
              <Input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://…"
              />
            </Field>

            {status === 'publicado' && (
              <Field label="Link do post publicado">
                <Input
                  value={publishedUrl}
                  onChange={(e) => setPublishedUrl(e.target.value)}
                  placeholder="https://…"
                />
              </Field>
            )}

            <Field label="Ideia vinculada">
              <Popover open={ideaPickerOpen} onOpenChange={setIdeaPickerOpen} modal={false}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="btn"
                    role="combobox"
                    style={{
                      width: '100%',
                      justifyContent: 'space-between',
                      color: ideaLabel ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-4))',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ideaLabel || 'Buscar ideia…'}
                    </span>
                    <ChevronsUpDown size={13} strokeWidth={1.5} style={{ opacity: 0.5, flexShrink: 0 }} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width] z-[200]">
                  <Command>
                    <CommandInput placeholder="Buscar ideia…" />
                    <CommandEmpty>Nenhuma ideia encontrada.</CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-auto">
                      {ideaId && (
                        <CommandItem
                          onSelect={() => {
                            setIdeaId('');
                            setIdeaPickerOpen(false);
                          }}
                        >
                          <X size={13} strokeWidth={1.5} style={{ marginRight: 8 }} /> Remover vínculo
                        </CommandItem>
                      )}
                      {ideas.map((i) => (
                        <CommandItem
                          key={i.id}
                          value={i.title}
                          onSelect={() => {
                            setIdeaId(i.id);
                            setIdeaPickerOpen(false);
                          }}
                        >
                          <Check
                            size={13}
                            strokeWidth={1.5}
                            style={{
                              marginRight: 8,
                              opacity: ideaId === i.id ? 1 : 0,
                              color: 'hsl(var(--ds-accent))',
                            }}
                          />
                          {i.title}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </Field>
          </div>
        </div>

        {status === 'publicado' && (
          <Collapsible
            open={metricsOpen}
            onOpenChange={setMetricsOpen}
            style={{ border: '1px solid hsl(var(--ds-line-1))' }}
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'hsl(var(--ds-fg-1))',
                  }}
                >
                  <BarChart3 size={14} strokeWidth={1.5} />
                  Métricas de performance
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  style={{
                    color: 'hsl(var(--ds-fg-3))',
                    transition: 'transform 0.2s',
                    transform: metricsOpen ? 'rotate(180deg)' : 'none',
                  }}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div style={{ padding: 16, borderTop: '1px solid hsl(var(--ds-line-1))', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
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
                    <Field key={m.label} label={m.label}>
                      <Input
                        type="number"
                        min={0}
                        value={m.value}
                        onChange={(e) => m.set(Number(e.target.value) || 0)}
                      />
                    </Field>
                  ))}
                </div>

                <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                  Taxa de engajamento será calculada automaticamente:{' '}
                  <span style={{ fontWeight: 600, color: 'hsl(var(--ds-fg-1))', fontVariantNumeric: 'tabular-nums' }}>
                    {computedEngagement.toFixed(2)}%
                  </span>
                </p>

                {metricsUpdatedAt && (
                  <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>
                    Atualizado em{' '}
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(metricsUpdatedAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(metricsUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>{' '}
                    via{' '}
                    {metricsSource === 'api_instagram'
                      ? 'Instagram'
                      : metricsSource === 'api_linkedin'
                        ? 'LinkedIn'
                        : 'manual'}
                  </p>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
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
                                <button
                                  type="button"
                                  className="btn"
                                  disabled={igDisabled}
                                  onClick={() => handleSync('instagram')}
                                >
                                  {syncingPlatform === 'instagram' ? (
                                    <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                                  ) : (
                                    <RefreshCw size={13} strokeWidth={1.5} />
                                  )}
                                  <span>Sincronizar do Instagram</span>
                                </button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{igTooltip}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <button
                                  type="button"
                                  className="btn"
                                  disabled={liDisabled}
                                  onClick={() => handleSync('linkedin')}
                                >
                                  {syncingPlatform === 'linkedin' ? (
                                    <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                                  ) : (
                                    <RefreshCw size={13} strokeWidth={1.5} />
                                  )}
                                  <span>Sincronizar do LinkedIn</span>
                                </button>
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
          <button type="button" className="btn" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSubmit}
            disabled={saving || !title.trim() || uploading}
          >
            {saving && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
            <span>Salvar</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
