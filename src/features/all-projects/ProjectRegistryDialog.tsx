import { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useProjectRegistryMutations,
  type ProjectRegistryInput,
  type ProjectRegistryRow,
} from './useProjectRegistry';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, dialog is in edit mode. */
  member?: ProjectRegistryRow | null;
}

const fieldLabel: React.CSSProperties = {
  fontFamily: '"HN Display", sans-serif',
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

function emptyDraft(): ProjectRegistryInput {
  return {
    project_number: '',
    project_name: '',
    client_name: '',
    project_date: null,
    value_brl: null,
    notes: null,
  };
}

export function ProjectRegistryDialog({ open, onOpenChange, member }: Props) {
  const { create, update, remove } = useProjectRegistryMutations();
  const isEditing = !!member;

  const [draft, setDraft] = useState<ProjectRegistryInput>(emptyDraft);
  const [valueText, setValueText] = useState<string>('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (member) {
      setDraft({
        project_number: member.project_number,
        project_name: member.project_name,
        client_name: member.client_name,
        project_date: member.project_date,
        value_brl: member.value_brl,
        notes: member.notes,
      });
      setValueText(member.value_brl != null ? String(member.value_brl) : '');
    } else {
      setDraft(emptyDraft());
      setValueText('');
    }
  }, [member, open]);

  const valid =
    draft.project_number.trim().length > 0 &&
    draft.project_name.trim().length > 0 &&
    draft.client_name.trim().length > 0;

  const isSaving = create.isPending || update.isPending;

  const handleSave = () => {
    if (!valid) return;
    const payload: ProjectRegistryInput = {
      project_number: draft.project_number.trim(),
      project_name: draft.project_name.trim(),
      client_name: draft.client_name.trim(),
      project_date: draft.project_date || null,
      value_brl: valueText.trim() === '' ? null : Number(valueText.replace(',', '.')),
      notes: draft.notes && draft.notes.trim() ? draft.notes.trim() : null,
    };
    if (isEditing && member) {
      update.mutate(
        { ...payload, id: member.id },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleDelete = () => {
    if (!member) return;
    remove.mutate(member.id, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        onOpenChange(false);
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md ds-shell">
          <DialogHeader>
            <DialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>
                {isEditing ? 'Editar projeto' : 'Adicionar projeto'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '12px 0' }}>
            {/* Número + Data on the same row */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
              <div>
                <label style={fieldLabel}>
                  Nº <span style={{ marginLeft: 2, color: 'hsl(var(--ds-danger))' }}>*</span>
                </label>
                <Input
                  value={draft.project_number}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, project_number: e.target.value }))
                  }
                  placeholder="Ex: 558"
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>
              <div>
                <label style={fieldLabel}>Data</label>
                <Input
                  type="date"
                  value={draft.project_date ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, project_date: e.target.value || null }))
                  }
                />
              </div>
            </div>

            <div>
              <label style={fieldLabel}>
                Nome do projeto <span style={{ marginLeft: 2, color: 'hsl(var(--ds-danger))' }}>*</span>
              </label>
              <Input
                value={draft.project_name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, project_name: e.target.value }))
                }
                placeholder="Ex: Lançamento Campanha Verão"
                maxLength={200}
              />
            </div>

            <div>
              <label style={fieldLabel}>
                Empresa <span style={{ marginLeft: 2, color: 'hsl(var(--ds-danger))' }}>*</span>
              </label>
              <Input
                value={draft.client_name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, client_name: e.target.value }))
                }
                placeholder="Ex: BrandX Cosmetics"
                maxLength={120}
              />
            </div>

            <div>
              <label style={fieldLabel}>Valor (R$)</label>
              <Input
                value={valueText}
                onChange={(e) => {
                  // Allow only digits, dot and comma; keep it lax — server-side cast does the rest.
                  const v = e.target.value.replace(/[^\d.,]/g, '');
                  setValueText(v);
                }}
                placeholder="Ex: 72250.00"
                inputMode="decimal"
              />
            </div>

            <div>
              <label style={fieldLabel}>Notas</label>
              <Textarea
                value={draft.notes ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, notes: e.target.value || null }))
                }
                placeholder="Opcional — qualquer coisa que precise lembrar sobre este projeto."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            {isEditing ? (
              <button
                type="button"
                className="btn"
                style={{ color: 'hsl(var(--ds-danger))', borderColor: 'hsl(var(--ds-danger) / 0.4)' }}
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isSaving}
              >
                <Trash2 size={13} strokeWidth={1.5} />
                <span>Remover</span>
              </button>
            ) : (
              <span />
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={handleSave}
                disabled={!valid || isSaving}
              >
                {isSaving && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />}
                <span>{isEditing ? 'Salvar' : 'Adicionar'}</span>
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a remover{' '}
              <strong>
                Nº {member?.project_number} · {member?.project_name}
              </strong>
              . Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{
                background: 'hsl(var(--ds-danger))',
                color: 'hsl(var(--ds-bg))',
                border: '1px solid hsl(var(--ds-danger))',
              }}
            >
              {remove.isPending ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                'Remover'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
