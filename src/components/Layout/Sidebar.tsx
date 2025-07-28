import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Settings, BarChart3, ArrowRightLeft, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
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
  {
    name: 'Configurações',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-card border-r border-border shadow-card flex flex-col">
      <div className="p-6 border-b border-border">
        <img 
          src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png" 
          alt="HIRO Logo" 
          className="h-12 w-auto mb-2"
        />
        <p className="text-sm text-muted-foreground">
          Gestão de Equipamentos
        </p>
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
      </nav>
    </div>
  );
}