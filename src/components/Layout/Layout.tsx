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
        "--sidebar-width-icon": "5rem",
      } as React.CSSProperties}
    >
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <OfflineIndicator />
          <UpdateNotification />
          <main className="flex-1 overflow-auto pt-16">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <InstallPrompt />
    </SidebarProvider>
  );
}