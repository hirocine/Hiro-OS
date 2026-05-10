import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import {
  type MarketingReference,
  type MarketingReferenceInput,
  useMarketingReferences,
} from '@/hooks/useMarketingReferences';

export const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Outro' },
];

export const CATEGORY_OPTIONS = [
  { value: 'estetica', label: 'Estética' },
  { value: 'formato', label: 'Formato' },
  { value: 'edicao', label: 'Edição' },
  { value: 'copy', label: 'Copy' },
  { value: 'audio', label: 'Áudio' },
  { value: 'outro', label: 'Outro' },
];

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

function detectPlatform(url: string): string | null {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.startsWith('http')) return 'website';
  return null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reference?: MarketingReference | null;
}

type RefType = 'link' | 'image' | 'both';

export function MarketingReferenceDialog({ open, onOpenChange, reference }: Props) {
  const { createReference, updateReference, uploadImage } = useMarketingReferences();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<RefType>('link');
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [platform, setPlatform] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      if (reference) {
        setTitle(reference.title);
        setSourceUrl(reference.source_url ?? '');
        setImageUrl(reference.image_url ?? '');
        setPlatform(reference.platform ?? '');
        setCategory(reference.category ?? '');
        setTags(reference.tags ?? []);
        setNotes(reference.notes ?? '');
        if (reference.source_url && reference.image_url) setType('both');
        else if (reference.image_url) setType('image');
        else setType('link');
      } else {
        setTitle('');
        setSourceUrl('');
        setImageUrl('');
        setPlatform('');
        setCategory('');
        setTags([]);
        setTagInput('');
        setNotes('');
        setType('link');
      }
    }
  }, [open, reference]);

  const handleUrlChange = (val: string) => {
    setSourceUrl(val);
    if (!platform) {
      const detected = detectPlatform(val);
      if (detected) setPlatform(detected);
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const file = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadImage(file);
      setImageUrl(url);
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const payload: MarketingReferenceInput = {
      title: title.trim(),
      description: null,
      source_url: type === 'image' ? null : sourceUrl.trim() || null,
      image_url: type === 'link' ? null : imageUrl || null,
      platform: platform || null,
      category: category || null,
      tags,
      notes: notes.trim() || null,
    };
    try {
      setSaving(true);
      if (reference) await updateReference(reference.id, payload);
      else await createReference(payload);
      onOpenChange(false);
    } catch {
      // toast handled in hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>
            {reference ? 'Editar referência' : 'Nova referência'}
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8, paddingBottom: 8 }}>
          <Field label="Título" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome da referência" />
          </Field>

          <Field label="Tipo">
            <Tabs value={type} onValueChange={(v) => setType(v as RefType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="link">
                  <LinkIcon size={13} strokeWidth={1.5} style={{ marginRight: 6 }} />
                  Link
                </TabsTrigger>
                <TabsTrigger value="image">
                  <ImageIcon size={13} strokeWidth={1.5} style={{ marginRight: 6 }} />
                  Imagem
                </TabsTrigger>
                <TabsTrigger value="both">Ambos</TabsTrigger>
              </TabsList>
            </Tabs>
          </Field>

          {(type === 'link' || type === 'both') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12 }}>
              <Field label="URL">
                <Input
                  value={sourceUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Plataforma">
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {(type === 'image' || type === 'both') && (
            <Field label="Imagem">
              {imageUrl ? (
                <div
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-line-2) / 0.3)',
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="preview"
                    style={{ width: '100%', maxHeight: 256, objectFit: 'contain', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
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
                    aria-label="Remover imagem"
                  >
                    <X size={13} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: dragOver ? '2px dashed hsl(var(--ds-accent))' : '2px dashed hsl(var(--ds-line-1))',
                    background: dragOver ? 'hsl(var(--ds-accent) / 0.05)' : 'transparent',
                    padding: 24,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
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
                        gap: 8,
                        fontSize: 13,
                        color: 'hsl(var(--ds-fg-3))',
                      }}
                    >
                      <Upload size={18} strokeWidth={1.5} />
                      <span>Arraste uma imagem ou clique para selecionar</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                </div>
              )}
            </Field>
          )}

          <Field label="Categoria">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Tags">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {tags.map((t) => (
                <span
                  key={t}
                  className="pill muted"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
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
                    aria-label={`Remover ${t}`}
                  >
                    <X size={10} strokeWidth={1.5} />
                  </button>
                </span>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              onBlur={handleAddTag}
              placeholder="Digite uma tag e pressione Enter"
            />
          </Field>

          <Field label="Anotações">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anotações livres…"
            />
          </Field>
        </div>

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
