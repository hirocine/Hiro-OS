import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Clock } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { getAvatarData } from '@/lib/avatarUtils';

export interface CompletionData {
  userId: string;
  userName: string;
  timestamp: string;
}

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: CompletionData) => void;
  loading?: boolean;
}

export function CompletionDialog({ open, onOpenChange, onConfirm, loading = false }: CompletionDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [completionTime, setCompletionTime] = useState<string>('');
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const { users } = useUsers();

  React.useEffect(() => {
    if (open && !completionTime) {
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setCompletionTime(localDateTime);
    }
  }, [open, completionTime]);

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setSelectedUserName(user.display_name || user.email);
    }
  };

  const handleConfirm = () => {
    if (!selectedUserId || !completionTime || !declarationChecked) return;

    const data: CompletionData = {
      userId: selectedUserId,
      userName: selectedUserName,
      timestamp: completionTime
    };

    onConfirm(data);
    
    setSelectedUserId('');
    setSelectedUserName('');
    setCompletionTime('');
    setDeclarationChecked(false);
  };

  const canConfirm = selectedUserId && completionTime && declarationChecked && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Finalizar Projeto
          </DialogTitle>
          <DialogDescription>
            Selecione o usuário responsável pela finalização do projeto.
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
                            <span className="text-xs text-muted-foreground">
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
            <Label htmlFor="datetime">Horário da finalização *</Label>
            <div className="relative">
              <Input
                id="datetime"
                type="datetime-local"
                value={completionTime}
                onChange={(e) => setCompletionTime(e.target.value)}
                className="pl-10"
                max={new Date().toISOString().slice(0, 16)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Clock className="h-4 w-4 text-muted-foreground" />
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
              Declaro que o projeto foi concluído e todos os processos foram verificados.
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </button>
            <button type="button" className="btn primary" onClick={handleConfirm} disabled={!canConfirm}>
              {loading ? 'Processando...' : 'Finalizar Projeto'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
