import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarData } from '@/lib/avatarUtils';

interface InlineAssigneeCellProps {
  value: string[];
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
  /** Avatar shape — `'square'` removes the default circle rounding. */
  avatarShape?: 'circle' | 'square';
  /**
   * When true, picking a user replaces the current selection and closes the
   * popover. Use this for single-owner fields like `editor_id` in the
   * post-production queue. Default behavior is multi-select (toggle).
   */
  singleSelect?: boolean;
}

export function InlineAssigneeCell({
  value = [],
  users,
  onSave,
  className = '',
  isActive = true,
  avatarShape = 'circle',
  singleSelect = false,
}: InlineAssigneeCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isSquare = avatarShape === 'square';
  const avatarSquareClass = isSquare
    ? 'rounded-none [&_img]:rounded-none [&_span]:rounded-none'
    : '';
  const avatarSquareStyle: React.CSSProperties = isSquare ? { borderRadius: 0 } : {};

  const selectedUsers = users.filter((u) => value.includes(u.id));

  const handleToggle = (userId: string) => {
    if (singleSelect) {
      // Picking the same user again clears it (acts as a deselect).
      onSave(value.includes(userId) ? [] : [userId]);
      setIsOpen(false);
      return;
    }
    if (value.includes(userId)) onSave(value.filter((id) => id !== userId));
    else onSave([...value, userId]);
  };

  const handleClear = () => {
    onSave([]);
    setIsOpen(false);
  };

  return (
    <div onClick={(e) => e.stopPropagation()} className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {!isActive || selectedUsers.length === 0 ? (
              <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                {isActive ? 'Sem responsável' : 'Selecionar'}
              </span>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex' }}>
                  {selectedUsers.slice(0, 3).map((user, i) => {
                    const avatarData = getAvatarData(
                      { id: user.id, email: user.email, user_metadata: user.user_metadata } as any,
                      user.avatar_url,
                      user.display_name
                    );
                    return (
                      <Avatar
                        key={user.id}
                        className={avatarSquareClass}
                        style={{
                          width: 22,
                          height: 22,
                          border: '2px solid hsl(var(--ds-surface))',
                          marginLeft: i === 0 ? 0 : -6,
                          ...avatarSquareStyle,
                        }}
                      >
                        <AvatarImage src={avatarData.url || undefined} />
                        <AvatarFallback
                          className={avatarSquareClass}
                          style={{ fontSize: 9, ...avatarSquareStyle }}
                        >
                          {avatarData.initials}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
                {selectedUsers.length > 3 && (
                  <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
                    +{selectedUsers.length - 3}
                  </span>
                )}
                {selectedUsers.length <= 2 && (
                  <span
                    style={{
                      fontSize: 13,
                      marginLeft: 6,
                      color: 'hsl(var(--ds-fg-1))',
                      textAlign: 'left',
                      whiteSpace: 'normal',
                      wordBreak: 'normal',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {selectedUsers.map((u) => u.display_name?.split(' ')[0] || u.email.split('@')[0]).join(', ')}
                  </span>
                )}
              </div>
            )}
            <ChevronDown size={11} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-4))', flexShrink: 0 }} />
          </button>
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
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  Nenhum
                  <Check
                    size={14}
                    strokeWidth={1.5}
                    style={{
                      marginLeft: 'auto',
                      flexShrink: 0,
                      opacity: value.length === 0 ? 1 : 0,
                      color: 'hsl(var(--ds-accent))',
                    }}
                  />
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
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar
                          className={avatarSquareClass}
                          style={{ width: 24, height: 24, ...avatarSquareStyle }}
                        >
                          <AvatarImage src={userData.url || undefined} />
                          <AvatarFallback
                            className={avatarSquareClass}
                            style={{ fontSize: 10, ...avatarSquareStyle }}
                          >
                            {userData.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span>{userData.displayName || user.email}</span>
                      </div>
                      <Check
                        size={14}
                        strokeWidth={1.5}
                        style={{
                          marginLeft: 'auto',
                          flexShrink: 0,
                          opacity: isSelected ? 1 : 0,
                          color: 'hsl(var(--ds-accent))',
                        }}
                      />
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
