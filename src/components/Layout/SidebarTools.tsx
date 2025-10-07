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
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Ferramentas
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/50 transition-colors">
            <span className="text-sm">Notificações</span>
            <NotificationPanel />
          </div>
          
          <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/50 transition-colors">
            <span className="text-sm">Tema</span>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}
