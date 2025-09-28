import { Menu } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { useIsPWA } from '@/hooks/useIsPWA';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { cn } from '@/lib/utils';

export function Header() {
  const isPWA = useIsPWA();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className={cn(
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border",
        "flex items-center justify-between px-4 w-full z-50",
        isPWA 
          ? "h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)]" 
          : "h-16"
      )}>
        <div className="flex items-center gap-4">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png" 
              alt="HIRO Logo" 
              className="h-6 w-auto"
            />
            <span className="text-lg font-semibold text-foreground">
              Inventário
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationPanel />
          <ThemeSwitcher />
        </div>
      </header>

      {/* Mobile Sidebar */}
      {isMobile && <AppSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />}
    </>
  );
}