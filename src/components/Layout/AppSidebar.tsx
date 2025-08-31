import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, BarChart3, FolderOpen, Shield, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
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
  const { state, isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar 
      collapsible="icon" 
      className="transition-all duration-300 ease-in-out border-r border-sidebar-border"
      variant="sidebar"
    >
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png" 
              alt="HIRO Logo" 
              className={cn(
                "transition-all duration-300 ease-in-out flex-shrink-0",
                state === 'collapsed' ? "h-6 w-auto" : "h-8 w-auto"
              )}
            />
            {state !== 'collapsed' && (
              <div>
                <span className="text-lg font-semibold text-sidebar-foreground">
                  Inventário
                </span>
                <p className="text-xs text-sidebar-foreground/70">
                  Produtora Audiovisual
                </p>
              </div>
            )}
          </div>
          <SidebarTrigger className="h-8 w-8 rounded-md hover:bg-sidebar-accent text-sidebar-foreground" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          {state !== 'collapsed' && (
            <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-medium uppercase tracking-wide">
              Navegação
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => {
                if (item.adminOnly && !isAdmin) {
                  return null;
                }
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      className="transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group"
                      tooltip={state === 'collapsed' ? item.name : undefined}
                    >
                      <NavLink
                        to={item.href}
                        end={item.href === '/'}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )
                        }
                        onClick={() => {
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {state !== 'collapsed' && (
                          <span className="transition-all duration-200">{item.name}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className="transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    tooltip={state === 'collapsed' ? 'Administração' : undefined}
                  >
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )
                      }
                      onClick={() => {
                        if (isMobile) {
                          setOpenMobile(false);
                        }
                      }}
                    >
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      {state !== 'collapsed' && (
                        <span className="transition-all duration-200">Administração</span>
                      )}
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