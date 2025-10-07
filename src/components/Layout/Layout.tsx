import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileSidebar } from './MobileSidebar';
import { UpdateNotification } from '@/components/PWA/UpdateNotification';
import { OfflineIndicator } from '@/components/PWA/OfflineIndicator';
import { InstallPrompt } from '@/components/PWA/InstallPrompt';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Layout() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar - Desktop sempre visível, Mobile como Sheet */}
        {!isMobile && <DesktopSidebar />}
        {isMobile && <MobileSidebar />}
        
        {/* PWA Global Components */}
        <OfflineIndicator />
        <UpdateNotification />
        <InstallPrompt />
        
        {/* Main Content Area */}
        <main 
          className={cn(
            "flex-1 w-full min-h-screen",
            isMobile 
              ? isPWA 
                ? "pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,1rem)]"
                : "pt-0 pb-4"
              : "pl-60" // Desktop: padding-left para sidebar 240px
          )}
        >
          {/* Mobile: Botão flutuante para abrir sidebar */}
          {isMobile && (
            <div className={cn(
              "fixed top-4 left-4 z-40",
              isPWA && "top-[calc(1rem+env(safe-area-inset-top,0px))]"
            )}>
              <SidebarTrigger asChild>
                <Button size="icon" variant="outline" className="h-10 w-10 rounded-full shadow-lg">
                  <Menu className="h-5 w-5" />
                </Button>
              </SidebarTrigger>
            </div>
          )}
          
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
