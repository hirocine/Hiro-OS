import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsPWA } from '@/hooks/useIsPWA';
import { cn } from '@/lib/utils';
import { Z_INDEX } from '@/lib/z-index';

export function TopBar() {
  const { setOpenMobile } = useSidebar();
  const isPWA = useIsPWA();

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
        "flex items-center justify-between relative px-4",
        isPWA && "pt-[env(safe-area-inset-top,0px)]"
      )}
      style={{ zIndex: Z_INDEX.header }}
    >
      <Button 
        size="icon" 
        variant="ghost"
        onClick={() => setOpenMobile(true)}
        className="h-9 w-9"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo centralizado */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <img 
          src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png" 
          alt="Hiro Logo" 
          className="h-8 w-auto"
        />
      </div>
    </header>
  );
}
