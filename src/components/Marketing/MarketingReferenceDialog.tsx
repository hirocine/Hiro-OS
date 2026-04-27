import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
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
          <DialogTitle>{reference ? 'Editar referência' : 'Nova referência'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome da referência" />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Tabs value={type} onValueChange={(v) => setType(v as RefType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="link"><LinkIcon className="h-3.5 w-3.5 mr-1.5" />Link</TabsTrigger>
                <TabsTrigger value="image"><ImageIcon className="h-3.5 w-3.5 mr-1.5" />Imagem</TabsTrigger>
                <TabsTrigger value="both">Ambos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {(type === 'link' || type === 'both') && (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={sourceUrl} onChange={(e) => handleUrlChange(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {(type === 'image' || type === 'both') && (
            <div className="space-y-2">
              <Label>Imagem</Label>
              {imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={imageUrl} alt="preview" className="w-full max-h-64 object-contain bg-muted/30" />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => setImageUrl('')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition',
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/30',
                  )}
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-5 w-5" />
                      <span>Arraste uma imagem ou clique para selecionar</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1">
                  {t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
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
          </div>

          <div className="space-y-2">
            <Label>Anotações</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anotações livres..." />
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
