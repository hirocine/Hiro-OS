import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryIcon } from '@/lib/categoryIconMap';
import { logger } from '@/lib/logger';
import { StatusPill } from '@/ds/components/StatusPill';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Search, FileText, ChevronRight, AlertTriangle, GripVertical } from 'lucide-react';

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'hsl(var(--ds-fg-3))',
  display: 'block',
  marginBottom: 6,
};

const iconBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  padding: 0,
  justifyContent: 'center',
};

// Componente Sortable para Item de Categoria
function SortableCategoryItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          padding: 4,
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GripVertical size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
      </button>
      {children}
    </div>
  );
}

// Componente Sortable para Item de Subcategoria
function SortableSubcategoryItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          padding: 4,
          marginLeft: 8,
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <GripVertical size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
      </button>
      {children}
    </div>
  );
}

// Função para retornar placeholder contextual baseado na categoria
const getSubcategoryPlaceholder = (category: string | null): string => {
  if (!category) return 'Ex: Digite o nome da subcategoria...';

  const placeholders: Record<string, string> = {
    'Câmera': 'Ex: Lente, Cage, Filtro, Bateria...',
    'Audio': 'Ex: Microfone, Gravador, Cabo, Braço Articulado...',
    'Iluminação': 'Ex: Luz, Modificador de Luz, Rebatedor...',
    'Acessórios': 'Ex: Bateria, Cabo, Case, Filtro...',
    'Armazenamento': 'Ex: SSD/HD Externo, Cartão de Memória, Leitor...',
    'Consumíveis': 'Ex: Fita Gaffer, Abraçadeiras, Pano Preto, Fita Crepe...',
    'Elétrica': 'Ex: Caçapa, Extensão, Tomada, Cabo de Força...',
    'Maquinária': 'Ex: Tripé de Câmera, Dolly, Grua...',
    'Monitoração': 'Ex: Monitor, Transmissão, Gravador...',
    'Produção': 'Ex: Cadeiras, Mesas, Comunicação, Tendas...',
    'Tecnologia': 'Ex: Desktop, Notebook, Monitor, Mouse...',
    'Transmissão': 'Ex: Mesa de Corte, Placa de Captura, Conversores...',
    'Tripés e Movimento': 'Ex: Tripé, Estabilizador, Slider, Gimbal...',
  };

  // Retorna o placeholder específico ou um genérico se a categoria não estiver no mapeamento
  return placeholders[category] || `Ex: Subcategoria de ${category}...`;
};

interface CategoryManagementProps {
  externalAddDialogOpen?: boolean;
  onExternalAddDialogChange?: (open: boolean) => void;
}

export function CategoryManagement({ externalAddDialogOpen, onExternalAddDialogChange }: CategoryManagementProps = {}) {
  const {
    loading,
    getCategoriesHierarchy,
    addCategoryOnly,
    addSubcategory,
    updateCategory,
    renameCategory,
    deleteSubcategory,
    deleteCategoryWithSubcategories,
    getCategoryUsageCount,
    refetch,
  } = useCategories();

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Dialogs state
  const [internalAddCategoryDialog, setInternalAddCategoryDialog] = useState(false);
  const showAddCategoryDialog = externalAddDialogOpen ?? internalAddCategoryDialog;
  const setShowAddCategoryDialog = onExternalAddDialogChange ?? setInternalAddCategoryDialog;
  const [showAddSubcategoryDialog, setShowAddSubcategoryDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{
    type: 'category' | 'subcategory';
    id?: string;
    categoryName: string;
    subcategoryName?: string;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'subcategory';
    id?: string;
    name: string;
    categoryName?: string;
    usageCount: number;
  } | null>(null);

  const hierarchy = getCategoriesHierarchy();

  const filteredHierarchy = hierarchy.filter(cat =>
    cat.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.subcategories.some(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  // Expand all quando tiver filtro
  useEffect(() => {
    if (searchTerm) {
      setExpandedCategories(new Set(filteredHierarchy.map(cat => cat.categoryName)));
    }
  }, [searchTerm]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome da categoria',
        variant: 'destructive',
      });
      return;
    }

    const result = await addCategoryOnly(newCategoryName, newCategoryIcon || null);

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso',
      });
      setShowAddCategoryDialog(false);
      setNewCategoryName('');
      setNewCategoryIcon('');
      refetch();
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleAddSubcategoryToExisting = async () => {
    if (!selectedCategory) {
      toast({
        title: 'Categoria obrigatória',
        description: 'Selecione uma categoria antes de adicionar a subcategoria',
        variant: 'destructive',
      });
      return;
    }

    if (!newSubcategoryName.trim()) {
      toast({
        title: 'Subcategoria obrigatória',
        description: 'Digite o nome da subcategoria',
        variant: 'destructive',
      });
      return;
    }

    const result = await addSubcategory(selectedCategory, newSubcategoryName);

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: 'Subcategoria adicionada com sucesso',
      });
      setShowAddSubcategoryDialog(false);
      setSelectedCategory(null);
      setNewSubcategoryName('');
      refetch();
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;

    if (editingItem.type === 'category') {
      if (!newCategoryName.trim()) {
        toast({
          title: 'Nome obrigatório',
          description: 'Digite o novo nome da categoria',
          variant: 'destructive',
        });
        return;
      }

      const result = await renameCategory(editingItem.categoryName, newCategoryName);

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Categoria renomeada com sucesso',
        });
        setShowEditDialog(false);
        setEditingItem(null);
        setNewCategoryName('');
        refetch();
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        });
      }
    } else {
      if (!newSubcategoryName.trim()) {
        toast({
          title: 'Nome obrigatório',
          description: 'Digite o novo nome da subcategoria',
          variant: 'destructive',
        });
        return;
      }

      const result = await updateCategory(
        editingItem.id!,
        editingItem.categoryName,
        newSubcategoryName
      );

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Subcategoria renomeada com sucesso',
        });
        setShowEditDialog(false);
        setEditingItem(null);
        setNewSubcategoryName('');
        refetch();
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        });
      }
    }
  };

  // Setup drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Função para reordenar categorias principais
  const reorderCategories = async (reorderedCategoryNames: string[]) => {
    try {
      // Para cada categoria, atualizar apenas o category_order
      for (let index = 0; index < reorderedCategoryNames.length; index++) {
        const catName = reorderedCategoryNames[index];
        const newOrder = (index + 1) * 10;

        // Atualizar todos os registros desta categoria
        const { error } = await supabase
          .from('equipment_categories')
          .update({ category_order: newOrder })
          .eq('category', catName);

        if (error) throw error;
      }

      toast({
        title: 'Ordem atualizada',
        description: 'Categorias reordenadas com sucesso',
      });

      await refetch();
    } catch (error) {
      logger.error('Error reordering categories', {
        module: 'category-management',
        action: 'reorder_categories',
        error,
      });
      toast({
        title: 'Erro',
        description: 'Erro ao reordenar categorias',
        variant: 'destructive',
      });
    }
  };

  // Função para reordenar subcategorias dentro de uma categoria
  const reorderSubcategories = async (
    categoryName: string,
    reorderedSubcategoryIds: string[]
  ) => {
    try {
      // Para cada subcategoria, atualizar apenas o subcategory_order
      for (let index = 0; index < reorderedSubcategoryIds.length; index++) {
        const id = reorderedSubcategoryIds[index];
        const newOrder = (index + 1) * 10;

        const { error } = await supabase
          .from('equipment_categories')
          .update({ subcategory_order: newOrder })
          .eq('id', id);

        if (error) throw error;
      }

      toast({
        title: 'Ordem atualizada',
        description: 'Subcategorias reordenadas com sucesso',
      });

      await refetch();
    } catch (error) {
      logger.error('Error reordering subcategories', {
        module: 'category-management',
        action: 'reorder_subcategories',
        error,
      });
      toast({
        title: 'Erro',
        description: 'Erro ao reordenar subcategorias',
        variant: 'destructive',
      });
    }
  };

  // Handler para drag end de categorias
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = hierarchy.findIndex(cat => cat.categoryName === active.id);
      const newIndex = hierarchy.findIndex(cat => cat.categoryName === over.id);

      const reordered = arrayMove(hierarchy, oldIndex, newIndex);
      const categoryNames = reordered.map(cat => cat.categoryName);
      reorderCategories(categoryNames);
    }
  };

  // Handler para drag end de subcategorias
  const handleSubcategoryDragEnd = (categoryName: string) => (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const category = hierarchy.find(cat => cat.categoryName === categoryName);
      if (!category) return;

      const oldIndex = category.subcategories.findIndex(sub => sub.id === active.id);
      const newIndex = category.subcategories.findIndex(sub => sub.id === over.id);

      const reordered = arrayMove(category.subcategories, oldIndex, newIndex);
      const subcategoryIds = reordered.map(sub => sub.id);
      reorderSubcategories(categoryName, subcategoryIds);
    }
  };

  const openEditDialog = (
    type: 'category' | 'subcategory',
    categoryName: string,
    subcategoryName?: string,
    subcategoryId?: string
  ) => {
    setEditingItem({
      type,
      id: subcategoryId,
      categoryName,
      subcategoryName,
    });

    if (type === 'category') {
      setNewCategoryName(categoryName);
    } else {
      setNewSubcategoryName(subcategoryName || '');
    }

    setShowEditDialog(true);
  };

  const openDeleteDialog = async (
    type: 'category' | 'subcategory',
    categoryName: string,
    subcategoryName?: string,
    subcategoryId?: string
  ) => {
    let usageCount = 0;

    if (type === 'subcategory' && subcategoryName) {
      usageCount = await getCategoryUsageCount(categoryName, subcategoryName);
    } else {
      // Count total usage for entire category
      const cat = hierarchy.find(c => c.categoryName === categoryName);
      if (cat) {
        const counts = await Promise.all(
          cat.subcategories.map(sub => getCategoryUsageCount(categoryName, sub.name))
        );
        usageCount = counts.reduce((sum, count) => sum + count, 0);
      }
    }

    setDeleteTarget({
      type,
      id: subcategoryId,
      name: subcategoryName || categoryName,
      categoryName: type === 'subcategory' ? categoryName : undefined,
      usageCount,
    });

    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.usageCount > 0) {
      toast({
        title: 'Não é possível deletar',
        description: `${deleteTarget.usageCount} equipamentos usam esta ${deleteTarget.type === 'category' ? 'categoria' : 'subcategoria'}`,
        variant: 'destructive',
      });
      return;
    }

    const result = deleteTarget.type === 'category'
      ? await deleteCategoryWithSubcategories(deleteTarget.name)
      : await deleteSubcategory(deleteTarget.id!);

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: `${deleteTarget.type === 'category' ? 'Categoria' : 'Subcategoria'} deletada com sucesso`,
      });
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      refetch();
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div
        style={{
          border: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface))',
          padding: 24,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Loader2 size={20} strokeWidth={1.5} className="animate-spin" style={{ color: 'hsl(var(--ds-fg-3))' }} />
      </div>
    );
  }

  return (
    <>
      <div style={{ position: 'relative', flex: 1 }}>
        <Search
          size={14}
          strokeWidth={1.5}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'hsl(var(--ds-fg-3))',
            pointerEvents: 'none',
          }}
        />
        <Input
          placeholder="Buscar categorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div
        style={{
          border: '1px solid hsl(var(--ds-line-1))',
          background: 'hsl(var(--ds-surface))',
          marginTop: 14,
        }}
      >
        <div style={{ padding: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Drag-and-drop para categorias principais */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoryDragEnd}
            >
              <SortableContext
                items={filteredHierarchy.map(cat => cat.categoryName)}
                strategy={verticalListSortingStrategy}
              >
                {filteredHierarchy.map((cat) => {
                  const isExpanded = expandedCategories.has(cat.categoryName);
                  const Icon = getCategoryIcon(cat.categoryName);

                  return (
                    <SortableCategoryItem key={cat.categoryName} id={cat.categoryName}>
                      <Collapsible
                        style={{ flex: 1 }}
                        open={isExpanded}
                        onOpenChange={() => toggleCategory(cat.categoryName)}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            border: '1px solid hsl(var(--ds-line-1))',
                            background: 'hsl(var(--ds-surface))',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="btn"
                                style={{ width: 24, height: 24, padding: 0, justifyContent: 'center' }}
                              >
                                <ChevronRight
                                  size={14}
                                  strokeWidth={1.5}
                                  style={{
                                    transition: 'transform 0.15s ease',
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    color: 'hsl(var(--ds-fg-3))',
                                  }}
                                />
                              </button>
                            </CollapsibleTrigger>

                            <Icon size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))' }} />
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                              {cat.categoryName}
                            </span>
                            <span className="pill muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {cat.subcategories.length} {cat.subcategories.length === 1 ? 'subcategoria' : 'subcategorias'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="btn"
                              style={iconBtnStyle}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog('category', cat.categoryName);
                              }}
                            >
                              <Pencil size={13} strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              className="btn"
                              style={{
                                ...iconBtnStyle,
                                color: 'hsl(var(--ds-danger))',
                                borderColor: 'hsl(var(--ds-danger) / 0.3)',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog('category', cat.categoryName);
                              }}
                            >
                              <Trash2 size={13} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div
                            style={{
                              marginLeft: 32,
                              marginTop: 8,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            {/* Drag-and-drop para subcategorias */}
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleSubcategoryDragEnd(cat.categoryName)}
                            >
                              <SortableContext
                                items={cat.subcategories.map(sub => sub.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {cat.subcategories.map((sub) => (
                                  <SortableSubcategoryItem key={sub.id} id={sub.id}>
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 10px',
                                        border: '1px solid hsl(var(--ds-line-1))',
                                        background: 'hsl(var(--ds-line-2) / 0.3)',
                                        flex: 1,
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <FileText size={13} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
                                        <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>{sub.name}</span>
                                        {sub.usageCount > 0 && (
                                          <StatusPill label={`${sub.usageCount} equipamentos`} tone="muted" />
                                        )}
                                      </div>

                                      <div style={{ display: 'flex', gap: 4 }}>
                                        <button
                                          type="button"
                                          className="btn"
                                          style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                                          onClick={() => openEditDialog('subcategory', cat.categoryName, sub.name, sub.id)}
                                        >
                                          <Pencil size={12} strokeWidth={1.5} />
                                        </button>
                                        <button
                                          type="button"
                                          className="btn"
                                          style={{
                                            width: 28,
                                            height: 28,
                                            padding: 0,
                                            justifyContent: 'center',
                                            color: 'hsl(var(--ds-danger))',
                                            borderColor: 'hsl(var(--ds-danger) / 0.3)',
                                          }}
                                          onClick={() => openDeleteDialog('subcategory', cat.categoryName, sub.name, sub.id)}
                                        >
                                          <Trash2 size={12} strokeWidth={1.5} />
                                        </button>
                                      </div>
                                    </div>
                                  </SortableSubcategoryItem>
                                ))}
                              </SortableContext>
                            </DndContext>

                            <button
                              type="button"
                              className="btn"
                              style={{ width: '100%', justifyContent: 'center' }}
                              onClick={() => {
                                setSelectedCategory(cat.categoryName);
                                setShowAddSubcategoryDialog(true);
                              }}
                            >
                              <Plus size={13} strokeWidth={1.5} />
                              <span>Adicionar Subcategoria</span>
                            </button>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </SortableCategoryItem>
                  );
                })}
              </SortableContext>
            </DndContext>

            {filteredHierarchy.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 0',
                  fontSize: 13,
                  color: 'hsl(var(--ds-fg-3))',
                }}
              >
                Nenhuma categoria encontrada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog: Nova Categoria Principal */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="ds-shell">
          <DialogHeader>
            <DialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>Nova Categoria Principal</span>
            </DialogTitle>
            <DialogDescription>
              Crie uma nova categoria principal. Adicione subcategorias depois através do botão dentro de cada categoria.
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="category" style={eyebrowStyle}>Nome da Categoria *</label>
              <Input
                id="category"
                placeholder="Ex: Drone, Estabilizador, Monitor..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="category-icon" style={eyebrowStyle}>Ícone da Categoria (opcional)</label>
              <Select
                value={newCategoryIcon}
                onValueChange={setNewCategoryIcon}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Camera">Câmera</SelectItem>
                  <SelectItem value="Video">Vídeo</SelectItem>
                  <SelectItem value="Mic2">Áudio</SelectItem>
                  <SelectItem value="Lightbulb">Iluminação</SelectItem>
                  <SelectItem value="Monitor">Monitor</SelectItem>
                  <SelectItem value="HardDrive">Armazenamento</SelectItem>
                  <SelectItem value="Zap">Elétrica</SelectItem>
                  <SelectItem value="Package">Acessórios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowAddCategoryDialog(false);
                setNewCategoryName('');
                setNewCategoryIcon('');
              }}
            >
              Cancelar
            </button>
            <button type="button" className="btn primary" onClick={handleAddCategory}>
              Criar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Adicionar Subcategoria */}
      <Dialog open={showAddSubcategoryDialog} onOpenChange={setShowAddSubcategoryDialog}>
        <DialogContent className="ds-shell">
          <DialogHeader>
            <DialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>Adicionar Subcategoria</span>
            </DialogTitle>
            <DialogDescription>
              {selectedCategory
                ? `Adicionar subcategoria à categoria "${selectedCategory}"`
                : 'Adicionar subcategoria a uma categoria existente'}
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label htmlFor="select-category" style={eyebrowStyle}>Categoria *</label>
              <Select
                value={selectedCategory || ''}
                onValueChange={setSelectedCategory}
                disabled={!!selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {hierarchy
                    .map((cat) => (
                      <SelectItem key={cat.categoryName} value={cat.categoryName}>
                        {cat.categoryName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="new-subcategory" style={eyebrowStyle}>Nome da Subcategoria *</label>
              <Input
                id="new-subcategory"
                placeholder={getSubcategoryPlaceholder(selectedCategory)}
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowAddSubcategoryDialog(false);
                setSelectedCategory(null);
                setNewSubcategoryName('');
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={handleAddSubcategoryToExisting}
              disabled={!selectedCategory}
            >
              Adicionar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="ds-shell">
          <DialogHeader>
            <DialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>
                {editingItem?.type === 'category' ? 'Renomear Categoria' : 'Renomear Subcategoria'}
              </span>
            </DialogTitle>
            <DialogDescription>
              {editingItem?.type === 'category'
                ? 'Isso irá renomear todas as subcategorias e equipamentos associados'
                : `Renomear subcategoria da categoria "${editingItem?.categoryName}"`}
            </DialogDescription>
          </DialogHeader>

          {editingItem?.type === 'category' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '10px 12px',
                  border: '1px solid hsl(var(--ds-warning) / 0.3)',
                  background: 'hsl(var(--ds-warning) / 0.08)',
                }}
              >
                <AlertTriangle
                  size={14}
                  strokeWidth={1.5}
                  style={{ color: 'hsl(var(--ds-warning))', flexShrink: 0, marginTop: 2 }}
                />
                <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>
                  Atenção: Isso irá atualizar todos os equipamentos desta categoria
                </span>
              </div>
              <div>
                <label htmlFor="edit-category" style={eyebrowStyle}>Novo Nome da Categoria *</label>
                <Input
                  id="edit-category"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={eyebrowStyle}>Categoria</label>
                <Input value={editingItem?.categoryName || ''} disabled />
              </div>
              <div>
                <label htmlFor="edit-subcategory" style={eyebrowStyle}>Novo Nome da Subcategoria *</label>
                <Input
                  id="edit-subcategory"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setShowEditDialog(false);
                setEditingItem(null);
                setNewCategoryName('');
                setNewSubcategoryName('');
              }}
            >
              Cancelar
            </button>
            <button type="button" className="btn primary" onClick={handleEdit}>
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Deletar */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title={`Deletar ${deleteTarget?.type === 'category' ? 'Categoria' : 'Subcategoria'}?`}
        description={
          deleteTarget?.usageCount && deleteTarget.usageCount > 0
            ? `Esta ${deleteTarget.type === 'category' ? 'categoria' : 'subcategoria'} está sendo usada por ${deleteTarget.usageCount} equipamentos e não pode ser deletada.`
            : deleteTarget?.type === 'category'
            ? `Deletar a categoria "${deleteTarget?.name}" irá remover todas as suas subcategorias. Tem certeza?`
            : `Tem certeza que deseja deletar a subcategoria "${deleteTarget?.name}"?`
        }
        confirmText="Deletar"
        variant="destructive"
      />
    </>
  );
}
