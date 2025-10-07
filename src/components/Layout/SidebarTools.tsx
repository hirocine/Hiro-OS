import { NotificationPanel } from './NotificationPanel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarToolsProps {
  isMobile?: boolean;
}

export function SidebarTools({ isMobile = false }: SidebarToolsProps) {
  if (isMobile) {
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

  return (
    <>
      <Separator className="my-2" />
      <div className="px-2 py-2">
        <div className="space-y-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center h-12 rounded-md hover:bg-accent/50 transition-colors cursor-pointer">
                <NotificationPanel />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Notificações</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center h-12 rounded-md hover:bg-accent/50 transition-colors">
                <ThemeSwitcher />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Tema</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  );
}
