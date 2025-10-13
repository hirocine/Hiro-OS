import React, { useState, useMemo } from 'react';
import { 
  ResponsiveDialog, 
  ResponsiveDialogContent, 
  ResponsiveDialogHeader, 
  ResponsiveDialogTitle, 
  ResponsiveDialogDescription 
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Package, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEquipment } from '@/hooks/useEquipment';
import { useLoans } from '@/hooks/useLoans';
import { useToast } from '@/hooks/use-toast';
import { Equipment } from '@/types/equipment';
import { Project } from '@/types/project';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AddEquipmentToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess?: () => void;
}

export function AddEquipmentToProjectDialog({ 
  open, 
  onOpenChange, 
  project, 
  onSuccess 
}: AddEquipmentToProjectDialogProps) {
  const { toast } = useToast();
  const { allEquipment } = useEquipment();
  const { addLoan } = useLoans();
  
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [borrowerName, setBorrowerName] = useState(project.responsibleName || '');
  const [borrowerEmail, setBorrowerEmail] = useState(project.responsibleEmail || '');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date>(
    new Date(project.expectedEndDate)
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter equipment (show all equipment, regardless of current loan status)
  const availableEquipment = useMemo(() => {
    return allEquipment.filter(equipment => {
      // Apply search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return equipment.name.toLowerCase().includes(search) ||
               equipment.brand.toLowerCase().includes(search) ||
               equipment.patrimonyNumber?.toLowerCase().includes(search);
      }
      
      return true;
    });
  }, [allEquipment, searchTerm]);

  // Function to get project count for equipment
  const getEquipmentProjectCount = async (equipmentId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_equipment_project_count', { equipment_id: equipmentId });
      
      if (error) {
        logger.error('Error getting project count', { 
          module: 'equipment-project-count',
          error,
          data: { equipment_id: equipmentId }
        });
        return 0;
      }
      
      return data || 0;
    } catch (error) {
      logger.error('Error getting project count', { 
        module: 'equipment-project-count',
        error,
        data: { equipment_id: equipmentId }
      });
      return 0;
    }
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    const newSelected = new Set(selectedEquipment);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedEquipment(newSelected);
  };


  const handleSubmit = async () => {
    if (selectedEquipment.size === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um equipamento",
        variant: "destructive"
      });
      return;
    }

    if (!borrowerName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do responsável é obrigatório",
        variant: "destructive"
      });
      return;
    }

    logger.info('Starting loan creation process', {
      module: 'project-equipment',
      action: 'create_loans',
      data: {
        selectedEquipmentCount: selectedEquipment.size,
        project: project.name,
        borrower: borrowerName,
        selectedEquipmentIds: Array.from(selectedEquipment)
      }
    });

    try {
      setLoading(true);

      let successCount = 0;
      let errors: string[] = [];

      // Create loans for all selected equipment
      const loanPromises = Array.from(selectedEquipment).map(async (equipmentId) => {
        const equipment = allEquipment.find(eq => eq.id === equipmentId);
        if (!equipment) {
          logger.error('Equipment not found for loan creation', { 
            module: 'project-equipment',
            action: 'create_loan',
            data: { equipmentId }
          });
          errors.push(`Equipamento não encontrado: ${equipmentId}`);
          return;
        }

        try {
          logger.debug('Creating loan for equipment', {
            module: 'project-equipment',
            action: 'create_loan',
            data: { equipmentName: equipment.name, equipmentId }
          });
          
          await addLoan({
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            borrowerName: borrowerName.trim(),
            project: project.name, // Use project name for linking
            loanDate: format(new Date(), 'yyyy-MM-dd'),
            expectedReturnDate: format(expectedReturnDate, 'yyyy-MM-dd'),
            status: 'active',
            notes: notes.trim() || undefined
          });
          
          successCount++;
          logger.debug('Loan created successfully', {
            module: 'project-equipment',
            action: 'loan_created',
            data: { equipmentName: equipment.name }
          });
          
        } catch (loanError) {
          logger.error('Error creating loan for equipment', { 
            module: 'project-equipment',
            action: 'create_loan',
            error: loanError,
            data: { equipmentName: equipment.name }
          });
          const errorMessage = loanError instanceof Error ? loanError.message : 'Erro desconhecido';
          errors.push(`${equipment.name}: ${errorMessage}`);
        }
      });

      await Promise.all(loanPromises);

      if (successCount > 0) {
        // Verificar quantos SSDs/HDs foram selecionados
        const storageDevices = Array.from(selectedEquipment).filter(id => {
          const equipment = allEquipment.find(e => e.id === id);
          return equipment?.category === 'storage' && 
                 (equipment?.subcategory?.toLowerCase().includes('ssd') || 
                  equipment?.subcategory?.toLowerCase().includes('hd'));
        });
        
        // Mensagem diferenciada para SSDs/HDs
        if (storageDevices.length > 0 && storageDevices.length === successCount) {
          toast({
            title: "SSDs/HDs adicionados ao projeto",
            description: `${successCount} SSD(s)/HD(s) registrado(s) no projeto. O status é gerenciado na página de Controle de SSDs.`,
          });
        } else if (storageDevices.length > 0) {
          toast({
            title: "Equipamentos adicionados",
            description: `${successCount} equipamento(s) adicionado(s). SSDs/HDs têm status gerenciado na página de Controle de SSDs.`,
          });
        } else {
          toast({
            title: "Sucesso",
            description: `${successCount} equipamento(s) adicionado(s) ao projeto`,
          });
        }
        
        logger.info('Loans created successfully', {
          module: 'project-equipment',
          action: 'loans_completed',
          data: { successCount, storageDevicesCount: storageDevices.length }
        });
        
        // Reset form and close dialog
        setSelectedEquipment(new Set());
        setSearchTerm('');
        setBorrowerName(project.responsibleName || '');
        setBorrowerEmail(project.responsibleEmail || '');
        setBorrowerPhone('');
        setNotes('');
        onOpenChange(false);
        onSuccess?.();
      }
      
      if (errors.length > 0) {
        logger.error('Loan creation completed with errors', {
          module: 'project-equipment',
          action: 'loan_creation_errors',
          data: { errors, errorCount: errors.length }
        });
        toast({
          title: "Erros detectados",
          description: errors.slice(0, 3).join('\n') + (errors.length > 3 ? '\n...' : ''),
          variant: "destructive"
        });
      }
      
    } catch (error) {
      logger.error('Error in loan creation process', {
        module: 'project-equipment',
        action: 'loan_creation_process',
        error
      });
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro",
        description: `Erro ao adicionar equipamentos ao projeto: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="w-full max-w-5xl flex flex-col">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Adicionar Equipamentos ao Projeto</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Selecione os equipamentos que deseja vincular ao projeto "{project.name}"
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
          {/* Equipment Selection */}
          <div className="flex-1 flex flex-col">
            <div className="space-y-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar equipamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Label className="text-sm font-medium">
                Todos os Equipamentos ({availableEquipment.length})
              </Label>
            </div>

            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-3 space-y-2">
                {availableEquipment.map((equipment) => (
                  <Card 
                    key={equipment.id} 
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      selectedEquipment.has(equipment.id) && "bg-primary/5 border-primary"
                    )}
                    onClick={() => handleEquipmentToggle(equipment.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={selectedEquipment.has(equipment.id)}
                          onChange={() => handleEquipmentToggle(equipment.id)}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{equipment.name}</h4>
                            <Badge 
                              variant={equipment.currentBorrower ? "secondary" : "outline"}
                            >
                              {equipment.currentBorrower ? "Em projetos" : "Disponível"}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              <span>{equipment.brand} • {equipment.category}</span>
                            </div>
                            
                            {equipment.serialNumber && (
                              <div>Série: {equipment.serialNumber}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {availableEquipment.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum equipamento encontrado
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Loan Details Form */}
          <div className="w-full lg:w-80 space-y-4">
            <div>
              <Label htmlFor="borrower-name">Nome do Responsável *</Label>
                <Input
                  id="borrower-name"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="Nome completo"
                  className="h-12"
                />
            </div>

            <div>
              <Label htmlFor="borrower-email">Email</Label>
                <Input
                  id="borrower-email"
                  type="email"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="h-12"
                />
            </div>

            <div>
              <Label htmlFor="borrower-phone">Telefone</Label>
                <Input
                  id="borrower-phone"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="h-12"
                />
            </div>

            <div>
              <Label>Data de Retorno Prevista *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !expectedReturnDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expectedReturnDate ? 
                      format(expectedReturnDate, "PPP", { locale: ptBR }) : 
                      "Selecione uma data"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expectedReturnDate}
                    onSelect={(date) => date && setExpectedReturnDate(date)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o empréstimo..."
                rows={3}
              />
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground mb-4">
                {selectedEquipment.size} equipamento{selectedEquipment.size !== 1 ? 's' : ''} selecionado{selectedEquipment.size !== 1 ? 's' : ''}
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-12"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedEquipment.size === 0 || loading}
                  className="flex-1 h-12"
                >
                  {loading ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}