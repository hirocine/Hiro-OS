import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Camera, Package, Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { useEquipment } from '@/hooks/useEquipment';
import { Equipment } from '@/types/equipment';

interface NewWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

interface SelectedCamera {
  camera: Equipment;
  accessories: Equipment[];
}

interface WithdrawalData {
  projectNumber: string;
  company: string;
  projectName: string;
  responsibleUserId: string;
  withdrawalDate: Date | undefined;
  returnDate: Date | undefined;
  separationDate: Date | undefined;
  recordingType: string;
  selectedEquipment: {
    cameraQuantity: number;
    cameras: SelectedCamera[];
  };
}

const RECORDING_TYPES = [
  'Criativos/VSLs 🎬',
  'Entrevistas/Depoimentos 🎙️',
  'Documentários 🎥',
  'Aulas 📚',
  'Workshop/PGM 🧑‍🏫',
  'Institucionais 🏛️',
  'Eventos 🎤',
  'Fotografia 📸',
  'Live 🔴',
  'Publicidade 📺',
  'Appetite Appeal 🍫',
  'Making Of 🎞️'
];

export function NewWithdrawalDialog({ open, onOpenChange, onSubmit }: NewWithdrawalDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WithdrawalData>({
    projectNumber: '',
    company: '',
    projectName: '',
    responsibleUserId: '',
    withdrawalDate: undefined,
    returnDate: undefined,
    separationDate: undefined,
    recordingType: '',
    selectedEquipment: {
      cameraQuantity: 1,
      cameras: [],
    },
  });

  const { users, loading: usersLoading } = useUsers();
  const { toast } = useToast();
  const { equipmentHierarchy, loading: equipmentLoading } = useEquipment();

  const updateField = <K extends keyof WithdrawalData>(field: K, value: WithdrawalData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Get available cameras (main items, camera category, available status)
  const getAvailableCameras = () => {
    return equipmentHierarchy
      .filter(item => 
        item.item.category === 'camera' && 
        item.item.subcategory === 'Câmera' &&
        item.item.itemType === 'main' && 
        item.item.status === 'available' &&
        !data.selectedEquipment.cameras.some(selected => selected.camera.id === item.item.id)
      );
  };

  const handleCameraQuantityChange = (quantity: number) => {
    const currentQuantity = data.selectedEquipment.cameraQuantity;
    const selectedCameras = data.selectedEquipment.cameras;
    
    if (quantity < selectedCameras.length) {
      // Remove excess cameras
      const newCameras = selectedCameras.slice(0, quantity);
      updateField('selectedEquipment', {
        ...data.selectedEquipment,
        cameraQuantity: quantity,
        cameras: newCameras,
      });
    } else {
      updateField('selectedEquipment', {
        ...data.selectedEquipment,
        cameraQuantity: quantity,
      });
    }
  };

  const handleCameraSelect = (cameraHierarchy: { item: Equipment; accessories: Equipment[] }) => {
    const newSelectedCamera: SelectedCamera = {
      camera: cameraHierarchy.item,
      accessories: cameraHierarchy.accessories,
    };

    updateField('selectedEquipment', {
      ...data.selectedEquipment,
      cameras: [...data.selectedEquipment.cameras, newSelectedCamera],
    });
  };

  const handleCameraDeselect = (cameraId: string) => {
    const updatedCameras = data.selectedEquipment.cameras.filter(
      selected => selected.camera.id !== cameraId
    );
    
    updateField('selectedEquipment', {
      ...data.selectedEquipment,
      cameras: updatedCameras,
    });
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.projectNumber.trim() !== '' && 
               data.company.trim() !== '' && 
               data.projectName.trim() !== '' &&
               /^\d{1,4}$/.test(data.projectNumber.trim());
      case 2:
        return data.responsibleUserId !== '';
      case 3:
        return data.withdrawalDate && data.returnDate && data.separationDate;
      case 4:
        return data.recordingType !== '';
      case 5:
        return data.selectedEquipment.cameras.length === data.selectedEquipment.cameraQuantity;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStepValid()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const selectedUser = users.find(u => u.id === data.responsibleUserId);
    
    const projectData = {
      projectNumber: data.projectNumber,
      company: data.company,
      projectName: data.projectName,
      responsibleUserId: data.responsibleUserId,
      responsibleName: selectedUser?.display_name || selectedUser?.email || '',
      responsibleEmail: selectedUser?.email || '',
      department: selectedUser?.department || '',
      startDate: data.withdrawalDate?.toISOString().split('T')[0] || '',
      expectedEndDate: data.returnDate?.toISOString().split('T')[0] || '',
      withdrawalDate: data.withdrawalDate?.toISOString().split('T')[0] || '',
      separationDate: data.separationDate?.toISOString().split('T')[0] || '',
      recordingType: data.recordingType,
      status: 'active' as const,
      equipmentCount: 0,
      loanIds: []
    };

    try {
      await onSubmit(projectData);
      
      // Reset form
      setCurrentStep(1);
      setData({
        projectNumber: '',
        company: '',
        projectName: '',
        responsibleUserId: '',
        withdrawalDate: undefined,
        returnDate: undefined,
        separationDate: undefined,
        recordingType: '',
        selectedEquipment: {
          cameraQuantity: 1,
          cameras: [],
        },
      });
      
      onOpenChange(false);
      
      toast({
        title: "Sucesso",
        description: "Nova retirada criada com sucesso!",
      });
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar nova retirada. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Dados do Projeto</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="projectNumber">Número do Projeto *</Label>
                <Input
                  id="projectNumber"
                  value={data.projectNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    updateField('projectNumber', value);
                  }}
                  placeholder="Ex: 398"
                  maxLength={4}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Apenas números, máximo 4 dígitos
                </p>
              </div>

              <div>
                <Label htmlFor="company">Empresa *</Label>
                <Input
                  id="company"
                  value={data.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Ex: Hiro Films"
                />
              </div>

              <div>
                <Label htmlFor="projectName">Nome do Projeto *</Label>
                <Input
                  id="projectName"
                  value={data.projectName}
                  onChange={(e) => updateField('projectName', e.target.value)}
                  placeholder="Ex: Institucional"
                />
              </div>

              {data.projectNumber && data.company && data.projectName && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Nome final do projeto:</p>
                  <p className="text-sm text-muted-foreground">
                    {data.projectNumber} - {data.company}: {data.projectName}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Responsável pelo Projeto</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="responsible">Responsável *</Label>
                <Select 
                  value={data.responsibleUserId} 
                  onValueChange={(value) => updateField('responsibleUserId', value)}
                  disabled={usersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={usersLoading ? "Carregando usuários..." : "Selecione o responsável"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.display_name || user.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.department && user.position 
                              ? `${user.position} - ${user.department}`
                              : user.department || user.position || user.email
                            }
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {data.responsibleUserId && (
                <div className="p-3 bg-muted rounded-lg">
                  {(() => {
                    const selectedUser = users.find(u => u.id === data.responsibleUserId);
                    return selectedUser ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Dados do responsável:</p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Nome:</strong> {selectedUser.display_name || selectedUser.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Email:</strong> {selectedUser.email}
                        </p>
                        {selectedUser.department && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Departamento:</strong> {selectedUser.department}
                          </p>
                        )}
                        {selectedUser.position && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Cargo:</strong> {selectedUser.position}
                          </p>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Datas do Projeto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Separação *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !data.separationDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {data.separationDate ? format(data.separationDate, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data.separationDate}
                      onSelect={(date) => updateField('separationDate', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Retirada *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !data.withdrawalDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {data.withdrawalDate ? format(data.withdrawalDate, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data.withdrawalDate}
                      onSelect={(date) => updateField('withdrawalDate', date)}
                      disabled={(date) => data.separationDate && date < data.separationDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data de Devolução *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !data.returnDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {data.returnDate ? format(data.returnDate, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={data.returnDate}
                      onSelect={(date) => updateField('returnDate', date)}
                      disabled={(date) => data.withdrawalDate && date < data.withdrawalDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• A data de separação deve ser anterior à data de retirada</p>
              <p>• A data de devolução deve ser posterior à data de retirada</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Tipo de Gravação</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="recordingType">Tipo de Gravação *</Label>
                <Select 
                  value={data.recordingType} 
                  onValueChange={(value) => updateField('recordingType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de gravação" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECORDING_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {data.recordingType && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Tipo selecionado:</p>
                  <p className="text-sm text-muted-foreground">
                    {data.recordingType}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Seleção de Câmeras</h3>
            
            <div className="space-y-6">
              {/* Camera Quantity Selection */}
              <div className="space-y-3">
                <Label>Quantidade de Câmeras *</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCameraQuantityChange(Math.max(1, data.selectedEquipment.cameraQuantity - 1))}
                    disabled={data.selectedEquipment.cameraQuantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-mono text-lg font-semibold w-8 text-center">
                    {data.selectedEquipment.cameraQuantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCameraQuantityChange(Math.min(10, data.selectedEquipment.cameraQuantity + 1))}
                    disabled={data.selectedEquipment.cameraQuantity >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground ml-2">
                    (máximo 10 câmeras)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Cameras */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    <h4 className="font-medium">Câmeras Disponíveis</h4>
                    <Badge variant="secondary">
                      {getAvailableCameras().length} disponíveis
                    </Badge>
                  </div>

                  {equipmentLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : getAvailableCameras().length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="text-center text-sm text-muted-foreground">
                          <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma câmera disponível
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {getAvailableCameras().map((cameraHierarchy) => (
                        <Card 
                          key={cameraHierarchy.item.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors border-2 hover:border-primary/20"
                          onClick={() => 
                            data.selectedEquipment.cameras.length < data.selectedEquipment.cameraQuantity && 
                            handleCameraSelect(cameraHierarchy)
                          }
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                {cameraHierarchy.item.image ? (
                                  <img 
                                    src={cameraHierarchy.item.image} 
                                    alt={cameraHierarchy.item.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Camera className="h-6 w-6 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1 flex-1 min-w-0 mr-3">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="font-medium text-sm truncate">
                                        {cameraHierarchy.item.name}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{cameraHierarchy.item.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <p className="text-xs text-muted-foreground">
                                    {cameraHierarchy.item.brand}
                                  </p>
                                  {cameraHierarchy.accessories.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Package className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {cameraHierarchy.accessories.length} acessórios
                                      </span>
                                    </div>
                                  )}
                                </div>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={data.selectedEquipment.cameras.length >= data.selectedEquipment.cameraQuantity}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCameraSelect(cameraHierarchy);
                                    }}
                                  >
                                    Selecionar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Cameras Preview */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">Câmeras Selecionadas</h4>
                    <Badge variant="default">
                      {data.selectedEquipment.cameras.length} / {data.selectedEquipment.cameraQuantity}
                    </Badge>
                  </div>

                  {data.selectedEquipment.cameras.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="text-center text-sm text-muted-foreground">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          Nenhuma câmera selecionada
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {data.selectedEquipment.cameras.map((selectedCamera) => (
                        <Card key={selectedCamera.camera.id} className="border-primary/20">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <Check className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <CardTitle className="text-sm">{selectedCamera.camera.name}</CardTitle>
                                  <p className="text-xs text-muted-foreground">
                                    {selectedCamera.camera.brand}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleCameraDeselect(selectedCamera.camera.id)}
                              >
                                Remover
                              </Button>
                            </div>
                          </CardHeader>
                          {selectedCamera.accessories.length > 0 && (
                            <CardContent className="pt-0">
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Acessórios incluídos:
                                </p>
                                <div className="space-y-1">
                                  {selectedCamera.accessories.map((accessory) => (
                                    <div key={accessory.id} className="flex items-center gap-2 text-xs">
                                      <div className="w-1 h-1 bg-primary rounded-full" />
                                      <span>{accessory.name}</span>
                                      <span className="text-muted-foreground">({accessory.brand})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Summary */}
              {data.selectedEquipment.cameras.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h5 className="font-medium text-sm mb-2">Resumo da Seleção:</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Câmeras:</span>
                      <span className="ml-2 font-medium">
                        {data.selectedEquipment.cameras.length} / {data.selectedEquipment.cameraQuantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total acessórios:</span>
                      <span className="ml-2 font-medium">
                        {data.selectedEquipment.cameras.reduce((acc, cam) => acc + cam.accessories.length, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Retirada - Passo {currentStep} de 5</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2 mb-6">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>

            {renderStep()}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              
              {currentStep === 5 ? (
                <Button onClick={handleSubmit} disabled={!isStepValid()}>
                  <Check className="h-4 w-4 mr-2" />
                  Criar Retirada
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
