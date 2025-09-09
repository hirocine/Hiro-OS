
import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { LayoutDashboard, Package, Settings, BarChart3, FolderOpen, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsPWA } from '@/hooks/useIsPWA';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Inventário',
    href: '/equipment',
    icon: Package,
  },
  {
    name: 'Projetos',
    href: '/projects',
    icon: FolderOpen,
  },
  {
    name: 'Relatórios',
    href: '/reports',
    icon: BarChart3,
  },
];

export function AppSidebar() {
  const { isAdmin } = useUserRole();
  const { setOpenMobile } = useSidebar();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isPWA = useIsPWA();

  // Auto-close sidebar on mobile when navigating to a new route
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);

  // Determine collapsible behavior based on device and PWA status
  const getCollapsibleBehavior = () => {
    if (isMobile) return "offcanvas";
    return "icon";
  };

  return (
    <Sidebar 
      collapsible={getCollapsibleBehavior()}
      className="border-r border-border/40"
    >
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground/80 px-3 mb-4">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => {
                // Hide admin-only items for non-admin users
                if (item.adminOnly && !isAdmin) {
                  return null;
                }
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild className="h-10">
                      <NavLink
                        to={item.href}
                        end={item.href === '/'}
                        className={({ isActive }) => cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive && "bg-primary/10 text-primary font-medium border border-primary/20"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to="/admin"
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive && "bg-primary/10 text-primary font-medium border border-primary/20"
                      )}
                    >
                      <Shield className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">Administração</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
