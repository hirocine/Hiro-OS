import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileSidebar } from './MobileSidebar';
import { TopBar } from './TopBar';
import { UpdateNotification } from '@/components/PWA/UpdateNotification';
import { OfflineIndicator } from '@/components/PWA/OfflineIndicator';
import { InstallPrompt } from '@/components/PWA/InstallPrompt';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

function LayoutContent() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar - Desktop sempre visível, Mobile como Sheet */}
      {!isMobile && <DesktopSidebar />}
      {isMobile && <MobileSidebar />}
      
      {/* Top Bar - Apenas Mobile */}
      {isMobile && <TopBar />}
      
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
              ? "pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,1rem)]"
              : "pt-14 pb-4"
            : "pl-16" // Desktop: padding-left para sidebar 64px
        )}
      >
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
