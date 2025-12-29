import { User, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getAvatarData } from '@/lib/avatarUtils';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';

interface SidebarUserProfileProps {
  isMobile?: boolean;
  variant?: 'sidebar' | 'sidebar-expanded' | 'header';
}

export function SidebarUserProfile({ isMobile = false, variant = 'sidebar' }: SidebarUserProfileProps) {
  const { user, signOut } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: profile } = useCurrentUserProfile();
  const avatarData = getAvatarData(user, profile?.avatar_url, profile?.display_name);

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

  // Header variant - compact avatar for global header
  if (variant === 'header') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center hover:opacity-80 rounded-full cursor-pointer transition-opacity">
            <div className="relative w-9 h-9 shrink-0">
              <Avatar className="w-full h-full ring-2 ring-border">
                <AvatarImage src={avatarData.url || undefined} className="object-cover" />
                <AvatarFallback className="text-xs font-medium">{avatarData.initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-success rounded-full border-2 border-background" />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 mb-1">
            <p className="text-sm font-medium">{avatarData.displayName || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => navigate('/perfil')}>
            <User className="mr-2 h-4 w-4" />
            Ver Perfil
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Sidebar expanded variant - shows name and email
  if (variant === 'sidebar-expanded') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full hover:bg-accent/50 rounded-lg p-3 cursor-pointer transition-colors">
            <div className="relative w-10 h-10 shrink-0">
              <Avatar className="w-full h-full ring-2 ring-border">
                <AvatarImage src={avatarData.url || undefined} className="object-cover" />
                <AvatarFallback className="text-sm font-medium">{avatarData.initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-success rounded-full border-2 border-card" />
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium leading-none truncate">
                {avatarData.displayName || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {user?.email}
              </p>
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => navigate('/perfil')}>
            <User className="mr-2 h-4 w-4" />
            Ver Perfil
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full hover:bg-accent/50 rounded-lg p-3 cursor-pointer transition-colors">
              <div className="relative w-12 h-12 shrink-0">
                <Avatar className="w-full h-full ring-2 ring-border">
                  <AvatarImage src={avatarData.url || undefined} className="object-cover" />
                  <AvatarFallback className="text-sm font-medium">{avatarData.initials}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-success rounded-full border-2 border-card" />
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium leading-none truncate">
                  {avatarData.displayName || 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {user?.email}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/perfil')}>
              <User className="mr-2 h-4 w-4" />
              Ver Perfil
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default sidebar (collapsed) variant
  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-2 sticky bottom-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center w-full hover:bg-accent/50 rounded-lg p-2 cursor-pointer transition-colors">
            <div className="relative w-10 h-10 shrink-0">
              <Avatar className="w-full h-full ring-2 ring-border">
                <AvatarImage src={avatarData.url || undefined} className="object-cover" />
                <AvatarFallback className="text-sm font-medium">{avatarData.initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-success rounded-full border-2 border-card" />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 mb-1">
            <p className="text-sm font-medium">{avatarData.displayName || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => navigate('/perfil')}>
            <User className="mr-2 h-4 w-4" />
            Ver Perfil
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
