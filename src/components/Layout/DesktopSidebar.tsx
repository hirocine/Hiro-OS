import { Home, LayoutDashboard, Package, Camera, FileText, Settings, HardDrive, Key, Users, CheckSquare, Film, Search, ChevronRight, Lock } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigationBlocker } from '@/contexts/NavigationBlockerContext';
import { SidebarUserProfile } from './SidebarUserProfile';
import { cn } from '@/lib/utils';
import { useIsPWA } from '@/hooks/useIsPWA';
import { Z_INDEX } from '@/lib/z-index';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import hiroLogo from '@/assets/hiro-logo.png';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home },
  {
    name: 'Tarefas', href: '/tarefas', icon: CheckSquare,
    children: [
      { name: 'Gerais', href: '/tarefas/gerais', icon: Users },
      { name: 'Privadas', href: '/tarefas/privadas', icon: Lock },
    ],
  },
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

function NavItem({ item, active, isAdmin: isAdminItem, onNavClick }: {
  item: NavigationItem;
  active: boolean;
  isAdmin?: boolean;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.href}
      onClick={(e) => onNavClick(e, item.href)}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
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
          "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full",
          isAdminItem ? "bg-destructive" : "bg-primary"
        )} />
      )}
      <Icon className={cn(
        "h-[18px] w-[18px] shrink-0",
        active && (isAdminItem ? "text-destructive" : "text-primary")
      )} />
      <span className="text-sm truncate">{item.name}</span>
    </NavLink>
  );
}

function NavItemWithChildren({ item, isActive, onNavClick }: {
  item: NavigationItem;
  isActive: (path: string) => boolean;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const location = useLocation();
  const Icon = item.icon;
  const [hovered, setHovered] = useState(false);

  // Auto-expand if current route matches a child
  const childActive = item.children?.some(c => isActive(c.href)) ?? false;
  const parentActive = location.pathname === item.href;
  const anyActive = childActive || parentActive;

  const [expanded, setExpanded] = useState(childActive);

  // Auto-expand when navigating to a child route
  useEffect(() => {
    if (childActive) setExpanded(true);
  }, [childActive]);

  return (
    <div className={cn(
      "transition-colors duration-200 rounded-lg",
      expanded ? "bg-muted/50" : "bg-transparent"
    )}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 relative group cursor-pointer",
          expanded
            ? "text-foreground font-semibold"
            : "rounded-lg",
          parentActive && !expanded
            ? "bg-primary/10 text-primary font-medium"
            : !expanded
              ? "hover:bg-muted text-muted-foreground hover:text-foreground"
              : ""
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {parentActive && !expanded && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary" />
        )}

        {/* Icon area - clickable to toggle expand */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="relative h-[18px] w-[18px] shrink-0 flex items-center justify-center"
        >
          <Icon className={cn(
            "h-[18px] w-[18px] absolute inset-0 transition-opacity duration-150",
            hovered ? "opacity-0" : "opacity-100",
            parentActive && !expanded && "text-primary"
          )} />
          <ChevronRight className={cn(
            "h-[18px] w-[18px] absolute inset-0 transition-all duration-200",
            hovered ? "opacity-100" : "opacity-0",
            expanded && "rotate-90",
            parentActive && !expanded ? "text-primary" : "text-muted-foreground"
          )} />
        </button>

        {/* Name - clickable to navigate */}
        <NavLink
          to={item.href}
          onClick={(e) => onNavClick(e, item.href)}
          className="text-sm truncate flex-1"
        >
          {item.name}
        </NavLink>
      </div>

      {/* Children */}
      <Collapsible open={expanded}>
        <CollapsibleContent>
          <div className="mt-0.5 space-y-0.5">
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              const active = isActive(child.href);
              return (
                <NavLink
                  key={child.href}
                  to={child.href}
                  onClick={(e) => onNavClick(e, child.href)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm relative",
                    active
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
                  )}
                  <ChildIcon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
                  <span className="truncate">{child.name}</span>
                </NavLink>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function DesktopSidebar() {
  const { isAdmin } = useAuthContext();
  const location = useLocation();
  const isPWA = useIsPWA();
  const { requestNavigation } = useNavigationBlocker();

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredNav = useMemo(() =>
    navigation.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.children?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
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
        "hidden lg:flex flex-col w-64 border-r border-border bg-card fixed left-0 bottom-0",
        isPWA ? "top-[env(safe-area-inset-top,0px)]" : "top-0"
      )}
      style={{ zIndex: Z_INDEX.sidebar }}
    >
      {/* Header + Search */}
      <div className={cn(
        "shrink-0",
        isPWA && "pt-[env(safe-area-inset-top,0px)]"
      )}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <img src={hiroLogo} alt="HIRO Logo" className="h-8 w-8 rounded-lg object-cover shrink-0" />
          <span className="text-base font-bold text-foreground truncate">Hiro Hub</span>
        </div>
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar"
              className="w-full h-8 pl-8 pr-12 rounded-lg border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-colors"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden xl:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <div className="pt-5 pb-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 mb-2">
            Menu
          </p>
          <nav className="space-y-0.5 px-3">
            {filteredNav.map((item) => (
              item.children ? (
                <NavItemWithChildren
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  onNavClick={handleNavClick}
                />
              ) : (
                <NavItem
                  key={item.name}
                  item={item}
                  active={isActive(item.href)}
                  onNavClick={handleNavClick}
                />
              )
            ))}
          </nav>

          {/* Admin Section */}
          {isAdmin && (filteredAdminNav.length > 0 || !searchQuery) && (
            <>
              <div className="px-3 my-5">
                <Separator />
              </div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-6 mb-2">
                Administração
              </p>
              <nav className="space-y-0.5 px-3">
                {filteredAdminNav.map((item) => (
                  <NavItem
                    key={item.name}
                    item={item}
                    active={isActive(item.href)}
                    isAdmin
                    onNavClick={handleNavClick}
                  />
                ))}
              </nav>
            </>
          )}
        </div>
      </ScrollArea>

      {/* User Profile */}
      <SidebarUserProfile />
    </aside>
  );
}
