import * as React from "react";
import { useResponsiveDialog } from "@/hooks/useResponsiveDialog";
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { useAutoScrollOnFocus } from "@/hooks/useAutoScrollOnFocus";
import { useIsPWA } from "@/hooks/useIsPWA";
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
  const isPWA = useIsPWA();
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  useAutoScrollOnFocus(contentRef);

  if (shouldUseDrawer) {
    let drawerStyle: React.CSSProperties = {};

    if (isKeyboardVisible) {
      const adjustedHeight = `${Math.max(visualViewportHeight * 0.8, 300)}px`;
      drawerStyle = { height: adjustedHeight, maxHeight: adjustedHeight };
    }
    // Para PWA, a altura é controlada diretamente no DrawerContent via CSS
      
    return (
      <DrawerContent
        ref={contentRef}
        className={cn("ds-shell overflow-hidden", className)}
        style={drawerStyle}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={cn("ds-shell max-w-[96vw] max-h-[96vh] overflow-y-auto", className)}>
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