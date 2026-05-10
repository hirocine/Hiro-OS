import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Monitor, Tablet, Smartphone, Clock } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { useEquipment } from '@/features/equipment';
import { ConvertToAccessoryDialog } from '@/components/Equipment/ConvertToAccessoryDialog';
import { UnifiedEquipmentFilters } from '@/components/Equipment/UnifiedEquipmentFilters';
import { EquipmentTableHeader } from '@/components/Equipment/EquipmentTableHeader';
import { EquipmentTableRow } from '@/components/Equipment/EquipmentTableRow';
import { EquipmentMobileView } from '@/components/Equipment/EquipmentMobileView';
import { EquipmentMobileCard } from '@/components/Equipment/EquipmentMobileCard';
import { EquipmentPagination } from '@/components/Equipment/EquipmentPagination';
import { EquipmentStatsCards } from '@/components/Equipment/EquipmentStatsCards';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Equipment } from '@/types/equipment';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { UndoDeleteDialog } from '@/components/Equipment/UndoDeleteDialog';
import { logger } from '@/lib/logger';
import { generateEquipmentImageName } from '@/lib/imageNaming';
import { compressImage } from '@/lib/imageUtils';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { BulkActionsBar } from '@/components/Equipment/BulkActionsBar';

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
    toggleEquipmentExpansion,
    handleSort,
  } = useEquipment();

  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [convertingEquipment, setConvertingEquipment] = useState<Equipment | null>(null);
  const [, setDeletingId] = useState<string | null>(null);
  const [, setIsConverting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ open: boolean; equipment: Equipment | null }>({ open: false, equipment: null });
  const [undoDeleteDialog, setUndoDeleteDialog] = useState<{ open: boolean; equipment: any | null }>({ open: false, equipment: null });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [lastFiltersHash, setLastFiltersHash] = useState('');

  const isMobile = useIsMobile();
  const isTablet = false;

  const {
    selectedItems, selectedCount, isAllSelected, isPartialSelected,
    toggleItem, toggleAll, clearSelection, getSelectedItems,
  } = useBulkSelection(filteredEquipment);

  useEffect(() => {
    if (!loading && allEquipment.length > 0) setLastUpdate(new Date());
  }, [loading, allEquipment.length]);

  const effectiveViewMode = useMemo<ViewMode>(() => {
    if (isMobile) return 'cards';
    if (isTablet && viewMode === 'table') return 'grid';
    return viewMode;
  }, [isMobile, isTablet, viewMode]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    if (effectiveViewMode === 'grid' || effectiveViewMode === 'cards') {
      return filteredEquipment.slice(startIndex, endIndex);
    }
    return equipmentHierarchy.slice(startIndex, endIndex);
  }, [filteredEquipment, equipmentHierarchy, currentPage, itemsPerPage, effectiveViewMode]);

  const totalItems = effectiveViewMode === 'grid' || effectiveViewMode === 'cards'
    ? filteredEquipment.length
    : equipmentHierarchy.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    const filtersHash = JSON.stringify({
      search: filters.search, category: filters.category, status: filters.status, itemType: filters.itemType,
    });
    if (lastFiltersHash && filtersHash !== lastFiltersHash) {
      const maxValidPage = Math.ceil(totalItems / itemsPerPage) || 1;
      if (currentPage > maxValidPage) setCurrentPage(1);
    }
    setLastFiltersHash(filtersHash);
  }, [filters, currentPage, itemsPerPage, totalItems, lastFiltersHash]);

  const handleEdit = (equipment: Equipment) => navigate(`/inventario/editar/${equipment.id}`);
  const handleDelete = (equipment: Equipment) => setDeleteConfirmation({ open: true, equipment });

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
                id: equipment.id, name: equipment.name, brand: equipment.brand,
                category: equipment.category, patrimony_number: equipment.patrimonyNumber,
                deletedAt: new Date(), canRestore: true,
              },
            });
          },
        },
      });
    } catch (error) {
      logger.error('Error deleting equipment in page', {
        module: 'equipment-page', action: 'delete_equipment', error,
        data: { equipmentId: equipment.id, equipmentName: equipment.name },
      });
      enhancedToast.error({ title: 'Erro ao excluir equipamento', description: 'Tente novamente ou contate o suporte.' });
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
      const compressedBlob = await compressImage(file);
      const fileName = generateEquipmentImageName(equipment.id, equipment.patrimonyNumber);
      const { error } = await supabase.storage
        .from('equipment-images')
        .upload(fileName, compressedBlob, { contentType: 'image/webp', cacheControl: '3600', upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('equipment-images').getPublicUrl(fileName);
      await updateEquipment(equipment.id, { image: publicUrl });
      enhancedToast.success({ title: 'Imagem otimizada e atualizada!', description: `Imagem de ${equipment.name} foi comprimida e atualizada.` });
    } catch (error) {
      logger.error('Error uploading equipment image in page', {
        module: 'equipment-page', action: 'upload_image', error,
        data: { equipmentId: equipment.id, equipmentName: equipment.name },
      });
      enhancedToast.error({ title: 'Erro ao fazer upload da imagem', description: 'Tente novamente ou contate o suporte.' });
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
    const header = document.querySelector('h1');
    if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleBulkDelete = useCallback(async (items: Equipment[]) => {
    for (const item of items) await deleteEquipment(item.id);
  }, [deleteEquipment]);

  const handleBulkEdit = useCallback(() => {
    enhancedToast.info({ title: 'Em desenvolvimento', description: 'A edição em massa estará disponível em breve.' });
  }, []);

  const handleBulkExport = useCallback(() => {
    enhancedToast.info({ title: 'Funcionalidade movida', description: 'A exportação CSV agora está disponível apenas na página de Administração.' });
  }, []);

  const ViewIcon = effectiveViewMode === 'table' ? Monitor : effectiveViewMode === 'grid' ? Tablet : Smartphone;
  const viewLabel = effectiveViewMode === 'table' ? 'Tabela' : effectiveViewMode === 'grid' ? 'Grade' : 'Cards';

  const renderContent = () => {
    if (loading) {
      return (
        <div className="tbl" style={{ gridTemplateColumns: '1fr', border: '1px solid hsl(var(--ds-line-1))' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={'tbl-row' + (i === 5 ? ' last' : '')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                <span className="sk dot" />
                <span className="sk line lg" style={{ width: 240 }} />
                <span className="sk line" style={{ width: 100, marginLeft: 'auto' }} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredEquipment.length === 0) {
      return (
        <div className="empties">
          <div className="empty" style={{ borderRight: 0 }}>
            <div className="glyph"><Plus strokeWidth={1.25} /></div>
            <h5>Nenhum equipamento encontrado</h5>
            <p>Adicione equipamentos para começar a gerenciar seu inventário.</p>
            <div className="actions">
              <button className="btn primary" onClick={() => navigate('/inventario/novo')} type="button">
                <Plus size={14} strokeWidth={1.5} />
                <span>Adicionar equipamento</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (effectiveViewMode) {
      case 'cards':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
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

      default:
        if (isMobile) {
          return (
            <EquipmentMobileView
              equipment={paginatedData as Equipment[]}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onImageUpload={handleImageUpload}
              onConvertToAccessory={handleConvertToAccessory}
              onAddEquipment={() => navigate('/inventario/novo')}
              isLoading={loading}
            />
          );
        }
        return (
          <div style={{ border: '1px solid hsl(var(--ds-line-1))', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 1200 }}>
                <EquipmentTableHeader
                  onSort={handleSort}
                  sortBy={filters.sortBy}
                  sortOrder={filters.sortOrder}
                  isAllSelected={isAllSelected}
                  isPartialSelected={isPartialSelected}
                  onToggleAll={toggleAll}
                />
                <div>
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
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div className="ph">
          <div>
            <h1 className="ph-title">Equipamentos.</h1>
            <p className="ph-sub">
              Gerencie o inventário de equipamentos audiovisuais.
              {lastUpdate && (
                <span className="meta">
                  <Clock size={12} strokeWidth={1.5} />
                  Atualizado {formatRelativeTime(lastUpdate)}
                </span>
              )}
            </p>
          </div>
          <div className="ph-actions">
            <button className="btn primary" onClick={() => navigate('/inventario/novo')} type="button">
              <Plus size={14} strokeWidth={1.5} />
              <span>Adicionar Equipamento</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <EquipmentStatsCards stats={stats} isLoading={loading} />
        </div>

        <div style={{ marginTop: 20 }}>
          <UnifiedEquipmentFilters
            filters={filters}
            onFiltersChange={setFilters}
            allEquipment={allEquipment}
            stats={stats}
          />
        </div>

        {!loading && filteredEquipment.length > 0 && (
          <div style={{
            marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="pill"><ViewIcon size={12} strokeWidth={1.5} />{viewLabel}</span>
              <span style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}
              </span>
            </div>
            <div className="tabs-seg">
              <button className={'seg' + (viewMode === 'table' ? ' on' : '')} onClick={() => setViewMode('table')} type="button">Tabela</button>
              <button className={'seg' + (viewMode === 'grid' ? ' on' : '')} onClick={() => setViewMode('grid')} type="button">Grade</button>
              <button className={'seg' + (viewMode === 'cards' ? ' on' : '')} onClick={() => setViewMode('cards')} type="button">Cards</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {renderContent()}

          {!loading && totalPages > 1 && (
            <div style={{ marginTop: 16 }}>
              <EquipmentPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          )}
        </div>

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
                  description: `${convertingEquipment.name} foi convertido para acessório com sucesso.`,
                });
                return { success: true };
              } catch (error: any) {
                const errorMessage = error?.details || error?.message || 'Erro desconhecido durante a conversão';
                logger.error('Error converting equipment to accessory in page', {
                  module: 'equipment-page', action: 'convert_to_accessory', error,
                  data: { equipmentId: convertingEquipment.id, equipmentName: convertingEquipment.name, parentId },
                });
                enhancedToast.error({ title: 'Erro na conversão', description: errorMessage });
                return { success: false };
              } finally {
                setIsConverting(false);
              }
            }}
          />
        )}

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
              const deletedEquipment = undoDeleteDialog.equipment;
              if (!deletedEquipment) throw new Error('Dados do equipamento não encontrados');

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
                  description: `${deletedEquipment.name} foi restaurado com sucesso.`,
                });
                setUndoDeleteDialog({ open: false, equipment: null });
              } else {
                throw new Error(result.error || 'Erro ao restaurar equipamento');
              }
            } catch (error) {
              logger.error('Error restoring equipment', {
                module: 'equipment-page', action: 'restore_equipment', error, data: { equipmentId },
              });
              enhancedToast.error({
                title: 'Erro ao restaurar',
                description: 'Não foi possível restaurar o equipamento. Tente adicionar manualmente.',
              });
            }
          }}
        />

        <BulkActionsBar
          selectedItems={getSelectedItems()}
          selectedCount={selectedCount}
          onClearSelection={clearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkEdit={handleBulkEdit}
          onBulkExport={handleBulkExport}
        />
      </div>
    </div>
  );
}
