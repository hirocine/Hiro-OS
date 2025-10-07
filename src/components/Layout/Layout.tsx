import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
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

function LayoutContent() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  return (
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
            : "pl-16" // Desktop: padding-left para sidebar 64px
        )}
      >
        {/* Mobile: Botão flutuante para abrir sidebar */}
        {isMobile && (
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => setOpenMobile(true)}
            className={cn(
              "fixed top-4 left-4 z-50 h-10 w-10 rounded-full shadow-lg",
              isPWA && "top-[calc(1rem+env(safe-area-inset-top,0px))]"
            )}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        
        <Outlet />
      </main>
    </div>
  );
}

export function Layout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
}
