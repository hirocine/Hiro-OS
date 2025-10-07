import { Home, Package, FolderKanban, FileText, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { SidebarTools } from './SidebarTools';
import { SidebarUserProfile } from './SidebarUserProfile';
import { cn } from '@/lib/utils';
import { useIsPWA } from '@/hooks/useIsPWA';
import { Z_INDEX } from '@/lib/z-index';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export function DesktopSidebar() {
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const isPWA = useIsPWA();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-card shadow-lg",
        "w-60 fixed left-0 bottom-0",
        isPWA 
          ? "top-[env(safe-area-inset-top,0px)]"
          : "top-0"
      )}
      style={{ zIndex: Z_INDEX.sidebar }}
    >
      {/* Logo e Título */}
      <div className={cn(
        "flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10 sticky top-0 z-10",
        isPWA ? "px-6 py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]" : "px-6 py-5"
      )}>
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground shadow-md">
          <Package className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-none">Sistema de</h1>
          <h2 className="text-base font-bold text-primary leading-none mt-0.5">Inventário</h2>
        </div>
      </div>

      {/* Navegação com ScrollArea */}
      <ScrollArea className="flex-1">
        <div className="py-4">
          {/* Navegação Principal */}
          <div className="px-3 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-3">
              Navegação
            </h3>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 relative group",
                      active 
                        ? "bg-primary/10 text-primary font-medium shadow-sm" 
                        : "hover:bg-accent/50 text-foreground"
                    )}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />
                    )}
                    <Icon className={cn(
                      "h-5 w-5 transition-transform group-hover:scale-110",
                      active && "text-primary"
                    )} />
                    <span className="text-sm">{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Seção Admin */}
          {isAdmin && (
            <div className="px-3 mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-3">
                Administração
              </h3>
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 relative group",
                        active 
                          ? "bg-destructive/10 text-destructive font-medium shadow-sm" 
                          : "hover:bg-destructive/5 text-foreground"
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-destructive rounded-r-full" />
                      )}
                      <Icon className={cn(
                        "h-5 w-5 transition-transform group-hover:scale-110",
                        active && "text-destructive"
                      )} />
                      <span className="text-sm">{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Ferramentas */}
          <SidebarTools />
        </div>
      </ScrollArea>

      {/* User Profile - Sticky Bottom */}
      <SidebarUserProfile />
    </aside>
  );
}
