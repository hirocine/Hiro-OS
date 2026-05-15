import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { FileText, Clock, Trash2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WithdrawalDraftData } from '@/hooks/useWithdrawalDraft';

interface DraftRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftData: WithdrawalDraftData;
  draftUpdatedAt: string;
  currentStep: number;
  onContinue: () => void;
  onDiscard: () => void;
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 4,
};

export function DraftRecoveryDialog({
  open,
  onOpenChange,
  draftData,
  draftUpdatedAt,
  currentStep,
  onContinue,
  onDiscard,
}: DraftRecoveryDialogProps) {
  const projectName =
    draftData.projectNumber && draftData.company && draftData.projectName
      ? `${draftData.projectNumber} - ${draftData.company}: ${draftData.projectName}`
      : draftData.projectNumber || 'Rascunho sem título';

  const formattedDate = format(new Date(draftUpdatedAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md ds-shell"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: '"HN Display", sans-serif',
              }}
            >
              <FileText size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))' }} />
              Rascunho Encontrado
            </span>
          </DialogTitle>
          <DialogDescription>
            Você tem um rascunho de retirada salvo. Deseja continuar de onde parou?
          </DialogDescription>
        </DialogHeader>

        <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              padding: 14,
              background: 'hsl(var(--ds-line-2) / 0.3)',
              border: '1px solid hsl(var(--ds-line-1))',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div>
              <label style={eyebrowStyle}>Projeto</label>
              <p style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontSize: 13 }}>{projectName}</p>
            </div>

            {draftData.recordingType && (
              <div>
                <label style={eyebrowStyle}>Tipo de Gravação</label>
                <p style={{ fontWeight: 500, color: 'hsl(var(--ds-fg-1))', fontSize: 13 }}>
                  {draftData.recordingType}
                </p>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                fontSize: 12,
                color: 'hsl(var(--ds-fg-3))',
                paddingTop: 8,
                borderTop: '1px solid hsl(var(--ds-line-1))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>Salvo em {formattedDate}</span>
              </div>
              <span style={{ marginLeft: 20, fontVariantNumeric: 'tabular-nums' }}>
                Passo {currentStep} · {draftData.selectedEquipment.length} equipamento(s)
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-x-0">
          <button
            type="button"
            className="btn"
            onClick={onDiscard}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Trash2 size={13} strokeWidth={1.5} />
            <span>Descartar</span>
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={onContinue}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <ArrowRight size={13} strokeWidth={1.5} />
            <span>Continuar Rascunho</span>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
