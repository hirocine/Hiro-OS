import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useProjectEquipment } from '@/features/projects';
import { useSeparationChecklist } from '@/hooks/useSeparationChecklist';
import { useProjectDetails } from '@/features/projects';
import { useToast } from '@/hooks/use-toast';
import { VerificationDialog } from '@/components/Projects/VerificationDialog';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle2, 
  CheckCircle, 
  AlertTriangle, 
  Camera, 
  Mic, 
  Lightbulb, 
  Settings, 
  HardDrive,
  ArrowLeft,
  Home,
  ClipboardCheck
} from 'lucide-react';
import { useCategoriesContext } from '@/contexts/CategoriesContext';

const categoryIcons: Record<string, any> = {
  camera: Camera,
  audio: Mic,
  lighting: Lightbulb,
  accessories: Settings,
  storage: HardDrive,
};

export default function ProjectVerification() {
  const { categories: dbCategories } = useCategoriesContext();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const { user } = useAuth();
  
  const { project } = useProjectDetails(id!);
  const { equipment, loading, error } = useProjectEquipment(id || '');
  const { updateProjectStep } = useProjectDetails(id!);
  
  // Transform equipment data for the checklist
  const equipmentData = equipment.map(eq => ({
    id: eq.id,
    name: eq.name,
    category: eq.category,
    itemType: eq.itemType,
    parentId: eq.parentId,
    patrimonyNumber: eq.patrimonyNumber,
    brand: eq.brand
  }));

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

  const handleConfirm = async () => {
    if (!allItemsChecked || !project) return;
    
    // Abrir o diálogo para selecionar usuário
    setShowVerificationDialog(true);
  };

  const handleVerificationConfirm = async (data: {
    userId: string;
    userName: string;
    timestamp: string;
  }) => {
    setIsSubmitting(true);
    try {
      await updateProjectStep('pending_verification', notes.trim() || undefined, {
        userId: data.userId,
        userName: data.userName,
        timestamp: data.timestamp
      });
      
      toast({
        title: "Verificação concluída",
        description: "A verificação dos equipamentos foi confirmada com sucesso.",
      });
      navigate(`/projetos/${id}`);
    } catch (error) {
      toast({
        title: "Erro ao confirmar verificação",
        description: "Não foi possível confirmar a verificação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setShowVerificationDialog(false);
    }
  };

  const handleCancel = () => {
    navigate(`/projetos/${id}`);
  };

  const progressPercentage = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg font-medium">Carregando equipamentos...</p>
            <p className="text-sm text-muted-foreground">Preparando lista de verificação</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <div className="text-center space-y-4 py-12">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-destructive">Erro ao Carregar</h1>
          <p className="text-muted-foreground">{error || 'Não foi possível carregar os dados do projeto.'}</p>
          <Button onClick={handleCancel}>Voltar ao Projeto</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 md:p-8 max-w-5xl space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6" />
              Check Desmontagem dos Equipamentos
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Home className="w-4 h-4" />
              <span>Projetos</span>
              <span>•</span>
              <span className="font-medium">{project.name}</span>
              <span>•</span>
              <span>Verificação</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={allItemsChecked ? "default" : "outline"} className="text-sm">
                {checkedCount}/{totalCount} itens verificados
              </Badge>
              {allItemsChecked && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Todos os itens verificados</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso da verificação</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <div className="space-y-6 mb-6">
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
              <Card key={category.category}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                    <span>{category.category}</span>
                    <Badge variant="outline">
                      {category.items.length} {category.items.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
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
                            <div 
                              className="flex-1 min-w-0 font-medium cursor-pointer" 
                              onClick={() => toggleMainItemWithAccessories(mainItem.id)}
                            >
                              <span className="block truncate">
                                {mainItem.name}
                                {accessories.length > 0 && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    • {accessories.length} acessório{accessories.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </span>
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
                                  className="flex items-center space-x-3 py-2 px-3 border border-dashed rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <Checkbox
                                    id={accessory.id}
                                    checked={checkedItems[accessory.id] || false}
                                    onCheckedChange={() => toggleItem(accessory.id)}
                                    className="flex-shrink-0"
                                  />
                                   <div 
                                     className="flex-1 min-w-0 text-sm cursor-pointer" 
                                     onClick={() => toggleItem(accessory.id)}
                                   >
                                     <span className="block truncate">
                                       {accessory.name}
                                     </span>
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
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Notes Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Observações da Verificação</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Adicione observações sobre o estado dos equipamentos após desmontagem... (opcional)"
            rows={4}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Alert */}
      {!allItemsChecked && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Todos os equipamentos e acessórios devem ser verificados antes de finalizar o projeto.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button 
          type="button" 
          onClick={handleConfirm}
          disabled={!allItemsChecked || isSubmitting}
          className="bg-success hover:bg-success/90 w-full sm:min-w-[200px] sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Finalizando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Finalizar Verificação
            </>
          )}
        </Button>
      </div>

      <VerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
        onConfirm={handleVerificationConfirm}
        loading={isSubmitting}
      />
    </div>
  );
}