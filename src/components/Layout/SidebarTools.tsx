import { NotificationPanel } from './NotificationPanel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Separator } from '@/components/ui/separator';

interface SidebarToolsProps {
  isMobile?: boolean;
}

export function SidebarTools({ isMobile = false }: SidebarToolsProps) {
  return (
    <>
      <Separator className="my-2" />
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          Ferramentas
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer">
            <NotificationPanel />
            <span className="text-[10px] text-muted-foreground mt-1.5">Notificações</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
            <ThemeSwitcher />
            <span className="text-[10px] text-muted-foreground mt-1.5">Tema</span>
          </div>
        </div>
      </div>
    </>
  );
}
