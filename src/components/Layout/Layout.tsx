import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { InstallPrompt } from '@/components/PWA/InstallPrompt';
import { OfflineIndicator } from '@/components/PWA/OfflineIndicator';
import { UpdateNotification } from '@/components/PWA/UpdateNotification';

export function Layout() {
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