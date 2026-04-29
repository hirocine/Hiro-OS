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
import { useMarketingPillars } from '@/hooks/useMarketingPillars';
import { useMarketingPersonas } from '@/hooks/useMarketingPersonas';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPillarColor } from '@/lib/marketing-colors';
import { POST_FORMATS } from '@/lib/marketing-posts-config';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea?: MarketingIdea | null;
  defaultStatus?: IdeaStatus;
}

export function MarketingIdeaDialog({ open, onOpenChange, idea, defaultStatus }: Props) {
  const { createIdea, updateIdea } = useMarketingIdeas();
  const { references } = useMarketingReferences();
  const { pillars } = useMarketingPillars();
  const { personas } = useMarketingPersonas();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IdeaStatus>('rascunho');
  const [source, setSource] = useState<string>('');
  const [format, setFormat] = useState<string>('');
  const [pillarId, setPillarId] = useState<string>('');
  const [personaId, setPersonaId] = useState<string>('');
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
        setFormat(idea.format ?? '');
        setPillarId(idea.pillar_id ?? '');
        setPersonaId(idea.persona_id ?? '');
        setTags(idea.tags ?? []);
        setReferenceIds(idea.reference_ids ?? []);
      } else {
        setTitle('');
        setDescription('');
        setStatus(defaultStatus ?? 'rascunho');
        setSource('');
        setFormat('');
        setPillarId('');
        setPersonaId('');
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
      format: format || null,
      pillar_id: pillarId || null,
      persona_id: personaId || null,
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                <SelectValue placeholder="Selecionar pilar (opcional)">
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
            <Label>Persona</Label>
            <Select value={personaId} onValueChange={setPersonaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar persona (opcional)">
                  {personaId && (() => {
                    const persona = personas.find((p) => p.id === personaId);
                    if (!persona) return null;
                    return (
                      <span className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={persona.avatar_url ?? undefined} alt={persona.name} />
                          <AvatarFallback className="text-[10px]">
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
                  <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                    Nenhuma persona cadastrada
                  </div>
                ) : (
                  personas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={p.avatar_url ?? undefined} alt={p.name} />
                          <AvatarFallback className="text-[10px]">
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
