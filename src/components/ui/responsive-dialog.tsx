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
  const { availableHeight, isVisible: isKeyboardVisible } = useVirtualKeyboard();
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  // Usa hook de auto scroll para este container
  useAutoScrollOnFocus(contentRef);

  if (shouldUseDrawer) {
    const dynamicHeight = isKeyboardVisible 
      ? `${Math.min(availableHeight * 0.96, availableHeight - 20)}px`
      : '96vh';
      
    return (
      <DrawerContent 
        ref={contentRef}
        className={cn(
          "transition-all duration-300 ease-in-out",
          "focus:outline-none",
          className
        )}
        style={{
          height: dynamicHeight,
          maxHeight: dynamicHeight
        }}
      >
        <div className="mx-auto w-full max-w-[calc(100vw-1rem)] px-3 pb-safe-bottom h-full">
          <div className="h-full overflow-y-auto">
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