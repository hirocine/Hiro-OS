import { useState, useEffect } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
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

const UNDO_TIMEOUT = 30;

export function UndoDeleteDialog({ open, onOpenChange, deletedEquipment, onRestore }: UndoDeleteDialogProps) {
  const [timeLeft, setTimeLeft] = useState(UNDO_TIMEOUT);
  const [restoring, setRestoring] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open || !deletedEquipment) return;

    const elapsed = Math.floor((Date.now() - deletedEquipment.deletedAt.getTime()) / 1000);
    const remaining = Math.max(0, UNDO_TIMEOUT - elapsed);

    setTimeLeft(remaining);

    if (remaining <= 0) {
      onOpenChange(false);
      return;
    }

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
        data: { equipmentId: deletedEquipment.id, equipmentName: deletedEquipment.name },
      });

      await onRestore(deletedEquipment.id);

      toast({
        title: 'Equipamento Restaurado',
        description: `${deletedEquipment.name} foi restaurado com sucesso`,
      });

      onOpenChange(false);
    } catch (error) {
      logger.error('Error restoring equipment', { module: 'equipment', error });
      toast({
        title: 'Erro ao Restaurar',
        description: 'Não foi possível restaurar o equipamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  const progressPercentage = (timeLeft / UNDO_TIMEOUT) * 100;

  if (!deletedEquipment) return null;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={`ds-shell ${isMobile ? '' : 'max-w-md'}`}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: '"HN Display", sans-serif',
              }}
            >
              <RotateCcw size={18} strokeWidth={1.5} />
              Desfazer Exclusão
            </span>
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'hsl(var(--ds-fg-3))' }}>
                <Clock size={13} strokeWidth={1.5} />
                Tempo restante
              </span>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--ds-fg-1))' }}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div style={{ height: 4, background: 'hsl(var(--ds-line-2))', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPercentage}%`,
                  background: 'hsl(var(--ds-accent))',
                  transition: 'width 1s linear',
                }}
              />
            </div>
          </div>

          <div
            style={{
              border: '1px solid hsl(var(--ds-line-1))',
              background: 'hsl(var(--ds-surface))',
              padding: 14,
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 10 }}>
              <Package size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))', marginTop: 2 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h4 style={{ fontSize: 14, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                  {deletedEquipment.name}
                </h4>
                <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))' }}>
                  {deletedEquipment.brand} • {deletedEquipment.category}
                </p>
                {deletedEquipment.patrimony_number && (
                  <span className="pill muted" style={{ fontSize: 10, alignSelf: 'flex-start' }}>
                    #{deletedEquipment.patrimony_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          {deletedEquipment.canRestore ? (
            <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', lineHeight: 1.5 }}>
              Este equipamento pode ser restaurado. Clique em "Desfazer" para cancelar a exclusão.
            </p>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: 12,
                background: 'hsl(var(--ds-danger) / 0.08)',
                border: '1px solid hsl(var(--ds-danger) / 0.2)',
              }}
            >
              <AlertTriangle size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-danger))', marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontSize: 12 }}>
                <p style={{ fontWeight: 500, color: 'hsl(var(--ds-danger))' }}>Não é possível restaurar</p>
                <p style={{ color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                  Este equipamento possui dependências que impedem a restauração.
                </p>
              </div>
            </div>
          )}
        </div>

        <ResponsiveDialogFooter>
          <MobileFriendlyFormActions>
            <button type="button" className="btn" onClick={() => onOpenChange(false)}>
              Fechar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleRestore}
              disabled={!deletedEquipment.canRestore || restoring || timeLeft <= 0}
            >
              {restoring ? (
                <>
                  <div
                    className="animate-spin"
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }}
                  />
                  <span>Restaurando…</span>
                </>
              ) : (
                <>
                  <RotateCcw size={14} strokeWidth={1.5} />
                  <span>Desfazer</span>
                </>
              )}
            </button>
          </MobileFriendlyFormActions>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
