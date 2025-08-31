import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Settings, BarChart3, FolderOpen, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

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

export function Sidebar() {
  const { isAdmin } = useUserRole();

  return (
    <div className="w-64 bg-card border-r border-border shadow-card flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png" 
            alt="HIRO Logo" 
            className="h-8 w-auto"
          />
          <span className="text-lg font-semibold text-foreground">
            Inventário
          </span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          // Hide admin-only items for non-admin users
          if (item.adminOnly && !isAdmin) {
            return null;
          }
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-elegant'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )
              }
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </NavLink>
          );
        })}
        
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-elegant'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )
            }
          >
            <Shield className="mr-3 h-4 w-4" />
            Administração
          </NavLink>
        )}
      </nav>
    </div>
  );
}