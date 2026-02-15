import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsPWA } from '@/hooks/useIsPWA';
import { cn } from '@/lib/utils';
import { Z_INDEX } from '@/lib/z-index';
import { NotificationPanel } from './NotificationPanel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { useMobileSidebarTrigger } from './MobileSidebar';

export function TopBar() {
  const openSidebar = useMobileSidebarTrigger();
  const isPWA = useIsPWA();

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 h-28 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
        "flex items-center justify-between px-4",
        isPWA && "pt-[env(safe-area-inset-top,0px)]"
      )}
      style={{ zIndex: Z_INDEX.header }}
    >
      <Button 
        size="icon" 
        variant="ghost"
        onClick={openSidebar}
        className="h-9 w-9"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <div className="h-9 w-9 flex items-center justify-center">
          <NotificationPanel />
        </div>
        <ThemeSwitcher />
      </div>
    </header>
  );
}
