import { Outlet } from 'react-router-dom';
import { VerticalSidebar } from './VerticalSidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { InstallPrompt } from '@/components/PWA/InstallPrompt';
import { OfflineIndicator } from '@/components/PWA/OfflineIndicator';
import { UpdateNotification } from '@/components/PWA/UpdateNotification';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function Layout() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();

  // Mobile sempre usa AppSidebar (Sheet)
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full">
        {/* Header com mobile trigger */}
        <Header />
        
        {/* PWA Indicators */}
        <OfflineIndicator />
        <UpdateNotification />
        
        {/* Mobile Sidebar */}
        <AppSidebar />
        
        {/* Main content */}
        <main className={cn(
          "flex-1 overflow-hidden overflow-y-auto min-w-0",
          isPWA 
            ? "pt-[calc(4rem+env(safe-area-inset-top,0px))]" 
            : "pt-16"
        )}>
          <Outlet />
        </main>
        
        <InstallPrompt />
      </div>
    );
  }

  if (isPWA) {
    // Layout PWA Desktop com sidebar vertical
    return (
      <div className="min-h-screen flex w-full max-w-screen overflow-hidden">
        {/* Header fixo no topo com z-index máximo */}
        <div className="fixed inset-x-0 top-0 z-[60]">
          <Header />
        </div>
        
        {/* Indicadores PWA */}
        <OfflineIndicator />
        <UpdateNotification />
        
        {/* Container principal com padding-top para header */}
        <div className={cn(
          "min-h-screen flex w-full max-w-screen overflow-hidden",
          "pt-[calc(4rem+env(safe-area-inset-top,0px))]" // Espaço para o header + safe area
        )}>
          <VerticalSidebar />
          <main className="flex-1 overflow-hidden overflow-y-auto min-w-0">
            <Outlet />
          </main>
        </div>
        
        <InstallPrompt />
      </div>
    );
  }

  // Layout padrão para web desktop
  return (
    <div className="min-h-screen flex w-full max-w-screen overflow-hidden">
      <VerticalSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <OfflineIndicator />
        <UpdateNotification />
        <main className="flex-1 overflow-hidden overflow-y-auto pt-16 min-w-0">
          <Outlet />
        </main>
      </div>
      <InstallPrompt />
    </div>
  );
}