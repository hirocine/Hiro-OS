import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarStateProvider, useSidebarState } from '@/contexts/SidebarContext';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileSidebar } from './MobileSidebar';
import { GlobalHeader } from './GlobalHeader';
import { UpdateNotification } from '@/components/PWA/UpdateNotification';
import { OfflineIndicator } from '@/components/PWA/OfflineIndicator';
import { InstallPrompt } from '@/components/PWA/InstallPrompt';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

function LayoutContent() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  
  // Try to use sidebar state, fallback to expanded
  let isExpanded = true;
  try {
    const sidebarState = useSidebarState();
    isExpanded = sidebarState.isExpanded;
  } catch {
    // Context not available yet, use default
  }

  return (
    <>
      {/* Sidebar - Desktop sempre visível, Mobile como Sheet */}
      {!isMobile && <DesktopSidebar />}
      {isMobile && <MobileSidebar />}
      
      {/* Global Header - Desktop e Mobile */}
      <GlobalHeader />
      
      {/* PWA Global Components */}
      <OfflineIndicator />
      <UpdateNotification />
      <InstallPrompt />
      
      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 w-full min-h-screen bg-background [contain:layout] transition-all duration-300",
          isMobile 
            ? isPWA 
              ? "pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,1rem)]"
              : "pt-16 pb-4"
            : cn(
                "pt-16", // espaço para o header
                isExpanded ? "pl-64" : "pl-16" // ajusta conforme sidebar
              )
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
    <SidebarStateProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <LayoutContent />
        </div>
      </SidebarProvider>
    </SidebarStateProvider>
  );
}
