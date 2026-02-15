import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryIcon } from '@/lib/categoryIconMap';
import { logger } from '@/lib/logger';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Search, Folder, FileText, ChevronRight, AlertTriangle, ArrowUp, ArrowDown, Camera, Monitor, Mic2, Lightbulb, Package, Video, Zap, HardDrive, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

// Componente Sortable para Item de Categoria
function SortableCategoryItem({ 
  id, 
  children 
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
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      {children}
    </div>
  );
}

// Componente Sortable para Item de Subcategoria
function SortableSubcategoryItem({ 
  id, 
  children 
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
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded ml-2"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
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

export function CategoryManagement() {
  const { 
    categories,
    loading,
    getCategoriesHierarchy,
    addCategoryOnly,
    addSubcategory,
    updateCategory,
    renameCategory,
    deleteSubcategory,
    deleteCategoryWithSubcategories,
    getCategoryUsageCount,
    reorderSubcategory,
    syncOrdersWithMapping,
    refetch
  } = useCategories();

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Dialogs state
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
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
        variant: 'destructive'
      });
      return;
    }

    const result = await addCategoryOnly(newCategoryName, newCategoryIcon || null);

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso'
      });
      setShowAddCategoryDialog(false);
      setNewCategoryName('');
      setNewCategoryIcon('');
      refetch();
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const handleAddSubcategoryToExisting = async () => {
    if (!selectedCategory) {
      toast({
        title: 'Categoria obrigatória',
        description: 'Selecione uma categoria antes de adicionar a subcategoria',
        variant: 'destructive'
      });
      return;
    }

    if (!newSubcategoryName.trim()) {
      toast({
        title: 'Subcategoria obrigatória',
        description: 'Digite o nome da subcategoria',
        variant: 'destructive'
      });
      return;
    }

    const result = await addSubcategory(selectedCategory, newSubcategoryName);

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: 'Subcategoria adicionada com sucesso'
      });
      setShowAddSubcategoryDialog(false);
      setSelectedCategory(null);
      setNewSubcategoryName('');
      refetch();
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive'
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
          variant: 'destructive'
        });
        return;
      }

      const result = await renameCategory(editingItem.categoryName, newCategoryName);
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Categoria renomeada com sucesso'
        });
        setShowEditDialog(false);
        setEditingItem(null);
        setNewCategoryName('');
        refetch();
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive'
        });
      }
    } else {
      if (!newSubcategoryName.trim()) {
        toast({
          title: 'Nome obrigatório',
          description: 'Digite o novo nome da subcategoria',
          variant: 'destructive'
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
          description: 'Subcategoria renomeada com sucesso'
        });
        setShowEditDialog(false);
        setEditingItem(null);
        setNewSubcategoryName('');
        refetch();
      } else {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive'
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
        description: 'Categorias reordenadas com sucesso'
      });
      
      await refetch();
    } catch (error) {
      logger.error('Error reordering categories', {
        module: 'category-management',
        action: 'reorder_categories',
        error
      });
      toast({
        title: 'Erro',
        description: 'Erro ao reordenar categorias',
        variant: 'destructive'
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
        description: 'Subcategorias reordenadas com sucesso'
      });
      
      await refetch();
    } catch (error) {
      logger.error('Error reordering subcategories', {
        module: 'category-management',
        action: 'reorder_subcategories',
        error
      });
      toast({
        title: 'Erro',
        description: 'Erro ao reordenar subcategorias',
        variant: 'destructive'
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
      subcategoryName
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
      usageCount
    });
    
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.usageCount > 0) {
      toast({
        title: 'Não é possível deletar',
        description: `${deleteTarget.usageCount} equipamentos usam esta ${deleteTarget.type === 'category' ? 'categoria' : 'subcategoria'}`,
        variant: 'destructive'
      });
      return;
    }

    const result = deleteTarget.type === 'category'
      ? await deleteCategoryWithSubcategories(deleteTarget.name)
      : await deleteSubcategory(deleteTarget.id!);

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: `${deleteTarget.type === 'category' ? 'Categoria' : 'Subcategoria'} deletada com sucesso`
      });
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      refetch();
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setShowAddCategoryDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova
            </Button>
          </div>

          <div className="space-y-2">
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
                        className="flex-1"
                        open={isExpanded}
                        onOpenChange={() => toggleCategory(cat.categoryName)}
                      >
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-2 flex-1">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <ChevronRight
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    isExpanded && "rotate-90"
                                  )}
                                />
                              </Button>
                            </CollapsibleTrigger>
                            
                            <Icon className="h-4 w-4 text-primary" />
                            <span className="font-medium">{cat.categoryName}</span>
                            <Badge variant="secondary">
                              {cat.subcategories.length} {cat.subcategories.length === 1 ? 'subcategoria' : 'subcategorias'}
                            </Badge>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog('category', cat.categoryName);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog('category', cat.categoryName);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="ml-8 mt-2 space-y-1">
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
                                    <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors flex-1">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span>{sub.name}</span>
                                        {sub.usageCount > 0 && (
                                          <Badge variant="outline">{sub.usageCount} equipamentos</Badge>
                                        )}
                                      </div>

                                      <div className="flex gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => openEditDialog('subcategory', cat.categoryName, sub.name, sub.id)}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => openDeleteDialog('subcategory', cat.categoryName, sub.name, sub.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </SortableSubcategoryItem>
                                ))}
                              </SortableContext>
                            </DndContext>

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedCategory(cat.categoryName);
                                setShowAddSubcategoryDialog(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Subcategoria
                            </Button>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </SortableCategoryItem>
                  );
                })}
              </SortableContext>
            </DndContext>

            {filteredHierarchy.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma categoria encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Nova Categoria Principal */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria Principal</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria principal. Adicione subcategorias depois através do botão dentro de cada categoria.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Nome da Categoria *</Label>
              <Input
                id="category"
                placeholder="Ex: Drone, Estabilizador, Monitor..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category-icon">Ícone da Categoria (opcional)</Label>
              <Select
                value={newCategoryIcon}
                onValueChange={setNewCategoryIcon}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ícone..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Camera">📷 Câmera</SelectItem>
                  <SelectItem value="Video">🎬 Vídeo</SelectItem>
                  <SelectItem value="Mic2">🎤 Áudio</SelectItem>
                  <SelectItem value="Lightbulb">💡 Iluminação</SelectItem>
                  <SelectItem value="Monitor">🖥️ Monitor</SelectItem>
                  <SelectItem value="HardDrive">💾 Armazenamento</SelectItem>
                  <SelectItem value="Zap">⚡ Elétrica</SelectItem>
                  <SelectItem value="Package">📦 Acessórios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddCategoryDialog(false);
              setNewCategoryName('');
              setNewCategoryIcon('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleAddCategory}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Adicionar Subcategoria */}
      <Dialog open={showAddSubcategoryDialog} onOpenChange={setShowAddSubcategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Subcategoria</DialogTitle>
            <DialogDescription>
              {selectedCategory 
                ? `Adicionar subcategoria à categoria "${selectedCategory}"`
                : 'Adicionar subcategoria a uma categoria existente'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="select-category">Categoria *</Label>
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
              <Label htmlFor="new-subcategory">Nome da Subcategoria *</Label>
              <Input
                id="new-subcategory"
                placeholder={getSubcategoryPlaceholder(selectedCategory)}
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddSubcategoryDialog(false);
                setSelectedCategory(null);
                setNewSubcategoryName('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSubcategoryToExisting}
              disabled={!selectedCategory}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem?.type === 'category' ? 'Renomear Categoria' : 'Renomear Subcategoria'}
            </DialogTitle>
            <DialogDescription>
              {editingItem?.type === 'category'
                ? 'Isso irá renomear todas as subcategorias e equipamentos associados'
                : `Renomear subcategoria da categoria "${editingItem?.categoryName}"`}
            </DialogDescription>
          </DialogHeader>
          
          {editingItem?.type === 'category' ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Atenção: Isso irá atualizar todos os equipamentos desta categoria
                </AlertDescription>
              </Alert>
              <div>
                <Label htmlFor="edit-category">Novo Nome da Categoria *</Label>
                <Input
                  id="edit-category"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Categoria</Label>
                <Input value={editingItem?.categoryName || ''} disabled />
              </div>
              <div>
                <Label htmlFor="edit-subcategory">Novo Nome da Subcategoria *</Label>
                <Input
                  id="edit-subcategory"
                  value={newSubcategoryName}
                  onChange={(e) => setNewSubcategoryName(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditDialog(false);
                setEditingItem(null);
                setNewCategoryName('');
                setNewSubcategoryName('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar</Button>
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