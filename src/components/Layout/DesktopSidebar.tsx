import { Home, LayoutDashboard, Package, Camera, FileText, Settings, HardDrive, Key, Users, CheckSquare, Film, Search, PanelLeftClose, PanelLeft } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
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
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
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

function NavItem({ item, active, expanded, isAdmin: isAdminItem, onNavClick }: {
  item: NavigationItem;
  active: boolean;
  expanded: boolean;
  isAdmin?: boolean;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const Icon = item.icon;
  const activeColor = isAdminItem ? 'destructive' : 'primary';

  const link = (
    <NavLink
      to={item.href}
      onClick={(e) => onNavClick(e, item.href)}
      className={cn(
        "flex items-center gap-3 rounded-lg transition-all duration-200 relative group",
        expanded ? "px-3 py-2.5" : "justify-center h-10 w-10 mx-auto",
        active
          ? isAdminItem
            ? "bg-destructive/10 text-destructive font-medium"
            : "bg-primary/10 text-primary font-medium"
          : isAdminItem
            ? "hover:bg-destructive/5 text-muted-foreground hover:text-foreground"
            : "hover:bg-accent text-muted-foreground hover:text-foreground"
      )}
    >
      {active && (
        <div className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full",
          expanded ? "h-6" : "h-5",
          isAdminItem ? "bg-destructive" : "bg-primary"
        )} />
      )}
      <Icon className={cn(
        "h-[18px] w-[18px] shrink-0",
        active && (isAdminItem ? "text-destructive" : "text-primary")
      )} />
      {expanded && (
        <span className="text-sm truncate">{item.name}</span>
      )}
    </NavLink>
  );

  if (!expanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right"><p>{item.name}</p></TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function DesktopSidebar() {
  const { isAdmin } = useAuthContext();
  const location = useLocation();
  const isPWA = useIsPWA();
  const { requestNavigation } = useNavigationBlocker();
  const { state, toggleSidebar } = useSidebar();
  const expanded = state === 'expanded';

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!expanded) toggleSidebar();
        setTimeout(() => searchInputRef.current?.focus(), 350);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expanded, toggleSidebar]);

  // Clear search when collapsing
  useEffect(() => {
    if (!expanded) setSearchQuery('');
  }, [expanded]);

  const filteredNav = useMemo(() =>
    navigation.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );
  const filteredAdminNav = useMemo(() =>
    adminNavigation.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (location.pathname === href) return;
    const shouldProceed = requestNavigation(href);
    if (!shouldProceed) e.preventDefault();
  };

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-card",
        "fixed left-0 bottom-0 transition-[width] duration-300 ease-in-out",
        expanded ? "w-64" : "w-16",
        isPWA ? "top-[env(safe-area-inset-top,0px)]" : "top-0"
      )}
      style={{ zIndex: Z_INDEX.sidebar }}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-border shrink-0",
        expanded ? "justify-between px-4 py-4" : "justify-center py-4",
        isPWA && "pt-[calc(1rem+env(safe-area-inset-top,0px))]"
      )}>
        <div className={cn("flex items-center gap-3 min-w-0", !expanded && "justify-center")}>
          <img src={hiroLogo} alt="HIRO Logo" className="h-8 w-8 rounded-lg object-cover shrink-0" />
          {expanded && (
            <span className="text-base font-bold text-foreground truncate">Hiro Hub</span>
          )}
        </div>
        {expanded && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Toggle button when collapsed */}
      {!expanded && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search */}
      <div className={cn("shrink-0 px-3 pb-2", !expanded && "px-2")}>
        {expanded ? (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full h-8 pl-8 pr-12 rounded-lg border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-colors"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  toggleSidebar();
                  setTimeout(() => searchInputRef.current?.focus(), 350);
                }}
                className="h-10 w-10 mx-auto text-muted-foreground hover:text-foreground"
              >
                <Search className="h-[18px] w-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Buscar (⌘K)</p></TooltipContent>
          </Tooltip>
        )}
      </div>

      <Separator className="mx-3" />

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="py-3">
          {/* Main Nav Label */}
          {expanded && (
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 mb-2">
              Menu
            </p>
          )}
          <nav className={cn("space-y-0.5", expanded ? "px-3" : "px-2")}>
            {filteredNav.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                active={isActive(item.href)}
                expanded={expanded}
                onNavClick={handleNavClick}
              />
            ))}
          </nav>

          {/* Admin Section */}
          {isAdmin && (filteredAdminNav.length > 0 || !searchQuery) && (
            <>
              <div className="px-3 my-3">
                <Separator />
              </div>
              {expanded && (
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 mb-2">
                  Administração
                </p>
              )}
              <nav className={cn("space-y-0.5", expanded ? "px-3" : "px-2")}>
                {filteredAdminNav.map((item) => (
                  <NavItem
                    key={item.name}
                    item={item}
                    active={isActive(item.href)}
                    expanded={expanded}
                    isAdmin
                    onNavClick={handleNavClick}
                  />
                ))}
              </nav>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Tools - Bottom */}
      <div className="border-t border-border/50 px-2 py-2 shrink-0">
        <div className={cn("space-y-0.5", expanded && "px-1")}>
          {expanded ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                <NotificationPanel />
                <span className="text-sm text-muted-foreground">Notificações</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg">
                <ThemeSwitcher className="w-full justify-start gap-3 px-3 py-2 h-auto rounded-lg" showLabel />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <NotificationPanel />
              </div>
              <div className="flex items-center justify-center">
                <ThemeSwitcher aria-label="Alternar tema" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* User Profile */}
      <SidebarUserProfile />
    </aside>
  );
}
