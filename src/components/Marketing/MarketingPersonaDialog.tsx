import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, X, Loader2, User } from 'lucide-react';
import {
  type MarketingPersona,
  type MarketingPersonaInput,
  useMarketingPersonas,
} from '@/hooks/useMarketingPersonas';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona?: MarketingPersona | null;
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

interface TagFieldProps {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
}

function TagField({ label, placeholder, values, onChange }: TagFieldProps) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setInput('');
  };

  return (
    <Field label={label}>
      <div style={{ display: 'flex', gap: 6 }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn" onClick={add}>
          Adicionar
        </button>
      </div>
      {values.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {values.map((v) => (
            <span
              key={v}
              className="pill muted"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
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
                aria-label={`Remover ${v}`}
              >
                <X size={10} strokeWidth={1.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </Field>
  );
}

export function MarketingPersonaDialog({ open, onOpenChange, persona }: Props) {
  const { createPersona, updatePersona, uploadAvatar } = useMarketingPersonas();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [segment, setSegment] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [mainPains, setMainPains] = useState<string[]>([]);
  const [commonObjections, setCommonObjections] = useState<string[]>([]);
  const [buyingTriggers, setBuyingTriggers] = useState<string[]>([]);
  const [channelsConsumed, setChannelsConsumed] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (persona) {
        setName(persona.name);
        setDescription(persona.description ?? '');
        setSegment(persona.segment ?? '');
        setCompanySize(persona.company_size ?? '');
        setAvatarUrl(persona.avatar_url ?? '');
        setMainPains(persona.main_pains ?? []);
        setCommonObjections(persona.common_objections ?? []);
        setBuyingTriggers(persona.buying_triggers ?? []);
        setChannelsConsumed(persona.channels_consumed ?? []);
      } else {
        setName('');
        setDescription('');
        setSegment('');
        setCompanySize('');
        setAvatarUrl('');
        setMainPains([]);
        setCommonObjections([]);
        setBuyingTriggers([]);
        setChannelsConsumed([]);
      }
    }
  }, [open, persona]);

  const handleAvatar = async (file: File) => {
    try {
      setUploading(true);
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch {
      // toast handled in hook
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const input: MarketingPersonaInput = {
      name: name.trim(),
      description: description.trim() || null,
      segment: segment.trim() || null,
      company_size: companySize.trim() || null,
      avatar_url: avatarUrl || null,
      main_pains: mainPains,
      common_objections: commonObjections,
      buying_triggers: buyingTriggers,
      channels_consumed: channelsConsumed,
    };
    try {
      setSaving(true);
      if (persona) await updatePersona(persona.id, input);
      else await createPersona(input);
      onOpenChange(false);
    } catch {
      // toast handled
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>
            {persona ? 'Editar persona' : 'Nova persona'}
          </DialogTitle>
        </DialogHeader>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            paddingRight: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar style={{ width: 76, height: 76 }}>
              <AvatarImage src={avatarUrl || undefined} alt={name} />
              <AvatarFallback>
                {name ? name.charAt(0).toUpperCase() : <User size={28} strokeWidth={1.5} />}
              </AvatarFallback>
            </Avatar>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatar(f);
                }}
              />
              <button
                type="button"
                className="btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                ) : (
                  <Upload size={14} strokeWidth={1.5} />
                )}
                <span>{avatarUrl ? 'Trocar avatar' : 'Enviar avatar'}</span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  style={{
                    fontSize: 11,
                    color: 'hsl(var(--ds-fg-3))',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: 0,
                  }}
                  onClick={() => setAvatarUrl('')}
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          <Field label="Nome" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marina, Diretora de Marketing"
            />
          </Field>

          <Field label="Descrição curta">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quem é essa persona, o que faz, o que busca…"
              rows={3}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <Field label="Segmento">
              <Input
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="Ex: Tecnologia, Saúde…"
              />
            </Field>
            <Field label="Porte da empresa">
              <Input
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                placeholder="Ex: Startup, Mid-market…"
              />
            </Field>
          </div>

          <TagField
            label="Principais dores"
            placeholder="Adicione uma dor e Enter"
            values={mainPains}
            onChange={setMainPains}
          />
          <TagField
            label="Objeções comuns"
            placeholder="Adicione uma objeção e Enter"
            values={commonObjections}
            onChange={setCommonObjections}
          />
          <TagField
            label="Gatilhos de compra"
            placeholder="Adicione um gatilho e Enter"
            values={buyingTriggers}
            onChange={setBuyingTriggers}
          />
          <TagField
            label="Canais consumidos"
            placeholder="Ex: Instagram, LinkedIn, podcasts…"
            values={channelsConsumed}
            onChange={setChannelsConsumed}
          />
        </div>

        <DialogFooter>
          <button type="button" className="btn" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
            <span>Salvar</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
