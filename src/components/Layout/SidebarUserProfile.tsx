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
import { cn } from '@/lib/utils';
import { NotificationPanel } from './NotificationPanel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

interface SidebarUserProfileProps {
  isMobile?: boolean;
}

export function SidebarUserProfile({ isMobile = false }: SidebarUserProfileProps) {
  const { user, signOut } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: profile } = useCurrentUserProfile();
  const avatarData = getAvatarData(user, profile?.avatar_url, profile?.display_name);
  const firstName = avatarData.displayName?.split(' ')[0] || null;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: "Erro ao sair", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className={cn(
      "border-t border-border/50 bg-card/50 backdrop-blur-sm shrink-0",
      isMobile ? "" : "p-2"
    )}>
      <div className="flex items-center justify-between w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg cursor-pointer transition-colors shrink-0">
              <Avatar className="w-8 h-8">
                <AvatarImage src={avatarData.url || undefined} className="object-cover" />
                <AvatarFallback className="text-xs font-medium">{avatarData.initials}</AvatarFallback>
              </Avatar>
              {firstName && (
                <span className="text-sm font-medium text-foreground truncate max-w-[80px]">
                  {firstName}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/perfil')}>
              <User className="mr-2 h-4 w-4" />
              Ver Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isMobile && (
          <div className="flex items-center shrink-0">
            <ThemeSwitcher />
            <NotificationPanel />
          </div>
        )}
      </div>
    </div>
  );
}
