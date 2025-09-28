import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FolderOpen, BarChart3, Settings, Shield, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { toast } from 'sonner';

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

export function VerticalSidebar() {
  const { isAdmin } = useUserRole();
  const { user, signOut } = useAuth();
  const location = useLocation();

  const avatarData = getAvatarData(user);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast.error('Erro ao sair da conta');
    }
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="w-20 bg-sidebar border-r border-sidebar-border flex flex-col min-h-screen shadow-card">
      {/* Navigation Items */}
      <nav className="flex-1 py-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive: active }) =>
              cn(
                'flex flex-col items-center px-3 py-3 mx-2 rounded-lg transition-all duration-200',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant'
                  : 'text-sidebar-foreground'
              )
            }
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium leading-tight text-center">
              {item.name}
            </span>
          </NavLink>
        ))}
        
        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="px-2 pt-4 pb-2">
              <div className="h-px bg-sidebar-border"></div>
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive: active }) =>
                  cn(
                    'flex flex-col items-center px-3 py-3 mx-2 rounded-lg transition-all duration-200',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant'
                      : 'text-sidebar-foreground'
                  )
                }
              >
                <item.icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium leading-tight text-center">
                  {item.name}
                </span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Avatar at Bottom */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'w-full flex flex-col items-center p-2 rounded-lg transition-all duration-200',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              'text-sidebar-foreground'
            )}>
              <Avatar className="h-8 w-8 mb-1">
                <AvatarImage src={avatarData.url || ''} />
                <AvatarFallback className="text-xs">
                  {avatarData.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium leading-tight text-center truncate w-full">
                {avatarData.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-56">
            <DropdownMenuItem asChild>
              <NavLink to="/profile" className="w-full">
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
  );
}