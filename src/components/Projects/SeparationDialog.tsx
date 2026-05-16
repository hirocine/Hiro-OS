import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Package, Clock } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { getAvatarData } from '@/lib/avatarUtils';

export interface SeparationData {
  userId: string;
  userName: string;
  timestamp: string;
}

interface SeparationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: SeparationData) => void;
  loading?: boolean;
}

export function SeparationDialog({ open, onOpenChange, onConfirm, loading = false }: SeparationDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [separationTime, setSeparationTime] = useState<string>('');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const { users } = useUsers();

  React.useEffect(() => {
    if (open && !separationTime) {
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setSeparationTime(localDateTime);
    }
  }, [open, separationTime]);

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setSelectedUserName(user.display_name || user.email);
    }
  };

  const handleConfirm = () => {
    if (!selectedUserId || !separationTime || !declarationChecked) return;

    const data: SeparationData = {
      userId: selectedUserId,
      userName: selectedUserName,
      timestamp: separationTime
    };

    onConfirm(data);
    
    setSelectedUserId('');
    setSelectedUserName('');
    setSeparationTime('');
    setDeclarationChecked(false);
  };

  const canConfirm = selectedUserId && separationTime && declarationChecked && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md ds-shell">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[hsl(var(--ds-text))]" />
            Confirmar Separação de Equipamentos
          </DialogTitle>
          <DialogDescription>
            Selecione o usuário responsável pela separação dos equipamentos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="user-select">Usuário Responsável *</Label>
            <Select value={selectedUserId} onValueChange={handleUserSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o usuário..." />
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
            <Label htmlFor="datetime">Horário da separação *</Label>
            <div className="relative">
              <Input
                id="datetime"
                type="datetime-local"
                value={separationTime}
                onChange={(e) => setSeparationTime(e.target.value)}
                className="pl-10"
                max={new Date().toISOString().slice(0, 16)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Clock className="h-4 w-4 text-[hsl(var(--ds-fg-3))]" />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="declaration"
              checked={declarationChecked}
              onCheckedChange={(checked) => setDeclarationChecked(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="declaration" className="text-sm leading-normal cursor-pointer font-normal">
              Declaro que separei todos os equipamentos necessários para este projeto.
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </button>
            <button type="button" className="btn primary" onClick={handleConfirm} disabled={!canConfirm}>
              {loading ? 'Processando...' : 'Confirmar Separação'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
