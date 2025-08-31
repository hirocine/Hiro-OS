import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm,
  loading = false
}: DeleteProjectDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmed = confirmationText === projectName;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setConfirmationText('');
    }
  };

  const handleCancel = () => {
    setConfirmationText('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Excluir Projeto</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            <div className="space-y-4">
              <p className="font-medium text-foreground">
                Esta ação é <strong>PERMANENTE</strong> e não pode ser desfeita.
              </p>
              
              <p>
                O projeto e todo seu histórico serão removidos definitivamente do sistema.
              </p>
              
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Projeto:</strong> {projectName}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  Para confirmar, digite o nome do projeto:
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Digite o nome do projeto..."
                  className="w-full"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmed || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}