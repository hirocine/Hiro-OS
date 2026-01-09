import { Home, LayoutDashboard, Package, Camera, FileText, Settings, HardDrive, Key, Users, CheckSquare, Film } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigationBlocker } from '@/contexts/NavigationBlockerContext';
import { SidebarUserProfile } from './SidebarUserProfile';
import { NotificationPanel } from './NotificationPanel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { cn } from '@/lib/utils';
import { useIsPWA } from '@/hooks/useIsPWA';
import { Z_INDEX } from '@/lib/z-index';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import hiroLogo from '@/assets/hiro-logo.png';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Projetos AV', href: '/projetos-av', icon: Film },
  { name: 'Retiradas', href: '/retiradas', icon: Camera },
  { name: 'Inventário', href: '/inventario', icon: Package },
  { name: 'Controle de SSDs e HDs', href: '/ssds', icon: HardDrive },
  { name: 'Políticas', href: '/politicas', icon: FileText },
  { name: 'Plataformas', href: '/plataformas', icon: Key },
];

const adminNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: true },
  { name: 'Fornecedores', href: '/fornecedores', icon: Users, adminOnly: true },
  { name: 'Admin', href: '/administracao', icon: Settings, adminOnly: true },
];

export function DesktopSidebar() {
  const { isAdmin } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const isPWA = useIsPWA();
  const { requestNavigation } = useNavigationBlocker();
  
  const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false });
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const checkScrollState = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      setScrollState({
        canScrollUp: scrollTop > 5,
        canScrollDown: scrollTop + clientHeight < scrollHeight - 5
      });
    }
  }, []);

  useEffect(() => {
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    return () => window.removeEventListener('resize', checkScrollState);
  }, [checkScrollState]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // If we're already on this path, allow normal navigation
    if (location.pathname === href) return;
    
    // Check if navigation should be blocked
    const shouldProceed = requestNavigation(href);
    if (!shouldProceed) {
      e.preventDefault();
    }
  };

  return (
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
      <div className="flex-1 relative scroll-fade-container">
        <div className={cn("scroll-fade-top", scrollState.canScrollUp && "visible")} />
        <ScrollArea 
          ref={scrollAreaRef} 
          className="h-full hide-scrollbar"
          onScrollCapture={checkScrollState}
        >
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
                        onClick={(e) => handleNavClick(e, item.href)}
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
                          onClick={(e) => handleNavClick(e, item.href)}
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
        <div className={cn("scroll-fade-bottom", scrollState.canScrollDown && "visible")} />
      </div>

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
  );
}
