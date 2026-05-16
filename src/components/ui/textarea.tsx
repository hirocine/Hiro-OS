import * as React from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onFocus, ...props }, ref) => {
    const isMobile = useIsMobile();
    const { scrollToField } = useVirtualKeyboard();

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (isMobile) {
        scrollToField(e.target);
      }
      onFocus?.(e);
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50",
          isMobile && "min-h-[100px] text-base",
          className
        )}
        ref={ref}
        onFocus={handleFocus}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
