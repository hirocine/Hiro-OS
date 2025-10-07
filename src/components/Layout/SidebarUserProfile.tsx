import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getAvatarData } from '@/lib/avatarUtils';
import { cn } from '@/lib/utils';

interface SidebarUserProfileProps {
  isMobile?: boolean;
}

export function SidebarUserProfile({ isMobile = false }: SidebarUserProfileProps) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const avatarData = getAvatarData(user);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className={cn(
      "border-t border-border bg-card/50 backdrop-blur-sm",
      isMobile ? "p-4" : "p-3 sticky bottom-0"
    )}>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <Avatar className="h-10 w-10 ring-2 ring-border">
            <AvatarImage src={avatarData.url || undefined} className="object-cover" />
            <AvatarFallback className="text-sm font-medium">{avatarData.initials}</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 h-3 w-3 bg-success rounded-full border-2 border-card" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-none truncate">
            {avatarData.displayName || 'Usuário'}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-1">
            {user?.email}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/profile')}
          className="flex-1 h-8 text-xs"
        >
          <User className="h-3.5 w-3.5 mr-1.5" />
          Perfil
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex-1 h-8 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Sair
        </Button>
      </div>
    </div>
  );
}
