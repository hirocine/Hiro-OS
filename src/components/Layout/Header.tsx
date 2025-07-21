import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-card shadow-card flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-lg font-semibold">Sistema de Inventário</h2>
          <p className="text-sm text-muted-foreground">
            Produtora Audiovisual
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            3
          </Badge>
        </Button>
        
        <Button variant="ghost" size="icon">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}