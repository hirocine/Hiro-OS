import { Home, Package, FolderKanban, FileText, Settings, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { getAvatarData } from '@/lib/avatarUtils';
import { cn } from '@/lib/utils';
import { useIsPWA } from '@/hooks/useIsPWA';
import { Z_INDEX } from '@/lib/z-index';

interface NavigationItem {
  name: string;
  href: string;
  icon: typeof Home;
  adminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Inventário', href: '/equipment', icon: Package },
  { name: 'Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Relatórios', href: '/reports', icon: FileText },
];

const adminNavigation: NavigationItem[] = [
  { name: 'Admin', href: '/admin', icon: Settings, adminOnly: true },
];

export function VerticalSidebar() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const isPWA = useIsPWA();
  const avatarData = getAvatarData(user);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col items-center border-r border-border bg-card shadow-sm",
        "w-16 fixed left-0 bottom-0",
        isPWA 
          ? "top-[calc(4rem+env(safe-area-inset-top,0px))]" // PWA: abaixo do header dinâmico
          : "top-16" // Web: abaixo do header fixo
      )}
      style={{ zIndex: Z_INDEX.sidebar }}
    >
      {/* Navegação principal */}
      <nav className="flex-1 w-full py-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 px-2 w-full transition-all duration-200",
                "hover:bg-accent/50 relative group",
                active && "bg-accent text-primary font-medium"
              )}
            >
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
              )}
              <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span className="text-xs text-center leading-tight">
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Seção Admin */}
      {isAdmin && (
        <>
          <div className="w-16 h-px bg-border my-2" />
          <nav className="w-full pb-4 space-y-2">
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 px-2 w-full transition-all duration-200",
                    "hover:bg-destructive/10 relative group",
                    active && "bg-destructive/20 text-destructive font-medium"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive rounded-r-full" />
                  )}
                  <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                  <span className="text-xs text-center leading-tight">
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </>
      )}

      {/* Avatar do usuário */}
      <NavLink
        to="/profile"
        className="w-full py-4 flex flex-col items-center gap-2 border-t border-border hover:bg-accent/30 transition-colors group"
      >
        <div className="relative">
          <Avatar className="h-8 w-8 ring-2 ring-border group-hover:ring-primary transition-all">
            <AvatarImage src={avatarData.url || undefined} className="object-cover" />
            <AvatarFallback className="text-xs">{avatarData.initials}</AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-success rounded-full border-2 border-card" />
        </div>
        <span className="text-xs text-center leading-tight px-1 line-clamp-1">
          {avatarData.displayName || 'Perfil'}
        </span>
      </NavLink>
    </aside>
  );
}
