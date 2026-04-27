import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
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
        <Button type="button" variant="secondary" onClick={add}>
          Adicionar
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1">
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
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
          <DialogTitle>{persona ? 'Editar persona' : 'Nova persona'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl || undefined} alt={name} />
              <AvatarFallback>
                {name ? name.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatar(f);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                {avatarUrl ? 'Trocar avatar' : 'Enviar avatar'}
              </Button>
              {avatarUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAvatarUrl('')}>
                  Remover
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Marina, Diretora de Marketing" />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição curta</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quem é essa persona, o que faz, o que busca..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Segmento</Label>
              <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="Ex: Tecnologia, Saúde..." />
            </div>
            <div className="space-y-1.5">
              <Label>Porte da empresa</Label>
              <Input value={companySize} onChange={(e) => setCompanySize(e.target.value)} placeholder="Ex: Startup, Mid-market..." />
            </div>
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
            placeholder="Ex: Instagram, LinkedIn, podcasts..."
            values={channelsConsumed}
            onChange={setChannelsConsumed}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
