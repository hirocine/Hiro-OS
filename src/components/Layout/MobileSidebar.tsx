import { Home, LayoutDashboard, Package, Camera, FileText, Settings, X, HardDrive, Key, Users } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { useSidebar } from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { SidebarTools } from './SidebarTools';
import { SidebarUserProfile } from './SidebarUserProfile';
import { cn } from '@/lib/utils';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
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
  { name: 'Projetos', href: '/projetos', icon: Camera },
  { name: 'Inventário', href: '/inventario', icon: Package },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Controle de SSDs e HDs', href: '/ssds', icon: HardDrive },
  { name: 'Políticas', href: '/politicas', icon: FileText },
  { name: 'Plataformas', href: '/plataformas', icon: Key },
];

const adminNavigation: NavigationItem[] = [
  { name: 'Fornecedores', href: '/fornecedores', icon: Users, adminOnly: true },
  { name: 'Admin', href: '/administracao', icon: Settings, adminOnly: true },
];

export function MobileSidebar() {
  const { isAdmin } = useUserRole();
  const { openMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const isPWA = useIsPWA();

  useEffect(() => {
    if (openMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, setOpenMobile]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile}>
      <SheetContent 
        side="left" 
        className={cn(
          "w-80 flex flex-col p-0 [&>button]:hidden",
          isPWA && "pt-[env(safe-area-inset-top,0px)]"
        )}
      >
        {/* Header com Logo */}
        <SheetHeader className={cn(
          "flex-row items-center justify-between border-b border-border px-4 py-4",
          isPWA && "pt-[calc(1rem+env(safe-area-inset-top,0px))]"
        )}>
          <div className="flex items-center gap-3">
            <img 
              src={hiroLogo} 
              alt="HIRO Logo" 
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div className="text-left">
              <h1 className="text-sm font-bold leading-none text-left">Sistema de</h1>
              <h2 className="text-sm font-bold text-primary leading-none mt-0.5 text-left">Inventário</h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpenMobile(false)}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </SheetHeader>

        {/* Conteúdo com ScrollArea */}
        <ScrollArea className="flex-1">
          <div className="py-4">
            {/* Navegação Principal */}
            <div className="px-4 mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-3">
                Menu Principal
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
                        "flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 relative group",
                        active 
                          ? "bg-primary/10 text-primary font-medium shadow-sm" 
                          : "hover:bg-accent/50 text-foreground"
                      )}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 bg-primary rounded-r-full" />
                      )}
                      <Icon className={cn(
                        "h-5 w-5",
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
              <>
                <div className="px-4 mb-4">
                  <Separator className="mb-4" />
                </div>
              <div className="px-4 mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-3">
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
                          "flex items-center gap-3 px-3 py-3 rounded-md transition-all duration-200 relative group",
                          active 
                            ? "bg-destructive/10 text-destructive font-medium shadow-sm" 
                            : "hover:bg-destructive/5 text-foreground"
                        )}
                      >
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 bg-destructive rounded-r-full" />
                        )}
                        <Icon className={cn(
                          "h-5 w-5",
                          active && "text-destructive"
                        )} />
                        <span className="text-sm">{item.name}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>
              </>
            )}

            {/* Ferramentas */}
            <div className="px-4">
              <SidebarTools isMobile />
            </div>
          </div>
        </ScrollArea>

        {/* User Profile - Sticky Bottom */}
        <div className="px-4 py-6 flex items-center">
          <SidebarUserProfile isMobile />
        </div>
      </SheetContent>
    </Sheet>
  );
}
