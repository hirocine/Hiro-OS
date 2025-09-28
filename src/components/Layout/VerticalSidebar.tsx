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
    <div className="w-24 bg-sidebar border-r border-sidebar-border flex flex-col min-h-screen shadow-card">
      {/* Navigation Items */}
      <nav className="flex-1 py-6 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive: active }) =>
              cn(
                'relative flex flex-col items-center px-2 py-4 mx-2 rounded-lg transition-all duration-200',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-sidebar',
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant border-l-4 border-accent font-semibold'
                  : 'text-sidebar-foreground hover:font-medium'
              )
            }
            aria-label={item.name}
          >
            <item.icon className="h-7 w-7 mb-2" />
            <span className="text-[10px] leading-tight text-center font-medium">
              {item.name}
            </span>
          </NavLink>
        ))}
        
        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="px-3 pt-6 pb-4">
              <div className="h-px bg-accent/30 relative">
                <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-sidebar px-2 text-[8px] font-medium text-muted-foreground uppercase tracking-wider">
                  Admin
                </span>
              </div>
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive: active }) =>
                  cn(
                    'relative flex flex-col items-center px-2 py-4 mx-2 rounded-lg transition-all duration-200',
                    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-sidebar',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-elegant border-l-4 border-accent font-semibold'
                      : 'text-sidebar-foreground hover:font-medium'
                  )
                }
                aria-label={item.name}
              >
                <item.icon className="h-7 w-7 mb-2" />
                <span className="text-[10px] leading-tight text-center font-medium">
                  {item.name}
                </span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Avatar at Bottom */}
      <div className="p-3 pb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              'w-full flex flex-col items-center p-3 rounded-xl transition-all duration-200',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:scale-105',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-sidebar',
              'text-sidebar-foreground group'
            )}>
              <div className="relative">
                <Avatar className="h-10 w-10 mb-2 ring-2 ring-sidebar-border group-hover:ring-accent transition-all duration-200">
                  <AvatarImage src={avatarData.url || ''} />
                  <AvatarFallback className="text-sm font-semibold">
                    {avatarData.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-sidebar"></div>
              </div>
              <span className="text-[10px] font-medium leading-tight text-center truncate w-full max-w-[80px]">
                {avatarData.displayName || user?.email?.split('@')[0] || 'User'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-56 ml-2">
            <div className="px-2 py-2 border-b border-border">
              <p className="text-sm font-medium">
                {avatarData.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
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