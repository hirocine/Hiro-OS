import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { Footer } from './Footer';

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
          <main className="flex-1 overflow-auto pb-12 pt-16">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <Footer />
    </SidebarProvider>
  );
}