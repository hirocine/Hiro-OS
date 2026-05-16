import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
}

export function StarRating({ rating = 0, onChange, readonly = false }: StarRatingProps) {
  const handleClick = (value: number) => {
    if (!readonly && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readonly}
          className={cn(
            'transition-colors',
            !readonly && 'hover:scale-110 cursor-pointer',
            readonly && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              'h-4 w-4',
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-[hsl(var(--ds-fg-3))]'
            )}
          />
        </button>
      ))}
    </div>
  );
}
