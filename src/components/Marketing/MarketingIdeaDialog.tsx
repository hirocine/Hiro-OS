import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto ds-shell">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>
            {idea ? 'Editar ideia' : 'Nova ideia'}
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8, paddingBottom: 8 }}>
          <Field label="Título" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome da ideia" />
          </Field>

          <Field label="Descrição">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Descreva a ideia…"
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as IdeaStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IDEA_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.emoji} {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Origem">
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {IDEA_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
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
                <SelectValue placeholder="Selecionar pilar (opcional)">
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

          <Field label="Referências vinculadas">
            <MultiSelect
              options={referenceOptions}
              value={referenceIds}
              onValueChange={setReferenceIds}
              placeholder="Buscar referências…"
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
            disabled={saving || !title.trim()}
          >
            {saving && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
            <span>Salvar</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
