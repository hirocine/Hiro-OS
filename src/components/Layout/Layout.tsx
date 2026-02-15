import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileSidebar } from './MobileSidebar';
import { TopBar } from './TopBar';
import { UpdateNotification } from '@/components/PWA/UpdateNotification';
import { OfflineIndicator } from '@/components/PWA/OfflineIndicator';
import { InstallPrompt } from '@/components/PWA/InstallPrompt';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

function getDefaultSidebarOpen(): boolean {
  try {
    const match = document.cookie.match(/(?:^|;\s*)sidebar:state=([^;]*)/);
    if (match) return match[1] === 'true';
  } catch {}
  return true;
}

function LayoutContent() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const { state } = useSidebar();
  const expanded = state === 'expanded';

  return (
    <>
      {!isMobile && <DesktopSidebar />}
      {isMobile && <MobileSidebar />}
      
      {isMobile && <TopBar />}
      
      <OfflineIndicator />
      <UpdateNotification />
      <InstallPrompt />
      
      <main 
        className={cn(
          "flex-1 w-full min-h-screen bg-background [contain:layout] transition-[padding-left] duration-300 ease-in-out",
          isMobile 
            ? isPWA 
              ? "pt-[calc(7rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,1rem)]"
              : "pt-28 pb-4"
            : expanded ? "pl-64" : "pl-16"
        )}
      >
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
    </>
  );
}

export function Layout() {
  return (
    <SidebarProvider defaultOpen={getDefaultSidebarOpen()}>
      <div className="min-h-screen flex w-full">
        <LayoutContent />
      </div>
    </SidebarProvider>
  );
}
