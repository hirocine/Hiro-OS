import { useState } from 'react';
import { useEquipment } from '@/hooks/useEquipment';
import { useUserRole } from '@/hooks/useUserRole';
import type { Equipment } from '@/types/equipment';
import { EquipmentHierarchyRow } from '@/components/Equipment/EquipmentHierarchyRow';
import { EquipmentFiltersComponent } from '@/components/Equipment/EquipmentFilters';
import { AddEquipmentDialog } from '@/components/Equipment/AddEquipmentDialog';
import { ImportDialog } from '@/components/Equipment/ImportDialog';
import { Button } from '@/components/ui/button';
import { Plus, Package, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminOnly } from '@/components/RoleGuard';
import { EmptyState } from '@/components/ui/empty-state';
import { StatsCardSkeleton, EquipmentCardSkeleton, FiltersSkeleton } from '@/components/ui/skeleton-loaders';

export default function Equipment() {
  const { 
    equipment, 
    equipmentHierarchy, 
    unlinkedAccessories, 
    filters, 
    setFilters, 
    addEquipment, 
    updateEquipment, 
    deleteEquipment, 
    importEquipment, 
    toggleEquipmentExpansion,
    getMainItems
  } = useEquipment();
  const { logAuditEntry } = useUserRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>();
  const { toast } = useToast();

  const handleAddEquipment = async (equipmentData: Omit<Equipment, 'id'>) => {
    addEquipment(equipmentData);
    await logAuditEntry('CREATE_EQUIPMENT', 'equipments', undefined, null, equipmentData);
    toast({
      title: "Equipamento adicionado",
      description: `${equipmentData.name} foi adicionado ao inventário.`,
    });
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setDialogOpen(true);
  };

  const handleUpdateEquipment = async (equipmentData: Omit<Equipment, 'id'>) => {
    if (editingEquipment) {
      updateEquipment(editingEquipment.id, equipmentData);
      await logAuditEntry('UPDATE_EQUIPMENT', 'equipments', editingEquipment.id, editingEquipment, equipmentData);
      setEditingEquipment(undefined);
      toast({
        title: "Equipamento atualizado",
        description: `${equipmentData.name} foi atualizado com sucesso.`,
      });
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    const equipmentToDelete = equipment.find(eq => eq.id === id);
    deleteEquipment(id);
    await logAuditEntry('DELETE_EQUIPMENT', 'equipments', id, equipmentToDelete, null);
    toast({
      title: "Equipamento removido",
      description: `${equipmentToDelete?.name} foi removido do inventário.`,
      variant: "destructive"
    });
  };

  const handleImageUpload = (equipmentId: string, file: File) => {
    // Create a URL for the uploaded file (in a real app, you'd upload to a server)
    const imageUrl = URL.createObjectURL(file);
    updateEquipment(equipmentId, { image: imageUrl });
    toast({
      title: "Imagem atualizada",
      description: "A imagem do equipamento foi atualizada com sucesso.",
    });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEquipment(undefined);
  };

  const handleImport = (importedEquipment: any[]) => {
    importEquipment(importedEquipment);
    setImportDialogOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Inventário</h1>
          <p className="text-muted-foreground">
            Gerencie todos os equipamentos do seu inventário
          </p>
        </div>
        <div className="flex gap-2">
          <AdminOnly>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" />
              Importar CSV/Excel
            </Button>
          </AdminOnly>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar Equipamento
          </Button>
        </div>
      </div>

      <EquipmentFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {equipmentHierarchy.length === 0 && unlinkedAccessories.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum equipamento encontrado"
          description={
            Object.keys(filters).length > 0 
              ? "Tente ajustar os filtros para encontrar equipamentos." 
              : "Comece adicionando seu primeiro equipamento ao inventário."
          }
          action={Object.keys(filters).length === 0 ? {
            label: "Adicionar Primeiro Equipamento",
            onClick: () => setDialogOpen(true)
          } : undefined}
        />
      ) : (
        <div className="bg-card rounded-lg border shadow">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
            <div className="col-span-1">Tipo</div>
            <div className="col-span-1">Imagem</div>
            <div className="col-span-1">Patrimônio</div>
            <div className="col-span-2">Nome</div>
            <div className="col-span-2">Marca/Modelo</div>
            <div className="col-span-1">Categoria</div>
            <div className="col-span-1">Serial</div>
            <div className="col-span-1">Valor</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Ações</div>
          </div>
          
          {/* Itens principais com acessórios */}
          {equipmentHierarchy.map((hierarchy) => (
            <EquipmentHierarchyRow
              key={hierarchy.item.id}
              equipment={hierarchy.item}
              accessories={hierarchy.accessories}
              onEdit={handleEditEquipment}
              onDelete={handleDeleteEquipment}
              onToggleExpansion={toggleEquipmentExpansion}
              onImageUpload={handleImageUpload}
            />
          ))}
          
          {/* Acessórios não vinculados */}
          {unlinkedAccessories.map((item) => (
            <EquipmentHierarchyRow
              key={item.id}
              equipment={item}
              onEdit={handleEditEquipment}
              onDelete={handleDeleteEquipment}
              onToggleExpansion={toggleEquipmentExpansion}
              onImageUpload={handleImageUpload}
            />
          ))}
        </div>
      )}

      <AddEquipmentDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={editingEquipment ? handleUpdateEquipment : handleAddEquipment}
        equipment={editingEquipment}
        mainItems={getMainItems()}
      />

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
      />
    </div>
  );
}