import { useState } from 'react';
import { useEquipment } from '@/hooks/useEquipment';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import type { Equipment } from '@/types/equipment';
import { EquipmentHierarchyRow } from '@/components/Equipment/EquipmentHierarchyRow';
import { EquipmentFiltersComponent } from '@/components/Equipment/EquipmentFilters';
import { SortableHeader } from '@/components/Equipment/SortableHeader';
import { AddEquipmentDialog } from '@/components/Equipment/AddEquipmentDialog';
import { ImportDialog } from '@/components/Equipment/ImportDialog';
import { BulkImageUploadDialog } from '@/components/Equipment/BulkImageUploadDialog';
import { ConvertToAccessoryDialog } from '@/components/Equipment/ConvertToAccessoryDialog';
import { Button } from '@/components/ui/button';
import { Plus, Package, FileSpreadsheet, Images } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { enhancedToast } from '@/components/ui/enhanced-toast';
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
    stats,
    addEquipment, 
    updateEquipment, 
    deleteEquipment, 
    importEquipment, 
    toggleEquipmentExpansion,
    getMainItems,
    handleSort
  } = useEquipment();
  const { logAuditEntry } = useUserRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [bulkImageDialogOpen, setBulkImageDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>();
  const [convertingEquipment, setConvertingEquipment] = useState<Equipment | undefined>();
  const { toast } = useToast();

  const handleAddEquipment = async (equipmentData: Omit<Equipment, 'id'>) => {
    try {
      const result = await addEquipment(equipmentData);
      await logAuditEntry('CREATE_EQUIPMENT', 'equipments', undefined, null, equipmentData);
      return result;
    } catch (error) {
      console.error('Error adding equipment:', error);
      throw error;
    }
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setDialogOpen(true);
  };

  const handleUpdateEquipment = async (equipmentData: Omit<Equipment, 'id'>) => {
    if (editingEquipment) {
      try {
        const result = await updateEquipment(editingEquipment.id, equipmentData);
        await logAuditEntry('UPDATE_EQUIPMENT', 'equipments', editingEquipment.id, editingEquipment, equipmentData);
        setEditingEquipment(undefined);
        return result;
      } catch (error) {
        console.error('Error updating equipment:', error);
        throw error;
      }
    }
    return { success: false };
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

  const handleImageUpload = async (equipmentId: string, file: File) => {
    try {
      // Gerar um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${equipmentId}-${Date.now()}.${fileExt}`;
      const filePath = `equipment/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('equipment-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública da imagem
      const { data } = supabase.storage
        .from('equipment-images')
        .getPublicUrl(filePath);

      // Atualizar o equipamento com a nova URL da imagem
      await updateEquipment(equipmentId, { image: data.publicUrl });
      
      await logAuditEntry('UPDATE_EQUIPMENT_IMAGE', 'equipments', equipmentId, null, { image: data.publicUrl });
      
      toast({
        title: "Imagem atualizada",
        description: "A imagem do equipamento foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast({
        title: "Erro ao atualizar imagem",
        description: "Ocorreu um erro ao fazer upload da imagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEquipment(undefined);
  };

  const handleImport = (importedEquipment: any[]) => {
    importEquipment(importedEquipment);
    setImportDialogOpen(false);
  };

  const handleConvertToAccessory = async (equipmentId: string, parentId: string) => {
    try {
      const result = await updateEquipment(equipmentId, {
        itemType: 'accessory',
        parentId: parentId
      });

      if (result?.success) {
        enhancedToast.success({
          title: 'Item convertido',
          description: 'O item foi convertido para acessório com sucesso.'
        });
      }

      return result;
    } catch (error) {
      console.error('Error converting to accessory:', error);
      enhancedToast.error({
        title: 'Erro na conversão',
        description: 'Ocorreu um erro ao converter o item.'
      });
      return { success: false };
    }
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
            <Button variant="outline" onClick={() => setBulkImageDialogOpen(true)}>
              <Images className="h-4 w-4" />
              Upload de Imagens
            </Button>
          </AdminOnly>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Adicionar Equipamento
          </Button>
        </div>
      </div>

      <EquipmentFiltersComponent filters={filters} onFiltersChange={setFilters} stats={stats} />

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
          <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-sm items-center">
            <div className="col-span-1 font-medium">Tipo</div>
            <div className="col-span-1 font-medium">Imagem</div>
            <div className="col-span-1">
              <SortableHeader
                field="patrimonyNumber"
                label="Patrimônio"
                currentSortBy={filters.sortBy}
                currentSortOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-3">
              <SortableHeader
                field="name"
                label="Nome"
                currentSortBy={filters.sortBy}
                currentSortOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-1">
              <SortableHeader
                field="brand"
                label="Marca/Modelo"
                currentSortBy={filters.sortBy}
                currentSortOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-1">
              <SortableHeader
                field="category"
                label="Categoria"
                currentSortBy={filters.sortBy}
                currentSortOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-1">
              <SortableHeader
                field="subcategory"
                label="Subcategoria"
                currentSortBy={filters.sortBy}
                currentSortOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-1">
              <SortableHeader
                field="value"
                label="Valor"
                currentSortBy={filters.sortBy}
                currentSortOrder={filters.sortOrder}
                onSort={handleSort}
              />
            </div>
            <div className="col-span-2 font-medium">Ações</div>
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
               onConvertToAccessory={(equipment) => {
                 setConvertingEquipment(equipment);
                 setConvertDialogOpen(true);
               }}
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
               onConvertToAccessory={(equipment) => {
                 setConvertingEquipment(equipment);
                 setConvertDialogOpen(true);
               }}
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

      <BulkImageUploadDialog
        open={bulkImageDialogOpen}
        onOpenChange={setBulkImageDialogOpen}
        onComplete={() => {
          // Recarregar equipamentos após upload
          window.location.reload();
        }}
        equipments={equipment}
      />

      {convertingEquipment && (
        <ConvertToAccessoryDialog
          open={convertDialogOpen}
          onOpenChange={(open) => {
            setConvertDialogOpen(open);
            if (!open) setConvertingEquipment(undefined);
          }}
          equipment={convertingEquipment}
          mainItems={getMainItems()}
          onConvert={handleConvertToAccessory}
        />
      )}
    </div>
  );
}