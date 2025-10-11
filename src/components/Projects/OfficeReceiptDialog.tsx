import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';

export interface OfficeReceiptData {
  userId: string;
  userName: string;
  receiptTime: string;
}

interface OfficeReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: OfficeReceiptData) => void;
  loading?: boolean;
}

export function OfficeReceiptDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  loading = false 
}: OfficeReceiptDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const { users } = useUsers();

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setSelectedUserName(user.display_name || user.email);
    }
  };

  const handleConfirm = () => {
    if (!selectedUserId || !declarationChecked) return;

    const receiptData: OfficeReceiptData = {
      userId: selectedUserId,
      userName: selectedUserName,
      receiptTime: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    onConfirm(receiptData);
    
    // Reset form
    setSelectedUserId('');
    setSelectedUserName('');
    setDeclarationChecked(false);
  };

  const canConfirm = selectedUserId && declarationChecked && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Retorno
          </DialogTitle>
          <DialogDescription>
            Selecione o usuário que está confirmando o recebimento dos equipamentos no escritório.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="user-select">Usuário Responsável pelo Recebimento</Label>
            <Select value={selectedUserId} onValueChange={handleUserSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o usuário..." />
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

          <div className="flex items-start space-x-2">
            <Checkbox
              id="declaration"
              checked={declarationChecked}
              onCheckedChange={(checked) => setDeclarationChecked(checked === true)}
            />
            <Label 
              htmlFor="declaration" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              Declaro que verifiquei todos os equipamentos e acessórios.
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="bg-foreground hover:bg-foreground/90 text-background"
            >
              {loading ? 'Processando...' : 'Confirmar Recebimento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}