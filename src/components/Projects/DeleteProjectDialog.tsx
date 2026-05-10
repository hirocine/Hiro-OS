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
import { AlertTriangle } from 'lucide-react';

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onConfirm: () => void;
  loading?: boolean;
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm,
  loading = false,
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
          <AlertDialogTitle>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: 'hsl(var(--ds-danger))',
                fontFamily: '"HN Display", sans-serif',
              }}
            >
              <AlertTriangle size={18} strokeWidth={1.5} />
              <span>Excluir Projeto</span>
            </span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
              <p style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontSize: 14 }}>
                Esta ação é <strong>PERMANENTE</strong> e não pode ser desfeita.
              </p>

              <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>
                O projeto e todo seu histórico serão removidos definitivamente do sistema.
              </p>

              <div
                style={{
                  background: 'hsl(var(--ds-line-2) / 0.4)',
                  border: '1px solid hsl(var(--ds-line-1))',
                  padding: 12,
                }}
              >
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>
                  <strong style={{ color: 'hsl(var(--ds-fg-1))' }}>Projeto:</strong> {projectName}
                </p>
              </div>

              <div>
                <label htmlFor="confirmation" style={eyebrowStyle}>
                  Para confirmar, digite o nome do projeto
                </label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Digite o nome do projeto..."
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmed || loading}
            style={{
              background: 'hsl(var(--ds-danger))',
              color: '#fff',
              border: '1px solid hsl(var(--ds-danger))',
            }}
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
