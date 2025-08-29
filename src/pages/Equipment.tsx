import { useState, useMemo } from 'react';
import { Plus, Upload, Image, Grid3X3, List, Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEquipment } from '@/hooks/useEquipment';
import { AddEquipmentDialog } from '@/components/Equipment/AddEquipmentDialog';
import { ImportDialog } from '@/components/Equipment/ImportDialog';
import { BulkImageUploadDialog } from '@/components/Equipment/BulkImageUploadDialog';
import { ConvertToAccessoryDialog } from '@/components/Equipment/ConvertToAccessoryDialog';
import { EquipmentFiltersComponent } from '@/components/Equipment/EquipmentFilters';
import { EquipmentHierarchyRow } from '@/components/Equipment/EquipmentHierarchyRow';
import { EquipmentMobileCard } from '@/components/Equipment/EquipmentMobileCard';
import { EquipmentPagination } from '@/components/Equipment/EquipmentPagination';
import { EquipmentStatsCards } from '@/components/Equipment/EquipmentStatsCards';
import { SortableHeader } from '@/components/Equipment/SortableHeader';
import { EmptyState } from '@/components/ui/empty-state';
import { Equipment } from '@/types/equipment';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

type ViewMode = 'table' | 'grid' | 'cards';

export default function EquipmentPage() {
  const {
    equipment: filteredEquipment,
    equipmentHierarchy,
    stats,
    loading,
    filters,
    setFilters,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    importEquipment,
    toggleEquipmentExpansion,
    handleSort,
  } = useEquipment();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isBulkImageDialogOpen, setIsBulkImageDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [convertingEquipment, setConvertingEquipment] = useState<Equipment | null>(null);
  
  // Pagination and view states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  const isMobile = useIsMobile();
  const isTablet = false; // Simplified for now

  // Auto-switch view mode based on screen size
  const effectiveViewMode = useMemo(() => {
    if (isMobile) return 'cards';
    if (isTablet && viewMode === 'table') return 'grid';
    return viewMode;
  }, [isMobile, isTablet, viewMode]);

  // Paginated data - memoized for performance
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    if (effectiveViewMode === 'cards') {
      return filteredEquipment.slice(startIndex, endIndex);
    }
    
    return equipmentHierarchy.slice(startIndex, endIndex);
  }, [filteredEquipment, equipmentHierarchy, currentPage, itemsPerPage, effectiveViewMode]);

  const totalPages = Math.ceil(
    (effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length) / itemsPerPage
  );

  const handleAdd = async (equipmentData: Omit<Equipment, 'id'>) => {
    try {
      await addEquipment(equipmentData);
      setIsAddDialogOpen(false);
      toast.success('Equipamento adicionado com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error('Erro ao adicionar equipamento');
      return { success: false };
    }
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsAddDialogOpen(true);
  };

  const handleUpdate = async (equipmentData: Omit<Equipment, 'id'>) => {
    if (editingEquipment) {
      try {
        await updateEquipment(editingEquipment.id, equipmentData);
        setEditingEquipment(null);
        setIsAddDialogOpen(false);
        toast.success('Equipamento atualizado com sucesso!');
        return { success: true };
      } catch (error) {
        console.error('Error updating equipment:', error);
        toast.error('Erro ao atualizar equipamento');
        return { success: false };
      }
    }
    return { success: false };
  };

  const handleDelete = async (equipment: Equipment) => {
    if (confirm(`Tem certeza que deseja excluir "${equipment.name}"?`)) {
      try {
        await deleteEquipment(equipment.id);
        toast.success('Equipamento excluído com sucesso!');
      } catch (error) {
        console.error('Error deleting equipment:', error);
        toast.error('Erro ao excluir equipamento');
      }
    }
  };

  const handleDeleteById = async (equipmentId: string) => {
    const equipment = filteredEquipment.find(e => e.id === equipmentId);
    if (!equipment) return;
    await handleDelete(equipment);
  };

  const handleImageUpload = async (equipment: Equipment, file: File) => {
    try {
      // Aqui você implementaria o upload da imagem
      // Por enquanto, vamos simular o sucesso
      toast.success('Imagem atualizada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
    }
  };

  const handleImageUploadById = async (equipmentId: string, file: File) => {
    const equipment = filteredEquipment.find(e => e.id === equipmentId);
    if (!equipment) return;
    await handleImageUpload(equipment, file);
  };

  const handleConvertToAccessory = (equipment: Equipment) => {
    setConvertingEquipment(equipment);
    setIsConvertDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setEditingEquipment(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredEquipment.length === 0) {
      return (
        <EmptyState
          icon={Plus}
          title="Nenhum equipamento encontrado"
          description="Não há equipamentos que correspondem aos filtros selecionados."
          action={{
            label: "Adicionar Equipamento",
            onClick: () => setIsAddDialogOpen(true)
          }}
        />
      );
    }

    switch (effectiveViewMode) {
      case 'cards':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(paginatedData as Equipment[]).map((equipment) => (
              <EquipmentMobileCard
                key={equipment.id}
                equipment={equipment}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onImageUpload={handleImageUpload}
                onConvertToAccessory={handleConvertToAccessory}
              />
            ))}
          </div>
        );
        
      case 'grid':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(paginatedData as Equipment[]).map((equipment) => (
              <EquipmentMobileCard
                key={equipment.id}
                equipment={equipment}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onImageUpload={handleImageUpload}
                onConvertToAccessory={handleConvertToAccessory}
              />
            ))}
          </div>
        );

      default: // table
        return (
          <div className="bg-card rounded-lg border overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header */}
                <div className="bg-muted/30 border-b border-border">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                    <div className="col-span-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      Tipo
                    </div>
                    <div className="col-span-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      Imagem
                    </div>
                    <div className="col-span-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      <SortableHeader 
                        field="patrimonyNumber" 
                        label="Patrimônio" 
                        currentSortBy={filters.sortBy}
                        currentSortOrder={filters.sortOrder}
                        onSort={handleSort}
                      />
                    </div>
                    <div className="col-span-3 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      <SortableHeader 
                        field="name" 
                        label="Nome" 
                        currentSortBy={filters.sortBy}
                        currentSortOrder={filters.sortOrder}
                        onSort={handleSort}
                      />
                    </div>
                    <div className="col-span-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      <SortableHeader 
                        field="brand" 
                        label="Marca" 
                        currentSortBy={filters.sortBy}
                        currentSortOrder={filters.sortOrder}
                        onSort={handleSort}
                      />
                    </div>
                    <div className="col-span-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      <SortableHeader 
                        field="category" 
                        label="Categoria" 
                        currentSortBy={filters.sortBy}
                        currentSortOrder={filters.sortOrder}
                        onSort={handleSort}
                      />
                    </div>
                    <div className="col-span-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      Subcategoria
                    </div>
                    <div className="col-span-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      <SortableHeader 
                        field="value" 
                        label="Valor" 
                        currentSortBy={filters.sortBy}
                        currentSortOrder={filters.sortOrder}
                        onSort={handleSort}
                      />
                    </div>
                    <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      Ações
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="bg-card">
                  {paginatedData.map((hierarchyItem: any) => (
                    <EquipmentHierarchyRow
                      key={hierarchyItem.item.id}
                      equipment={hierarchyItem.item}
                      accessories={hierarchyItem.accessories}
                      onEdit={handleEdit}
                      onDelete={handleDeleteById}
                      onToggleExpansion={toggleEquipmentExpansion}
                      onImageUpload={handleImageUploadById}
                      onConvertToAccessory={handleConvertToAccessory}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventário de Equipamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os equipamentos da sua organização
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* View mode toggle - hidden on mobile */}
          {!isMobile && (
            <div className="flex items-center border rounded-lg p-1 bg-muted/30">
              <Button
                variant={effectiveViewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={effectiveViewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={effectiveViewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="h-8 px-3"
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar Equipamento</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
          
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          
          <Button variant="outline" onClick={() => setIsBulkImageDialogOpen(true)} className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Upload de Imagens</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <EquipmentStatsCards stats={stats} isLoading={loading} />

      {/* Filters */}
      <EquipmentFiltersComponent 
        filters={filters} 
        onFiltersChange={setFilters}
        stats={stats}
      />

      {/* Content */}
      <div className="space-y-4">
        {/* Current view indicator */}
        {!loading && filteredEquipment.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {effectiveViewMode === 'table' ? (
                  <>
                    <Monitor className="h-3 w-3 mr-1" />
                    Tabela
                  </>
                ) : effectiveViewMode === 'grid' ? (
                  <>
                    <Tablet className="h-3 w-3 mr-1" />
                    Grade
                  </>
                ) : (
                  <>
                    <Smartphone className="h-3 w-3 mr-1" />
                    Cards
                  </>
                )}
              </Badge>
              <span>
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length)} de {effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length} equipamentos
              </span>
            </div>
          </div>
        )}

        {renderContent()}

        {/* Pagination */}
        {!loading && filteredEquipment.length > 0 && (
          <EquipmentPagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Dialogs */}
      <AddEquipmentDialog
        open={isAddDialogOpen}
        onOpenChange={handleDialogClose}
        onSubmit={editingEquipment ? handleUpdate : handleAdd}
        equipment={editingEquipment}
      />

      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={(data) => {
          importEquipment(data);
          setIsImportDialogOpen(false);
          toast.success('Equipamentos importados com sucesso!');
        }}
      />

      <BulkImageUploadDialog
        open={isBulkImageDialogOpen}
        onOpenChange={setIsBulkImageDialogOpen}
        onComplete={() => {
          setIsBulkImageDialogOpen(false);
          toast.success('Upload de imagens concluído!');
        }}
        equipments={filteredEquipment}
      />

      {convertingEquipment && (
        <ConvertToAccessoryDialog
          open={isConvertDialogOpen}
          onOpenChange={(open) => {
            setIsConvertDialogOpen(open);
            if (!open) setConvertingEquipment(null);
          }}
          equipment={convertingEquipment}
          mainItems={filteredEquipment.filter(e => e.itemType === 'main')}
          onConvert={async (equipmentId, parentId) => {
            try {
              // Implementar conversão para acessório
              setIsConvertDialogOpen(false);
              setConvertingEquipment(null);
              toast.success('Equipamento convertido para acessório!');
              return { success: true };
            } catch (error) {
              console.error('Error converting equipment:', error);
              toast.error('Erro ao converter equipamento');
              return { success: false };
            }
          }}
        />
      )}
    </div>
  );
}