import { Home, Package, FolderKanban, FileText, Settings, HardDrive, Key } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { SidebarUserProfile } from './SidebarUserProfile';
import { NotificationPanel } from './NotificationPanel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { cn } from '@/lib/utils';
import { useIsPWA } from '@/hooks/useIsPWA';
import { Z_INDEX } from '@/lib/z-index';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import hiroLogo from '@/assets/hiro-logo.png';

interface NavigationItem {
  name: string;
  href: string;
  icon: typeof Home;
  adminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Inventário', href: '/equipment', icon: Package },
  { name: 'Controle de SSDs e HDs', href: '/ssds', icon: HardDrive },
  { name: 'Projetos', href: '/projects', icon: FolderKanban },
  { name: 'Acessos', href: '/accesses', icon: Key },
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
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card shadow-lg",
          "w-16 fixed left-0 bottom-0",
          isPWA 
            ? "top-[env(safe-area-inset-top,0px)]"
            : "top-0"
        )}
        style={{ zIndex: Z_INDEX.sidebar }}
      >
      {/* Logo */}
      <div className={cn(
        "flex items-center justify-center border-b border-border sticky top-0 z-10",
        isPWA ? "py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]" : "py-5"
      )}>
        <img 
          src={hiroLogo} 
          alt="HIRO Logo" 
          className="h-10 w-10 rounded-lg object-cover"
        />
      </div>

      {/* Navegação com ScrollArea */}
      <ScrollArea className="flex-1">
        <div className="py-4">
          {/* Navegação Principal */}
          <div className="px-2 mb-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.href}
                        className={cn(
                          "flex items-center justify-center h-12 rounded-md transition-all duration-200 relative group",
                          active 
                            ? "bg-primary/10 text-primary font-medium shadow-sm" 
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full" />
                        )}
                        <Icon className={cn(
                          "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                          active && "text-primary"
                        )} />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          {/* Seção Admin */}
          {isAdmin && (
            <>
              <div className="px-2 mb-4">
                <Separator className="mb-4" />
              </div>
            <div className="px-2 mb-4">
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.href}
                          className={cn(
                            "flex items-center justify-center h-12 rounded-md transition-all duration-200 relative group",
                            active 
                              ? "bg-destructive/10 text-destructive font-medium shadow-sm" 
                              : "hover:bg-destructive/5 text-foreground"
                          )}
                        >
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-destructive rounded-r-full" />
                          )}
                          <Icon className={cn(
                            "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                            active && "text-destructive"
                          )} />
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </nav>
            </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Ferramentas - Fixas no fundo */}
      <div className="border-t border-border/50 px-2 py-2">
        <div className="space-y-1">
          <div className="flex items-center justify-center">
            <NotificationPanel />
          </div>
          
          <div className="flex items-center justify-center">
            <ThemeSwitcher aria-label="Alternar tema" />
          </div>
        </div>
      </div>

      {/* User Profile - Sticky Bottom */}
      <SidebarUserProfile />
    </aside>
    </TooltipProvider>
  );
}
