import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Lock, Search } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

export function CategoryManagement() {
  const { categories, loading, addCustomCategory, updateCategory, deleteCategory, getCategoryUsageCount } = useCategories();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    category: string;
    subcategory: string;
  } | null>(null);
  
  const [usageCount, setUsageCount] = useState(0);
  
  const [formData, setFormData] = useState({
    category: '',
    subcategory: ''
  });

  const filteredCategories = categories.filter(cat => 
    cat.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!formData.category || !formData.subcategory) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha categoria e subcategoria',
        variant: 'destructive'
      });
      return;
    }

    const result = await addCustomCategory(formData.category, formData.subcategory);
    
    if (result.success) {
      toast({
        title: 'Categoria adicionada',
        description: `${formData.category} - ${formData.subcategory} foi criada com sucesso`
      });
      setShowAddDialog(false);
      setFormData({ category: '', subcategory: '' });
    } else {
      toast({
        title: 'Erro ao adicionar categoria',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedCategory || !formData.category || !formData.subcategory) return;

    const result = await updateCategory(
      selectedCategory.id,
      formData.category,
      formData.subcategory
    );
    
    if (result.success) {
      toast({
        title: 'Categoria atualizada',
        description: 'A categoria foi atualizada com sucesso'
      });
      setShowEditDialog(false);
      setSelectedCategory(null);
      setFormData({ category: '', subcategory: '' });
    } else {
      toast({
        title: 'Erro ao atualizar categoria',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (cat: typeof categories[0]) => {
    setSelectedCategory({
      id: cat.id,
      category: cat.category,
      subcategory: cat.subcategory
    });
    setFormData({
      category: cat.category,
      subcategory: cat.subcategory
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = async (cat: typeof categories[0]) => {
    const count = await getCategoryUsageCount(cat.category, cat.subcategory);
    setUsageCount(count);
    setSelectedCategory({
      id: cat.id,
      category: cat.category,
      subcategory: cat.subcategory
    });
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    const result = await deleteCategory(selectedCategory.id);
    
    if (result.success) {
      toast({
        title: 'Categoria deletada',
        description: 'A categoria foi removida com sucesso'
      });
      setShowDeleteDialog(false);
      setSelectedCategory(null);
      setUsageCount(0);
    } else {
      toast({
        title: 'Erro ao deletar categoria',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Categorias</CardTitle>
        <CardDescription>
          Adicione, edite ou remova categorias e subcategorias de equipamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>

        {filteredCategories.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nenhuma categoria encontrada"
            description={searchTerm ? "Tente ajustar os filtros de busca" : "Adicione sua primeira categoria personalizada"}
            action={!searchTerm ? {
              label: "Adicionar Categoria",
              onClick: () => setShowAddDialog(true)
            } : undefined}
          />
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Subcategoria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      {cat.isCustom ? (
                        <Badge variant="secondary">Customizada</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Sistema
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{cat.category}</TableCell>
                    <TableCell>{cat.subcategory}</TableCell>
                    <TableCell className="text-right">
                      {cat.isCustom ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(cat)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(cat)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Bloqueado</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria e subcategoria para seus equipamentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Input
                id="category"
                placeholder="Ex: Drone, Estabilizador..."
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoria *</Label>
              <Input
                id="subcategory"
                placeholder="Ex: FPV, Racing, Gimbal..."
                value={formData.subcategory}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize o nome da categoria ou subcategoria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Categoria *</Label>
              <Input
                id="edit-category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subcategory">Subcategoria *</Label>
              <Input
                id="edit-subcategory"
                value={formData.subcategory}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Deletar Categoria?"
        description={
          usageCount > 0
            ? `Esta categoria está sendo usada por ${usageCount} equipamento(s). Ao deletar, esses equipamentos precisarão ser recategorizados.`
            : `Tem certeza que deseja deletar a categoria "${selectedCategory?.category} - ${selectedCategory?.subcategory}"?`
        }
        confirmText="Deletar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </Card>
  );
}
