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
import { Input } from '@/components/ui/input';
import { Building2, Clock } from 'lucide-react';
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
  const [receiptTime, setReceiptTime] = useState<string>('');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const { users } = useUsers();

  React.useEffect(() => {
    if (open && !receiptTime) {
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setReceiptTime(localDateTime);
    }
  }, [open, receiptTime]);

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setSelectedUserName(user.display_name || user.email);
    }
  };

  const handleConfirm = () => {
    if (!selectedUserId || !receiptTime || !declarationChecked) return;

    const receiptData: OfficeReceiptData = {
      userId: selectedUserId,
      userName: selectedUserName,
      receiptTime: receiptTime
    };

    onConfirm(receiptData);
    
    // Reset form
    setSelectedUserId('');
    setSelectedUserName('');
    setReceiptTime('');
    setDeclarationChecked(false);
  };

  const canConfirm = selectedUserId && receiptTime && declarationChecked && !loading;

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
                {users.filter(user => user.is_active).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col items-start text-left">
                      <span>{user.display_name || user.email}</span>
                      {user.position && user.department && (
                        <span className="text-xs text-muted-foreground text-left">
                          {user.position} • {user.department}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="datetime">Horário de recebimento *</Label>
            <div className="relative">
              <Input
                id="datetime"
                type="datetime-local"
                value={receiptTime}
                onChange={(e) => setReceiptTime(e.target.value)}
                className="pl-10 text-left"
                max={new Date().toISOString().slice(0, 16)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
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