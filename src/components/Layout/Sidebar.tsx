import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Settings, BarChart3, FolderOpen, Shield, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';
import hiroLogo from '@/assets/hiro-logo.png';

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
    name: 'SSDs',
    href: '/ssds',
    icon: HardDrive,
  },
  {
    name: 'Projetos',
    href: '/projects',
    icon: FolderOpen,
  },
];

const adminNavigation: NavigationItem[] = [
  {
    name: 'Administração',
    href: '/admin',
    icon: Settings,
    adminOnly: true,
  },
  {
    name: 'Segurança',
    href: '/security',
    icon: Shield,
    adminOnly: true,
  },
];

export function Sidebar() {
  const { isAdmin } = useUserRole();

  return (
    <div className="w-64 bg-card border-r border-border shadow-card flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img 
            src={hiroLogo} 
            alt="HIRO Logo" 
            className="h-8 w-auto"
          />
          <span className="text-lg font-semibold text-foreground">
            Inventário
          </span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
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
        ))}
        
        {isAdmin && (
          <div className="pt-4 border-t border-border mt-4">
            <div className="pb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Administração
              </p>
            </div>
            {adminNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
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
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}