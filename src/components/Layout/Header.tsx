import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { NotificationPanel } from './NotificationPanel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { getAvatarData } from '@/lib/avatarUtils';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { SyncStatusIndicator } from '@/components/PWA/SyncStatusIndicator';

export function Header() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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

  const avatarData = getAvatarData(user);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card shadow-card flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center space-x-2 lg:space-x-4">
        <SidebarTrigger className="lg:hidden" />
        {!isMobile && (
          <div>
            <h2 className="text-base lg:text-lg font-semibold">Sistema de Inventário</h2>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2 lg:space-x-4">
        <SyncStatusIndicator />
        <NotificationPanel />
        <ThemeSwitcher />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-visible">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarData.url || undefined} className="object-cover" />
                <AvatarFallback>{avatarData.initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none">
                {avatarData.displayName || 'Usuário'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}