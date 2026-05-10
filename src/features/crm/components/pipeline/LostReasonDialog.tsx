import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface LostReasonDialogProps {
  open: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function LostReasonDialog({ open, onConfirm, onCancel }: LostReasonDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: '"HN Display", sans-serif' }}>Motivo da Perda</DialogTitle>
        </DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-3))',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Por que este deal foi perdido?
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Descreva o motivo…"
              autoFocus
            />
          </div>
          <DialogFooter>
            <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
            <button
              type="button"
              className="btn primary"
              onClick={handleConfirm}
              disabled={!reason.trim()}
            >
              Confirmar
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
