import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { PILLAR_COLORS } from '@/lib/marketing-colors';
import type { MarketingPillar, MarketingPillarInput } from '@/hooks/useMarketingPillars';
import { Check } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillar?: MarketingPillar | null;
  onSave: (input: MarketingPillarInput) => Promise<void>;
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

export function MarketingPillarDialog({ open, onOpenChange, pillar, onSave }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [hasTarget, setHasTarget] = useState(false);
  const [target, setTarget] = useState(20);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(pillar?.name ?? '');
      setDescription(pillar?.description ?? '');
      setColor(pillar?.color ?? 'blue');
      setHasTarget(pillar?.target_percentage != null);
      setTarget(pillar?.target_percentage ?? 20);
    }
  }, [open, pillar]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        color,
        target_percentage: hasTarget ? target : null,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col ds-shell">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>
            {pillar ? 'Editar Pilar' : 'Novo Pilar'}
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 4 }}>
          <Field label="Nome" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bastidores"
            />
          </Field>

          <Field label="Descrição">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que este pilar representa?"
              rows={3}
            />
          </Field>

          <Field label="Cor">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
              {PILLAR_COLORS.map((c) => {
                const isSelected = color === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    style={{
                      height: 36,
                      width: 36,
                      borderRadius: '50%',
                      border: 0,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      background: c.hex,
                      boxShadow: isSelected ? `0 0 0 2px hsl(var(--ds-bg)), 0 0 0 4px hsl(var(--ds-fg-1))` : undefined,
                      transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    title={c.label}
                  >
                    {isSelected && <Check size={14} strokeWidth={2} style={{ color: '#fff' }} />}
                  </button>
                );
              })}
            </div>
          </Field>

          <div
            style={{
              border: '1px solid hsl(var(--ds-line-1))',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                  Definir meta de distribuição
                </span>
                <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                  % ideal de posts deste pilar
                </p>
              </div>
              <Switch checked={hasTarget} onCheckedChange={setHasTarget} />
            </div>
            {hasTarget && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>Meta</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      color: 'hsl(var(--ds-fg-1))',
                    }}
                  >
                    {target}%
                  </span>
                </div>
                <Slider value={[target]} onValueChange={(v) => setTarget(v[0])} min={0} max={100} step={5} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <button type="button" className="btn" onClick={() => onOpenChange(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSubmit}
            disabled={!name.trim() || saving}
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
