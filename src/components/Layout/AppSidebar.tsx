import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, FolderOpen, BarChart3, Settings, Shield } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { getAvatarData } from '@/lib/avatarUtils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Inventário',
    href: '/equipment',
    icon: Package,
  },
  {
    name: 'Projetos',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    name: 'Relatórios',
    href: '/reports',
    icon: BarChart3,
  },
];

const adminNavigation: NavigationItem[] = [
  {
    name: 'Admin',
    href: '/admin',
    icon: Settings,
    adminOnly: true,
  },
  {
    name: 'Segurança',
    href: '/security',
    icon: Shield,
    adminOnly: true,
  },
];

interface AppSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AppSidebar({ open = false, onOpenChange }: AppSidebarProps) {
  const { isAdmin } = useUserRole();
  const { user, signOut } = useAuth();
  
  const avatarData = getAvatarData(user);

  const handleSignOut = async () => {
    try {
      await signOut();
      onOpenChange?.(false);
    } catch (error) {
      toast.error('Erro ao sair da conta');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png" 
              alt="HIRO Logo" 
              className="h-8 w-auto"
            />
            <SheetTitle className="text-lg font-semibold">
              Inventário
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/'}
                onClick={() => onOpenChange?.(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-elegant'
                      : 'text-foreground'
                  )
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </NavLink>
            ))}
            
            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <div className="h-px bg-border"></div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-4">
                    Administração
                  </p>
                </div>
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => onOpenChange?.(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                        'hover:bg-accent hover:text-accent-foreground',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-elegant'
                          : 'text-foreground'
                      )
                    }
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarData.url || ''} />
                    <AvatarFallback>
                      {avatarData.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">
                      {avatarData.displayName || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <NavLink to="/profile" className="w-full" onClick={() => onOpenChange?.(false)}>
                    Perfil
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}