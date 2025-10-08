import { useState, useEffect } from 'react';
import { Equipment } from '@/types/equipment';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, HardDrive } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCapacity } from '@/lib/utils';
import { capitalizeNames } from '@/lib/stringUtils';
import { useUsers } from '@/hooks/useUsers';
import { useSSDDetails, SSDExternalLoan } from '@/hooks/useSSDDetails';
import { SSDStatus } from '@/hooks/useSSDs';
import { ProjectAllocationList, ProjectAllocation } from './ProjectAllocationList';
import { Badge } from '@/components/ui/badge';

interface SSDDetailsDialogProps {
  ssd: Equipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const SSDDetailsDialog = ({
  ssd,
  open,
  onOpenChange,
  onUpdate
}: SSDDetailsDialogProps) => {
  const { users } = useUsers();
  const { allocations, externalLoan, loading, updateSSD } = useSSDDetails(ssd);

  const [status, setStatus] = useState<SSDStatus>('available');
  const [internalUserId, setInternalUserId] = useState<string>('');
  const [externalBorrowerName, setExternalBorrowerName] = useState('');
  const [loanDate, setLoanDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [projectAllocations, setProjectAllocations] = useState<ProjectAllocation[]>([]);

  // Inicializar estados quando o dialog abrir ou o SSD mudar
  useEffect(() => {
    if (ssd && open) {
      // Determinar status baseado no display_order
      let currentStatus: SSDStatus = 'available';
      if (ssd.displayOrder && ssd.displayOrder >= 2000) currentStatus = 'loaned';
      else if (ssd.displayOrder && ssd.displayOrder >= 1000) currentStatus = 'in_use';
      
      setStatus(currentStatus);
      setInternalUserId(ssd.internal_user_id || '');
      setProjectAllocations(allocations || []);

      if (externalLoan) {
        setExternalBorrowerName(externalLoan.borrower_name);
        setLoanDate(new Date(externalLoan.loan_date));
        setReturnDate(new Date(externalLoan.expected_return_date));
      } else {
        setExternalBorrowerName('');
        setLoanDate(undefined);
        setReturnDate(undefined);
      }
    }
  }, [ssd, open, allocations, externalLoan]);

  const handleSave = async () => {
    if (!ssd) return;

    // Validações
    if (status === 'in_use' && !internalUserId) {
      alert('Selecione um responsável interno');
      return;
    }

    if (status === 'loaned') {
      if (!externalBorrowerName.trim()) {
        alert('Digite o nome do tomador externo');
        return;
      }
      if (!loanDate || !returnDate) {
        alert('Preencha as datas de empréstimo e devolução');
        return;
      }
      if (returnDate < loanDate) {
        alert('A data de devolução deve ser posterior à data de empréstimo');
        return;
      }
    }

    // Validar alocações
    const totalAllocated = projectAllocations.reduce((sum, a) => sum + (a.allocated_gb || 0), 0);
    if (ssd.capacity && totalAllocated > ssd.capacity) {
      alert(`A capacidade total foi ultrapassada em ${(totalAllocated - ssd.capacity).toFixed(0)} GB`);
      return;
    }

    // Preparar dados do empréstimo externo
    let externalLoanData: SSDExternalLoan | null = null;
    if (status === 'loaned' && loanDate && returnDate) {
      externalLoanData = {
        ssd_id: ssd.id,
        borrower_name: capitalizeNames(externalBorrowerName),
        loan_date: format(loanDate, 'yyyy-MM-dd'),
        expected_return_date: format(returnDate, 'yyyy-MM-dd')
      };
    }

    const success = await updateSSD(
      status,
      status === 'in_use' ? internalUserId : null,
      projectAllocations,
      externalLoanData
    );

    if (success) {
      onUpdate();
      onOpenChange(false);
    }
  };

  if (!ssd) return null;

  const totalAllocated = projectAllocations.reduce((sum, a) => sum + (a.allocated_gb || 0), 0);
  const freeSpace = (ssd.capacity || 0) - totalAllocated;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{ssd.name}</DialogTitle>
              <DialogDescription>
                {formatCapacity(ssd.capacity)} • #{ssd.patrimonyNumber}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as SSDStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Livre</SelectItem>
                <SelectItem value="in_use">Em uso (Interno)</SelectItem>
                <SelectItem value="loaned">Em uso (Externo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Responsável Interno */}
          {status === 'in_use' && (
            <div className="space-y-2">
              <Label htmlFor="internal-user">Responsável Interno *</Label>
              <Select value={internalUserId} onValueChange={setInternalUserId}>
                <SelectTrigger id="internal-user">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.display_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Empréstimo Externo */}
          {status === 'loaned' && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-medium text-sm">Empréstimo Externo</h3>

              <div className="space-y-2">
                <Label htmlFor="external-borrower">Nome do Tomador *</Label>
                <Input
                  id="external-borrower"
                  value={externalBorrowerName}
                  onChange={(e) => setExternalBorrowerName(e.target.value)}
                  onBlur={(e) => setExternalBorrowerName(capitalizeNames(e.target.value))}
                  placeholder="Ex: João Silva"
                  className="h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Empréstimo *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !loanDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {loanDate ? format(loanDate, 'dd/MM/yyyy') : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={loanDate}
                        onSelect={setLoanDate}
                        locale={ptBR}
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
                          "w-full justify-start text-left font-normal h-10",
                          !returnDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, 'dd/MM/yyyy') : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={setReturnDate}
                        locale={ptBR}
                        disabled={(date) => loanDate ? date < loanDate : false}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Alocações de Projetos (apenas para interno) */}
          {status === 'in_use' && ssd.capacity && (
            <div className="p-4 border rounded-lg">
              <ProjectAllocationList
                allocations={projectAllocations}
                totalCapacity={ssd.capacity}
                onChange={setProjectAllocations}
              />
            </div>
          )}

          {/* Resumo de Capacidade */}
          {status === 'in_use' && ssd.capacity && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">Espaço Livre</span>
              <Badge variant={freeSpace < ssd.capacity * 0.2 ? 'destructive' : 'success'}>
                {freeSpace.toFixed(0)} GB de {ssd.capacity} GB
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
