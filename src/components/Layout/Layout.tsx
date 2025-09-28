import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { InstallPrompt } from '@/components/PWA/InstallPrompt';
import { OfflineIndicator } from '@/components/PWA/OfflineIndicator';
import { UpdateNotification } from '@/components/PWA/UpdateNotification';
import { useIsPWA } from '@/hooks/useIsPWA';
import { cn } from '@/lib/utils';

export function Layout() {
  const isPWA = useIsPWA();

  if (isPWA) {
    // Layout específico para PWA
    return (
      <SidebarProvider
        style={{
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "4rem",
          "--sidebar-width-mobile": "18rem",
        } as React.CSSProperties}
      >
        {/* Header fixo no topo com z-index máximo */}
        <div className="fixed inset-x-0 top-0 z-[60]">
          <Header />
        </div>
        
        {/* Indicadores PWA */}
        <OfflineIndicator />
        <UpdateNotification />
        
        {/* Container principal */}
        <div className={cn(
          "min-h-screen flex w-full max-w-screen overflow-hidden",
          "pt-[calc(4rem+env(safe-area-inset-top,0px))]" // Espaço para o header + safe area
        )}>
          <AppSidebar />
          <SidebarInset className="flex-1 min-w-0">
            <main className="flex-1 overflow-hidden overflow-y-auto min-w-0">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
        
        <InstallPrompt />
      </SidebarProvider>
    );
  }

  // Layout padrão para web
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "4rem",
        "--sidebar-width-mobile": "18rem",
      } as React.CSSProperties}
    >
      <div className="min-h-screen flex w-full max-w-screen overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex-1 min-w-0">
          <Header />
          <OfflineIndicator />
          <UpdateNotification />
          <main className="flex-1 overflow-hidden overflow-y-auto pt-16 min-w-0">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <InstallPrompt />
    </SidebarProvider>
  );
}