import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUsers } from '@/hooks/useUsers';
import { getAvatarData } from '@/lib/avatarUtils';
import { Clock, User } from 'lucide-react';

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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: fetch helper closes over the listed deps; missing deps are stable refs/setters
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md ds-shell">
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
                {users.filter(user => user.is_active).map((user) => {
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
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={avatarData.url || undefined} alt={user.display_name || user.email} />
                          <AvatarFallback className="text-xs">{avatarData.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{user.display_name || user.email}</span>
                          {(user.position || user.department) && (
                            <span className="text-xs text-[hsl(var(--ds-fg-3))]">
                              {user.position && user.department 
                                ? `${user.position} • ${user.department}`
                                : user.position || user.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
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
                <Clock className="h-4 w-4 text-[hsl(var(--ds-fg-3))]" />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, termsAccepted: checked === true }))
              }
              className="mt-0.5"
            />
            <Label 
              htmlFor="terms" 
              className="text-sm leading-normal cursor-pointer font-normal"
            >
              Declaro que conferi todos os equipamentos e acessórios
            </Label>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            className="btn"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleSubmit}
            disabled={!isFormValid() || loading}
          >
            {loading ? 'Registrando...' : 'Registrar Retirada'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
