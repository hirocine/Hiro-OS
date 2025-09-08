import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Upload, Grid3X3, List, Monitor, Tablet, Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { ResponsiveButton } from '@/components/ui/responsive-button';
import { usePageLayout } from '@/hooks/usePageLayout';
import { useEquipment } from '@/hooks/useEquipment';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { AddEquipmentDialog } from '@/components/Equipment/AddEquipmentDialog';
import { ImportDialog } from '@/components/Equipment/ImportDialog';
import { ConvertToAccessoryDialog } from '@/components/Equipment/ConvertToAccessoryDialog';
import { UnifiedEquipmentFilters } from '@/components/Equipment/UnifiedEquipmentFilters';
import { EquipmentHierarchyRow } from '@/components/Equipment/EquipmentHierarchyRow';
import { EquipmentMobileCard } from '@/components/Equipment/EquipmentMobileCard';
import { SelectableEquipmentCard } from '@/components/Equipment/SelectableEquipmentCard';
import { BulkActionsBar } from '@/components/Equipment/BulkActionsBar';
import { EquipmentPagination } from '@/components/Equipment/EquipmentPagination';
import { EquipmentStatsCards } from '@/components/Equipment/EquipmentStatsCards';
import { SortableHeader } from '@/components/Equipment/SortableHeader';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Equipment } from '@/types/equipment';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { equipmentDebug } from '@/lib/debug';
import { UndoDeleteDialog } from '@/components/Equipment/UndoDeleteDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { logger } from '@/lib/logger';

import { AdminOnly } from '@/components/RoleGuard';
import { useEquipmentProjects } from '@/hooks/useEquipmentProjects';

type ViewMode = 'table' | 'grid' | 'cards';

export default function EquipmentPage() {
  const {
    equipment: filteredEquipment,
    allEquipment,
    equipmentHierarchy,
    stats,
    loading,
    filters,
    setFilters,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    convertToAccessory,
    importEquipment,
    toggleEquipmentExpansion,
    handleSort,
  } = useEquipment();

  console.log('🏠 [EquipmentPage] Renderizando com dados:', {
    filteredEquipmentLength: filteredEquipment.length,
    allEquipmentLength: allEquipment.length,
    loading,
    hasStats: !!stats,
    statsTotal: stats?.total || 0
  });

  // Initialize bulk selection
  const bulkSelection = useBulkSelection(filteredEquipment);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [convertingEquipment, setConvertingEquipment] = useState<Equipment | null>(null);
  
  // Loading states for individual actions
  const [loadingStates, setLoadingStates] = useState<{
    deleting: string | null;
    updating: string | null;
    uploading: string | null;
    convert: boolean;
  }>({
    deleting: null,
    updating: null,
    uploading: null,
    convert: false
  });
  
  // Confirmation dialog state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    equipment: Equipment | null;
  }>({ open: false, equipment: null });

  // Undo dialog state
  const [undoDeleteDialog, setUndoDeleteDialog] = useState<{
    open: boolean;
    equipment: any | null;
  }>({ open: false, equipment: null });
  
  // Pagination and view states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [lastFiltersHash, setLastFiltersHash] = useState('');
  
  const isMobile = useIsMobile();
  const isTablet = false; // Simplified for now
  const { classes } = usePageLayout('table');

  // Auto-switch view mode based on screen size - FORÇA cards no mobile
  const effectiveViewMode = useMemo(() => {
    if (isMobile) return 'cards'; // NUNCA tabela em mobile
    if (isTablet && viewMode === 'table') return 'grid';
    return viewMode;
  }, [isMobile, isTablet, viewMode]);

  // Paginated data - memoized for performance
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Use flat equipment data for grid and cards views
    if (effectiveViewMode === 'grid' || effectiveViewMode === 'cards') {
      return filteredEquipment.slice(startIndex, endIndex);
    }
    
    // Use hierarchy data for table view
    return equipmentHierarchy.slice(startIndex, endIndex);
  }, [filteredEquipment, equipmentHierarchy, currentPage, itemsPerPage, effectiveViewMode]);

  const totalPages = Math.ceil(
    (effectiveViewMode === 'grid' || effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length) / itemsPerPage
  );

  // Smart pagination - reset only when filters significantly change
  useEffect(() => {
    const filtersHash = JSON.stringify({
      search: filters.search,
      category: filters.category,
      status: filters.status,
      itemType: filters.itemType
    });
    
    if (lastFiltersHash && filtersHash !== lastFiltersHash) {
      // Only reset to page 1 if current page would be empty
      const totalItems = effectiveViewMode === 'grid' || effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length;
      const maxValidPage = Math.ceil(totalItems / itemsPerPage) || 1;
      
      if (currentPage > maxValidPage) {
        setCurrentPage(1);
      }
    }
    
    setLastFiltersHash(filtersHash);
  }, [filters, currentPage, itemsPerPage, filteredEquipment.length, equipmentHierarchy.length, effectiveViewMode, lastFiltersHash]);

  const handleAdd = useCallback(async (equipmentData: Omit<Equipment, 'id'>) => {
    try {
      await addEquipment(equipmentData);
      setIsAddDialogOpen(false);
      enhancedToast.success({
        title: 'Equipamento adicionado!',
        description: `${equipmentData.name} foi adicionado ao inventário.`
      });
      return { success: true };
    } catch (error) {
      logger.error('Error adding equipment in page', {
        module: 'equipment-page',
        action: 'add_equipment',
        error,
        data: { equipmentName: equipmentData.name }
      });
      enhancedToast.error({
        title: 'Erro ao adicionar equipamento',
        description: 'Tente novamente ou contate o suporte.'
      });
      return { success: false };
    }
  }, [addEquipment]);

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsAddDialogOpen(true);
  };

  const handleUpdate = async (equipmentData: Omit<Equipment, 'id'>) => {
    if (editingEquipment) {
      try {
        setLoadingStates(prev => ({ ...prev, updating: editingEquipment.id }));
        await updateEquipment(editingEquipment.id, equipmentData);
        setEditingEquipment(null);
        setIsAddDialogOpen(false);
        enhancedToast.success({
          title: 'Equipamento atualizado!',
          description: `${equipmentData.name} foi atualizado com sucesso.`
        });
        return { success: true };
      } catch (error) {
        logger.error('Error updating equipment in page', {
          module: 'equipment-page',
          action: 'update_equipment',
          error,
          data: { equipmentId: editingEquipment.id, equipmentName: editingEquipment.name }
        });
        enhancedToast.error({
          title: 'Erro ao atualizar equipamento',
          description: 'Tente novamente ou contate o suporte.'
        });
        return { success: false };
      } finally {
        setLoadingStates(prev => ({ ...prev, updating: null }));
      }
    }
    return { success: false };
  };

  const handleDelete = (equipment: Equipment) => {
    setDeleteConfirmation({ open: true, equipment });
  };

  const confirmDelete = async () => {
    const equipment = deleteConfirmation.equipment;
    if (!equipment) return;

    try {
      setLoadingStates(prev => ({ ...prev, deleting: equipment.id }));
      await deleteEquipment(equipment.id);
      
      enhancedToast.success({
        title: 'Equipamento excluído!',
        description: `${equipment.name} foi removido do inventário.`,
        action: {
          label: 'Desfazer',
          onClick: () => {
            setUndoDeleteDialog({
              open: true,
              equipment: {
                id: equipment.id,
                name: equipment.name,
                brand: equipment.brand,
                category: equipment.category,
                patrimony_number: equipment.patrimonyNumber,
                deletedAt: new Date(),
                canRestore: true
              }
            });
          }
        }
      });
    } catch (error) {
      logger.error('Error deleting equipment in page', {
        module: 'equipment-page',
        action: 'delete_equipment',
        error,
        data: { equipmentId: equipment.id, equipmentName: equipment.name }
      });
      enhancedToast.error({
        title: 'Erro ao excluir equipamento',
        description: 'Tente novamente ou contate o suporte.'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, deleting: null }));
      setDeleteConfirmation({ open: false, equipment: null });
    }
  };

  const handleDeleteById = async (equipmentId: string) => {
    const equipment = filteredEquipment.find(e => e.id === equipmentId);
    if (!equipment) return;
    await handleDelete(equipment);
  };

  const handleImageUpload = async (equipment: Equipment, file: File) => {
    try {
      setLoadingStates(prev => ({ ...prev, uploading: equipment.id }));
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${equipment.id}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('equipment-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('equipment-images')
        .getPublicUrl(fileName);

      await updateEquipment(equipment.id, { image: publicUrl });
      
      enhancedToast.success({
        title: 'Imagem atualizada!',
        description: `Imagem de ${equipment.name} foi atualizada.`
      });
    } catch (error) {
      logger.error('Error uploading equipment image in page', {
        module: 'equipment-page',
        action: 'upload_image',
        error,
        data: { equipmentId: equipment.id, equipmentName: equipment.name }
      });
      enhancedToast.error({
        title: 'Erro ao fazer upload da imagem',
        description: 'Tente novamente ou contate o suporte.'
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, uploading: null }));
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
    // Smooth scroll to top with better UX
    const header = document.querySelector('h1');
    if (header) {
      header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const handleBulkDelete = async (items: Equipment[]) => {
    for (const equipment of items) {
      await deleteEquipment(equipment.id);
    }
  };

  const handleBulkEdit = (items: Equipment[]) => {
    // For now, just show a toast that this feature is coming
    enhancedToast.info({
      title: 'Em breve',
      description: 'Edição em lote será implementada em uma próxima versão.'
    });
  };

  const handleBulkExport = useCallback((items: Equipment[]) => {
    // Simple CSV export
    const csvContent = [
      'Nome,Marca,Categoria,Patrimônio,Status,Valor',
      ...items.map(item => 
        `"${item.name}","${item.brand}","${item.category}","${item.patrimonyNumber || ''}","${item.status}","${item.value || 0}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `equipamentos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    enhancedToast.success({
      title: 'Exportação concluída',
      description: `${items.length} equipamento(s) exportado(s) com sucesso.`
    });
  }, []);

  const loadingSkeletons = useMemo(() => {
    return [...Array(6)].map((_, i) => (
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
    ));
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingSkeletons}
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

      default: // table - NEVER render on mobile
        if (isMobile) {
          return (
            <div className="grid grid-cols-1 gap-4">
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
        }
        
        return (
          <div className="bg-card rounded-lg border overflow-hidden shadow-card">
            <div className="overflow-x-auto table-container">
              <div className="min-w-0"> {/* Remove fixed width for mobile responsiveness */}
                {/* Header */}
                <div className="bg-muted/30 border-b border-border">
                  <div className="grid grid-cols-8 gap-2 lg:gap-3 px-2 lg:px-4 py-3 items-center text-xs">
                    <div className="col-span-1 font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-center">
                      <Checkbox
                        checked={bulkSelection.isAllSelected}
                        onCheckedChange={bulkSelection.toggleAll}
                        className={bulkSelection.isPartialSelected ? "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" : ""}
                      />
                    </div>
                    <div className="col-span-1 font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-center">
                      <span>Img</span>
                    </div>
                    <div className="col-span-2 font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      <SortableHeader 
                        field="name" 
                        label="Nome/Modelo" 
                        currentSortBy={filters.sortBy} 
                        currentSortOrder={filters.sortOrder}
                        onSort={handleSort}
                      />
                    </div>
                    <div className="col-span-1 font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      <SortableHeader 
                        field="category" 
                        label="Categoria" 
                        currentSortBy={filters.sortBy} 
                        currentSortOrder={filters.sortOrder}
                        onSort={handleSort}
                      />
                    </div>
                    <div className="col-span-1 font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      <SortableHeader 
                        field="status" 
                        label="Status" 
                        currentSortBy={filters.sortBy} 
                        currentSortOrder={filters.sortOrder}
                        onSort={handleSort}
                      />
                    </div>
                    <div className="col-span-1 font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      <SortableHeader 
                        field="value" 
                        label="Valor" 
                        currentSortBy={filters.sortBy} 
                        currentSortOrder={filters.sortOrder}
                        onSort={handleSort}
                      />
                    </div>
                    <div className="col-span-1 font-medium text-muted-foreground uppercase tracking-wider flex items-center">
                      <span>Ações</span>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="bg-card">
                  {(paginatedData as any[]).map((item) => (
                    <EquipmentHierarchyRow
                      key={item.id}
                      equipment={item}
                      onEdit={handleEdit}
                      onDelete={handleDeleteById}
                      onImageUpload={handleImageUploadById}
                      onConvertToAccessory={handleConvertToAccessory}
                      onToggleExpansion={toggleEquipmentExpansion}
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
    <ResponsiveContainer maxWidth="7xl" className="min-h-screen">
      <PageHeader 
        title="Equipamentos" 
        subtitle="Gerencie o inventário de equipamentos audiovisuais"
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <AdminOnly>
              <ResponsiveButton
                onClick={() => setIsImportDialogOpen(true)}
                variant="outline"
                icon={Upload}
                mobileText="Importar"
                desktopText="Importar CSV"
              />
            </AdminOnly>
            <ResponsiveButton
              onClick={() => setIsAddDialogOpen(true)}
              icon={Plus}
              mobileText="Adicionar"
              desktopText="Adicionar Equipamento"
            />
          </div>
        }
      />

      {/* Stats Cards */}
      <EquipmentStatsCards stats={stats} isLoading={loading} />

      {/* Filters */}
      <UnifiedEquipmentFilters
        filters={filters}
        onFiltersChange={setFilters}
        allEquipment={allEquipment}
        stats={stats}
      />

      {/* Content */}
      <div className={classes.section}>
        {/* Current view indicator */}
        {!loading && filteredEquipment.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {effectiveViewMode === 'table' ? (
                  <>
                    <Monitor className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Tabela</span>
                    <span className="sm:hidden">Tab</span>
                  </>
                ) : effectiveViewMode === 'grid' ? (
                  <>
                    <Tablet className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Grade</span>
                    <span className="sm:hidden">Grid</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="h-3 w-3 mr-1" />
                    Cards
                  </>
                )}
              </Badge>
              <span className="text-xs sm:text-sm">
                <span className="hidden sm:inline">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length)} de {effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length} equipamentos
                </span>
                <span className="sm:hidden">
                  {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length)} de {effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length}
                </span>
              </span>
            </div>
          </div>
        )}

        {renderContent()}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <EquipmentPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={effectiveViewMode === 'grid' || effectiveViewMode === 'cards' ? filteredEquipment.length : equipmentHierarchy.length}
            itemsPerPage={itemsPerPage}
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
        mainItems={filteredEquipment.filter(e => e.itemType === 'main')}
      />

      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={(data) => {
          importEquipment(data);
          setIsImportDialogOpen(false);
          enhancedToast.success({
            title: 'Importação concluída!',
            description: `${data.length} equipamento(s) importado(s) com sucesso.`
          });
        }}
      />

      {convertingEquipment && (
        <ConvertToAccessoryDialog
          open={isConvertDialogOpen}
          onOpenChange={setIsConvertDialogOpen}
          equipment={convertingEquipment}
          mainItems={allEquipment.filter(eq => eq.itemType === 'main')}
          onConvert={async (equipmentId: string, parentId: string) => {
            try {
              setLoadingStates(prev => ({ ...prev, convert: true }));
              await convertToAccessory(equipmentId, parentId);
              setConvertingEquipment(null);
              setIsConvertDialogOpen(false);
              
              enhancedToast.success({
                title: 'Conversão realizada!',
                description: `${convertingEquipment.name} foi convertido para acessório com sucesso.`
              });
              
              return { success: true };
            } catch (error: any) {
              const errorMessage = error?.details || error?.message || 'Erro desconhecido durante a conversão';
              logger.error('Error converting equipment to accessory in page', {
                module: 'equipment-page',
                action: 'convert_to_accessory',
                error,
                data: { 
                  equipmentId: convertingEquipment.id, 
                  equipmentName: convertingEquipment.name,
                  parentId
                }
              });

              enhancedToast.error({
                title: 'Erro na conversão',
                description: errorMessage
              });
              
              return { success: false };
            } finally {
              setLoadingStates(prev => ({ ...prev, convert: false }));
            }
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmation.open}
        onOpenChange={(open) => setDeleteConfirmation({ open, equipment: null })}
        title="Excluir Equipamento"
        description={
          deleteConfirmation.equipment
            ? `Tem certeza que deseja excluir "${deleteConfirmation.equipment.name}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        icon="delete"
        onConfirm={confirmDelete}
      />
      
      <UndoDeleteDialog
        open={undoDeleteDialog.open}
        onOpenChange={(open) => setUndoDeleteDialog({ open, equipment: null })}
        deletedEquipment={undoDeleteDialog.equipment}
        onRestore={async (equipmentId) => {
          equipmentDebug('Restoring equipment', { equipmentId });
          // Implementar lógica de restauração quando necessário
        }}
      />
      
      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedItems={bulkSelection.getSelectedItems()}
        selectedCount={bulkSelection.selectedCount}
        onClearSelection={bulkSelection.clearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
        onBulkExport={handleBulkExport}
      />
    </ResponsiveContainer>
  );
}