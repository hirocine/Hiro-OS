import { useState } from 'react';
import { Trash2, Edit, Download, Tag, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Equipment } from '@/types/equipment';
import { enhancedToast } from '@/components/ui/enhanced-toast';

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
      console.error('Erro ao excluir equipamentos:', error);
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
      <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-lg border-primary/20 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              Limpar
            </Button>
          </div>

          <div className="h-6 border-l border-border" />

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkEdit(selectedItems)}
              className="h-8"
              disabled={selectedCount > 10} // Limit bulk edit to reasonable numbers
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkExport(selectedItems)}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        title="Excluir equipamentos selecionados"
        description={`Tem certeza que deseja excluir ${selectedCount} equipamento(s)? Esta ação não pode ser desfeita.`}
        confirmText={isLoading ? "Excluindo..." : "Excluir"}
        cancelText="Cancelar"
        variant="destructive"
      />
    </>
  );
}