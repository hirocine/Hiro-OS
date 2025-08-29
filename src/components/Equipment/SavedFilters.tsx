import { useState } from 'react';
import { Save, BookOpen, Edit2, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { EquipmentFilters } from '@/types/equipment';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { useFilterHistory } from '@/hooks/useFilterHistory';
import { enhancedToast } from '@/components/ui/enhanced-toast';

interface SavedFiltersProps {
  currentFilters: EquipmentFilters;
  onFiltersChange: (filters: EquipmentFilters) => void;
}

export function SavedFilters({ currentFilters, onFiltersChange }: SavedFiltersProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [editingFilter, setEditingFilter] = useState<string | null>(null);
  const [deletingFilter, setDeletingFilter] = useState<string | null>(null);

  const { savedFilters, loading, saveFilter, updateFilter, deleteFilter } = useSavedFilters();
  const { history, getFilterDisplayName } = useFilterHistory();

  const hasActiveFilters = Object.keys(currentFilters).some(key => {
    const value = currentFilters[key as keyof EquipmentFilters];
    return value !== undefined && value !== null && value !== '';
  });

  const handleSaveFilter = async () => {
    if (!filterName.trim() || !hasActiveFilters) return;

    try {
      await saveFilter(filterName.trim(), currentFilters);
      setFilterName('');
      setSaveDialogOpen(false);
      enhancedToast.success({
        title: 'Filtro salvo!',
        description: `Filtro "${filterName}" foi salvo com sucesso.`
      });
    } catch (error) {
      enhancedToast.error({
        title: 'Erro ao salvar filtro',
        description: 'Não foi possível salvar o filtro.'
      });
    }
  };

  const handleEditFilter = async () => {
    if (!editingFilter || !filterName.trim()) return;

    try {
      await updateFilter(editingFilter, filterName.trim(), currentFilters);
      setFilterName('');
      setEditingFilter(null);
      setEditDialogOpen(false);
      enhancedToast.success({
        title: 'Filtro atualizado!',
        description: `Filtro "${filterName}" foi atualizado com sucesso.`
      });
    } catch (error) {
      enhancedToast.error({
        title: 'Erro ao atualizar filtro',
        description: 'Não foi possível atualizar o filtro.'
      });
    }
  };

  const handleDeleteFilter = async () => {
    if (!deletingFilter) return;

    try {
      await deleteFilter(deletingFilter);
      setDeletingFilter(null);
      setDeleteDialogOpen(false);
      enhancedToast.success({
        title: 'Filtro removido!',
        description: 'Filtro foi removido com sucesso.'
      });
    } catch (error) {
      enhancedToast.error({
        title: 'Erro ao remover filtro',
        description: 'Não foi possível remover o filtro.'
      });
    }
  };

  const startEdit = (filterId: string, currentName: string) => {
    setEditingFilter(filterId);
    setFilterName(currentName);
    setEditDialogOpen(true);
  };

  const startDelete = (filterId: string) => {
    setDeletingFilter(filterId);
    setDeleteDialogOpen(true);
  };

  const applyFilter = (filters: EquipmentFilters) => {
    onFiltersChange(filters);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Botão Salvar Filtro */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasActiveFilters}
            className="flex items-center gap-2"
          >
            <Save className="h-3 w-3" />
            Salvar Filtro
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Filtro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-name">Nome do Filtro</Label>
              <Input
                id="filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Digite um nome para o filtro..."
                className="mt-1"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Filtros atuais:</strong> {getFilterDisplayName(currentFilters)}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveFilter} disabled={!filterName.trim() || loading}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dropdown com Filtros Salvos e Histórico */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <BookOpen className="h-3 w-3" />
            Filtros
            {(savedFilters.length > 0 || history.length > 0) && (
              <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                {savedFilters.length + history.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
          {/* Filtros Salvos */}
          {savedFilters.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Filtros Salvos
              </div>
              {savedFilters.map((filter) => (
                <div key={filter.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start h-auto p-1"
                    onClick={() => applyFilter(filter.filters)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{filter.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(filter.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => startEdit(filter.id, filter.name)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => startDelete(filter.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {history.length > 0 && <DropdownMenuSeparator />}
            </>
          )}

          {/* Histórico */}
          {history.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Filtros Recentes
              </div>
              {history.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => applyFilter(item.filters)}
                >
                  <div className="flex-1">
                    <div className="text-sm">{getFilterDisplayName(item.filters)}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(item.timestamp), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}

          {savedFilters.length === 0 && history.length === 0 && (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nenhum filtro salvo ou usado recentemente
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Filtro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-filter-name">Nome do Filtro</Label>
              <Input
                id="edit-filter-name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Digite um nome para o filtro..."
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditFilter} disabled={!filterName.trim() || loading}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Filtro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja remover este filtro salvo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFilter} disabled={loading}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}