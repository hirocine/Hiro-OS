import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlatformAccessCard } from './PlatformAccessCard';
import { PlatformAccessDialog } from './PlatformAccessDialog';
import { PlatformFilters } from './PlatformFilters';
import { BulkAddPlatformAccesses } from './BulkAddPlatformAccesses';
import { usePlatformAccesses } from '../hooks/usePlatformAccesses';
import type { PlatformAccess } from '../types';
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

export function PlatformAccessGrid() {
  const {
    accesses,
    stats,
    filters,
    setFilters,
    loading,
    addAccess,
    updateAccess,
    deleteAccess,
    copyPassword,
    copyUsername,
    getPassword,
    toggleFavorite,
  } = usePlatformAccesses();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<PlatformAccess | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accessToDelete, setAccessToDelete] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingAccess(null);
    setDialogOpen(true);
  };

  const handleEdit = (access: PlatformAccess) => {
    setEditingAccess(access);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setAccessToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (accessToDelete) {
      await deleteAccess(accessToDelete);
      setDeleteDialogOpen(false);
      setAccessToDelete(null);
    }
  };

  const handleSubmit = async (data: any) => {
    if (editingAccess) {
      await updateAccess({ id: editingAccess.id, updates: data });
    } else {
      await addAccess(data);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BulkAddPlatformAccesses />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Acessos de Plataformas</h2>
          <p className="text-muted-foreground">
            Gerencie suas credenciais de forma segura
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Acesso
        </Button>
      </div>

      {/* Filters */}
      <PlatformFilters
        filters={filters}
        onFiltersChange={setFilters}
        stats={stats}
      />

      {/* Grid */}
      {accesses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Plus className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Nenhum acesso encontrado</h3>
              <p className="text-muted-foreground mt-1">
                {filters.search || filters.category !== 'all' || filters.favorites
                  ? 'Tente ajustar os filtros'
                  : 'Comece adicionando seu primeiro acesso de plataforma'}
              </p>
            </div>
            {!filters.search && filters.category === 'all' && !filters.favorites && (
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Acesso
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {accesses.map((access) => (
            <PlatformAccessCard
              key={access.id}
              access={access}
              onEdit={handleEdit}
              onToggleFavorite={toggleFavorite}
              onCopyPassword={copyPassword}
              onCopyUsername={copyUsername}
              onGetPassword={getPassword}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <PlatformAccessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        editingAccess={editingAccess}
        getPassword={getPassword}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este acesso? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
