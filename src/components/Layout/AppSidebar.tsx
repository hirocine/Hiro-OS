import { Home, Package, FolderKanban, FileText, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSidebar } from '@/components/ui/sidebar';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useEffect } from 'react';
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

export function AppSidebar() {
  const { isAdmin } = useUserRole();
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const isPWA = useIsPWA();

  useEffect(() => {
    if (open) {
      setOpen(false);
    }
  }, [location.pathname, setOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent 
        side="left" 
        className={cn("w-80 p-0", isPWA && "pt-[env(safe-area-inset-top,0px)]")}
        style={{ zIndex: Z_INDEX.sheet }}
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Menu de Navegação</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 p-6">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Menu Principal
            </h3>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <NavLink key={item.name} to={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground", active && "bg-accent text-primary font-medium")}>
                    <Icon className="h-5 w-5" />
                    <span className="text-sm">{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {isAdmin && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Administração</h3>
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <NavLink key={item.name} to={item.href} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-destructive/10 hover:text-destructive", active && "bg-destructive/20 text-destructive font-medium")}>
                      <Icon className="h-5 w-5" />
                      <span className="text-sm">{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
