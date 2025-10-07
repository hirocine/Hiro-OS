import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { VerticalSidebar } from './VerticalSidebar';
import { Header } from './Header';
import { UpdateNotification } from '@/components/PWA/UpdateNotification';
import { OfflineIndicator } from '@/components/PWA/OfflineIndicator';
import { InstallPrompt } from '@/components/PWA/InstallPrompt';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function Layout() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();

  // Layout PWA
  if (isPWA) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-background">
          <Header />
          <OfflineIndicator />
          <UpdateNotification />
          <InstallPrompt />

          <div className="flex flex-1 w-full">
            {!isMobile && <VerticalSidebar />}
            {isMobile && <AppSidebar />}
            
            <main 
              className={cn(
                "flex-1 w-full",
                isMobile 
                  ? "pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,1rem)]"
                  : "pt-[calc(4rem+env(safe-area-inset-top,0px))] pl-24 pb-[env(safe-area-inset-bottom,1rem)]"
              )}
            >
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // Layout Web padrão
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "16rem",
        "--sidebar-width-mobile": "20rem",
      } as React.CSSProperties}
    >
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop: Sidebar vertical fixa */}
        {!isMobile && <VerticalSidebar />}
        
        {/* Mobile: Sheet overlay */}
        {isMobile && <AppSidebar />}
        
        <div className="flex flex-col flex-1">
          <Header />
          <OfflineIndicator />
          <UpdateNotification />
          <InstallPrompt />
          <main className={cn(
            "flex-1 pt-16",
            !isMobile && "pl-24"
          )}>
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
