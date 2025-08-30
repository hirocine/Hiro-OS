import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/hooks/use-toast';

interface NewWithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
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
}

const RECORDING_TYPES = [
  'Criativos/VSLs',
  'Entrevistas/Depoimentos',
  'Documentários',
  'Aulas',
  'Workshop/PGM',
  'Institucionais',
  'Eventos',
  'Fotografia',
  'Live',
  'Publicidade',
  'Appetite Appeal',
  'Making Of'
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
  });

  const { users, loading: usersLoading } = useUsers();
  const { toast } = useToast();

  const updateField = <K extends keyof WithdrawalData>(field: K, value: WithdrawalData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
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
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
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

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Retirada - Passo {currentStep} de 4</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div 
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(currentStep / 4) * 100}%` }}
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
            
            {currentStep === 4 ? (
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
  );
}
