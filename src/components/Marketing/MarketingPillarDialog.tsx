import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { PILLAR_COLORS } from '@/lib/marketing-colors';
import { cn } from '@/lib/utils';
import type { MarketingPillar, MarketingPillarInput } from '@/hooks/useMarketingPillars';
import { Check } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pillar?: MarketingPillar | null;
  onSave: (input: MarketingPillarInput) => Promise<void>;
}

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
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{pillar ? 'Editar Pilar' : 'Novo Pilar'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Bastidores" />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que este pilar representa?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-8 gap-2">
              {PILLAR_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center transition-all',
                    color === c.key ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {color === c.key && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Definir meta de distribuição</Label>
                <p className="text-xs text-muted-foreground">% ideal de posts deste pilar</p>
              </div>
              <Switch checked={hasTarget} onCheckedChange={setHasTarget} />
            </div>
            {hasTarget && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Meta</span>
                  <span className="text-sm font-semibold">{target}%</span>
                </div>
                <Slider value={[target]} onValueChange={(v) => setTarget(v[0])} min={0} max={100} step={5} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
