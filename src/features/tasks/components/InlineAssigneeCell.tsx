import { useState } from 'react';
import { ChevronDown, Check, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getAvatarData } from '@/lib/avatarUtils';

interface InlineAssigneeCellProps {
  value: string | null; // user_id or null
  users: Array<{
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    user_metadata?: any;
  }>;
  onSave: (newValue: string | null) => void;
  className?: string;
  isActive?: boolean;
}

export function InlineAssigneeCell({ 
  value, 
  users,
  onSave, 
  className = '',
  isActive = true
}: InlineAssigneeCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedUser = users.find(u => u.id === value);
  const avatarData = selectedUser ? getAvatarData(
    { id: selectedUser.id, email: selectedUser.email, user_metadata: selectedUser.user_metadata } as any,
    selectedUser.avatar_url,
    selectedUser.display_name
  ) : null;

  const handleValueChange = (newValue: string) => {
    if (newValue === 'none') {
      onSave(null);
    } else if (newValue !== value) {
      onSave(newValue);
    }
    setIsOpen(false);
  };

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto min-h-0 w-auto p-0 font-normal bg-transparent hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
              {!isActive ? (
                <span className="text-sm text-muted-foreground/60 italic">Selecionar</span>
              ) : avatarData ? (
                <>
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={avatarData.url || undefined} />
                    <AvatarFallback className="text-xs">{avatarData.initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{avatarData.displayName || selectedUser?.email}</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Sem responsável</span>
              )}
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[240px] p-0" 
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem 
                  onSelect={() => handleValueChange('none')}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                  Nenhum
                </CommandItem>
                {users.map((user) => {
                  const userData = getAvatarData(
                    { id: user.id, email: user.email, user_metadata: user.user_metadata } as any,
                    user.avatar_url,
                    user.display_name
                  );
                  return (
                    <CommandItem 
                      key={user.id} 
                      onSelect={() => handleValueChange(user.id)}
                      className="cursor-pointer"
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === user.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={userData.url || undefined} />
                          <AvatarFallback className="text-xs">{userData.initials}</AvatarFallback>
                        </Avatar>
                        <span>{userData.displayName || user.email}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
