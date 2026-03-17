import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getAvatarData } from '@/lib/avatarUtils';

interface InlineAssigneeCellProps {
  value: string[]; // array of user_ids
  users: Array<{
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    user_metadata?: any;
  }>;
  onSave: (newValue: string[]) => void;
  className?: string;
  isActive?: boolean;
}

export function InlineAssigneeCell({ 
  value = [], 
  users,
  onSave, 
  className = '',
  isActive = true
}: InlineAssigneeCellProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedUsers = users.filter(u => value.includes(u.id));

  const handleToggle = (userId: string) => {
    if (value.includes(userId)) {
      onSave(value.filter(id => id !== userId));
    } else {
      onSave([...value, userId]);
    }
  };

  const handleClear = () => {
    onSave([]);
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
            className="h-auto min-h-0 w-full justify-start text-left p-0 font-normal bg-transparent hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          >
            <div className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
              {!isActive || selectedUsers.length === 0 ? (
                <span className="text-sm text-muted-foreground">
                  {isActive ? 'Sem responsável' : 'Selecionar'}
                </span>
              ) : (
                <div className="flex items-center">
                  {/* Stacked avatars */}
                  <div className="flex -space-x-2">
                    {selectedUsers.slice(0, 3).map((user) => {
                      const avatarData = getAvatarData(
                        { id: user.id, email: user.email, user_metadata: user.user_metadata } as any,
                        user.avatar_url,
                        user.display_name
                      );
                      return (
                        <Avatar key={user.id} className="w-6 h-6 border-2 border-background">
                          <AvatarImage src={avatarData.url || undefined} />
                          <AvatarFallback className="text-[10px]">{avatarData.initials}</AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </div>
                  {selectedUsers.length > 3 && (
                    <span className="text-xs text-muted-foreground ml-1">+{selectedUsers.length - 3}</span>
                  )}
                  {selectedUsers.length <= 2 && (
                    <span className="text-sm ml-1.5">
                      {selectedUsers.map(u => u.display_name?.split(' ')[0] || u.email.split('@')[0]).join(', ')}
                    </span>
                  )}
                </div>
              )}
              <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
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
                  onSelect={handleClear}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", value.length === 0 ? "opacity-100" : "opacity-0")} />
                  Nenhum
                </CommandItem>
                {users.map((user) => {
                  const isSelected = value.includes(user.id);
                  const userData = getAvatarData(
                    { id: user.id, email: user.email, user_metadata: user.user_metadata } as any,
                    user.avatar_url,
                    user.display_name
                  );
                  return (
                    <CommandItem 
                      key={user.id} 
                      onSelect={() => handleToggle(user.id)}
                      className="cursor-pointer"
                    >
                      <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
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
