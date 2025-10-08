import { NotificationPanel } from './NotificationPanel';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarToolsProps {
  isMobile?: boolean;
}

export function SidebarTools({ isMobile = false }: SidebarToolsProps) {
  if (isMobile) {
    return null;
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
