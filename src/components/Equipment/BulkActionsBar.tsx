import { useState } from 'react';
import { Trash2, Edit, Download, X } from 'lucide-react';
import { MobileOptimizedConfirmationDialog } from '@/components/ui/mobile-optimized-confirmation-dialog';
import { Equipment } from '@/types/equipment';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';
import { StatusPill } from '@/ds/components/StatusPill';

interface BulkActionsBarProps {
  selectedItems: Equipment[];
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: (items: Equipment[]) => Promise<void>;
  onBulkEdit: (items: Equipment[]) => void;
  onBulkExport: (items: Equipment[]) => void;
}

const actionBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 10px',
  height: 30,
  fontSize: 12,
  fontWeight: 500,
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  color: 'hsl(var(--ds-fg-2))',
  transition: 'background 0.15s, color 0.15s',
};

export function BulkActionsBar({
  selectedItems,
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkEdit,
  onBulkExport,
}: BulkActionsBarProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  if (selectedCount === 0) return null;

  const handleBulkDelete = async () => {
    try {
      setIsLoading(true);
      await onBulkDelete(selectedItems);
      setIsDeleteDialogOpen(false);
      onClearSelection();

      enhancedToast.success({
        title: 'Equipamentos excluídos',
        description: `${selectedCount} equipamento(s) foram excluídos com sucesso.`,
      });
    } catch (error) {
      logger.error('Error deleting equipment in bulk', {
        module: 'equipment',
        action: 'bulk_delete',
        error,
        data: { selectedCount, equipmentIds: selectedItems.map((item) => item.id) },
      });
      enhancedToast.error({
        title: 'Erro na exclusão',
        description: 'Não foi possível excluir os equipamentos selecionados.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          zIndex: 50,
          background: 'hsl(var(--ds-surface))',
          border: '1px solid hsl(var(--ds-line-1))',
          boxShadow: '0 12px 32px hsl(0 0% 0% / 0.15)',
          backdropFilter: 'blur(12px)',
          ...(isMobile
            ? { bottom: 16, left: 16, right: 16 }
            : { bottom: 24, left: '50%', transform: 'translateX(-50%)' }),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <StatusPill label={`${selectedCount} item${selectedCount !== 1 ? 's' : ''}`} tone="muted" />
            <button
              type="button"
              onClick={onClearSelection}
              style={{ ...actionBtn, color: 'hsl(var(--ds-fg-3))' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'hsl(var(--ds-fg-1))';
                e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'hsl(var(--ds-fg-3))';
                e.currentTarget.style.background = 'transparent';
              }}
              aria-label="Limpar seleção"
            >
              <X size={13} strokeWidth={1.5} />
              {!isMobile && <span>Limpar</span>}
            </button>
          </div>

          {!isMobile && (
            <div style={{ height: 20, borderLeft: '1px solid hsl(var(--ds-line-2))' }} />
          )}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: isMobile ? 'wrap' : undefined }}>
            <button
              type="button"
              onClick={() => onBulkEdit(selectedItems)}
              disabled={selectedCount > 10}
              style={{ ...actionBtn, opacity: selectedCount > 10 ? 0.4 : 1 }}
              onMouseEnter={(e) => {
                if (selectedCount <= 10) e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Edit size={13} strokeWidth={1.5} />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={() => onBulkExport(selectedItems)}
              style={actionBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Download size={13} strokeWidth={1.5} />
              <span>Exportar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              style={{ ...actionBtn, color: 'hsl(var(--ds-danger))' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsl(var(--ds-danger) / 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Trash2 size={13} strokeWidth={1.5} />
              <span>Excluir</span>
            </button>
          </div>
        </div>
      </div>

      <MobileOptimizedConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        title="Excluir equipamentos"
        description={`Tem certeza que deseja excluir ${selectedCount} equipamento(s)? Esta ação não pode ser desfeita.`}
        confirmText={isLoading ? 'Excluindo...' : 'Excluir'}
        cancelText="Cancelar"
        variant="destructive"
        icon="delete"
      />
    </>
  );
}
