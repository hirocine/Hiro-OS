import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

export function DraftRecoveryDialog({
  open,
  onOpenChange,
  draftData,
  draftUpdatedAt,
  currentStep,
  onContinue,
  onDiscard
}: DraftRecoveryDialogProps) {
  const projectName = draftData.projectNumber && draftData.company && draftData.projectName
    ? `${draftData.projectNumber} - ${draftData.company}: ${draftData.projectName}`
    : draftData.projectNumber || 'Rascunho sem título';

  const formattedDate = format(new Date(draftUpdatedAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Rascunho Encontrado
          </DialogTitle>
          <DialogDescription>
            Você tem um rascunho de retirada salvo. Deseja continuar de onde parou?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Projeto</p>
              <p className="font-medium">{projectName}</p>
            </div>
            
            {draftData.recordingType && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tipo de Gravação</p>
                <p className="font-medium">{draftData.recordingType}</p>
              </div>
            )}

            <div className="flex flex-col gap-1 text-sm text-muted-foreground pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Salvo em {formattedDate}</span>
              </div>
              <span className="ml-6">Passo {currentStep} • {draftData.selectedEquipment.length} equipamento(s)</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-x-0">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="w-full flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Descartar
          </Button>
          <Button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Continuar Rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
