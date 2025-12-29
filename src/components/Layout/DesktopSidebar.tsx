import { Home, LayoutDashboard, Package, Camera, FileText, Settings, HardDrive, Key, Users, CheckSquare, Film, ChevronLeft } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useIsPWA } from '@/hooks/useIsPWA';
import { Z_INDEX } from '@/lib/z-index';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useSidebarState } from '@/contexts/SidebarContext';
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
  { name: 'SSDs e HDs', href: '/ssds', icon: HardDrive },
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
  const { isExpanded, toggleSidebar } = useSidebarState();
  const location = useLocation();
  const isPWA = useIsPWA();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const NavItem = ({ item, isAdminItem = false }: { item: NavigationItem; isAdminItem?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    
    const linkContent = (
      <NavLink
        to={item.href}
        className={cn(
          "flex items-center gap-3 h-11 rounded-lg transition-all duration-200 relative group",
          isExpanded ? "px-3" : "justify-center px-0",
          active 
            ? isAdminItem 
              ? "bg-destructive/10 text-destructive font-medium" 
              : "bg-primary/10 text-primary font-medium"
            : isAdminItem
              ? "hover:bg-destructive/5 text-muted-foreground hover:text-foreground"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        {active && (
          <div className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full",
            isAdminItem ? "bg-destructive" : "bg-primary"
          )} />
        )}
        <Icon className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
          active && (isAdminItem ? "text-destructive" : "text-primary")
        )} />
        {isExpanded && (
          <span className="truncate text-sm animate-fade-in">
            {item.name}
          </span>
        )}
      </NavLink>
    );

    if (!isExpanded) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            <p>{item.name}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-card shadow-lg",
        "fixed left-0 bottom-0 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16",
        isPWA 
          ? "top-[env(safe-area-inset-top,0px)]"
          : "top-0"
      )}
      style={{ zIndex: Z_INDEX.sidebar }}
    >
      {/* Logo e Toggle */}
      <div className={cn(
        "flex items-center border-b border-border sticky top-0 z-10 bg-card",
        isExpanded ? "justify-between px-4" : "justify-center",
        isPWA ? "py-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]" : "py-4"
      )}>
        <div className="flex items-center gap-3">
          <img 
            src={hiroLogo} 
            alt="HIRO Logo" 
            className="h-9 w-9 rounded-lg object-cover shrink-0"
          />
          {isExpanded && (
            <span className="font-semibold text-lg text-foreground animate-fade-in">
              HIRO
            </span>
          )}
        </div>
        
        {isExpanded && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Botão de expandir quando colapsado */}
      {!isExpanded && (
        <div className="px-2 py-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="w-full h-9 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expandir menu</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Navegação com ScrollArea */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {/* Navegação Principal */}
          <div className={cn("mb-4", isExpanded ? "px-3" : "px-2")}>
            {isExpanded && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Menu
              </p>
            )}
            <nav className="space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </div>

          {/* Seção Admin */}
          {isAdmin && (
            <>
              <div className={cn("mb-4", isExpanded ? "px-3" : "px-2")}>
                <Separator />
              </div>
              <div className={cn("mb-4", isExpanded ? "px-3" : "px-2")}>
                {isExpanded && (
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">
                    Administração
                  </p>
                )}
                <nav className="space-y-1">
                  {adminNavigation.map((item) => (
                    <NavItem key={item.name} item={item} isAdminItem />
                  ))}
                </nav>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
