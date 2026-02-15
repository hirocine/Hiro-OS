import { User, LogOut, ChevronsUpDown } from 'lucide-react';
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

interface SidebarUserProfileProps {
  isMobile?: boolean;
}

export function SidebarUserProfile({ isMobile = false }: SidebarUserProfileProps) {
  const { user, signOut } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: profile } = useCurrentUserProfile();
  const avatarData = getAvatarData(user, profile?.avatar_url, profile?.display_name);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: "Erro ao sair", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className={cn(
      "border-t border-border bg-card/50 backdrop-blur-sm shrink-0",
      isMobile ? "" : "p-2"
    )}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full p-3 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors">
            <div className="relative shrink-0 w-9 h-9">
              <Avatar className="w-full h-full ring-2 ring-border">
                <AvatarImage src={avatarData.url || undefined} className="object-cover" />
                <AvatarFallback className="text-xs font-medium">{avatarData.initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-success rounded-full border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium leading-none truncate">
                {avatarData.displayName || 'Usuário'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {user?.email}
              </p>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
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
    </div>
  );
}
