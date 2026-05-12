/**
 * Dialog para criar/editar uma data "livre" (important_dates).
 * Aniversários do time (birth_date / hired_at) NÃO são editados aqui
 * — vão pelo EditUserDialog em /administracao/usuarios.
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTeamDates, IMPORTANT_DATE_TYPE_LABEL } from '@/features/rh';
import type { TeamDate } from '@/features/rh';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se preenchido, dialog está em modo de edição. */
  editing: TeamDate | null;
}

type ImportantType = NonNullable<TeamDate['important_type']>;

const TYPES: ImportantType[] = ['company_milestone', 'commemorative', 'client_anniversary', 'custom'];

export function ImportantDateDialog({ open, onOpenChange, editing }: Props) {
  const { createImportantDate, updateImportantDate } = useTeamDates();

  const [type, setType] = useState<ImportantType>('custom');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [recurring, setRecurring] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Hydrate from editing prop
  useEffect(() => {
    if (editing) {
      setType((editing.important_type ?? 'custom') as ImportantType);
      setTitle(editing.title);
      setDate(editing.base_date ?? '');
      setRecurring(editing.recurring ?? true);
      setNotes(editing.notes ?? '');
    } else if (open) {
      // Reset when opening fresh
      setType('custom');
      setTitle('');
      setDate('');
      setRecurring(true);
      setNotes('');
    }
  }, [editing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      enhancedToast.error({ title: 'Preencha título e data' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await new Promise<void>((resolve, reject) => {
          updateImportantDate(
            {
              id: editing.id,
              type,
              title: title.trim(),
              date,
              recurring,
              notes: notes.trim() || null,
            },
            { onSuccess: () => resolve(), onError: reject },
          );
        });
        enhancedToast.success({ title: 'Data atualizada' });
      } else {
        await new Promise<void>((resolve, reject) => {
          createImportantDate(
            {
              type,
              title: title.trim(),
              date,
              recurring,
              notes: notes.trim() || null,
            },
            { onSuccess: () => resolve(), onError: reject },
          );
        });
        enhancedToast.success({ title: 'Data adicionada' });
      }
      onOpenChange(false);
    } catch (err) {
      enhancedToast.error({
        title: 'Erro ao salvar',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar data' : 'Nova data'}</DialogTitle>
          <DialogDescription>
            Para aniversários do time, edite no perfil do colaborador em
            <strong> Administração → Usuários</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as ImportantType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {IMPORTANT_DATE_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Festa fim de ano, 5 anos de Hiro"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="recurring"
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <input
                id="recurring"
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
              />
              <span style={{ fontSize: 13 }}>Repete todo ano</span>
            </label>
            <p style={{ fontSize: 12, color: 'var(--ds-text-muted)' }}>
              Desmarcado = data única (one-shot). Ex: "Lançamento campanha X em 12/jun/2026".
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Contexto, link, lembrete..."
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
