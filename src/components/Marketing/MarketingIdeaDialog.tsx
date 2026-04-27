import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '@/components/ui/multi-select';
import { X, Loader2 } from 'lucide-react';
import {
  IDEA_SOURCES,
  IDEA_STATUSES,
  type IdeaStatus,
  type MarketingIdea,
  type MarketingIdeaInput,
  useMarketingIdeas,
} from '@/hooks/useMarketingIdeas';
import { useMarketingReferences } from '@/hooks/useMarketingReferences';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea?: MarketingIdea | null;
  defaultStatus?: IdeaStatus;
}

export function MarketingIdeaDialog({ open, onOpenChange, idea, defaultStatus }: Props) {
  const { createIdea, updateIdea } = useMarketingIdeas();
  const { references } = useMarketingReferences();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IdeaStatus>('rascunho');
  const [source, setSource] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [referenceIds, setReferenceIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (idea) {
        setTitle(idea.title);
        setDescription(idea.description ?? '');
        setStatus(idea.status);
        setSource(idea.source ?? '');
        setTags(idea.tags ?? []);
        setReferenceIds(idea.reference_ids ?? []);
      } else {
        setTitle('');
        setDescription('');
        setStatus(defaultStatus ?? 'rascunho');
        setSource('');
        setTags([]);
        setTagInput('');
        setReferenceIds([]);
      }
    }
  }, [open, idea, defaultStatus]);

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const payload: MarketingIdeaInput = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      source: source || null,
      tags,
      reference_ids: referenceIds,
    };
    try {
      setSaving(true);
      if (idea) await updateIdea(idea.id, payload);
      else await createIdea(payload);
      onOpenChange(false);
    } catch {
      // toast handled in hook
    } finally {
      setSaving(false);
    }
  };

  const referenceOptions = references.map((r) => ({ value: r.id, label: r.title }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{idea ? 'Editar ideia' : 'Nova ideia'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome da ideia" />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Descreva a ideia..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as IdeaStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IDEA_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.emoji} {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {IDEA_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Label>Referências vinculadas</Label>
            <MultiSelect
              options={referenceOptions}
              value={referenceIds}
              onValueChange={setReferenceIds}
              placeholder="Buscar referências..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
