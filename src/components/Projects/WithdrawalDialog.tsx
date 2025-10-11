import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useUsers } from '@/hooks/useUsers';
import { Calendar, Clock, User } from 'lucide-react';

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: WithdrawalData) => void;
  loading?: boolean;
}

export interface WithdrawalData {
  userId: string;
  userName: string;
  withdrawalTime: string;
  termsAccepted: boolean;
}

export function WithdrawalDialog({ open, onOpenChange, onConfirm, loading }: WithdrawalDialogProps) {
  const { users } = useUsers();
  const [formData, setFormData] = useState<WithdrawalData>({
    userId: '',
    userName: '',
    withdrawalTime: '',
    termsAccepted: false
  });

  const handleSubmit = () => {
    if (isFormValid()) {
      onConfirm(formData);
      // Reset form after submission
      setFormData({
        userId: '',
        userName: '',
        withdrawalTime: '',
        termsAccepted: false
      });
    }
  };

  const handleUserSelect = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    setFormData(prev => ({
      ...prev,
      userId,
      userName: selectedUser?.display_name || selectedUser?.email || 'Usuário desconhecido'
    }));
  };

  const isFormValid = () => {
    return formData.userId && formData.withdrawalTime && formData.termsAccepted;
  };

  // Set default withdrawal time to current date/time when dialog opens
  React.useEffect(() => {
    if (open && !formData.withdrawalTime) {
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setFormData(prev => ({ ...prev, withdrawalTime: localDateTime }));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Registrar Retirada
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="user">Quem retirou *</Label>
            <Select 
              value={formData.userId} 
              onValueChange={handleUserSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o usuário responsável" />
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
            <Label htmlFor="datetime">Horário de retirada *</Label>
            <div className="relative">
              <Input
                id="datetime"
                type="datetime-local"
                value={formData.withdrawalTime}
                onChange={(e) => setFormData(prev => ({ ...prev, withdrawalTime: e.target.value }))}
                className="pl-10 text-left"
                max={new Date().toISOString().slice(0, 16)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, termsAccepted: checked === true }))
                }
              />
              <Label 
                htmlFor="terms" 
                className="text-sm leading-relaxed cursor-pointer"
              >
                Declaro que conferi todos os equipamentos e acessórios
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || loading}
            className="bg-foreground hover:bg-foreground/90 text-background"
          >
            {loading ? 'Registrando...' : 'Registrar Retirada'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}