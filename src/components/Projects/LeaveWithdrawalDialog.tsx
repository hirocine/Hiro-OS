import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
          <Button 
            onClick={onSaveAndLeave} 
            className="w-full flex items-center justify-center gap-2"
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar e Sair'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onLeaveWithoutSaving}
            className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20 hover:border-destructive/50"
            disabled={isSaving}
          >
            <LogOut className="h-4 w-4" />
            Sair sem Salvar
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-2"
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
