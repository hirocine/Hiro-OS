import * as React from "react";
import { useResponsiveDialog } from "@/hooks/useResponsiveDialog";
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { useAutoScrollOnFocus } from "@/hooks/useAutoScrollOnFocus";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface ResponsiveDialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

interface ResponsiveDialogFooterProps {
  className?: string;
  children: React.ReactNode;
}

// Root component
export function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const { shouldUseDrawer } = useResponsiveDialog();

  if (shouldUseDrawer) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

// Content component
export function ResponsiveDialogContent({ className, children }: ResponsiveDialogContentProps) {
  const { shouldUseDrawer } = useResponsiveDialog();
  const { visualViewportHeight, isVisible: isKeyboardVisible } = useVirtualKeyboard();
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  useAutoScrollOnFocus(contentRef);

  if (shouldUseDrawer) {
    // Constantes para cálculo de altura
    const APP_HEADER_HEIGHT = 64; // Altura do header da aplicação
    const DRAWER_HANDLE_HEIGHT = 24; // Altura do handle do drawer
    const SAFE_MARGINS = 16; // Margem de segurança
    const TOTAL_OFFSET = APP_HEADER_HEIGHT + DRAWER_HANDLE_HEIGHT + SAFE_MARGINS;
    
    // Calcula altura disponível considerando o header da app
    const availableHeight = window.innerHeight - TOTAL_OFFSET;
    const keyboardAdjustedHeight = visualViewportHeight - TOTAL_OFFSET;
    
    const dynamicHeight = isKeyboardVisible 
      ? `${Math.max(keyboardAdjustedHeight, 200)}px` // Min 200px
      : `${Math.max(availableHeight, 300)}px`; // Min 300px
      
    return (
      <DrawerContent 
        ref={contentRef}
        className={cn(
          "transition-all duration-200 ease-out",
          "focus:outline-none",
          className
        )}
        style={{
          height: dynamicHeight,
          maxHeight: dynamicHeight,
          // Garantir que não sobreponha o header
          marginTop: `${APP_HEADER_HEIGHT}px`
        }}
      >
        <div className="mx-auto w-full max-w-[calc(100vw-1rem)] px-3 h-full flex flex-col">
          {/* Handle visual do drawer */}
          <div className="flex-shrink-0 h-6 flex items-center justify-center">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>
          
          {/* Conteúdo scrollável */}
          <div className="flex-1 min-h-0 overflow-y-auto pb-safe-bottom">
            {children}
          </div>
        </div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={cn("max-w-[96vw] max-h-[96vh] overflow-y-auto", className)}>
      {children}
    </DialogContent>
  );
}

// Header component
export function ResponsiveDialogHeader({ className, children }: ResponsiveDialogHeaderProps) {
  const { shouldUseDrawer } = useResponsiveDialog();

  if (shouldUseDrawer) {
    return (
      <DrawerHeader className={className}>
        {children}
      </DrawerHeader>
    );
  }

  return (
    <DialogHeader className={className}>
      {children}
    </DialogHeader>
  );
}

// Title component
export function ResponsiveDialogTitle({ className, children }: ResponsiveDialogTitleProps) {
  const { shouldUseDrawer } = useResponsiveDialog();

  if (shouldUseDrawer) {
    return (
      <DrawerTitle className={className}>
        {children}
      </DrawerTitle>
    );
  }

  return (
    <DialogTitle className={className}>
      {children}
    </DialogTitle>
  );
}

// Description component
export function ResponsiveDialogDescription({ className, children }: ResponsiveDialogDescriptionProps) {
  const { shouldUseDrawer } = useResponsiveDialog();

  if (shouldUseDrawer) {
    return (
      <DrawerDescription className={className}>
        {children}
      </DrawerDescription>
    );
  }

  return (
    <DialogDescription className={className}>
      {children}
    </DialogDescription>
  );
}

// Footer component
export function ResponsiveDialogFooter({ className, children }: ResponsiveDialogFooterProps) {
  const { shouldUseDrawer } = useResponsiveDialog();

  if (shouldUseDrawer) {
    return (
      <DrawerFooter className={className}>
        {children}
      </DrawerFooter>
    );
  }

  return (
    <DialogFooter className={className}>
      {children}
    </DialogFooter>
  );
}