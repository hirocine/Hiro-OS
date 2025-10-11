import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MobileStepperForm } from '@/components/ui/mobile-stepper-form';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { getAvatarData } from "@/lib/avatarUtils";
import { CalendarIcon, ArrowLeft, Camera, Package, Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';
import { useEquipment } from '@/hooks/useEquipment';
import { useProjects } from '@/hooks/useProjects';
import { Equipment } from '@/types/equipment';
import { logger } from '@/lib/logger';

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
    lenses: Equipment[];
    cameraAccessories: Equipment[];
    tripods: Equipment[];
    lights: Equipment[];
    lightModifiers: Equipment[];
    machinery: Equipment[];
    electrical: Equipment[];
    storage: Equipment[];
    computers: Equipment[];
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

export default function ProjectWithdrawal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { users, loading: usersLoading } = useUsers();
  const { equipmentHierarchy, loading: equipmentLoading } = useEquipment();
  const { addProject } = useProjects();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      lenses: [],
      cameraAccessories: [],
      tripods: [],
      lights: [],
      lightModifiers: [],
      machinery: [],
      electrical: [],
      storage: [],
      computers: [],
    },
  });

  const updateField = <K extends keyof WithdrawalData>(field: K, value: WithdrawalData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

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

  const flattenSelectedEquipment = (): Equipment[] => {
    const equipment: Equipment[] = [];
    
    data.selectedEquipment.cameras.forEach(({ camera, accessories }) => {
      equipment.push(camera);
      equipment.push(...accessories);
    });
    
    equipment.push(...data.selectedEquipment.lenses);
    equipment.push(...data.selectedEquipment.cameraAccessories);
    equipment.push(...data.selectedEquipment.tripods);
    equipment.push(...data.selectedEquipment.lights);
    equipment.push(...data.selectedEquipment.lightModifiers);
    equipment.push(...data.selectedEquipment.machinery);
    equipment.push(...data.selectedEquipment.electrical);
    equipment.push(...data.selectedEquipment.storage);
    equipment.push(...data.selectedEquipment.computers);
    
    return equipment;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    const selectedUser = users.find(u => u.id === data.responsibleUserId);
    const selectedEquipment = flattenSelectedEquipment();
    
    const projectData = {
      name: `${data.projectNumber} - ${data.company}: ${data.projectName}`,
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
      equipmentCount: selectedEquipment.length,
      loanIds: []
    };

    try {
      await addProject(projectData, selectedEquipment);
      
      toast({
        title: "Retirada criada com sucesso",
        description: `Projeto "${data.projectNumber}" criado com ${selectedEquipment.length} equipamentos.`,
      });
      
      navigate('/projects');
    } catch (error) {
      logger.error('Error creating withdrawal', {
        module: 'withdrawal-page',
        action: 'create_withdrawal_error',
        error
      });
      toast({
        title: "Erro",
        description: "Erro ao criar nova retirada. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0: // Project info
        return data.projectNumber.trim() !== '' && 
               data.company.trim() !== '' && 
               data.projectName.trim() !== '' &&
               /^\d{1,4}$/.test(data.projectNumber.trim());
      case 1: // Responsible
        return data.responsibleUserId !== '';
      case 2: // Dates
        return data.withdrawalDate && 
               data.returnDate && 
               data.separationDate &&
               data.returnDate >= data.withdrawalDate;
      case 3: // Recording type
        return data.recordingType !== '';
      case 4: // Cameras
        return data.selectedEquipment.cameras.length === data.selectedEquipment.cameraQuantity;
      case 5: // Summary
        return true;
      default:
        return true;
    }
  };

  const steps = [
    {
      id: 'project-info',
      title: 'Informações do Projeto',
      content: (
        <div className="space-y-6">
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
            <p className="text-xs text-muted-foreground mt-1">
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
      )
    },
    {
      id: 'responsible',
      title: 'Responsável',
      content: (
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
                {users.map((user) => {
                  const avatarData = getAvatarData(
                    { 
                      app_metadata: { provider: user.user_metadata?.provider || 'email' },
                      user_metadata: user.user_metadata || {},
                      email: user.email
                    } as any,
                    user.avatar_url,
                    user.display_name
                  );
                  
                  return (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={avatarData.url || undefined} alt={user.display_name || user.email} />
                          <AvatarFallback>{avatarData.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
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
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {data.responsibleUserId && (() => {
            const selectedUser = users.find(u => u.id === data.responsibleUserId);
            return selectedUser ? (
              <div className="p-3 bg-muted rounded-lg space-y-1">
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
              </div>
            ) : null;
          })()}
        </div>
      )
    },
    {
      id: 'dates',
      title: 'Datas',
      content: (
        <div className="space-y-4">
          <div>
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
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data.separationDate}
                  onSelect={(date) => updateField('separationDate', date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
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
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data.withdrawalDate}
                  onSelect={(date) => updateField('withdrawalDate', date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
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
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={data.returnDate}
                  onSelect={(date) => updateField('returnDate', date)}
                  locale={ptBR}
                  disabled={(date) => data.withdrawalDate ? date < data.withdrawalDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )
    },
    {
      id: 'recording-type',
      title: 'Tipo de Gravação',
      content: (
        <div className="space-y-4">
          <Label>Tipo de Gravação *</Label>
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
      )
    },
    {
      id: 'cameras',
      title: 'Câmeras',
      content: (
        <div className="space-y-4">
          <div>
            <Label>Quantidade de Câmeras</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={data.selectedEquipment.cameraQuantity}
              onChange={(e) => {
                const quantity = parseInt(e.target.value) || 1;
                updateField('selectedEquipment', {
                  ...data.selectedEquipment,
                  cameraQuantity: quantity
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Câmeras Selecionadas ({data.selectedEquipment.cameras.length}/{data.selectedEquipment.cameraQuantity})</Label>
            {data.selectedEquipment.cameras.map(({ camera, accessories }) => (
              <Card key={camera.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <div>
                        <CardTitle className="text-sm">{camera.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{camera.brand}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCameraDeselect(camera.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {accessories.length > 0 && (
                  <CardContent className="pt-0">
                    <Badge variant="secondary">+{accessories.length} acessórios</Badge>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {data.selectedEquipment.cameras.length < data.selectedEquipment.cameraQuantity && (
            <div className="space-y-2">
              <Label>Câmeras Disponíveis</Label>
              {getAvailableCameras().map((cameraHierarchy) => (
                <Card 
                  key={cameraHierarchy.item.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleCameraSelect(cameraHierarchy)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{cameraHierarchy.item.name}</p>
                        <p className="text-sm text-muted-foreground">{cameraHierarchy.item.brand}</p>
                      </div>
                      {cameraHierarchy.accessories.length > 0 && (
                        <Badge variant="secondary">+{cameraHierarchy.accessories.length}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'summary',
      title: 'Resumo',
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Projeto:</strong> {data.projectNumber} - {data.company}: {data.projectName}</p>
              <p><strong>Responsável:</strong> {users.find(u => u.id === data.responsibleUserId)?.display_name}</p>
              <p><strong>Tipo:</strong> {data.recordingType}</p>
              <p><strong>Separação:</strong> {data.separationDate ? format(data.separationDate, 'dd/MM/yyyy') : '-'}</p>
              <p><strong>Retirada:</strong> {data.withdrawalDate ? format(data.withdrawalDate, 'dd/MM/yyyy') : '-'}</p>
              <p><strong>Devolução:</strong> {data.returnDate ? format(data.returnDate, 'dd/MM/yyyy') : '-'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equipamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Câmeras</span>
                  <Badge>{data.selectedEquipment.cameras.length}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total de equipamentos: {flattenSelectedEquipment().length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  return (
    <ResponsiveContainer maxWidth="4xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nova Retirada</h1>
            <p className="text-sm text-muted-foreground">
              Crie um novo projeto de retirada de equipamentos
            </p>
          </div>
        </div>

        <MobileStepperForm
          steps={steps}
          currentStep={currentStep}
          onStepChange={(step) => {
            if (step > currentStep && !isStepValid(currentStep)) {
              toast({
                title: "Atenção",
                description: "Preencha todos os campos obrigatórios antes de continuar.",
                variant: "destructive"
              });
              return;
            }
            setCurrentStep(step);
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitText="Criar Retirada"
        />
      </div>
    </ResponsiveContainer>
  );
}
