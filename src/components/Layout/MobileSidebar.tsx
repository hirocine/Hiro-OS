import { Home, LayoutDashboard, Package, Camera, FileText, Settings, X, HardDrive, Key, Users, CheckSquare, Film, Search, ChevronRight, Lock, Building2, UserCheck, Receipt, Clapperboard, BarChart3, TrendingUp, ScrollText, Layers, Bell, Cog, Megaphone, Bookmark, Lightbulb, UserCircle, CalendarDays, Trophy } from 'lucide-react';
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

const operacoesNavigation: NavigationItem[] = [
  { name: 'Esteira de Pós', href: '/esteira-de-pos', icon: Clapperboard },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Retiradas', href: '/retiradas', icon: Camera },
  { name: 'Armazenamento', href: '/ssds', icon: HardDrive },
  { name: 'Plataformas', href: '/plataformas', icon: Key },
  { name: 'Políticas', href: '/politicas', icon: FileText },
];

const producaoNavigation: NavigationItem[] = [
  { name: 'Projetos', href: '/projetos-av', icon: Film },
  { name: 'Orçamentos', href: '/orcamentos', icon: Receipt },
  { name: 'CRM', href: '/crm', icon: Users },
  {
    name: 'Fornecedores', href: '/fornecedores', icon: Users,
    children: [
      { name: 'Freelancers', href: '/fornecedores/freelancers', icon: UserCheck },
      { name: 'Empresas', href: '/fornecedores/empresas', icon: Building2 },
    ],
  },
];

const marketingNavigation: NavigationItem[] = [
  {
    name: 'Marketing',
    href: '/marketing',
    icon: Megaphone,
    children: [
      { name: 'Dashboard', href: '/marketing/dashboard', icon: BarChart3 },
      { name: 'Ranking', href: '/marketing/ranking', icon: Trophy },
      { name: 'Pilares', href: '/marketing/pilares', icon: Layers },
      { name: 'Referências', href: '/marketing/referencias', icon: Bookmark },
      { name: 'Ideias', href: '/marketing/ideias', icon: Lightbulb },
      { name: 'Persona / ICP', href: '/marketing/persona', icon: UserCircle },
    ],
  },
];

const adminNavigation: NavigationItem[] = [
  {
    name: 'Financeiro', href: '/financeiro', icon: LayoutDashboard, adminOnly: true,
    children: [
      { name: 'Dashboard', href: '/financeiro/dashboard', icon: BarChart3 },
      { name: 'Gestão de CAPEX', href: '/financeiro/capex', icon: TrendingUp },
    ],
  },
  { name: 'Inventário', href: '/inventario', icon: Package, adminOnly: true },
  {
    name: 'Admin', href: '/administracao', icon: Settings, adminOnly: true,
    children: [
      { name: 'Usuários', href: '/administracao/usuarios', icon: Users },
      { name: 'Logs de Auditoria', href: '/administracao/logs', icon: ScrollText },
      { name: 'Categorias', href: '/administracao/categorias', icon: Layers },
      { name: 'Notificações', href: '/administracao/notificacoes', icon: Bell },
      { name: 'Sistema', href: '/administracao/sistema', icon: Cog },
      { name: 'Integrações', href: '/administracao/integracoes', icon: Megaphone },
    ],
  },
];

// Exported so TopBar can open the sidebar
let openMobileSidebar: (() => void) | null = null;

export function useMobileSidebarTrigger() {
  return useCallback(() => openMobileSidebar?.(), []);
}

function MobileNavItemWithChildren({ item, isActive, onNavClick, isAdmin: isAdminItem, expanded, onToggle }: {
  item: NavigationItem;
  isActive: (path: string) => boolean;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
  isAdmin?: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const Icon = item.icon;
  const childActive = item.children?.some(c => isActive(c.href)) ?? false;
  const parentActive = location.pathname === item.href;

  return (
    <div className={cn(
      "transition-colors duration-200 rounded-lg",
      expanded ? "bg-muted/50" : "bg-transparent"
    )}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 transition-all duration-200 relative group cursor-pointer select-none",
          expanded
            ? childActive ? "text-foreground font-medium" : "text-muted-foreground"
            : "rounded-lg",
          parentActive && !expanded
            ? isAdminItem ? "bg-destructive/10 text-destructive font-medium" : "bg-primary/10 text-primary font-medium"
            : !expanded
              ? isAdminItem ? "hover:bg-destructive/5 text-muted-foreground hover:text-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground"
              : ""
        )}
        onClick={onToggle}
      >
        {(parentActive && !expanded || childActive && expanded) && (
          <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full", isAdminItem ? "bg-destructive" : "bg-primary")} />
        )}

        <ChevronRight className={cn(
          "h-[18px] w-[18px] shrink-0 transition-transform duration-200",
          expanded && "rotate-90",
          parentActive && !expanded ? (isAdminItem ? "text-destructive" : "text-primary") : "text-muted-foreground"
        )} />

        <span className="text-sm flex-1">{item.name}</span>
      </div>

      <Collapsible open={expanded}>
        <CollapsibleContent>
          <div className="mt-0.5 space-y-0.5 px-1.5 pb-1.5">
            {item.children!.map((child) => {
              const active = isActive(child.href);
              return (
                <NavLink
                  key={child.href}
                  to={child.href}
                  onClick={(e) => onNavClick(e, child.href)}
                  className={cn(
                    "flex items-center gap-3 px-1.5 py-2.5 rounded-lg transition-all duration-200 text-sm border border-transparent",
                    active
                      ? isAdminItem ? "text-destructive font-semibold" : "text-success font-semibold"
                      : "text-muted-foreground hover:bg-background/80 hover:text-foreground hover:border-border/50"
                  )}
                >
                  <span className={cn("h-[18px] w-[18px] shrink-0 flex items-center justify-center text-[8px]", active ? (isAdminItem ? "text-destructive" : "text-success") : "text-muted-foreground")}>●</span>
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
  const { isAdmin, canAccessSuppliers } = useAuthContext();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isPWA = useIsPWA();
  const { requestNavigation } = useNavigationBlocker();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Auto-expand when route matches a child
  useEffect(() => {
    const allItems = [...operacoesNavigation, ...producaoNavigation, ...marketingNavigation, ...adminNavigation];
    for (const item of allItems) {
      if (item.children?.some(c => isActive(c.href))) {
        setExpandedItem(item.name);
        return;
      }
    }
  }, [location.pathname]);

  // Auto-expand when search matches a child
  useEffect(() => {
    if (!searchQuery) return;
    const query = searchQuery.toLowerCase();
    const allItems = [
      ...operacoesNavigation,
      ...(canAccessSuppliers ? producaoNavigation : []),
      ...marketingNavigation,
      ...(isAdmin ? adminNavigation : []),
    ];
    const match = allItems.find(item =>
      item.children?.some(c => c.name.toLowerCase().includes(query))
    );
    if (match) setExpandedItem(match.name);
  }, [searchQuery, canAccessSuppliers, isAdmin]);

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

  const filteredOperacoesNav = useMemo(() =>
    operacoesNavigation.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.children?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [searchQuery]
  );
  const filteredAdminNav = useMemo(() =>
    adminNavigation.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.children?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [searchQuery]
  );
  const filteredProducaoNav = useMemo(() =>
    producaoNavigation.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.children?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [searchQuery]
  );
  const filteredMarketingNav = useMemo(() =>
    marketingNavigation.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.children?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
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
            <span className="text-base font-bold text-foreground">Hiro OS®</span>
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
            {/* Home solo */}
            <nav className="px-4 mb-2">
              {(() => {
                const active = isActive('/');
                return (
                  <NavLink
                    to="/"
                    onClick={(e) => { setExpandedItem(null); handleNavClick(e, '/'); }}
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
                    <Home className={cn("h-[18px] w-[18px]", active && "text-primary")} />
                    <span className="text-sm">Home</span>
                  </NavLink>
                );
              })()}
            </nav>

            {/* Operações */}
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-7 mb-2">
              Operações
            </p>
            <nav className="space-y-0.5 px-4">
              {filteredOperacoesNav.map((item) => (
                item.children ? (
                  <MobileNavItemWithChildren
                    key={item.name}
                    item={item}
                    isActive={isActive}
                    onNavClick={handleNavClick}
                    expanded={expandedItem === item.name}
                    onToggle={() => setExpandedItem(prev => prev === item.name ? null : item.name)}
                  />
                ) : (() => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={(e) => { setExpandedItem(null); handleNavClick(e, item.href); }}
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

            {/* Produção Section */}
            {canAccessSuppliers && (filteredProducaoNav.length > 0 || !searchQuery) && (
              <>
                <div className="px-4 my-3">
                  <Separator />
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-7 mb-2">
                  Produção
                </p>
                <nav className="space-y-0.5 px-4">
                  {filteredProducaoNav.map((item) => (
                    item.children ? (
                      <MobileNavItemWithChildren
                        key={item.name}
                        item={item}
                        isActive={isActive}
                        onNavClick={handleNavClick}
                        expanded={expandedItem === item.name}
                        onToggle={() => setExpandedItem(prev => prev === item.name ? null : item.name)}
                      />
                    ) : (() => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={(e) => { setExpandedItem(null); handleNavClick(e, item.href); }}
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
              </>
            )}

            {/* Marketing Section */}
            {(filteredMarketingNav.length > 0 || !searchQuery) && (
              <>
                <div className="px-4 my-3">
                  <Separator />
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-7 mb-2">
                  Marketing
                </p>
                <nav className="space-y-0.5 px-4">
                  {filteredMarketingNav.map((item) => (
                    item.children ? (
                      <MobileNavItemWithChildren
                        key={item.name}
                        item={item}
                        isActive={isActive}
                        onNavClick={handleNavClick}
                        expanded={expandedItem === item.name}
                        onToggle={() => setExpandedItem(prev => prev === item.name ? null : item.name)}
                      />
                    ) : (() => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={(e) => { setExpandedItem(null); handleNavClick(e, item.href); }}
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
              </>
            )}

            {/* Administração Section */}
            {isAdmin && (filteredAdminNav.length > 0 || !searchQuery) && (
              <>
                <div className="px-4 my-3">
                  <Separator />
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-7 mb-2">
                  Administração
                </p>
                <nav className="space-y-0.5 px-4">
                  {filteredAdminNav.map((item) => (
                    item.children ? (
                      <MobileNavItemWithChildren
                        key={item.name}
                        item={item}
                        isActive={isActive}
                        onNavClick={handleNavClick}
                        isAdmin
                        expanded={expandedItem === item.name}
                        onToggle={() => setExpandedItem(prev => prev === item.name ? null : item.name)}
                      />
                    ) : (() => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={(e) => { setExpandedItem(null); handleNavClick(e, item.href); }}
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
                    })()
                  ))}
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
