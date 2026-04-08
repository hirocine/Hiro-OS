import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, Package, Settings, BarChart3, Camera, HardDrive, Key, FileText, CheckSquare, Users, UserCheck, Building2, Film, Receipt, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import hiroLogo from '@/assets/hiro-logo.png';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Esteira de Pós', href: '/esteira-de-pos', icon: CheckSquare },
  { name: 'Retiradas', href: '/retiradas', icon: Camera },
  { name: 'Inventário', href: '/inventario', icon: Package },
  { name: 'Armazenamento', href: '/ssds', icon: HardDrive },
  { name: 'Políticas', href: '/politicas', icon: FileText },
  { name: 'Plataformas', href: '/plataformas', icon: Key },
];

const producaoNavigation: NavigationItem[] = [
  {
    name: 'Projetos',
    href: '/projetos-av',
    icon: Film,
  },
  {
    name: 'Orçamentos',
    href: '/orcamentos',
    icon: Receipt,
  },
  {
    name: 'Freelancers',
    href: '/fornecedores/freelancers',
    icon: UserCheck,
  },
  {
    name: 'Empresas',
    href: '/fornecedores/empresas',
    icon: Building2,
  },
];

const adminNavigation: NavigationItem[] = [
  {
    name: 'Financeiro',
    href: '/financeiro',
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    name: 'Administração',
    href: '/administracao',
    icon: Settings,
    adminOnly: true,
  },
];

export function Sidebar() {
  const { isAdmin, canAccessSuppliers } = useAuthContext();

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
            Hiro OS®
          </span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end
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
        
        {canAccessSuppliers && (
          <div className="pt-4 border-t border-border mt-4">
            <div className="pb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Produção
              </p>
            </div>
            {producaoNavigation.map((item) => (
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