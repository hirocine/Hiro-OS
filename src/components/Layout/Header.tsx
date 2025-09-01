import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card shadow-card flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="h-8 w-8" />
        <img 
          src="/lovable-uploads/418c9547-19f7-4c12-8117-10a72835f155.png" 
          alt="HIRO Logo" 
          className="h-8 w-auto flex-shrink-0"
        />
        <div>
          <h2 className="text-lg font-semibold">Sistema de Inventário</h2>
        </div>
      </div>
    </header>
  );
}