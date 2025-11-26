import { useState, useEffect } from 'react';
import { 
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RotateCcw, Clock, Package, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { MobileFriendlyFormActions } from '@/components/ui/mobile-friendly-form';
import { useIsMobile } from '@/hooks/use-mobile';

interface DeletedEquipment {
  id: string;
  name: string;
  brand: string;
  category: string;
  patrimony_number?: string;
  deletedAt: Date;
  canRestore: boolean;
}

interface UndoDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deletedEquipment: DeletedEquipment | null;
  onRestore: (equipmentId: string) => Promise<void>;
}

const UNDO_TIMEOUT = 30; // 30 segundos para desfazer

export function UndoDeleteDialog({ open, onOpenChange, deletedEquipment, onRestore }: UndoDeleteDialogProps) {
  const [timeLeft, setTimeLeft] = useState(UNDO_TIMEOUT);
  const [restoring, setRestoring] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open || !deletedEquipment) return;

    // Calcular o tempo restante baseado na data de exclusão
    const elapsed = Math.floor((Date.now() - deletedEquipment.deletedAt.getTime()) / 1000);
    const remaining = Math.max(0, UNDO_TIMEOUT - elapsed);
    
    setTimeLeft(remaining);

    // Se o tempo já expirou, fechar o diálogo
    if (remaining <= 0) {
      onOpenChange(false);
      return;
    }

    // Configurar timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onOpenChange(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, deletedEquipment, onOpenChange]);

  const handleRestore = async () => {
    if (!deletedEquipment) return;

    setRestoring(true);
    try {
      logger.debug('Restoring deleted equipment', { 
        module: 'equipment',
        data: {
          equipmentId: deletedEquipment.id,
          equipmentName: deletedEquipment.name 
        }
      });

      await onRestore(deletedEquipment.id);
      
      toast({
        title: "Equipamento Restaurado",
        description: `${deletedEquipment.name} foi restaurado com sucesso`,
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('Error restoring equipment', { 
        module: 'equipment',
        error 
      });
      toast({
        title: "Erro ao Restaurar",
        description: "Não foi possível restaurar o equipamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setRestoring(false);
    }
  };

  const progressPercentage = (timeLeft / UNDO_TIMEOUT) * 100;

  if (!deletedEquipment) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={isMobile ? "" : "max-w-md"}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Desfazer Exclusão
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          {/* Timer Visual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Tempo restante
              </span>
              <span className="font-mono font-medium">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          </div>

          {/* Informações do Equipamento */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h4 className="font-medium">{deletedEquipment.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {deletedEquipment.brand} • {deletedEquipment.category}
                  </p>
                  {deletedEquipment.patrimony_number && (
                    <Badge variant="outline" className="text-xs">
                      #{deletedEquipment.patrimony_number}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status de Restauração */}
          {deletedEquipment.canRestore ? (
            <div className="text-sm text-muted-foreground">
              <p>Este equipamento pode ser restaurado. Clique em "Desfazer" para cancelar a exclusão.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Não é possível restaurar</p>
                <p className="text-muted-foreground">
                  Este equipamento possui dependências que impedem a restauração.
                </p>
              </div>
            </div>
          )}
        </div>

        <ResponsiveDialogFooter>
          <MobileFriendlyFormActions>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button 
              onClick={handleRestore}
              disabled={!deletedEquipment.canRestore || restoring || timeLeft <= 0}
              className="gap-2"
            >
              {restoring ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Desfazer
                </>
              )}
            </Button>
          </MobileFriendlyFormActions>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}