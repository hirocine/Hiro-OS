import { useState } from 'react';
import { Trash2, Edit, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MobileOptimizedConfirmationDialog } from '@/components/ui/mobile-optimized-confirmation-dialog';
import { Equipment } from '@/types/equipment';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { logger } from '@/lib/logger';
import { useIsMobile } from '@/hooks/use-mobile';

interface BulkActionsBarProps {
  selectedItems: Equipment[];
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: (items: Equipment[]) => Promise<void>;
  onBulkEdit: (items: Equipment[]) => void;
  onBulkExport: (items: Equipment[]) => void;
}

export function BulkActionsBar({
  selectedItems,
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkEdit,
  onBulkExport
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
        description: `${selectedCount} equipamento(s) foram excluídos com sucesso.`
      });
    } catch (error) {
      logger.error('Error deleting equipment in bulk', {
        module: 'equipment',
        action: 'bulk_delete',
        error,
        data: { selectedCount, equipmentIds: selectedItems.map(item => item.id) }
      });
      enhancedToast.error({
        title: 'Erro na exclusão',
        description: 'Não foi possível excluir os equipamentos selecionados.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className={`fixed z-50 shadow-xl border-primary/20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 
        ${isMobile 
          ? 'bottom-4 left-4 right-4 rounded-2xl' 
          : 'bottom-6 left-1/2 transform -translate-x-1/2 rounded-xl'
        }`}
      >
        <div className={`flex items-center gap-3 ${isMobile ? 'p-4' : 'p-4'}`}>
          {/* Seção de informações */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant="secondary" className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {selectedCount} item{selectedCount !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "sm"}
              onClick={onClearSelection}
              className={`text-muted-foreground hover:text-foreground ${isMobile ? 'h-9 w-9 p-0' : 'h-8 px-2'}`}
            >
              {isMobile ? (
                <X className="h-4 w-4" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </>
              )}
            </Button>
          </div>

          {/* Divisor apenas no desktop */}
          {!isMobile && <div className="h-6 border-l border-border" />}

          {/* Ações */}
          <div className={`flex items-center gap-1 ${isMobile ? 'flex-wrap' : ''}`}>
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "sm"}
              onClick={() => onBulkEdit(selectedItems)}
              className={`${isMobile ? 'h-11 min-w-11 flex-col gap-1 text-xs' : 'h-8'}`}
              disabled={selectedCount > 10}
            >
              <Edit className="h-4 w-4" />
              {isMobile ? 'Editar' : <span className="ml-1">Editar</span>}
            </Button>

            <Button
              variant="ghost"
              size={isMobile ? "sm" : "sm"}
              onClick={() => onBulkExport(selectedItems)}
              className={`${isMobile ? 'h-11 min-w-11 flex-col gap-1 text-xs' : 'h-8'}`}
            >
              <Download className="h-4 w-4" />
              {isMobile ? 'Export' : <span className="ml-1">Exportar</span>}
            </Button>

            <Button
              variant="ghost"
              size={isMobile ? "sm" : "sm"}
              onClick={() => setIsDeleteDialogOpen(true)}
              className={`text-destructive hover:text-destructive hover:bg-destructive/10 
                ${isMobile ? 'h-11 min-w-11 flex-col gap-1 text-xs' : 'h-8'}`}
            >
              <Trash2 className="h-4 w-4" />
              {isMobile ? 'Excluir' : <span className="ml-1">Excluir</span>}
            </Button>
          </div>
        </div>
      </Card>

      <MobileOptimizedConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        title="Excluir equipamentos"
        description={`Tem certeza que deseja excluir ${selectedCount} equipamento(s)? Esta ação não pode ser desfeita.`}
        confirmText={isLoading ? "Excluindo..." : "Excluir"}
        cancelText="Cancelar"
        variant="destructive"
        icon="delete"
      />
    </>
  );
}