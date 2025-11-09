import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, Grid3X3, List, Monitor, Tablet, Smartphone, Download, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { ResponsiveButton } from '@/components/ui/responsive-button';
import { usePageLayout } from '@/hooks/usePageLayout';
import { useEquipment } from '@/features/equipment';
import { ImportDialog } from '@/components/Equipment/ImportDialog';
import { ConvertToAccessoryDialog } from '@/components/Equipment/ConvertToAccessoryDialog';
import { UnifiedEquipmentFilters } from '@/components/Equipment/UnifiedEquipmentFilters';
import { EquipmentTableHeader } from '@/components/Equipment/EquipmentTableHeader';
import { EquipmentTableRow } from '@/components/Equipment/EquipmentTableRow';
import { EquipmentMobileView } from '@/components/Equipment/EquipmentMobileView';
import { EquipmentMobileCard } from '@/components/Equipment/EquipmentMobileCard';
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
import { logger } from '@/lib/logger';

import { AdminOnly } from '@/components/RoleGuard';
import { useEquipmentProjects } from '@/hooks/useEquipmentProjects';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { BulkActionsBar } from '@/components/Equipment/BulkActionsBar';
import { exportEquipmentToCSV } from '@/lib/csvExporter';

type ViewMode = 'table' | 'grid' | 'cards';

export default function EquipmentPage() {
  const navigate = useNavigate();
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

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [convertingEquipment, setConvertingEquipment] = useState<Equipment | null>(null);
  
  // Loading states for individual actions
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
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

  // Bulk selection
  const {
    selectedItems,
    selectedCount,
    isAllSelected,
    isPartialSelected,
    toggleItem,
    toggleAll,
    clearSelection,
    getSelectedItems,
  } = useBulkSelection(filteredEquipment);

  // Update timestamp when data is loaded
  useEffect(() => {
    if (!loading && allEquipment.length > 0) {
      setLastUpdate(new Date());
    }
  }, [loading, allEquipment.length]);

  // Helper function to format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
    if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
    return `há ${Math.floor(diffInSeconds / 86400)} dias`;
  };

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

  const handleEdit = (equipment: Equipment) => {
    navigate(`/equipment/edit/${equipment.id}`);
  };

  const handleDelete = (equipment: Equipment) => {
    setDeleteConfirmation({ open: true, equipment });
  };

  const confirmDelete = async () => {
    const equipment = deleteConfirmation.equipment;
    if (!equipment) return;

    try {
      setDeletingId(equipment.id);
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
      setDeletingId(null);
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

  // Bulk action handlers
  const handleBulkExport = useCallback((items: Equipment[]) => {
    const filename = `equipamentos-selecionados-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    exportEquipmentToCSV(items, filename);
    
    enhancedToast.success({
      title: 'CSV exportado!',
      description: `${items.length} equipamento(s) foram exportados com sucesso.`
    });
  }, []);

  const handleBulkDelete = useCallback(async (items: Equipment[]) => {
    // Deleta múltiplos equipamentos
    for (const item of items) {
      await deleteEquipment(item.id);
    }
  }, [deleteEquipment]);

  const handleBulkEdit = useCallback((items: Equipment[]) => {
    // Placeholder para futura implementação de edição em massa
    enhancedToast.info({
      title: 'Em desenvolvimento',
      description: 'A edição em massa estará disponível em breve.'
    });
  }, []);

  const handleExportAll = useCallback(() => {
    const filename = `todos-equipamentos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    exportEquipmentToCSV(filteredEquipment, filename);
    
    enhancedToast.success({
      title: 'CSV exportado!',
      description: `${filteredEquipment.length} equipamento(s) foram exportados com sucesso.`
    });
  }, [filteredEquipment]);


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

    // Verificação mais robusta - mesmo se filteredEquipment está vazio, 
    // mas temos dados carregados, pode ser um problema de filtro
    if (filteredEquipment.length === 0) {
      return (
        <EmptyState
          icon={Plus}
          title="Nenhum equipamento encontrado"
          description="Adicione equipamentos para começar a gerenciar seu inventário."
          action={{
            label: "Adicionar Equipamento",
            onClick: () => navigate('/equipment/new')
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
                selected={selectedItems.has(equipment.id)}
                onToggleSelection={toggleItem}
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
                selected={selectedItems.has(equipment.id)}
                onToggleSelection={toggleItem}
              />
            ))}
          </div>
        );

      default: // table - NEVER render on mobile
        if (isMobile) {
          return (
            <EquipmentMobileView
              equipment={paginatedData as Equipment[]}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onImageUpload={handleImageUpload}
              onConvertToAccessory={handleConvertToAccessory}
              onAddEquipment={() => navigate('/equipment/new')}
              isLoading={loading}
            />
          );
        }
         
        return (
          <div className="bg-card rounded-lg border overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                {/* Header */}
                <EquipmentTableHeader
                  onSort={handleSort}
                  sortBy={filters.sortBy}
                  sortOrder={filters.sortOrder}
                  isAllSelected={isAllSelected}
                  isPartialSelected={isPartialSelected}
                  onToggleAll={toggleAll}
                />

                {/* Body */}
                <div className="divide-y divide-border">
                  {(paginatedData as { item: Equipment; accessories: Equipment[] }[]).map(({ item, accessories }) => (
                    <EquipmentTableRow
                      key={item.id}
                      equipment={item}
                      accessories={accessories}
                      onEdit={handleEdit}
                      onDelete={handleDeleteById}
                      onToggleExpansion={toggleEquipmentExpansion}
                      onImageUpload={handleImageUploadById}
                      onConvertToAccessory={handleConvertToAccessory}
                      selected={selectedItems.has(item.id)}
                      onToggleSelection={toggleItem}
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
        subtitle={
          <span className="flex items-center gap-2">
            Gerencie o inventário de equipamentos audiovisuais
            {lastUpdate && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-xs text-muted-foreground/70 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Atualizado {formatRelativeTime(lastUpdate)}
                </span>
              </>
            )}
          </span>
        }
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <ResponsiveButton
              onClick={handleExportAll}
              variant="outline"
              icon={Download}
              mobileText="Exportar"
              desktopText="Exportar CSV"
              disabled={filteredEquipment.length === 0}
            />
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
              onClick={() => navigate('/equipment/new')}
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
              setIsConverting(true);
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
              setIsConverting(false);
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
          try {
            equipmentDebug('Restoring equipment', { equipmentId });
            
            const deletedEquipment = undoDeleteDialog.equipment;
            if (!deletedEquipment) {
              throw new Error('Dados do equipamento não encontrados');
            }

            const equipmentData: Omit<Equipment, 'id'> = {
              name: deletedEquipment.name,
              brand: deletedEquipment.brand,
              category: deletedEquipment.category,
              status: 'available',
              itemType: 'main',
              patrimonyNumber: deletedEquipment.patrimony_number,
            };

            const result = await addEquipment(equipmentData);
            
            if (result.success) {
              enhancedToast.success({
                title: 'Equipamento restaurado!',
                description: `${deletedEquipment.name} foi restaurado com sucesso.`
              });
              setUndoDeleteDialog({ open: false, equipment: null });
            } else {
              throw new Error(result.error || 'Erro ao restaurar equipamento');
            }
          } catch (error) {
            logger.error('Error restoring equipment', {
              module: 'equipment-page',
              action: 'restore_equipment',
              error,
              data: { equipmentId }
            });
            
            enhancedToast.error({
              title: 'Erro ao restaurar',
              description: 'Não foi possível restaurar o equipamento. Tente adicionar manualmente.'
            });
          }
        }}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedItems={getSelectedItems()}
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
        onBulkExport={handleBulkExport}
      />
    </ResponsiveContainer>
  );
}