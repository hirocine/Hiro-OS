import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Package, Clock } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
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
                {users.filter(user => user.is_active).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col items-start text-left">
                      <span>{user.display_name || user.email}</span>
                      {user.position && user.department && (
                        <span className="text-xs text-muted-foreground">
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
            <Label htmlFor="declaration" className="text-sm leading-relaxed cursor-pointer">
              Declaro que separei todos os equipamentos necessários para este projeto.
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!canConfirm}>
              {loading ? 'Processando...' : 'Confirmar Separação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
