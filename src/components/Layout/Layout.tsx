import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileSidebar } from './MobileSidebar';
import { TopBar } from './TopBar';
import { UpdateNotification } from '@/components/PWA/UpdateNotification';
import { OfflineIndicator } from '@/components/PWA/OfflineIndicator';
import { InstallPrompt } from '@/components/PWA/InstallPrompt';
import { HiroBubble } from './HiroBubble';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function Layout() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex w-full">
      {!isMobile && <DesktopSidebar />}
      {isMobile && <MobileSidebar />}

      {isMobile && <TopBar />}

      <OfflineIndicator />
      <UpdateNotification />
      <InstallPrompt />
      <HiroBubble />

      <main
        className={cn(
          "flex-1 w-full min-h-screen bg-background [contain:layout]",
          isMobile
            ? isPWA
              ? "pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,1rem)]"
              : "pt-16 pb-4"
            : "pl-64"
        )}
      >
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
