import { useState } from 'react';
import { Project, ProjectStep } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useProjectEquipment } from '@/hooks/useProjectEquipment';
import { useSeparationChecklist } from '@/hooks/useSeparationChecklist';
import { Package, CheckCircle, AlertTriangle, Camera, Mic, Lightbulb, Settings, HardDrive } from 'lucide-react';

interface SeparationConfirmationDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (projectId: string, newStep: ProjectStep, notes?: string) => void;
}

const categoryIcons: Record<string, any> = {
  camera: Camera,
  audio: Mic,
  lighting: Lightbulb,
  accessories: Settings,
  storage: HardDrive,
};

const categoryLabels: Record<string, string> = {
  camera: 'Câmeras',
  audio: 'Áudio',
  lighting: 'Iluminação',
  accessories: 'Acessórios',
  storage: 'Armazenamento',
};

export function SeparationConfirmationDialog({ 
  project, 
  open, 
  onOpenChange, 
  onConfirm 
}: SeparationConfirmationDialogProps) {
  const [notes, setNotes] = useState('');
  
  const { equipment, loading, error } = useProjectEquipment(project?.id || '');
  
  // Transform equipment data for the checklist
  console.log('📋 SeparationConfirmationDialog - Original equipment data:', equipment);
  
  const equipmentData = equipment.map(eq => ({
    id: eq.id,
    name: eq.name,
    category: eq.category,
    itemType: eq.itemType,
    parentId: eq.parentId,
    patrimonyNumber: eq.patrimonyNumber,
    brand: eq.brand
  }));
  
  console.log('📋 SeparationConfirmationDialog - Transformed equipment data:', equipmentData);

  const {
    categorizedEquipment,
    checkedItems,
    allItemsChecked,
    checkedCount,
    totalCount,
    toggleItem,
    toggleMainItemWithAccessories,
    allAccessoriesChecked,
    getAccessoriesForItem
  } = useSeparationChecklist(equipmentData);

  if (!project) return null;

  const handleConfirm = () => {
    if (!allItemsChecked) return;
    
    onConfirm(project.id, 'separated', notes.trim() || undefined);
    onOpenChange(false);
    setNotes('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setNotes('');
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Confirmar Separação dos Equipamentos
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando equipamentos...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Confirmar Separação dos Equipamentos
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar equipamentos: {error}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={handleCancel}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Confirmar Separação dos Equipamentos
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Projeto: <span className="font-medium">{project.name}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Badge variant={allItemsChecked ? "default" : "outline"}>
              {checkedCount}/{totalCount} itens confirmados
            </Badge>
            {allItemsChecked && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                Todos os itens confirmados
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {categorizedEquipment.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum equipamento encontrado para este projeto.
                </AlertDescription>
              </Alert>
            ) : (
              categorizedEquipment.map((category) => {
                const CategoryIcon = categoryIcons[category.category] || Settings;
                const mainItems = category.items.filter(item => item.itemType === 'main');
                
                return (
                  <div key={category.category} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">
                        {categoryLabels[category.category] || category.category}
                      </h3>
                      <Badge variant="outline">
                        {category.items.length} {category.items.length === 1 ? 'item' : 'itens'}
                      </Badge>
                    </div>

                    <div className="space-y-2 ml-2">
                      {mainItems.map((mainItem) => {
                        const accessories = getAccessoriesForItem(mainItem.id);
                        const mainItemChecked = checkedItems[mainItem.id];
                        const allAccessoriesCheckedForItem = allAccessoriesChecked(mainItem.id);
                        
                        return (
                          <div key={mainItem.id} className="space-y-2">
                            {/* Main Item */}
                            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-background hover:bg-accent/50 transition-colors">
                              <Checkbox
                                id={mainItem.id}
                                checked={mainItemChecked}
                                onCheckedChange={() => toggleMainItemWithAccessories(mainItem.id)}
                                className="flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <Label 
                                  htmlFor={mainItem.id} 
                                  className="font-medium cursor-pointer block truncate"
                                >
                                  {mainItem.name}
                                </Label>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  {mainItem.brand && (
                                    <span>{mainItem.brand}</span>
                                  )}
                                  {mainItem.patrimonyNumber && (
                                    <span>• #{mainItem.patrimonyNumber}</span>
                                  )}
                                  {accessories.length > 0 && (
                                    <span>• {accessories.length} acessório{accessories.length > 1 ? 's' : ''}</span>
                                  )}
                                </div>
                              </div>
                              {mainItemChecked && allAccessoriesCheckedForItem && (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>

                            {/* Accessories */}
                            {accessories.length > 0 && (
                              <div className="ml-6 space-y-1">
                                {accessories.map((accessory) => (
                                  <div
                                    key={accessory.id}
                                    className="flex items-center space-x-3 p-2 border border-dashed rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                                  >
                                    <Checkbox
                                      id={accessory.id}
                                      checked={checkedItems[accessory.id] || false}
                                      onCheckedChange={() => toggleItem(accessory.id)}
                                      className="flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <Label 
                                        htmlFor={accessory.id} 
                                        className="text-sm cursor-pointer block truncate"
                                      >
                                        {accessory.name}
                                      </Label>
                                      {accessory.patrimonyNumber && (
                                        <span className="text-xs text-muted-foreground">
                                          #{accessory.patrimonyNumber}
                                        </span>
                                      )}
                                    </div>
                                    {checkedItems[accessory.id] && (
                                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {category !== categorizedEquipment[categorizedEquipment.length - 1] && (
                      <Separator className="my-4" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-4 border-t">
          {!allItemsChecked && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Todos os equipamentos e acessórios devem ser confirmados antes de prosseguir com a separação.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="separation-notes">Observações da Separação (opcional)</Label>
            <Textarea
              id="separation-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre a separação dos equipamentos..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={!allItemsChecked}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirmar Separação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}