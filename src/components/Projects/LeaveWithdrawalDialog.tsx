import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, LogOut, X } from 'lucide-react';

interface LeaveWithdrawalDialogProps {
  open: boolean;
  onSaveAndLeave: () => void;
  onLeaveWithoutSaving: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function LeaveWithdrawalDialog({
  open,
  onSaveAndLeave,
  onLeaveWithoutSaving,
  onCancel,
  isSaving = false
}: LeaveWithdrawalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5 text-primary" />
            Salvar rascunho?
          </DialogTitle>
          <DialogDescription>
            Você tem dados não salvos nesta retirada. O que deseja fazer?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <button
            type="button"
            className="btn primary"
            onClick={onSaveAndLeave}
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={isSaving}
          >
            <Save size={13} strokeWidth={1.5} />
            {isSaving ? 'Salvando...' : 'Salvar e Sair'}
          </button>

          <button
            type="button"
            className="btn"
            onClick={onLeaveWithoutSaving}
            style={{
              width: '100%',
              justifyContent: 'center',
              color: 'hsl(var(--ds-danger))',
              borderColor: 'hsl(var(--ds-danger) / 0.3)',
            }}
            disabled={isSaving}
          >
            <LogOut size={13} strokeWidth={1.5} />
            Sair sem Salvar
          </button>

          <button
            type="button"
            className="btn"
            onClick={onCancel}
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={isSaving}
          >
            <X size={13} strokeWidth={1.5} />
            Cancelar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
