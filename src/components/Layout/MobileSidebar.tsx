import { Home, LayoutDashboard, Package, Camera, FileText, Settings, X, HardDrive, Key, Users, CheckSquare, Film, Search, ChevronRight, Lock } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { useAuthContext } from '@/contexts/AuthContext';
import { useNavigationBlocker } from '@/contexts/NavigationBlockerContext';
import { SidebarUserProfile } from './SidebarUserProfile';
import { NotificationPanel } from './NotificationPanel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { cn } from '@/lib/utils';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
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

// Exported so TopBar can open the sidebar
let openMobileSidebar: (() => void) | null = null;

export function useMobileSidebarTrigger() {
  return useCallback(() => openMobileSidebar?.(), []);
}

function MobileNavItemWithChildren({ item, isActive, onNavClick }: {
  item: NavigationItem;
  isActive: (path: string) => boolean;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const location = useLocation();
  const Icon = item.icon;
  const childActive = item.children?.some(c => isActive(c.href)) ?? false;
  const parentActive = location.pathname === item.href;
  const anyActive = childActive || parentActive;
  const [expanded, setExpanded] = useState(childActive);

  useEffect(() => {
    if (childActive) setExpanded(true);
  }, [childActive]);

  return (
    <div className={cn(
      "transition-colors duration-200 p-1 rounded-lg",
      expanded ? "bg-muted/50" : "bg-transparent"
    )}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 relative group",
          expanded
            ? "text-foreground"
            : "rounded-lg",
          parentActive && !expanded
            ? "bg-primary/10 text-primary font-medium"
            : !expanded
              ? "hover:bg-accent text-muted-foreground hover:text-foreground"
              : ""
        )}
      >
        {parentActive && !expanded && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-primary rounded-r-full" />
        )}

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="relative h-[18px] w-[18px] shrink-0 flex items-center justify-center"
        >
          <ChevronRight className={cn(
            "h-[18px] w-[18px] transition-transform duration-200",
            expanded && "rotate-90",
            parentActive && !expanded ? "text-primary" : "text-muted-foreground"
          )} />
        </button>

        <NavLink
          to={item.href}
          onClick={(e) => onNavClick(e, item.href)}
          className="text-sm flex-1"
        >
          {item.name}
        </NavLink>
      </div>

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
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
                    active
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                  )}
                >
                  <ChildIcon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
                  <span>{child.name}</span>
                </NavLink>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function MobileSidebar() {
  const { isAdmin } = useAuthContext();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isPWA = useIsPWA();
  const { requestNavigation } = useNavigationBlocker();
  
  const [searchQuery, setSearchQuery] = useState('');

  // Expose open function for TopBar
  useEffect(() => {
    openMobileSidebar = () => setOpen(true);
    return () => { openMobileSidebar = null; };
  }, []);

  // Close on route change
  useEffect(() => {
    if (open) setOpen(false);
  }, [location.pathname]);

  // Clear search when closing
  useEffect(() => {
    if (!open) setSearchQuery('');
  }, [open]);

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent 
        side="left" 
        className={cn(
          "w-80 flex flex-col p-0 [&>button]:hidden",
          isPWA && "pt-[env(safe-area-inset-top,0px)]"
        )}
      >
        {/* Header */}
        <SheetHeader className={cn(
          "flex-row items-center justify-between border-b border-border px-4 py-4",
          isPWA && "pt-[calc(1rem+env(safe-area-inset-top,0px))]"
        )}>
          <div className="flex items-center gap-3">
            <img src={hiroLogo} alt="HIRO Logo" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-base font-bold text-foreground">Hiro Hub</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-colors"
            />
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-7 mb-2">
              Menu
            </p>
            <nav className="space-y-0.5 px-4">
              {filteredNav.map((item) => (
                item.children ? (
                  <MobileNavItemWithChildren
                    key={item.name}
                    item={item}
                    isActive={isActive}
                    onNavClick={handleNavClick}
                  />
                ) : (() => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={(e) => handleNavClick(e, item.href)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-primary rounded-r-full" />
                      )}
                      <Icon className={cn("h-[18px] w-[18px]", active && "text-primary")} />
                      <span className="text-sm">{item.name}</span>
                    </NavLink>
                  );
                })()
              ))}
            </nav>

            {isAdmin && (filteredAdminNav.length > 0 || !searchQuery) && (
              <>
                <div className="px-4 my-3">
                  <Separator />
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-7 mb-2">
                  Administração
                </p>
                <nav className="space-y-0.5 px-4">
                  {filteredAdminNav.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group",
                          active
                            ? "bg-destructive/10 text-destructive font-medium"
                            : "hover:bg-destructive/5 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-destructive rounded-r-full" />
                        )}
                        <Icon className={cn("h-[18px] w-[18px]", active && "text-destructive")} />
                        <span className="text-sm">{item.name}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </>
            )}

            {/* Tools */}
            <div className="px-4 mt-3">
              <Separator className="mb-3" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  <NotificationPanel />
                  <span className="text-sm text-muted-foreground">Notificações</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg">
                  <ThemeSwitcher className="w-full justify-start gap-3 px-3 py-2.5 h-auto rounded-lg" showLabel />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* User Profile */}
        <div className="px-4 py-4 flex items-center">
          <SidebarUserProfile isMobile />
        </div>
      </SheetContent>
    </Sheet>
  );
}
