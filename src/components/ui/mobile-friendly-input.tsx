import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { cn } from "@/lib/utils";

interface MobileFriendlyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showLabel?: boolean;
}

/**
 * Input otimizado para mobile com labels e estados melhorados
 */
export const MobileFriendlyInput = React.forwardRef<
  HTMLInputElement,
  MobileFriendlyInputProps
>(({ 
  label, 
  error, 
  helperText, 
  showLabel = true, 
  className, 
  id,
  ...props 
}, ref) => {
  const isMobile = useIsMobile();
  const { scrollToField } = useVirtualKeyboard();
  const inputId = id || React.useId();

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isMobile) {
      scrollToField(e.target);
    }
    props.onFocus?.(e);
  };

  return (
    <div className="space-y-2">
      {showLabel && label && (
        <Label 
          htmlFor={inputId} 
          className={cn(
            "font-medium",
            isMobile ? "text-base" : "text-sm",
            error && "text-destructive"
          )}
        >
          {label}
          {props.required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <Input
        ref={ref}
        id={inputId}
        onFocus={handleFocus}
        className={cn(
          isMobile ? "h-12 text-base" : "h-10 text-sm",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        {...props}
      />
      
      {(error || helperText) && (
        <p className={cn(
          "text-sm",
          isMobile ? "text-base" : "text-sm",
          error ? "text-destructive" : "text-muted-foreground"
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

MobileFriendlyInput.displayName = "MobileFriendlyInput";