import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Settings, BarChart3, FolderOpen, Shield } from 'lucide-react';
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
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-3 px-3 py-3">
          <img 
            src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png" 
            alt="HIRO Logo" 
            className="w-auto h-8 flex-shrink-0"
          />
          {state !== 'collapsed' && (
            <span className="text-lg font-semibold text-foreground">
              Inventário
            </span>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="items-center">
              {navigation.map((item) => {
                // Hide admin-only items for non-admin users
                if (item.adminOnly && !isAdmin) {
                  return null;
                }
                
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild className="!px-6 py-2 justify-center">
                      <NavLink
                        to={item.href}
                        end={item.href === '/'}
                        className="flex items-center justify-center w-full"
                      >
                        <item.icon className={cn(
                          "h-4 w-4 flex-shrink-0",
                          state !== 'collapsed' && "mr-3"
                        )} />
                        <span>{item.name}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="!px-6 py-2 justify-center">
                    <NavLink
                      to="/admin"
                      className="flex items-center justify-center w-full"
                    >
                      <Shield className={cn(
                        "h-4 w-4 flex-shrink-0",
                        state !== 'collapsed' && "mr-3"
                      )} />
                      <span>Administração</span>
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