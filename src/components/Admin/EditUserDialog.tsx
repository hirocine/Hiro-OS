import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  position: string | null;
  department: string | null;
  role: 'admin' | 'user' | 'producao' | 'marketing';
  is_active: boolean;
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
}

export function EditUserDialog({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) {
  const { user: currentUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    position: '',
    department: '',
    role: 'user' as 'admin' | 'user' | 'producao' | 'marketing',
  });

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.display_name || '',
        position: user.position || '',
        department: user.department || '',
        role: user.role || 'user',
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await supabase.functions.invoke('manage-user', {
        body: {
          userId: user.id,
          displayName: formData.displayName || null,
          position: formData.position || null,
          department: formData.department || null,
          role: formData.role,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao atualizar usuário');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      enhancedToast.success({
        title: 'Usuário atualizado',
        description: 'As informações do usuário foram atualizadas com sucesso.',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating user:', error);
      enhancedToast.error({
        title: 'Erro ao atualizar usuário',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado',
      });
    } finally {
      setLoading(false);
    }
  };

  const isCurrentUser = user?.id === currentUser?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário. {user?.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Ex: Diretor de Fotografia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Ex: Produção"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Permissão</Label>
            <Select
              value={formData.role}
              onValueChange={(value: 'admin' | 'user' | 'producao' | 'marketing') => setFormData({ ...formData, role: value })}
              disabled={isCurrentUser}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {isCurrentUser && (
              <p className="text-xs text-muted-foreground">
                Você não pode alterar sua própria permissão
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
