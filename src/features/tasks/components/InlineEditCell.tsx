import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface InlineEditCellProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
}

export function InlineEditCell({ value, onSave, className = '' }: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() !== value && editValue.trim() !== '') {
      onSave(editValue.trim());
    } else {
      setEditValue(value);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        style={{ height: 32, fontSize: 13 }}
        className={className}
      />
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      style={{
        cursor: 'pointer',
        padding: '4px 8px',
        margin: '-4px -8px',
        fontSize: 13,
        color: 'hsl(var(--ds-fg-1))',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsl(var(--ds-line-2))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      className={className}
    >
      {value}
    </div>
  );
}
