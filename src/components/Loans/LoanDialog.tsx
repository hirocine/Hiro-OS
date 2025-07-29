import { useState } from 'react';
import { Equipment } from '@/types/equipment';
import { Loan } from '@/types/loan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { conditionLabels } from '@/data/mockLoans';

interface LoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment;
  mode: 'loan' | 'return';
  currentLoan?: Loan;
  onSubmit: (data: any) => void;
}

export function LoanDialog({ open, onOpenChange, equipment, mode, currentLoan, onSubmit }: LoanDialogProps) {
  const [formData, setFormData] = useState({
    borrowerName: currentLoan?.borrowerName || '',
    borrowerEmail: currentLoan?.borrowerEmail || '',
    borrowerPhone: currentLoan?.borrowerPhone || '',
    department: currentLoan?.department || '',
    project: currentLoan?.project || '',
    expectedReturnDate: '',
    notes: currentLoan?.notes || '',
    returnCondition: 'excellent' as const,
    returnNotes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'loan') {
      const loanData: Omit<Loan, 'id'> = {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        borrowerName: formData.borrowerName,
        borrowerEmail: formData.borrowerEmail,
        borrowerPhone: formData.borrowerPhone,
        department: formData.department,
        project: formData.project,
        loanDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: formData.expectedReturnDate,
        status: 'active',
        notes: formData.notes
      };
      onSubmit(loanData);
    } else {
      const returnData = {
        returnCondition: formData.returnCondition,
        returnNotes: formData.returnNotes
      };
      onSubmit(returnData);
    }
    
    onOpenChange(false);
    // Reset form
    setFormData({
      borrowerName: '',
      borrowerEmail: '',
      borrowerPhone: '',
      department: '',
      project: '',
      expectedReturnDate: '',
      notes: '',
      returnCondition: 'excellent',
      returnNotes: ''
    });
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'loan' ? 'Retirar Equipamento' : 'Devolver Equipamento'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium">{equipment.name}</h4>
          <p className="text-sm text-muted-foreground">{equipment.brand}</p>
          {currentLoan && (
            <div className="mt-2 text-sm">
              <p><strong>Retirado por:</strong> {currentLoan.borrowerName}</p>
              <p><strong>Data de retirada:</strong> {new Date(currentLoan.loanDate).toLocaleDateString('pt-BR')}</p>
              <p><strong>Previsão de devolução:</strong> {new Date(currentLoan.expectedReturnDate).toLocaleDateString('pt-BR')}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'loan' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="borrowerName">Nome do Responsável *</Label>
                  <Input
                    id="borrowerName"
                    value={formData.borrowerName}
                    onChange={(e) => updateField('borrowerName', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="borrowerEmail">Email</Label>
                  <Input
                    id="borrowerEmail"
                    type="email"
                    value={formData.borrowerEmail}
                    onChange={(e) => updateField('borrowerEmail', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="borrowerPhone">Telefone</Label>
                  <Input
                    id="borrowerPhone"
                    value={formData.borrowerPhone}
                    onChange={(e) => updateField('borrowerPhone', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => updateField('department', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project">Projeto</Label>
                  <Input
                    id="project"
                    value={formData.project}
                    onChange={(e) => updateField('project', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expectedReturnDate">Data Prevista de Devolução *</Label>
                  <Input
                    id="expectedReturnDate"
                    type="date"
                    value={formData.expectedReturnDate}
                    onChange={(e) => updateField('expectedReturnDate', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="returnCondition">Estado do Equipamento *</Label>
                <Select 
                  value={formData.returnCondition} 
                  onValueChange={(value) => updateField('returnCondition', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(conditionLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="returnNotes">Observações da Devolução</Label>
                <Textarea
                  id="returnNotes"
                  value={formData.returnNotes}
                  onChange={(e) => updateField('returnNotes', e.target.value)}
                  rows={3}
                  placeholder="Relate qualquer problema ou observação sobre o estado do equipamento..."
                />
              </div>
            </>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {mode === 'loan' ? 'Confirmar Retirada' : 'Confirmar Devolução'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}