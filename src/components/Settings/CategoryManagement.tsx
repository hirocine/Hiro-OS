import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Loader2, Plus, Pencil, Trash2, Search, Folder, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

    const result = newSubcategoryName.trim()
      ? await addSubcategory(newCategoryName, newSubcategoryName)
      : await addCategoryOnly(newCategoryName);

    if (result.success) {
      toast({
        title: 'Sucesso',
        description: newSubcategoryName 
          ? 'Categoria e subcategoria criadas com sucesso' 
          : 'Categoria criada com sucesso'
      });
      setShowAddCategoryDialog(false);
      setNewCategoryName('');
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
        <CardHeader>
          <CardTitle>Gerenciamento de Categorias</CardTitle>
          <CardDescription>
            Organize categorias e subcategorias de forma hierárquica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="flex gap-2">
              <Button onClick={() => setShowAddCategoryDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setSelectedCategory(null);
                  setShowAddSubcategoryDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Subcategoria
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredHierarchy.map((cat) => {
              const isExpanded = expandedCategories.has(cat.categoryName);
              
              return (
                <Collapsible
                  key={cat.categoryName}
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
                      
                      <Folder className="h-4 w-4 text-primary" />
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
                      {cat.subcategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{sub.name}</span>
                            {sub.usageCount > 0 && (
                              <Badge variant="outline">{sub.usageCount} equipamentos</Badge>
                            )}
                          </div>

                          <div className="flex gap-2">
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
                      ))}

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
              );
            })}

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
              Crie uma nova categoria. Você pode adicionar uma subcategoria agora ou depois.
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
              <Label htmlFor="subcategory">Subcategoria (opcional)</Label>
              <Input
                id="subcategory"
                placeholder="Ex: FPV, Racing, Gimbal..."
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Deixe em branco para criar apenas a categoria
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>
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
                placeholder="Ex: FPV, Racing, Gimbal..."
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