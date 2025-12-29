import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Button } from '@/components/ui/button';
import { useSidebarState } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarUserProfile } from './SidebarUserProfile';
import { NotificationPanel } from './NotificationPanel';

// Mapeamento de rotas para títulos
const routeTitles: Record<string, string> = {
  '/': 'Início',
  '/home': 'Início',
  '/equipamentos': 'Equipamentos',
  '/equipamentos/adicionar': 'Adicionar Equipamento',
  '/projetos': 'Projetos',
  '/tarefas': 'Tarefas',
  '/minhas-tarefas': 'Minhas Tarefas',
  '/ssds': 'SSDs',
  '/fornecedores': 'Fornecedores',
  '/projetos-av': 'Projetos AV',
  '/acessos': 'Acessos',
  '/politicas': 'Políticas',
  '/admin': 'Administração',
  '/perfil': 'Perfil',
  '/dashboard': 'Dashboard',
};

function getPageTitle(pathname: string): string {
  // Verifica correspondência exata primeiro
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }
  
  // Verifica correspondência parcial para rotas dinâmicas
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const baseRoute = '/' + segments[0];
    return routeTitles[baseRoute] || 'Inventário';
  }
  
  return 'Inventário';
}

export function GlobalHeader() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isPWA = useIsPWA();
  const { setOpenMobile } = useSidebar();
  
  // Tenta usar o contexto, mas não quebra se não estiver disponível
  let isExpanded = true;
  try {
    const sidebarState = useSidebarState();
    isExpanded = sidebarState.isExpanded;
  } catch {
    // Context not available, use default
  }

  const pageTitle = getPageTitle(location.pathname);

  return (
    <header 
      className={cn(
        "fixed top-0 right-0 z-40 h-16 bg-background/95 backdrop-blur-sm border-b border-border transition-all duration-300",
        isMobile 
          ? isPWA 
            ? "left-0 pt-[env(safe-area-inset-top,0px)]" 
            : "left-0"
          : isExpanded 
            ? "left-64" 
            : "left-16"
      )}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side - Menu button (mobile) + Title */}
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setOpenMobile(true)}
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <h1 className="text-xl font-semibold text-foreground truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center gap-2 lg:gap-3">
          <NotificationPanel />
          <ThemeSwitcher />
          <SidebarUserProfile variant="header" />
        </div>
      </div>
    </header>
  );
}
