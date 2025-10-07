import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileFriendlyFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

interface MobileFriendlyFormSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

interface MobileFriendlyFormFieldProps {
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2; // Quantas colunas ocupar no desktop
}

interface MobileFriendlyFormActionsProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Formulário otimizado para mobile com layout responsivo
 */
export const MobileFriendlyForm = React.forwardRef<
  HTMLFormElement,
  MobileFriendlyFormProps
>(({ children, className, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <form
      ref={ref}
      className={cn(
        "space-y-6",
        isMobile ? "px-1" : "",
        className
      )}
      {...props}
    >
      {children}
    </form>
  );
});

MobileFriendlyForm.displayName = "MobileFriendlyForm";

/**
 * Seção do formulário com título opcional
 */
export function MobileFriendlyFormSection({ 
  title, 
  children, 
  className 
}: MobileFriendlyFormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="flex items-center gap-2 pb-2 border-b">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Campo de formulário com layout responsivo
 */
export function MobileFriendlyFormField({ 
  children, 
  className, 
  span = 1 
}: MobileFriendlyFormFieldProps) {
  const isMobile = useIsMobile();
  
  return (
    <div 
      className={cn(
        isMobile 
          ? "w-full" 
          : span === 2 
            ? "col-span-2" 
            : "col-span-1",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Grid de campos responsivo
 */
export function MobileFriendlyFormGrid({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const isMobile = useIsMobile();
  
  return (
    <div 
      className={cn(
        isMobile 
          ? "space-y-4" 
          : "grid grid-cols-2 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Ações do formulário (botões) com layout responsivo
 * Touch targets mínimos de 48x48px
 */
export function MobileFriendlyFormActions({ 
  children, 
  className 
}: MobileFriendlyFormActionsProps) {
  const isMobile = useIsMobile();
  
  return (
    <div 
      className={cn(
        "flex gap-3 pt-4",
        isMobile 
          ? "flex-col-reverse" 
          : "flex-row justify-end",
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            className: cn(
              child.props.className,
              isMobile ? "w-full min-h-[48px]" : "min-h-[44px]"
            )
          } as any);
        }
        return child;
      })}
    </div>
  );
}